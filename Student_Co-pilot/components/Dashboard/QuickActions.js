import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Upload, FileText, BookOpen, Code, 
  Heart, GraduationCap, Plus, Zap 
} from "lucide-react";

const quickActions = [
  {
    title: "Upload Resume",
    description: "Get AI feedback instantly",
    icon: Upload,
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-50 to-blue-100",
    textColor: "text-blue-700",
    url: createPageUrl("Resume")
  },
  {
    title: "Add Study Notes",
    description: "Transform into quizzes & flashcards",
    icon: BookOpen,
    color: "from-purple-500 to-purple-600",
    bgColor: "from-purple-50 to-purple-100", 
    textColor: "text-purple-700",
    url: createPageUrl("Study")
  },
  {
    title: "Review Code",
    description: "Get expert AI mentorship",
    icon: Code,
    color: "from-green-500 to-green-600",
    bgColor: "from-green-50 to-green-100",
    textColor: "text-green-700", 
    url: createPageUrl("Code")
  },
  {
    title: "Check Wellness",
    description: "Track mood & get support",
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    bgColor: "from-rose-50 to-pink-100",
    textColor: "text-rose-700",
    url: createPageUrl("Wellness")
  },
];

export default function QuickActions() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link key={index} to={action.url}>
            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0 glass-effect">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors duration-200">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-600 transition-colors duration-200">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}