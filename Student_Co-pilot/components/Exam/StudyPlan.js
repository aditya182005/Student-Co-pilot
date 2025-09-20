import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Clock, AlertTriangle, CheckCircle, Calendar } from "lucide-react";

export default function StudyPlan({ exam }) {
  const daysLeft = Math.ceil((new Date(exam.exam_date) - new Date()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((new Date(exam.exam_date) - new Date(exam.created_date)) / (1000 * 60 * 60 * 24));
  const progress = totalDays > 0 ? Math.max(0, ((totalDays - daysLeft) / totalDays) * 100) : 0;

  const studySchedule = [
    { week: "Week 1", focus: "Foundation & Core Concepts", status: "completed", topics: ["Basic Algorithms", "Data Types", "Arrays & Strings"] },
    { week: "Week 2", focus: "Advanced Topics", status: "current", topics: ["Trees & Graphs", "Dynamic Programming", "Sorting Algorithms"] },
    { week: "Week 3", focus: "Practice & Mock Tests", status: "upcoming", topics: ["Mock Exams", "Time Management", "Revision"] },
    { week: "Week 4", focus: "Final Review", status: "upcoming", topics: ["Weak Areas", "Last-minute Tips", "Relaxation"] },
  ];

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              Study Progress
            </div>
            <Badge className={daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}>
              {daysLeft} days left
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Overall Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {exam.study_plan?.daily_hours || 4}h
                </div>
                <div className="text-sm text-blue-700">Recommended Daily Study</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {exam.predicted_questions?.length || 0}
                </div>
                <div className="text-sm text-green-700">Questions to Practice</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {exam.weak_areas?.length || 0}
                </div>
                <div className="text-sm text-red-700">Areas to Focus</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Study Schedule */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Study Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studySchedule.map((item, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    item.status === "current" 
                      ? "border-amber-300 bg-amber-50"
                      : item.status === "completed"
                      ? "border-green-300 bg-green-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.week}</h4>
                      <p className="text-sm text-slate-600">{item.focus}</p>
                    </div>
                    <Badge 
                      variant="outline"
                      className={
                        item.status === "current" 
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : item.status === "completed"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.topics.map((topic, topicIndex) => (
                      <Badge key={topicIndex} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weak Areas Focus */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Areas Needing Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exam.weak_areas?.length > 0 ? (
                exam.weak_areas.map((area, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">{area}</h4>
                        <p className="text-sm text-red-700">
                          Schedule extra practice time for this topic
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No specific weak areas identified</p>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📚 Study Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Focus 60% of time on weak areas</li>
                <li>• Take regular mock tests to track progress</li>
                <li>• Review mistakes immediately after practice</li>
                <li>• Use active recall and spaced repetition</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predicted Questions */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            AI Predicted Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {exam.predicted_questions?.length > 0 ? (
              exam.predicted_questions.map((question, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">{question}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No questions predicted yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}