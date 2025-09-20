import React, { useState, useEffect, useRef } from "react";
import { ChatConversation } from "@/entities/ChatConversation";
import { WellnessEntry } from "@/entities/WellnessEntry";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, Send, Brain, Heart, BookOpen, Target,
  Lightbulb, Coffee, Star, User, Loader2, Trash2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AIMentor() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userMood, setUserMood] = useState("");
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadRecentWellnessData();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const fetchedConversations = await ChatConversation.list("-created_date");
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations. Please refresh the page.");
    }
  };

  const loadRecentWellnessData = async () => {
    try {
      const recentEntries = await WellnessEntry.list("-created_date", 1);
      if (recentEntries.length > 0) {
        const moodRating = recentEntries[0].mood_rating;
        if (moodRating <= 4) setUserMood("low");
        else if (moodRating <= 7) setUserMood("neutral");
        else setUserMood("good");
      }
    } catch (error) {
      console.error("Error loading wellness data:", error);
      // Don't show error for wellness data as it's not critical
    }
  };

  const startNewConversation = async (topic = "General Chat") => {
    try {
      const conversation = await ChatConversation.create({
        title: topic,
        messages: [],
        conversation_type: "mentor",
        mood_context: userMood,
        topic: topic
      });
      
      setConversations(prev => [conversation, ...prev]);
      setActiveConversation(conversation);
      setMessages([]);
      
      const welcomeMessage = getWelcomeMessage(userMood);
      const aiMessage = { role: "ai", content: welcomeMessage };
      setMessages([aiMessage]);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to start new conversation. Please try again.");
    }
  };

  const getWelcomeMessage = (mood) => {
    switch (mood) {
      case "low":
        return "Hi there! 😊 I noticed you might be feeling a bit down lately. I'm here to listen and help you get through this. What's on your mind today?";
      case "good":
        return "Hello! 🌟 You seem to be doing well! I'm excited to chat with you today. How can I help you achieve your goals?";
      default:
        return "Hi! 👋 I'm your AI mentor, here to support you with your studies, career goals, or just to chat. What would you like to talk about today?";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input, timestamp: new Date().toISOString() };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const context = buildContextualPrompt(input, userMood, currentMessages);
      const aiResponse = await InvokeLLM({ 
        prompt: context,
        add_context_from_internet: false // Disable internet context for chat to avoid errors
      });

      const aiMessage = { role: "ai", content: aiResponse, timestamp: new Date().toISOString() };
      const updatedMessagesWithAI = [...currentMessages, aiMessage];
      setMessages(updatedMessagesWithAI);

      // Update conversation in database
      if (activeConversation) {
        try {
          await ChatConversation.update(activeConversation.id, {
            messages: updatedMessagesWithAI
          });
        } catch (updateError) {
          console.error("Error updating conversation:", updateError);
          // Don't show error to user for database updates
        }
      }

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = { 
        role: "ai", 
        content: "I'm having trouble connecting right now. Please check your internet connection and try again." 
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to get AI response. Please try again.");
    }

    setIsLoading(false);
  };

  const handleDeleteConversation = async (conversationId) => {
    const toastId = toast.loading("Deleting conversation...");
    try {
      await ChatConversation.delete(conversationId);
      toast.success("Conversation deleted!", { id: toastId });
      
      const newConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(newConversations);

      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Deletion error:", err);
      toast.error("Failed to delete conversation.", { id: toastId });
    }
  };

  const buildContextualPrompt = (userInput, mood, previousMessages) => {
    const moodContext = {
      low: "The student seems to be feeling down or stressed. Be empathetic, supportive, and encouraging.",
      neutral: "The student has a neutral mood. Be helpful and engaging.",
      good: "The student is feeling positive. Match their energy and be motivational."
    };

    return `
      You are an AI mentor for students. You provide emotional support, study guidance, career advice, and motivation.
      
      Context:
      - User's current mood: ${mood} (${moodContext[mood] || "Be supportive and helpful"})
      - Previous conversation: ${previousMessages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}
      
      User's message: "${userInput}"
      
      Respond as a caring, knowledgeable mentor. Provide practical advice, emotional support, or study guidance as needed.
      Keep responses conversational and encouraging. If they mention feeling stuck or overwhelmed, suggest specific techniques or next steps.
    `;
  };

  const quickActions = [
    { label: "I'm feeling overwhelmed", icon: Heart, color: "text-red-600" },
    { label: "Help me study better", icon: BookOpen, color: "text-blue-600" },
    { label: "Career guidance", icon: Target, color: "text-green-600" },
    { label: "Motivate me", icon: Star, color: "text-yellow-600" },
    { label: "I need a break", icon: Coffee, color: "text-purple-600" }
  ];

  if (error) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  AI Mentor Chat
                </h1>
              </div>
            </div>
          </div>
          <Card className="glass-effect border-0 shadow-lg border-l-4 border-l-red-500">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Connection Error</h3>
              <p className="text-slate-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-pink-600 hover:bg-pink-700">
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                AI Mentor Chat
              </h1>
              <p className="text-slate-600">Your personal AI companion for support and guidance</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-effect border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => {
                      setInput(action.label);
                      if (!activeConversation) {
                        startNewConversation(action.label);
                      }
                    }}
                  >
                    <action.icon className={`w-4 h-4 mr-3 ${action.color}`} />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Conversations */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Recent Chats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {conversations.slice(0, 5).map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg group transition-all relative ${
                      activeConversation?.id === conv.id 
                        ? 'bg-purple-50 border-purple-200' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => {
                        setActiveConversation(conv);
                        setMessages(conv.messages || []);
                      }}
                    >
                      <p className="font-medium text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-slate-500">
                        {conv.messages?.length || 0} messages
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this chat conversation. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleDeleteConversation(conv.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
                
                <Button 
                  onClick={() => startNewConversation()}
                  className="w-full mt-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat */}
          <div className="lg:col-span-3">
            <Card className="glass-effect border-0 shadow-lg h-[70vh] flex flex-col">
              {activeConversation ? (
                <>
                  <CardHeader className="border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{activeConversation.title}</CardTitle>
                      <Badge className="bg-purple-100 text-purple-800">
                        {userMood === "low" ? "Support Mode" : userMood === "good" ? "Motivation Mode" : "Chat Mode"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col p-0">
                    <div 
                      ref={scrollRef} 
                      className="flex-1 overflow-y-auto p-6 space-y-4"
                      style={{
                        scrollBehavior: 'smooth',
                        maxHeight: 'calc(70vh - 180px)'
                      }}
                    >
                      {messages.map((message, index) => (
                        <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.role === 'ai' && (
                            <Avatar className="w-8 h-8 bg-purple-100 text-purple-600 flex-shrink-0">
                              <AvatarFallback><Brain className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            message.role === 'user' 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-white border border-slate-200'
                          }`}>
                            <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          {message.role === 'user' && (
                            <Avatar className="w-8 h-8 bg-slate-100 text-slate-600 flex-shrink-0">
                              <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="w-8 h-8 bg-purple-100 text-purple-600">
                            <AvatarFallback><Loader2 className="w-4 h-4 animate-spin" /></AvatarFallback>
                          </Avatar>
                          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
                            <p className="text-sm text-slate-500">AI is thinking...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 p-4 flex-shrink-0">
                      <form onSubmit={handleSendMessage} className="flex gap-3">
                        <Textarea
                          placeholder="Share what's on your mind..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="flex-1 min-h-[60px] max-h-32 resize-none"
                          rows={2}
                          disabled={isLoading}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                        <Button 
                          type="submit" 
                          disabled={isLoading || !input.trim()}
                          size="lg"
                          className="h-[60px] px-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                      <p className="text-xs text-slate-400 mt-2">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <MessageCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">
                        Welcome to AI Mentor Chat
                      </h3>
                      <p className="text-slate-500 mb-6">
                        Your personal AI companion for emotional support, study guidance, and motivation
                      </p>
                      <Button 
                        onClick={() => startNewConversation()}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start Chatting
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}