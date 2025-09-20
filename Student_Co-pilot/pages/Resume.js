
import React, { useState, useEffect } from "react";
import { Resume as ResumeEntity } from "@/entities/Resume";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Brain, Zap, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import FileUploadZone from "../components/resume/FileUploadZone";
import ResumeAnalysis from "../components/resume/ResumeAnalysis";
import JobMatcher from "../components/resume/JobMatcher";
import ResumeGenerator from "../components/resume/ResumeGenerator";

export default function Resume() {
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    const fetchedResumes = await ResumeEntity.list("-created_date");
    setResumes(fetchedResumes);
    if (fetchedResumes.length > 0) {
      setCurrentResume(fetchedResumes[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    const toastId = toast.loading("Uploading resume...");
    
    try {
      const { file_url } = await UploadFile({ file });
      toast.loading("Analyzing resume with AI...", { id: toastId });
      await analyzeResume(file_url, toastId);
    } catch (error) {
      let errorMessage = "Error uploading file. Please try again.";
      if (error.message?.includes('413') || error.message?.toLowerCase().includes('too large')) {
        errorMessage = "File is too large. Please use a PDF smaller than 5MB.";
      } else if (error.message?.toLowerCase().includes('file type')) {
        errorMessage = "Only PDF files are supported. Please convert your resume to PDF.";
      }
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      console.error("Upload error:", error);
    }
    
    setIsUploading(false);
  };

  const analyzeResume = async (fileUrl, toastId) => {
    setIsAnalyzing(true);
    
    try {
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            experience: { type: "string" },
            education: { type: "string" },
            contact_info: { type: "string" }
          }
        }
      });

      let extractedContent = "";
      let extractedSkills = [];

      if (extractResult.status === "success" && extractResult.output) {
        extractedContent = extractResult.output.content || "";
        extractedSkills = extractResult.output.skills || [];
      } else {
        let errorMsg = "Failed to extract content from resume.";
        if (extractResult.details?.includes('10MB') || extractResult.details?.toLowerCase().includes('file size exceeded')) {
          errorMsg = "File is too large for analysis. Please use a PDF smaller than 5MB.";
        } else if (extractResult.details) {
          errorMsg = `Analysis failed: ${extractResult.details}`;
        }
        throw new Error(errorMsg);
      }

      if (!extractedContent.trim()) {
        throw new Error("No readable text found in the PDF. Please ensure your resume contains selectable text (not just a scanned image).");
      }

      const analysisResult = await InvokeLLM({
        prompt: `Analyze this resume content for a student/recent graduate. Provide comprehensive feedback on formatting, grammar, missing skills, strengths, and improvement suggestions. Focus on entry-level positions. Resume Content: ${extractedContent}`,
        response_json_schema: {
          type: "object",
          properties: {
            formatting_score: { type: "number" },
            grammar_issues: { type: "array", items: { type: "string" } },
            missing_skills: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
            extracted_skills: { type: "array", items: { type: "string" } },
            experience_level: { type: "string", enum: ["entry", "junior", "mid", "senior"] }
          }
        }
      });

      const resumeData = {
        file_url: fileUrl,
        analysis: analysisResult,
        skills: analysisResult.extracted_skills || extractedSkills,
        experience_level: analysisResult.experience_level || "entry",
        extracted_content: extractedContent
      };

      const savedResume = await ResumeEntity.create(resumeData);
      setCurrentResume(savedResume);
      await loadResumes();
      toast.success("Resume analysis complete!", { id: toastId });
      
    } catch (error) {
      setError(error.message || "Error analyzing resume. Please try again.");
      toast.error(error.message || "Analysis failed.", { id: toastId });
      console.error("Analysis error:", error);
    }
    
    setIsAnalyzing(false);
  };

  const handleDeleteResume = async (resumeId) => {
    const toastId = toast.loading("Deleting resume...");
    try {
      await ResumeEntity.delete(resumeId);
      toast.success("Resume deleted successfully!", { id: toastId });
      
      const newResumes = resumes.filter(r => r.id !== resumeId);
      setResumes(newResumes);

      if (currentResume?.id === resumeId) {
        setCurrentResume(newResumes.length > 0 ? newResumes[0] : null);
      }
    } catch (err) {
      toast.error("Failed to delete resume.", { id: toastId });
      console.error("Deletion error:", err);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Resume & Career Copilot
              </h1>
              <p className="text-slate-600">AI-powered resume optimization and job matching</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <FileUploadZone 
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              isAnalyzing={isAnalyzing}
            />

            {resumes.length > 0 && (
              <Card className="mt-6 glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Resumes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resumes.map((resume, index) => (
                    <div 
                      key={resume.id}
                      className={`p-3 rounded-lg border group transition-all duration-200 ${
                        currentResume?.id === resume.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setCurrentResume(resume)}
                      >
                        <span className="font-medium text-sm">Resume #{index + 1}</span>
                        <Badge variant="outline">
                          {resume.analysis?.formatting_score || 'N/A'}/100
                        </Badge>
                      </div>
                      <div className="flex justify-end mt-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this resume analysis.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteResume(resume.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis and Tools */}
          <div className="lg:col-span-2">
            {currentResume ? (
              <>
                <ResumeAnalysis resume={currentResume} />
                <ResumeGenerator 
                  resume={currentResume}
                  className="mt-8"
                />
                <JobMatcher 
                  resume={currentResume}
                  className="mt-8"
                />
              </>
            ) : (
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    Upload Your Resume
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Get instant AI-powered analysis and personalized recommendations
                  </p>
                  <Alert className="max-w-md mx-auto border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Note:</strong> Currently only PDF files are supported. Please convert your resume to PDF.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
