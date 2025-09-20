import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { Clock, Calendar, Brain, Loader2, CheckCircle, Target, Coffee } from "lucide-react";

export default function StudyScheduler() {
  const [schedule, setSchedule] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState({
    wakeUpTime: "07:00",
    sleepTime: "23:00",
    studyHoursPerDay: 6,
    breakInterval: 45,
    subjects: ""
  });

  const generateSchedule = async () => {
    setIsGenerating(true);
    
    try {
      const result = await InvokeLLM({
        prompt: `
          Create an optimal daily study schedule based on these preferences:
          - Wake up time: ${preferences.wakeUpTime}
          - Sleep time: ${preferences.sleepTime}
          - Target study hours: ${preferences.studyHoursPerDay} hours
          - Break interval: every ${preferences.breakInterval} minutes
          - Subjects to study: ${preferences.subjects || "General subjects"}
          
          Create a balanced schedule that includes:
          1. Study blocks with breaks
          2. Meal times
          3. Exercise/wellness time
          4. Buffer time for unexpected tasks
          
          Use Pomodoro technique and consider energy levels throughout the day.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            daily_schedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  activity: { type: "string" },
                  type: { type: "string", enum: ["study", "break", "meal", "exercise", "other"] },
                  duration: { type: "number" }
                }
              }
            },
            total_study_time: { type: "number" },
            total_break_time: { type: "number" },
            study_tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSchedule(result);
    } catch (error) {
      console.error("Error generating schedule:", error);
    }
    
    setIsGenerating(false);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "study": return <Brain className="w-4 h-4" />;
      case "break": return <Coffee className="w-4 h-4" />;
      case "meal": return <span className="text-sm">🍽️</span>;
      case "exercise": return <span className="text-sm">💪</span>;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "study": return "bg-blue-100 text-blue-800 border-blue-200";
      case "break": return "bg-green-100 text-green-800 border-green-200";
      case "meal": return "bg-orange-100 text-orange-800 border-orange-200";
      case "exercise": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Preferences Form */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Study Schedule Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="wakeUpTime">Wake Up Time</Label>
              <Input
                id="wakeUpTime"
                type="time"
                value={preferences.wakeUpTime}
                onChange={(e) => setPreferences(prev => ({ ...prev, wakeUpTime: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sleepTime">Sleep Time</Label>
              <Input
                id="sleepTime"
                type="time"
                value={preferences.sleepTime}
                onChange={(e) => setPreferences(prev => ({ ...prev, sleepTime: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studyHours">Study Hours Per Day</Label>
              <Input
                id="studyHours"
                type="number"
                min="1"
                max="16"
                value={preferences.studyHoursPerDay}
                onChange={(e) => setPreferences(prev => ({ ...prev, studyHoursPerDay: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="breakInterval">Break Every (minutes)</Label>
              <Input
                id="breakInterval"
                type="number"
                min="15"
                max="120"
                value={preferences.breakInterval}
                onChange={(e) => setPreferences(prev => ({ ...prev, breakInterval: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subjects">Subjects to Study</Label>
              <Input
                id="subjects"
                placeholder="e.g., Mathematics, Physics, Computer Science"
                value={preferences.subjects}
                onChange={(e) => setPreferences(prev => ({ ...prev, subjects: e.target.value }))}
              />
            </div>
          </div>
          
          <Button
            onClick={generateSchedule}
            disabled={isGenerating}
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating AI Schedule...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Generate Optimal Schedule
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Schedule */}
      {schedule && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Your Optimized Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {schedule.daily_schedule?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                      <div className="text-sm font-mono text-slate-600 w-16">
                        {item.time}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`p-1 rounded ${getActivityColor(item.type)}`}>
                          {getActivityIcon(item.type)}
                        </div>
                        <span className="font-medium text-slate-800">{item.activity}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.duration}min
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Schedule Summary */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Schedule Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {schedule.total_study_time}h
                  </div>
                  <div className="text-sm text-blue-700">Total Study Time</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {schedule.total_break_time}h
                  </div>
                  <div className="text-sm text-green-700">Total Break Time</div>
                </div>
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedule.study_tips?.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-purple-800">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}