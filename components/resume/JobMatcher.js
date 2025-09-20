import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InvokeLLM } from "@/integrations/Core";
import { 
  Briefcase, Loader2, Download, 
  CheckCircle, AlertTriangle, Target 
} from "lucide-react";

export default function JobMatcher({ resume, className = "" }) {
  const [jobDescription, setJobDescription] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeJobMatch = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description");
      return;
    }

    setIsMatching(true);
    setError(null);

    try {
      const result = await InvokeLLM({
        prompt: `
          Analyze how well this resume matches the job description. Consider:
          1. Matching skills and experience
          2. Missing requirements 
          3. Suggestions for resume tailoring
          4. Cover letter key points to highlight
          5. Overall match percentage
          
          Job Description: ${jobDescription}
          
          Resume Content: ${resume.extracted_content || 'Resume content not available'}
          Resume Skills: ${resume.skills?.join(', ') || 'Not specified'}
        `,
        response_json_schema: {
          type: "object",
          properties: {
            match_percentage: { type: "number" },
            matching_skills: {
              type: "array",
              items: { type: "string" }
            },
            missing_requirements: {
              type: "array", 
              items: { type: "string" }
            },
            resume_improvements: {
              type: "array",
              items: { type: "string" }
            },
            cover_letter_points: {
              type: "array",
              items: { type: "string" }
            },
            tailored_resume_suggestions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setMatchResult(result);
    } catch (error) {
      setError("Error analyzing job match. Please try again.");
      console.error("Job match error:", error);
    }

    setIsMatching(false);
  };

  const generateCoverLetter = async () => {
    if (!matchResult) return;

    try {
      const coverLetter = await InvokeLLM({
        prompt: `
          Generate a professional cover letter based on:
          - Resume content: ${resume.extracted_content || 'Resume content not available'}
          - Job description: ${jobDescription}
          - Key points to highlight: ${matchResult.cover_letter_points?.join(', ')}
          - Missing skills to address: ${matchResult.missing_requirements?.join(', ')}
          
          Make it personalized, engaging, and professionally formatted.
        `
      });

      // Create download
      const blob = new Blob([coverLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover-letter.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError("Error generating cover letter. Please try again.");
    }
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={className}>
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Job Match Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Job Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Paste Job Description
            </label>
            <Textarea
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-32"
            />
          </div>

          <Button 
            onClick={analyzeJobMatch}
            disabled={isMatching || !jobDescription.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isMatching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Match...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Analyze Job Match
              </>
            )}
          </Button>

          {/* Match Results */}
          {matchResult && (
            <div className="space-y-6 pt-6 border-t border-slate-200">
              {/* Match Percentage */}
              <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                <div className={`text-4xl font-bold mb-2 ${getMatchColor(matchResult.match_percentage)}`}>
                  {matchResult.match_percentage}%
                </div>
                <p className="text-slate-600">Job Match Score</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Matching Skills */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Matching Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matching_skills?.map((skill, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800 border-green-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Missing Requirements */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Missing Requirements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missing_requirements?.map((req, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resume Improvements */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Resume Tailoring Suggestions</h4>
                <div className="space-y-2">
                  {matchResult.tailored_resume_suggestions?.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <span className="text-sm text-indigo-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Cover Letter */}
              <Button 
                onClick={generateCoverLetter}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Cover Letter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
