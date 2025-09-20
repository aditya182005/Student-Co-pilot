import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { Send, User, Brain, Loader2, Youtube, ExternalLink, AlertCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

export default function StudyChat({ material }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      role: "user", 
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const aiResponse = await InvokeLLM({
        prompt: `
          You are a helpful study assistant. Based on the provided study material, answer the user's question.
          Be concise, clear, and educational. 
          
          IMPORTANT: If the question is about learning a concept or needs additional resources, also suggest 1-2 relevant YouTube videos by searching for educational content. Format YouTube suggestions as:
          
          📺 **Recommended Videos:**
          - [Video Title](youtube-search:search-query)
          
          --- Study Material Content ---
          ${material.extracted_content}
          ---
          
          User's Question: "${input}"
        `,
        add_context_from_internet: true
      });

      const aiMessage = { 
        role: "ai", 
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = { 
        role: "ai", 
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to get AI response. Please try again.");
      setError("Connection failed. Please try again.");
    }

    setIsLoading(false);
  };

  const handleYouTubeSearch = (query) => {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
  };

  const renderMessage = (message) => {
    // Handle YouTube links in AI responses
    const content = message.content.replace(
      /\[([^\]]+)\]\(youtube-search:([^)]+)\)/g,
      (match, title, query) => `[${title}](${query})`
    );

    return (
      <ReactMarkdown 
        className="prose prose-sm max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>p]:leading-relaxed [&>ul]:my-2 [&>ol]:my-2"
        components={{
          a: ({ href, children }) => {
            if (href && !href.startsWith('http')) {
              // This is a YouTube search query
              return (
                <button
                  onClick={() => handleYouTubeSearch(href)}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium underline"
                >
                  <Youtube className="w-3 h-3" />
                  {children}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1">
                {children}
                <ExternalLink className="w-3 h-3" />
              </a>
            );
          },
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-2 pl-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="my-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
          code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
          pre: ({ children }) => <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto my-2">{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <Card className="glass-effect border-0 shadow-lg flex flex-col" style={{ height: '70vh' }}>
      <CardHeader className="border-b border-slate-100 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Chat with "{material.title}"
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Youtube className="w-3 h-3" />
            YouTube Suggestions
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ 
            maxHeight: 'calc(70vh - 160px)',
            scrollBehavior: 'smooth'
          }}
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-8"
              >
                <Brain className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Chat with your notes</h3>
                <p className="text-sm text-slate-500 mb-4">Ask a question about "{material.title}" to get started.</p>
                <Badge variant="outline" className="text-xs">
                  💡 I can suggest YouTube videos for complex topics!
                </Badge>
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'ai' && (
                    <Avatar className="w-8 h-8 bg-purple-100 text-purple-600 flex-shrink-0">
                      <AvatarFallback><Brain className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {message.role === 'user' ? (
                        <p>{message.content}</p>
                      ) : (
                        renderMessage(message)
                      )}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 bg-slate-100 text-slate-600 flex-shrink-0">
                      <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))
            )}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <Avatar className="w-8 h-8 bg-purple-100 text-purple-600">
                  <AvatarFallback><Loader2 className="w-4 h-4 animate-spin" /></AvatarFallback>
                </Avatar>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-center"
              >
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder={`Ask a question about "${material.title}"...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[40px] max-h-32 resize-none text-sm leading-relaxed"
                rows={1}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()} 
              size="sm"
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Youtube className="w-3 h-3" />
            Ask about complex topics to get YouTube video suggestions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}