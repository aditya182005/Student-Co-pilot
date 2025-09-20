import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, Lightbulb, ShieldCheck, Zap, Bug, Star
} from "lucide-react";

const ReviewSection = ({ title, items, icon: Icon, colorClass }) => {
  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                <div className={`mt-1 w-1.5 h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No issues found in this category.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default function CodeReviewPanel({ submission }) {
  const { review, code } = submission;
  const score = review?.overall_score || 0;

  return (
    <div className="space-y-8">
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl">
              <Star className="w-6 h-6 text-yellow-500" />
              AI Code Review Analysis
            </div>
            <div className="text-3xl font-bold text-slate-800">{score}/100</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={score} className="h-3" />
          <p className="text-sm text-slate-500 mt-2 text-center">Overall Score</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <ReviewSection title="Bugs Found" items={review.bugs_found} icon={Bug} colorClass="text-red-600" />
        <ReviewSection title="Improvement Suggestions" items={review.suggestions} icon={Lightbulb} colorClass="text-blue-600" />
        <ReviewSection title="Security Issues" items={review.security_issues} icon={ShieldCheck} colorClass="text-purple-600" />
        <ReviewSection title="Performance Tips" items={review.performance_tips} icon={Zap} colorClass="text-amber-600" />
      </div>

       <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Reviewed Code</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{code}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}