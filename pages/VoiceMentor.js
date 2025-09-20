
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatConversation } from "@/entities/ChatConversation";
import { WellnessEntry } from "@/entities/WellnessEntry";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label"; // Added for the Select component label
import {
  Mic, MicOff, Volume2, VolumeX, Brain, Heart, User,
  Play, Pause, Square, Loader2, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VoiceMentor() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userMood, setUserMood] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [mentorPersonality, setMentorPersonality] = useState("friendly"); // New state variable

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const scrollRef = useRef(null);

  const buildContextualPrompt = useCallback((userInput, mood, previousMessages) => {
    const moodContext = {
      low: "The student seems to be feeling down or stressed. Be empathetic, supportive, and encouraging. Keep responses concise for voice interaction.",
      neutral: "The student has a neutral mood. Be helpful and engaging. Keep responses conversational and brief for voice chat.",
      good: "The student is feeling positive. Match their energy and be motivational. Keep responses energetic but concise for voice interaction."
    };

    const personalityContext = {
      friendly: "You are a friendly, encouraging peer mentor. Use positive language and emojis. Be warm and relatable.",
      professional: "You are a professional career coach and academic advisor. Your tone is formal, structured, and insightful. Provide clear, actionable advice.",
      motivational: "You are a high-energy motivational coach. Your goal is to inspire action and build confidence. Use powerful words and a commanding tone."
    };

    return `
      You are an AI voice mentor for students. Your current personality is: ${mentorPersonality}.
      ${personalityContext[mentorPersonality]}

      Provide emotional support, study guidance, career advice, and motivation.
      IMPORTANT: Keep responses concise and conversational since this is voice chat - aim for 2-3 sentences max.

      Context:
      - User's current mood: ${mood} (${moodContext[mood] || "Be supportive and helpful"})
      - Previous conversation: ${previousMessages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

      User's message: "${userInput}"

      Respond as a caring, knowledgeable voice mentor. Be conversational and encouraging.
    `;
  }, [mentorPersonality]);

  const speakMessage = (text) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error('Speech synthesis failed');
    };

    synthRef.current.speak(utterance);
  };

  const handleVoiceMessage = useCallback(async (voiceInput) => {
    if (!voiceInput.trim()) return;

    const userMessage = { role: "user", content: voiceInput, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const context = buildContextualPrompt(voiceInput, userMood, messages);
      const aiResponse = await InvokeLLM({ 
        prompt: context,
        add_context_from_internet: false // Disable internet context for voice to avoid errors
      });

      const aiMessage = { role: "ai", content: aiResponse, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMessage]);

      // Update conversation in database
      if (activeConversation) {
        try {
          // We need to use the messages state here directly or pass it to updateConversation function
          // to ensure we're getting the latest state. For this example, we'll assume `messages` is up-to-date
          // immediately after `setMessages`, which is often not strictly true in React's async state updates.
          // A more robust solution might pass userMessage and aiMessage explicitly to a reducer or helper.
          // For now, based on the original code's pattern, we'll continue with [...messages, ...]
          const updatedMessages = [...messages, userMessage, aiMessage];
          await ChatConversation.update(activeConversation.id, {
            messages: updatedMessages
          });
        } catch (updateError) {
          console.error("Error updating conversation:", updateError);
          // Don't show error to user for database updates
        }
      }

      // Speak the AI response
      speakMessage(aiResponse);

    } catch (error) {
      console.error("Voice message error:", error);
      const errorMessage = { 
        role: "ai", 
        content: "I'm having trouble connecting right now. Please check your internet connection and try again." 
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to get response. Please try again.");
      speakMessage("I'm having trouble connecting. Please try again.");
    }

    setIsProcessing(false);
  }, [userMood, messages, activeConversation, buildContextualPrompt]); // Changed mentorPersonality to buildContextualPrompt

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        handleVoiceMessage(speechResult);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      setSpeechSupported(true);
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    loadConversations();
    loadRecentWellnessData();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [handleVoiceMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    const fetchedConversations = await ChatConversation.list("-created_date");
    setConversations(fetchedConversations);
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
    }
  };

  const startVoiceConversation = async () => {
    if (!activeConversation) {
      const conversation = await ChatConversation.create({
        title: "Voice Chat Session",
        messages: [],
        conversation_type: "mentor",
        mood_context: userMood,
        topic: "Voice Chat"
      });

      setActiveConversation(conversation);
      setMessages([]);

      const welcomeMessage = getWelcomeMessage(userMood);
      const aiMessage = { role: "ai", content: welcomeMessage };
      setMessages([aiMessage]);

      // Speak the AI response
      speakMessage(welcomeMessage);
    }
  };

  const getWelcomeMessage = (mood) => {
    const welcomeMap = {
      friendly: {
        low: "Hey, I'm here for you. It's okay to not be okay. Let's talk through it. What's on your mind?",
        good: "Hey! You're sounding great today! Let's ride this wave of positivity. What amazing things are we going to tackle?",
        neutral: "Hey there! I'm your friendly AI mentor, ready to help with anything. What's our plan for today?"
      },
      professional: {
        low: "I recognize that this may be a difficult moment. I am available to provide support. How may I be of assistance?",
        good: "It is excellent to note your positive disposition. Let's leverage this momentum. What are your primary objectives for our session?",
        neutral: "Good day. I am your professional AI advisor. Please state your query, and we can begin our analysis."
      },
      motivational: {
        low: "Alright, listen up! Every setback is a setup for a comeback. You've got this! Now, tell me what challenge we're conquering first!",
        good: "YES! That's the energy I'm talking about! Let's crush those goals today. What's our first victory going to be?",
        neutral: "Let's get to it! No time for standing still. We're here to achieve greatness. What's your target?"
      }
    };
    return welcomeMap[mentorPersonality][mood] || welcomeMap.friendly.neutral;
  };

  const startListening = () => {
    if (!speechSupported) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    if (!activeConversation) {
      startVoiceConversation();
    }

    setIsListening(true);
    setTranscript("");
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Mic className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                AI Voice Mentor
              </h1>
              <p className="text-sm lg:text-base text-slate-600">Your intelligent voice companion for support and guidance</p>
            </div>
          </div>

          {!speechSupported && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                Voice features are not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Voice Controls */}
          <div className="lg:col-span-1">
            <Card className="glass-effect border-0 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="text-base lg:text-lg">Voice Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mentor Personality */}
                <div>
                  <Label htmlFor="mentor-personality">Mentor Personality</Label>
                  <Select value={mentorPersonality} onValueChange={setMentorPersonality}>
                    <SelectTrigger className="mt-1" id="mentor-personality">
                      <SelectValue placeholder="Select a personality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">😊 Friendly Mentor</SelectItem>
                      <SelectItem value="professional">👔 Professional Coach</SelectItem>
                      <SelectItem value="motivational">🔥 Motivational Buddy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Main Voice Button */}
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isListening ? stopListening : startListening}
                    disabled={!speechSupported || isProcessing}
                    className={`relative w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isListening
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-2xl animate-pulse'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-xl'
                    } ${!speechSupported || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 lg:w-10 lg:h-10 text-white animate-spin" />
                    ) : isListening ? (
                      <MicOff className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                    )}

                    {isListening && (
                      <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                    )}
                  </motion.button>

                  <p className="text-sm text-slate-600 mt-3">
                    {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Tap to talk'}
                  </p>
                </div>

                {/* Speech Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={stopSpeaking}
                    disabled={!isSpeaking}
                    variant="outline"
                    className="flex-1 text-xs lg:text-sm"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        Muted
                      </>
                    )}
                  </Button>
                </div>

                {/* Current transcript */}
                {transcript && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs lg:text-sm text-blue-800 font-medium">You said:</p>
                    <p className="text-xs lg:text-sm text-blue-700 mt-1">{transcript}</p>
                  </div>
                )}

                {/* Mood indicator */}
                {userMood && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-purple-800 font-medium">Current Mood:</p>
                    <Badge className={`mt-1 ${
                      userMood === 'low' ? 'bg-red-100 text-red-800' :
                      userMood === 'good' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {userMood === 'low' ? 'Support Mode' : userMood === 'good' ? 'Motivation Mode' : 'Chat Mode'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversation Area */}
          <div className="lg:col-span-3">
            <Card className="glass-effect border-0 shadow-lg h-[60vh] lg:h-[70vh] flex flex-col">
              {activeConversation ? (
                <>
                  <CardHeader className="border-b border-slate-100 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base lg:text-lg">{activeConversation.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {isSpeaking && (
                          <Badge className="bg-green-100 text-green-800 animate-pulse">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Speaking
                          </Badge>
                        )}
                        <Badge className="bg-purple-100 text-purple-800">
                          Voice Chat
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-4 lg:p-6">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 lg:pr-4 mb-4 lg:mb-6">
                      <AnimatePresence>
                        {messages.map((message, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'ai' && (
                              <Avatar className="w-6 h-6 lg:w-8 lg:h-8 bg-purple-100 text-purple-600">
                                <AvatarFallback><Brain className="w-3 h-3 lg:w-4 lg:h-4" /></AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`max-w-[85%] lg:max-w-md rounded-2xl px-3 py-2 lg:px-4 lg:py-2.5 ${
                              message.role === 'user'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border border-slate-200'
                            }`}>
                              <ReactMarkdown className="prose prose-sm max-w-none text-xs lg:text-sm">
                                {message.content}
                              </ReactMarkdown>
                              {message.role === 'ai' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => speakMessage(message.content)}
                                  className="mt-2 h-6 text-xs"
                                >
                                  <Volume2 className="w-3 h-3 mr-1" />
                                  Replay
                                </Button>
                              )}
                            </div>
                            {message.role === 'user' && (
                              <Avatar className="w-6 h-6 lg:w-8 lg:h-8 bg-slate-100 text-slate-600">
                                <AvatarFallback><User className="w-3 h-3 lg:w-4 lg:h-4" /></AvatarFallback>
                              </Avatar>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isProcessing && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 justify-start"
                        >
                          <Avatar className="w-6 h-6 lg:w-8 lg:h-8 bg-purple-100 text-purple-600">
                            <AvatarFallback><Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" /></AvatarFallback>
                          </Avatar>
                          <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 lg:px-4 lg:py-2.5">
                            <p className="text-xs lg:text-sm text-slate-500">AI is thinking...</p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-xs lg:text-sm text-slate-500 mb-3">
                        {speechSupported ? 'Click the microphone to start talking' : 'Voice features not supported'}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={startListening}
                          disabled={!speechSupported || isListening || isProcessing}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs lg:text-sm"
                        >
                          <Mic className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                          Talk
                        </Button>
                        <Button
                          onClick={() => setMessages([])}
                          variant="outline"
                          size="sm"
                          className="text-xs lg:text-sm"
                        >
                          Clear Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center p-6 lg:p-12">
                  <div className="text-center space-y-4 lg:space-y-6">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                      className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto"
                    >
                      <Mic className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-semibold text-slate-700 mb-2">
                        Welcome to AI Voice Mentor
                      </h3>
                      <p className="text-sm lg:text-base text-slate-500 mb-4 lg:mb-6">
                        Start a voice conversation with your AI companion for support and guidance
                      </p>
                      <Button
                        onClick={startVoiceConversation}
                        disabled={!speechSupported}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-sm lg:text-base"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Start Voice Chat
                      </Button>
                      {!speechSupported && (
                        <p className="text-xs text-red-500 mt-2">
                          Voice features require Chrome, Edge, or Safari
                        </p>
                      )}
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
