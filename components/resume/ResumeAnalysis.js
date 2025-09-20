import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, AlertTriangle, TrendingUp, 
  FileText, Star, Target, Lightbulb 
} from "lucide-react";

export default function ResumeAnalysis({ resume }) {
  const analysis = resume.analysis || {};
  const score = analysis.formatting_score || 0;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Overall Resume Score
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}/100
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress 
              value={score} 
              className="h-3"
            />
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Needs Work</span>
              <span className="text-slate-500">Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.strengths?.length > 0 ? (
                analysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800">{strength}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No strengths identified yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues to Fix */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Grammar Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.grammar_issues?.length > 0 ? (
                analysis.grammar_issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-800">{issue}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-green-800">No grammar issues found!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Skills */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Target className="w-5 h-5" />
            Skills to Add
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {analysis.missing_skills?.length > 0 ? (
              analysis.missing_skills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer"
                >
                  + {skill}
                </Badge>
              ))
            ) : (
              <p className="text-slate-500 text-sm">All key skills identified</p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Click on skills to add them to your study plan
          </p>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Lightbulb className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.suggestions?.length > 0 ? (
              analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm text-indigo-800">{suggestion}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No specific suggestions available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}