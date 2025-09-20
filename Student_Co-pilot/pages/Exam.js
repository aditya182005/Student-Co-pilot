
import React, { useState, useEffect } from "react";
import { ExamPrep } from "@/entities/ExamPrep";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Target, Brain, Calendar, AlertTriangle, FileUp, CheckSquare } from "lucide-react";
import { toast } from "sonner";
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
import ExamSetup from "../components/exam/ExamSetup";
import MockTest from "../components/exam/MockTest";
import StudyPlan from "../components/exam/StudyPlan";
import ExamList from "../components/exam/ExamList";
import AdaptiveQuiz from "../components/exam/AdaptiveQuiz";
import PerformanceAnalytics from "../components/exam/PerformanceAnalytics";

export default function Exam() {
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [activeTab, setActiveTab] = useState("exams");

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    const fetchedExams = await ExamPrep.list("-created_date");
    setExams(fetchedExams);
  };

  const handleExamCreate = async (examData, files) => {
    const toastId = toast.loading("Analyzing syllabus and past papers...");
    try {
      let pastPapersContent = "";
      if (files && files.length > 0) {
        toast.loading("Extracting content from past papers...", { id: toastId });
        for (const file of files) {
          const { file_url } = await UploadFile({ file });
          const extractResult = await ExtractDataFromUploadedFile({
            file_url,
            json_schema: { type: "object", properties: { content: { type: "string" } } }
          });
          if (extractResult.status === "success") {
            pastPapersContent += `\n\n--- Past Paper Content ---\n${extractResult.output.content}`;
          }
        }
      }

      toast.loading("Generating AI predictions and study plan...", { id: toastId });
      const analysis = await InvokeLLM({
        prompt: `
          For an exam named "${examData.exam_name}" on ${examData.exam_date} in ${examData.subject}:
          Syllabus: "${examData.syllabus}"
          ${pastPapersContent ? `Past Papers Content: "${pastPapersContent}"` : ''}
          
          Based on all this information, perform the following actions:
          1.  **Predict Questions**: Generate 15 highly likely exam questions based on recurring themes and important topics.
          2.  **Identify Weak Areas**: Pinpoint 3-5 challenging topics that students typically struggle with.
          3.  **Create Study Plan**: Develop a structured study plan with weekly goals, covering all syllabus topics.
          4.  **Suggest YouTube Videos**: Find 3-5 relevant YouTube video links for the toughest topics and key concepts identified in the syllabus. Ensure the URLs are valid.
          Provide the study plan as an object with 'daily_hours' (a number) and 'topics_schedule' (an object where keys are dates and values are scheduled topics).
        `,
        response_json_schema: {
          type: "object",
          properties: {
            predicted_questions: { type: "array", items: { type: "string" } },
            weak_areas: { type: "array", items: { type: "string" } },
            study_plan: {
              type: "object",
              properties: {
                daily_hours: { type: "number" },
                topics_schedule: { type: "object", additionalProperties: { type: "string" } }
              },
              required: ["daily_hours", "topics_schedule"]
            },
            youtube_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" }
                },
                required: ["title", "url"]
              }
            }
          },
          required: ["predicted_questions", "weak_areas", "study_plan", "youtube_suggestions"]
        }
      });

      const fullExamData = {
        ...examData,
        predicted_questions: analysis.predicted_questions || [],
        weak_areas: analysis.weak_areas || [],
        study_plan: analysis.study_plan || {},
        youtube_suggestions: analysis.youtube_suggestions || [],
        mock_test_scores: []
      };

      const savedExam = await ExamPrep.create(fullExamData);
      setActiveExam(savedExam);
      await loadExams();
      setActiveTab("plan");
      toast.success("AI Exam Prep Suite created successfully!", { id: toastId });
      
    } catch (error) {
      toast.error("Failed to create exam prep.", { id: toastId });
      console.error("Error creating exam:", error);
    }
  };

  const handleMockTestComplete = async (score, totalQuestions) => {
    if (!activeExam) return;
    
    const toastId = toast.loading("Saving mock test results...");
    const newScore = {
      date: new Date().toISOString().split('T')[0],
      score: Math.round((score / totalQuestions) * 100),
      total_questions: totalQuestions
    };
    
    const updatedScores = [...(activeExam.mock_test_scores || []), newScore];
    
    try {
      await ExamPrep.update(activeExam.id, { mock_test_scores: updatedScores });
      const updatedExam = await ExamPrep.get(activeExam.id);
      setActiveExam(updatedExam);
      await loadExams();
      toast.success("Mock test results saved!", { id: toastId });
    } catch (error) {
      toast.error("Failed to save test results.", { id: toastId });
      console.error("Error saving mock test score:", error);
    }
  };

  const handleDeleteExam = async (examId) => {
    const toastId = toast.loading("Deleting exam...");
    try {
      await ExamPrep.delete(examId);
      if (activeExam && activeExam.id === examId) {
        setActiveExam(null);
        setActiveTab("exams"); // Go back to exams list after deleting active one
      }
      await loadExams();
      toast.success("Exam deleted successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to delete exam.", { id: toastId });
      console.error("Error deleting exam:", error);
    }
  };

  const tabContent = {
    exams: (
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ExamSetup onExamCreate={handleExamCreate} />
        </div>
        <div className="lg:col-span-2">
          <ExamList 
            exams={exams}
            activeExam={activeExam}
            setActiveExam={setActiveExam}
            setActiveTab={setActiveTab}
            onDeleteExam={handleDeleteExam}
          />
        </div>
      </div>
    ),
    plan: activeExam ? <StudyPlan exam={activeExam} /> : null,
    test: activeExam ? <MockTest exam={activeExam} onTestComplete={handleMockTestComplete} /> : null,
    adaptive_quiz: activeExam ? <AdaptiveQuiz exam={activeExam} /> : null,
    analytics: activeExam ? <PerformanceAnalytics exam={activeExam} /> : null,
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                AI Exam Preparation
              </h1>
              <p className="text-slate-600">Predict questions, track progress, and ace your exams</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant={activeTab === "exams" ? "default" : "outline"} onClick={() => setActiveTab("exams")} className="flex items-center gap-2"><Calendar className="w-4 h-4" />My Exams</Button>
            <Button variant={activeTab === "plan" ? "default" : "outline"} onClick={() => setActiveTab("plan")} disabled={!activeExam} className="flex items-center gap-2"><Target className="w-4 h-4" />Study Plan</Button>
            <Button variant={activeTab === "test" ? "default" : "outline"} onClick={() => setActiveTab("test")} disabled={!activeExam} className="flex items-center gap-2"><Brain className="w-4 h-4" />Mock Test</Button>
            <Button variant={activeTab === "adaptive_quiz" ? "default" : "outline"} onClick={() => setActiveTab("adaptive_quiz")} disabled={!activeExam} className="flex items-center gap-2"><CheckSquare className="w-4 h-4" />Adaptive Quiz</Button>
            <Button variant={activeTab === "analytics" ? "default" : "outline"} onClick={() => setActiveTab("analytics")} disabled={!activeExam} className="flex items-center gap-2"><FileUp className="w-4 h-4" />Analytics</Button>
          </div>
        </div>

        {activeExam && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Active Exam</h3>
                <p className="text-sm text-amber-700">{activeExam.exam_name} • {activeExam.subject} • {new Date(activeExam.exam_date).toLocaleDateString()}</p>
              </div>
              <Badge className="ml-auto bg-amber-100 text-amber-800">
                {Math.ceil((new Date(activeExam.exam_date) - new Date()) / (1000 * 60 * 60 * 24))} days left
              </Badge>
            </div>
          </div>
        )}

        <div className="min-h-96">
          {tabContent[activeTab] || (
            <Card className="glass-effect border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Exam Selected</h3>
                <p className="text-slate-500">Create or select an exam to view study plans and take mock tests.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
