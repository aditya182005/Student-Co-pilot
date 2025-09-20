
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import { 
  Brain, BookOpen, Code, Heart, GraduationCap, 
  Home, Menu, Bell, Settings, User, MessageCircle,
  Compass, FileSearch, Users, Presentation, Mic, FileImage
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User as UserEntity, StudySession } from "@/entities/all";
import { Skeleton } from "@/components/ui/skeleton";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    title: "AI Voice Mentor",
    url: createPageUrl("VoiceMentor"),
    icon: Mic,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    title: "Handwriting OCR",
    url: createPageUrl("HandwritingOCR"),
    icon: FileImage,
    color: "text-green-600", 
    bgColor: "bg-green-50",
  },
  {
    title: "AI Chat Mentor",
    url: createPageUrl("AIMentor"),
    icon: MessageCircle,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Resume Copilot",
    url: createPageUrl("Resume"),
    icon: User,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Study Buddy",
    url: createPageUrl("Study"),
    icon: BookOpen,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    title: "Code Mentor",
    url: createPageUrl("Code"),
    icon: Code,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Wellness Hub",
    url: createPageUrl("Wellness"),
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    title: "Exam Prep",
    url: createPageUrl("Exam"),
    icon: GraduationCap,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Career Navigator",
    url: createPageUrl("Career"),
    icon: Compass,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Research Assistant",
    url: createPageUrl("Research"),
    icon: FileSearch,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    title: "Collaboration Hub",
    url: createPageUrl("Collaboration"),
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "AI Presentations",
    url: createPageUrl("Presentations"),
    icon: Presentation,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    studyStreak: 0,
    aiInteractions: 0,
    studyGroups: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);

        // Only fetch StudySession data for now to avoid StudyGroup API issues
        const sessions = await StudySession.list();

        // Calculate Study Streak
        const sessionDates = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort().reverse();
        let streak = 0;
        if (sessionDates.length > 0) {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            if (new Date(sessionDates[0]).toDateString() === today.toDateString() || new Date(sessionDates[0]).toDateString() === yesterday.toDateString()) {
                streak = 1;
                for (let i = 0; i < sessionDates.length - 1; i++) {
                    const current = new Date(sessionDates[i]);
                    const previous = new Date(sessionDates[i+1]);
                    const diffTime = current - previous;
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);

                    if (diffDays === 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }
        
        // Calculate AI interactions based on various activities
        const aiInteractions = sessions.length; // For now, use session count as proxy

        setStats({
          studyStreak: streak,
          aiInteractions: aiInteractions,
          studyGroups: 0, // Temporarily set to 0 until StudyGroup API is fixed
        });

      } catch (error) {
        console.error("Error fetching layout data:", error);
        // Set default stats on error
        setStats({
          studyStreak: 0,
          aiInteractions: 0,
          studyGroups: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <style jsx global>{`
          :root {
            --color-primary: #4f46e5;
            --color-secondary: #7c3aed;
            --color-accent: #10b981;
            --color-warm: #f59e0b;
            --font-primary: 'Inter', system-ui, sans-serif;
          }
          
          * {
            font-family: var(--font-primary);
          }
          
          .glass-effect {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
        
        <Sidebar className="border-r-0 glass-effect">
          <SidebarHeader className="p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Student Copilot
                </h2>
                <p className="text-xs text-slate-500 font-medium">AI Academic Companion</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mb-2">
                AI Modules
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`group hover:shadow-md transition-all duration-300 rounded-xl p-3 ${
                          location.pathname === item.url 
                            ? `${item.bgColor} ${item.color} shadow-sm` 
                            : 'hover:bg-white/60'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${location.pathname === item.url ? 'bg-white/80' : 'group-hover:bg-white/50'} transition-colors duration-300`}>
                            <item.icon className={`w-4 h-4 ${location.pathname === item.url ? item.color : 'text-slate-600'}`} />
                          </div>
                          <span className={`font-medium text-sm ${location.pathname === item.url ? item.color : 'text-slate-700'}`}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mb-2">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {isLoading ? (
                  <div className="px-3 py-4 space-y-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                    <Skeleton className="h-4 w-full bg-white/70" />
                    <Skeleton className="h-4 w-full bg-white/70" />
                    <Skeleton className="h-4 w-full bg-white/70" />
                  </div>
                ) : (
                  <div className="px-3 py-4 space-y-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Study Streak</span>
                      <span className="font-bold text-indigo-600">{stats.studyStreak} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">AI Interactions</span>
                      <span className="font-bold text-green-600">{stats.aiInteractions}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Study Groups</span>
                      <span className="font-bold text-amber-600">{stats.studyGroups}</span>
                    </div>
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/20 p-4">
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <Link to={createPageUrl("Profile")} className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center hover:shadow-lg transition-all">
                <span className="text-white font-bold text-sm">{user?.full_name?.[0] || 'S'}</span>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={createPageUrl("Profile")} className="block">
                  <p className="font-semibold text-slate-800 text-sm truncate hover:text-indigo-600 transition-colors">{user?.full_name || 'Student'}</p>
                  <p className="text-xs text-slate-500 truncate">Student Plan</p>
                </Link>
              </div>
              <Link to={createPageUrl("Profile")}>
                <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 px-6 py-4 md:hidden">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-white/80 p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Student Copilot
              </h1>
              <div className="w-8 h-8 flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
          <Toaster richColors />
        </main>
      </div>
    </SidebarProvider>
  );
}
