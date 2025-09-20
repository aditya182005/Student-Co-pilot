import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Brain, Eye } from "lucide-react";
import { differenceInDays, format } from 'date-fns';

export default function ExamList({ exams, activeExam, setActiveExam, setActiveTab }) {
  
  const handleSelectExam = (exam) => {
    setActiveExam(exam);
    setActiveTab('plan');
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          Your Exams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exams && exams.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {exams.map((exam) => {
              const daysLeft = differenceInDays(new Date(exam.exam_date), new Date());
              return (
                <div 
                  key={exam.id}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    activeExam?.id === exam.id 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleSelectExam(exam)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800">{exam.exam_name}</p>
                      <p className="text-sm text-slate-500 mt-1">{exam.subject} • {format(new Date(exam.exam_date), 'MMMM d, yyyy')}</p>
                    </div>
                    <Badge variant={daysLeft < 7 ? "destructive" : "outline"}>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Today!'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-7 text-amber-600">
                      <Eye className="w-3 h-3 mr-1.5" />
                      View Plan
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <Brain className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h4 className="font-semibold text-slate-700">No exams scheduled</h4>
            <p className="text-sm text-slate-500 mt-1">Create an exam prep plan to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}