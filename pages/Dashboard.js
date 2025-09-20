import React, { useState, useEffect } from "react";
import { 
  Resume, StudyMaterial, CodeSubmission, WellnessEntry, 
  ExamPrep, Task, StudySession, User as UserEntity 
} from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Brain, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvokeLLM } from "@/integrations/Core";

import QuickActions from "../components/dashboard/QuickActions";
import ProgressOverview from "../components/dashboard/ProgressOverview";
import RecentActivity from "../components/dashboard/RecentActivity";
import UpcomingTasks from "../components/dashboard/UpcomingTasks";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    studySessions: 0,
    codeReviews: 0,
    wellnessScore: 0,
    resumeScore: 0,
    studyStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [aiInsight, setAiInsight] = useState({ tip: "", focus: "", quality: "" });

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);

        const [resumes, materials, code, wellness, exams, sessions, tasks] = await Promise.all([
          Resume.list("-created_date", 1),
          StudyMaterial.list(),
          CodeSubmission.list(),
          WellnessEntry.list("-created_date", 30),
          ExamPrep.list(),
          StudySession.list("-created_date", 30),
          Task.list(),
        ]);

        // Calculate Stats
        const resumeScore = resumes.length > 0 ? resumes[0].analysis?.formatting_score || 0 : 0;
        const wellnessScore = wellness.length > 0
          ? Math.round(wellness.slice(0, 7).reduce((acc, w) => acc + (w.mood_rating || 5) * 10, 0) / Math.min(wellness.length, 7))
          : 0;

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
                    if ((current - previous) / (1000 * 60 * 60 * 24) === 1) streak++; else break;
                }
            }
        }
        
        setStats({
          studySessions: materials.length,
          codeReviews: code.length,
          wellnessScore,
          resumeScore,
          studyStreak: streak,
        });

        // Generate Recent Activity
        const allActivity = [
          ...resumes.map(r => ({ type: 'resume', title: 'Resume analyzed', time: r.created_date, url: createPageUrl('Resume') })),
          ...materials.slice(0,5).map(m => ({ type: 'study', title: `${m.title} uploaded`, time: m.created_date, url: createPageUrl('Study') })),
          ...code.slice(0,5).map(c => ({ type: 'code', title: `${c.title} reviewed`, time: c.created_date, url: createPageUrl('Code') })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
        setRecentActivity(allActivity);

        // Generate Weekly Progress
        const progressData = Array(7).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            study: 0, code: 0, wellness: 0,
          };
        }).reverse();
        
        sessions.forEach(s => {
          const sessionDate = new Date(s.date);
          const dayIndex = progressData.findIndex(d => new Date(d.fullDate).toDateString() === sessionDate.toDateString());
          if (dayIndex > -1) {
            progressData[dayIndex].study += (s.duration_minutes / 60);
          }
        });
        
        setWeeklyProgress(progressData);

        // Generate AI Insight
        const insightPrompt = `A student named ${currentUser.full_name} has these recent stats: Wellness Score ${wellnessScore}/100, Study Streak: ${streak} days, last resume score: ${resumeScore}%. Give a very short, one-sentence personalized tip for their resume, a focus area for studying, and a comment on their code quality.`;
        const insightResult = await InvokeLLM({
          prompt: insightPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              resume_tip: { type: "string" },
              study_focus: { type: "string" },
              code_quality: { type: "string" }
            }
          }
        });
        setAiInsight({
            tip: insightResult.resume_tip || "Add quantifiable results to your resume to show impact.",
            focus: insightResult.study_focus || "Consistent effort is key. Keep up the great work!",
            quality: insightResult.code_quality || "Reviewing code regularly builds strong habits."
        });

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {isLoading ? <Skeleton className="h-10 w-80" /> : `Welcome Back, ${user?.full_name?.split(' ')[0] || 'Student'}!`}
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Ready to accelerate your academic journey?</p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading ? <Skeleton className="h-10 w-40 rounded-xl" /> : (
                <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <span className="text-sm font-medium text-green-700">Study Streak: {stats.studyStreak} days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Progress Overview */}
        <ProgressOverview 
          stats={stats}
          weeklyProgress={weeklyProgress}
          isLoading={isLoading}
        />

        {/* Activity and Tasks Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <RecentActivity 
            activity={recentActivity}
            isLoading={isLoading}
          />
          
          <UpcomingTasks />
        </div>

        {/* AI Insights Card */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Insights</CardTitle>
                <p className="text-sm text-slate-500">Personalized recommendations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-24 w-full" /> : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">Resume Tip</h4>
                  <p className="text-sm text-blue-700">{aiInsight.tip}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-2">Study Focus</h4>
                  <p className="text-sm text-purple-700">{aiInsight.focus}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-2">Code Quality</h4>
                  <p className="text-sm text-green-700">{aiInsight.quality}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}