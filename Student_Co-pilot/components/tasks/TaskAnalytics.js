import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudySession } from "@/entities/StudySession";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Target, Clock, Award } from "lucide-react";

export default function TaskAnalytics({ tasks }) {
  const [studySessions, setStudySessions] = useState([]);

  useEffect(() => {
    loadStudySessions();
  }, []);

  const loadStudySessions = async () => {
    try {
      const sessions = await StudySession.list("-date", 30);
      setStudySessions(sessions);
    } catch (error) {
      console.error("Error loading study sessions:", error);
    }
  };

  // Task completion stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Priority distribution
  const priorityData = [
    { name: "Low", value: tasks.filter(t => t.priority === "low").length, color: "#3b82f6" },
    { name: "Medium", value: tasks.filter(t => t.priority === "medium").length, color: "#f59e0b" },
    { name: "High", value: tasks.filter(t => t.priority === "high").length, color: "#ef4444" },
    { name: "Urgent", value: tasks.filter(t => t.priority === "urgent").length, color: "#dc2626" }
  ].filter(item => item.value > 0);

  // Category distribution  
  const categoryData = [
    { name: "Study", value: tasks.filter(t => t.category === "study").length, color: "#8b5cf6" },
    { name: "Assignment", value: tasks.filter(t => t.category === "assignment").length, color: "#10b981" },
    { name: "Exam", value: tasks.filter(t => t.category === "exam").length, color: "#ef4444" },
    { name: "Project", value: tasks.filter(t => t.category === "project").length, color: "#3b82f6" },
    { name: "Personal", value: tasks.filter(t => t.category === "personal").length, color: "#6b7280" }
  ].filter(item => item.value > 0);

  // Daily productivity (last 7 days)
  const last7Days = Array.from({length: 7}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyData = last7Days.map(date => {
    const sessionsForDay = studySessions.filter(s => s.date === date);
    const tasksCompleted = tasks.filter(t => 
      t.status === "completed" && 
      new Date(t.updated_date).toISOString().split('T')[0] === date
    ).length;
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: sessionsForDay.reduce((sum, session) => sum + (session.duration_minutes || 0), 0),
      tasks: tasksCompleted,
      sessions: sessionsForDay.length
    };
  });

  // Subject breakdown
  const subjectData = {};
  studySessions.forEach(session => {
    if (session.subject) {
      subjectData[session.subject] = (subjectData[session.subject] || 0) + (session.duration_minutes || 0);
    }
  });

  const subjectChartData = Object.entries(subjectData)
    .map(([subject, minutes]) => ({ subject, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6);

  const totalStudyMinutes = studySessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
  const averageFocus = studySessions.length > 0 
    ? studySessions.reduce((sum, session) => sum + (session.focus_rating || 7), 0) / studySessions.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                <p className="text-2xl font-bold text-slate-800">{completionRate.toFixed(0)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Study Time</p>
                <p className="text-2xl font-bold text-slate-800">{Math.round(totalStudyMinutes / 60)}h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Focus Score</p>
                <p className="text-2xl font-bold text-slate-800">{averageFocus.toFixed(1)}/10</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-800">{totalTasks}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Productivity */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Daily Productivity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#3b82f6" name="Study Minutes" />
                  <Bar dataKey="tasks" fill="#10b981" name="Tasks Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Study Time by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="subject" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        {priorityData.length > 0 && (
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {priorityData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm text-slate-600">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Tasks by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {categoryData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm text-slate-600">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}