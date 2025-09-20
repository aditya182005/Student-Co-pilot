import React, { useState, useEffect } from "react";
import { CodeSubmission } from "@/entities/CodeSubmission";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Brain, Zap, MessageSquare, Target, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import CodeEditor from "../components/code/CodeEditor";
import CodeReviewPanel from "../components/code/CodeReviewPanel";
import MockInterview from "../components/code/MockInterview";
import CodeHistory from "../components/code/CodeHistory";

export default function CodePage() {
  const [submissions, setSubmissions] = useState([]);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("editor");

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    const fetchedSubmissions = await CodeSubmission.list("-created_date");
    setSubmissions(fetchedSubmissions);
  };

  const handleCodeSubmit = async (code, language, title) => {
    setIsAnalyzing(true);
    setError(null);
    const toastId = toast.loading("Submitting code for AI review...");
    
    try {
      const reviewResult = await InvokeLLM({
        prompt: `Review this ${language} code submission titled "${title}". Analyze for bugs, quality, security, performance, and best practices. Provide an overall score from 0-100. Code: ${code}`,
        response_json_schema: {
          type: "object",
          properties: {
            bugs_found: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
            security_issues: { type: "array", items: { type: "string" } },
            performance_tips: { type: "array", items: { type: "string" } },
            overall_score: { type: "number", minimum: 0, maximum: 100 }
          }
        }
      });

      const submissionData = { title, code, language, review: reviewResult, status: "reviewed" };
      const savedSubmission = await CodeSubmission.create(submissionData);
      
      setActiveSubmission(savedSubmission);
      await loadSubmissions();
      setActiveTab("review");
      toast.success("Code review complete!", { id: toastId });
      
    } catch (err) {
      setError("Error reviewing code. Please try again.");
      toast.error("Code review failed.", { id: toastId });
      console.error("Code review error:", err);
    }
    
    setIsAnalyzing(false);
  };

  const tabContent = {
    editor: (
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CodeEditor onCodeSubmit={handleCodeSubmit} isAnalyzing={isAnalyzing} />
        </div>
        <div className="lg:col-span-1">
          <CodeHistory submissions={submissions} activeSubmission={activeSubmission} setActiveSubmission={setActiveSubmission} setActiveTab={setActiveTab} />
        </div>
      </div>
    ),
    review: activeSubmission ? <CodeReviewPanel submission={activeSubmission} /> : null,
    interview: <MockInterview />,
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                AI Code Mentor
              </h1>
              <p className="text-slate-600">Get expert code reviews and interview preparation</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button variant={activeTab === "editor" ? "default" : "outline"} onClick={() => setActiveTab("editor")} className="flex items-center gap-2"><Code2 className="w-4 h-4" />Code Editor</Button>
            <Button variant={activeTab === "review" ? "default" : "outline"} onClick={() => setActiveTab("review")} disabled={!activeSubmission} className="flex items-center gap-2"><Brain className="w-4 h-4" />AI Review</Button>
            <Button variant={activeTab === "interview" ? "default" : "outline"} onClick={() => setActiveTab("interview")} className="flex items-center gap-2"><Target className="w-4 h-4" />Mock Interview</Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activeSubmission && activeTab !== "editor" && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Active Submission</h3>
                <p className="text-sm text-green-700">{activeSubmission.title} • {activeSubmission.language}</p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-800">
                Score: {activeSubmission.review?.overall_score || 'N/A'}/100
              </Badge>
            </div>
          </div>
        )}

        <div className="min-h-96">
          {tabContent[activeTab] || (
            <Card className="glass-effect border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Code2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to Code?</h3>
                <p className="text-slate-500">Submit your code for AI-powered review or start a mock interview.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}