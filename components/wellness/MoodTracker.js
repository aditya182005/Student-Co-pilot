import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Calendar, Smile, Activity } from "lucide-react";

export default function MoodTracker({ entries }) {
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    return entries
      .slice(0, 14) // Last 14 days
      .reverse()
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.mood_rating || 0,
        stress: entry.stress_level || 0,
        study_hours: entry.study_hours || 0
      }));
  }, [entries]);

  const averages = useMemo(() => {
    if (!entries || entries.length === 0) return { mood: 0, stress: 0, study_hours: 0 };
    
    const recentEntries = entries.slice(0, 7);
    return {
      mood: (recentEntries.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / recentEntries.length).toFixed(1),
      stress: (recentEntries.reduce((sum, entry) => sum + (entry.stress_level || 0), 0) / recentEntries.length).toFixed(1),
      study_hours: (recentEntries.reduce((sum, entry) => sum + (entry.study_hours || 0), 0) / recentEntries.length).toFixed(1)
    };
  }, [entries]);

  const getMoodTrend = () => {
    if (chartData.length < 2) return null;
    const recent = chartData.slice(-3);
    const older = chartData.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.mood, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.mood, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return "improving";
    if (recentAvg < olderAvg - 0.5) return "declining";
    return "stable";
  };

  const moodTrend = getMoodTrend();

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Mood (7 days)</p>
                <p className="text-3xl font-bold text-blue-600">{averages.mood}/10</p>
                {moodTrend && (
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className={`w-3 h-3 ${
                      moodTrend === 'improving' ? 'text-green-500' : 
                      moodTrend === 'declining' ? 'text-red-500' : 'text-gray-500'
                    }`} />
                    <span className={`text-xs font-medium ${
                      moodTrend === 'improving' ? 'text-green-600' : 
                      moodTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {moodTrend}
                    </span>
                  </div>
                )}
              </div>
              <Smile className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Stress (7 days)</p>
                <p className="text-3xl font-bold text-rose-600">{averages.stress}/10</p>
                <Badge className={`mt-2 ${
                  averages.stress <= 3 ? 'bg-green-100 text-green-700' :
                  averages.stress <= 6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {averages.stress <= 3 ? 'Low' : averages.stress <= 6 ? 'Moderate' : 'High'}
                </Badge>
              </div>
              <Activity className="w-8 h-8 text-rose-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Study Hours</p>
                <p className="text-3xl font-bold text-purple-600">{averages.study_hours}h</p>
                <p className="text-xs text-slate-500 mt-2">per day</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood & Stress Trend */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Mood & Stress Trends (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    stroke="#64748b" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    name="Mood"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stress" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                    name="Stress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No mood data available</p>
                <p className="text-sm text-slate-400">Complete daily check-ins to track your mood</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Hours */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Study Hours Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Bar 
                    dataKey="study_hours" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                    name="Study Hours"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No study hour data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}