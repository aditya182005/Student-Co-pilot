
import React, { useState, useEffect } from "react";
import { StudyMaterial } from "@/entities/StudyMaterial";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Upload, Brain, MessageSquare, FileText, Zap, AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

import MaterialUpload from "../components/study/MaterialUpload";
import MaterialsList from "../components/study/MaterialsList";
import StudyChat from "../components/study/StudyChat";
import QuizGenerator from "../components/study/QuizGenerator";
import FlashcardSystem from "../components/study/FlashcardSystem";

export default function Study() {
  const [materials, setMaterials] = useState([]);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("materials");

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    const fetchedMaterials = await StudyMaterial.list("-created_date");
    setMaterials(fetchedMaterials);
    // Optional: If no material is active, and there are materials, set the first one as active
    // This is often good for user experience, but we'll let explicit selection drive it for now.
    // If we wanted to auto-select, it would be:
    // if (!activeMaterial && fetchedMaterials.length > 0) {
    //   setActiveMaterial(fetchedMaterials[0]);
    //   setActiveTab("chat"); // Or another default interaction tab
    // }
  };

  const handleFileUpload = async (file, title, subject) => {
    setIsUploading(true);
    setError(null);
    const toastId = toast.loading("Uploading study material...");
    
    try {
      const { file_url } = await UploadFile({ file });
      toast.loading("Analyzing material...", { id: toastId });
      
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: { content: { type: "string" }, topics: { type: "array", items: { type: "string" } } }
        }
      });

      let extractedContent = "";
      let topics = [];
      
      if (extractResult.status === "success" && extractResult.output) {
        extractedContent = extractResult.output.content || "";
        topics = extractResult.output.topics || [];
      } else {
        throw new Error(extractResult.details || "Failed to extract content from file.");
      }

      // Check if extractedContent is empty after extraction
      if (!extractedContent.trim()) {
        throw new Error("No readable content extracted from the file. Please try another file.");
      }

      const analysisResult = await InvokeLLM({
        prompt: `Analyze this study material (Title: ${title}) and provide a summary, key concepts, difficulty level, and important points. Content: ${extractedContent}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_concepts: { type: "array", items: { type: "string" } },
            difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            important_points: { type: "array", items: { type: "string" } }
          }
        }
      });

      const materialData = {
        title, file_url, subject,
        file_type: file.type.includes('pdf') ? 'pdf' : (file.type.includes('image') ? 'image' : 'txt'),
        extracted_content: extractedContent,
        summary: analysisResult.summary,
        key_concepts: analysisResult.key_concepts || topics,
        difficulty_level: analysisResult.difficulty_level || "intermediate"
      };

      const newMaterial = await StudyMaterial.create(materialData);
      await loadMaterials(); // Reload all materials to include the new one
      setActiveMaterial(newMaterial); // Set newly uploaded material as active
      setActiveTab("chat"); // Switch to chat tab
      toast.success("Material processed successfully!", { id: toastId });
      
    } catch (err) {
      const errorMessage = err.message?.includes('413') ? "File is too large. Please upload files under 10MB." : (err.message || "Error processing material. Please try again.");
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      console.error("Upload error:", err);
    }
    
    setIsUploading(false);
  };
  
  const handleDeleteMaterial = async (materialId) => {
    const toastId = toast.loading("Deleting material...");
    try {
      await StudyMaterial.delete(materialId);
      toast.success("Material deleted successfully!", { id: toastId });
      
      const newMaterials = materials.filter(m => m.id !== materialId);
      setMaterials(newMaterials);

      if (activeMaterial?.id === materialId) {
        // If the active material was deleted, clear active material and revert to materials tab
        setActiveMaterial(null);
        setActiveTab("materials"); 
      } else if (newMaterials.length > 0) {
        // If activeMaterial was not the deleted one, but it's now null (e.g., deleted last material remaining),
        // or if all materials are deleted.
        if (!newMaterials.some(m => m.id === activeMaterial?.id)) {
          setActiveMaterial(null);
          setActiveTab("materials");
        }
      } else { // No materials left at all
        setActiveMaterial(null);
        setActiveTab("materials");
      }
    } catch (err) {
      toast.error("Failed to delete material.", { id: toastId });
      console.error("Deletion error:", err);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Study Buddy
              </h1>
              <p className="text-slate-600">Transform your notes into interactive learning experiences</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button variant={activeTab === "materials" ? "default" : "outline"} onClick={() => setActiveTab("materials")} className="flex items-center gap-2"><FileText className="w-4 h-4" />Manage Materials</Button>
            <Button variant={activeTab === "chat" ? "default" : "outline"} onClick={() => setActiveTab("chat")} disabled={!activeMaterial} className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />Chat with Notes</Button>
            <Button variant={activeTab === "quiz" ? "default" : "outline"} onClick={() => setActiveTab("quiz")} disabled={!activeMaterial} className="flex items-center gap-2"><Zap className="w-4 h-4" />Generate Quiz</Button>
            <Button variant={activeTab === "flashcards" ? "default" : "outline"} onClick={() => setActiveTab("flashcards")} disabled={!activeMaterial} className="flex items-center gap-2"><Brain className="w-4 h-4" />Smart Flashcards</Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activeMaterial && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900">Active Material</h3>
                <p className="text-sm text-purple-700">{activeMaterial.title} • {activeMaterial.subject}</p>
              </div>
              <Badge className="ml-auto bg-purple-100 text-purple-800">
                {activeMaterial.difficulty_level}
              </Badge>
              {/* Delete button for active material */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 ml-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your study material
                      "{activeMaterial.title}" and remove its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteMaterial(activeMaterial.id)} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar for Material Upload and List */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <MaterialUpload 
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
              />
              <MaterialsList 
                materials={materials} 
                activeMaterial={activeMaterial} 
                setActiveMaterial={(material) => {
                  setActiveMaterial(material);
                  // If on "materials" tab, switch to "chat" when a material is selected.
                  // Otherwise, keep the current tab (quiz, flashcards, etc.)
                  if (activeTab === 'materials' && material) {
                    setActiveTab('chat');
                  }
                }}
                onDeleteMaterial={handleDeleteMaterial}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="min-h-96">
              {activeMaterial ? (
                <>
                  {activeTab === "chat" && <StudyChat material={activeMaterial} />}
                  {activeTab === "quiz" && <QuizGenerator material={activeMaterial} />}
                  {activeTab === "flashcards" && <FlashcardSystem material={activeMaterial} />}
                  {activeTab === "materials" && (
                    <Card className="glass-effect border-0 shadow-lg">
                      <CardContent className="p-12 text-center">
                        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">Material Management</h3>
                        <p className="text-slate-500">
                          Use the sidebar to manage your materials. Select a different tab to interact with "{activeMaterial.title}".
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                // No active material selected
                <Card className="glass-effect border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    {activeTab === "materials" ? (
                      // If on "materials" tab and no active material, prompt to upload/select
                      <>
                        <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">Upload or Select a Material</h3>
                        <p className="text-slate-500">
                          Begin by uploading a new study material or select an existing one from the list on the left to start learning.
                        </p>
                      </>
                    ) : (
                      // If on other tabs (chat, quiz, flashcards) but no active material
                      <>
                        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Material Selected</h3>
                        <p className="text-slate-500">
                          Please select a study material from the list on the left, or upload a new one, to enable this feature.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
