import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, FileCode, Check, Eye } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export default function CodeHistory({ submissions, activeSubmission, setActiveSubmission, setActiveTab }) {
  
  const handleSelectSubmission = (submission) => {
    setActiveSubmission(submission);
    setActiveTab('review');
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-green-600" />
          Submission History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions && submissions.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {submissions.map((submission) => (
              <div 
                key={submission.id}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  activeSubmission?.id === submission.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => handleSelectSubmission(submission)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 truncate">{submission.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {submission.language} • {formatDistanceToNow(new Date(submission.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    {submission.review?.overall_score ?? 'N/A'}/100
                  </Badge>
                </div>
                <div className="mt-3 flex justify-end">
                   <Button variant="ghost" size="sm" className="h-7 text-green-600">
                     <Eye className="w-3 h-3 mr-1.5" />
                     View Review
                   </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <FileCode className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h4 className="font-semibold text-slate-700">No submissions yet</h4>
            <p className="text-sm text-slate-500 mt-1">Submit your code to see its history here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}