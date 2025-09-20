import React, { useState, useRef } from "react";
import { StudyMaterial } from "@/entities/StudyMaterial";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, Upload, FileImage, Brain, CheckCircle, 
  AlertTriangle, Loader2, Download, Copy
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function HandwritingOCR() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  const handleFileSelect = (file) => {
    if (!supportedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or PDF file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setExtractedText("");
    setAiSummary(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processHandwriting = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    const toastId = toast.loading("Processing handwritten content...");

    try {
      // Upload file
      toast.loading("Uploading file...", { id: toastId });
      const { file_url } = await UploadFile({ file: selectedFile });

      // Extract text using OCR
      toast.loading("Extracting text with AI OCR...", { id: toastId });
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            confidence: { type: "number" },
            detected_language: { type: "string" }
          }
        }
      });

      if (extractResult.status !== "success" || !extractResult.output?.content) {
        throw new Error(extractResult.details || "Failed to extract text from the image");
      }

      const extractedContent = extractResult.output.content;
      setExtractedText(extractedContent);

      // Generate AI summary and analysis
      toast.loading("Generating AI summary...", { id: toastId });
      const summaryResult = await InvokeLLM({
        prompt: `
          Analyze this extracted handwritten text and provide:
          1. A clear, organized summary
          2. Key concepts and topics
          3. Important points and highlights
          4. Suggested study focus areas
          
          Extracted text: "${extractedContent}"
        `,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_concepts: { type: "array", items: { type: "string" } },
            important_points: { type: "array", items: { type: "string" } },
            study_focus: { type: "array", items: { type: "string" } },
            difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
          }
        }
      });

      setAiSummary(summaryResult);
      toast.success("Handwriting processed successfully!", { id: toastId });

    } catch (err) {
      setError(err.message || "Failed to process handwriting. Please try again.");
      toast.error("Processing failed", { id: toastId });
      console.error("OCR processing error:", err);
    }

    setIsProcessing(false);
  };

  const saveAsStudyMaterial = async () => {
    if (!extractedText || !title.trim() || !subject.trim()) {
      toast.error("Please provide title and subject");
      return;
    }

    const toastId = toast.loading("Saving as study material...");

    try {
      const materialData = {
        title,
        file_url: preview, // Use preview as file URL for images
        file_type: selectedFile.type.startsWith('image/') ? 'image' : 'pdf',
        subject,
        extracted_content: extractedText,
        summary: aiSummary?.summary || "",
        key_concepts: aiSummary?.key_concepts || [],
        difficulty_level: aiSummary?.difficulty_level || "intermediate"
      };

      await StudyMaterial.create(materialData);
      toast.success("Study material saved successfully!", { id: toastId });
      
      // Reset form
      setSelectedFile(null);
      setPreview("");
      setExtractedText("");
      setAiSummary(null);
      setTitle("");
      setSubject("");

    } catch (error) {
      toast.error("Failed to save study material", { id: toastId });
      console.error("Save error:", error);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success("Text copied to clipboard!");
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileImage className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Handwriting OCR & Digitizer
              </h1>
              <p className="text-sm lg:text-base text-slate-600">Transform handwritten notes into digital text with AI analysis</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Upload Section */}
          <div>
            <Card className="glass-effect border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  Upload Handwritten Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 lg:p-8 text-center transition-all hover:border-slate-300"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                        <FileImage className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">Upload or take a photo</h3>
                        <p className="text-sm text-slate-500 mb-4">Drag & drop your handwritten notes or click to browse</p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                        <Button
                          onClick={() => cameraInputRef.current?.click()}
                          variant="outline"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400">
                        Supports JPEG, PNG, and PDF files • Max 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {preview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full max-h-64 object-contain rounded-lg border"
                        />
                      </motion.div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-800">{selectedFile.name}</span>
                      </div>
                      <Badge variant="outline">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={processHandwriting}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Extract Text
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview("");
                          setError(null);
                        }}
                        variant="outline"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Save Form */}
            {extractedText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Save as Study Material</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Physics Class Notes"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Physics"
                      />
                    </div>
                    <Button
                      onClick={saveAsStudyMaterial}
                      disabled={!title.trim() || !subject.trim()}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Study Material
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Results Section */}
          <div>
            <AnimatePresence>
              {extractedText ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Extracted Text */}
                  <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileImage className="w-5 h-5 text-green-600" />
                          Extracted Text
                        </CardTitle>
                        <Button
                          onClick={copyText}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                          {extractedText}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Analysis */}
                  {aiSummary && (
                    <Card className="glass-effect border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-blue-600" />
                          AI Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {aiSummary.summary && (
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Summary</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {aiSummary.summary}
                            </p>
                          </div>
                        )}

                        {aiSummary.key_concepts && aiSummary.key_concepts.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Key Concepts</h4>
                            <div className="flex flex-wrap gap-2">
                              {aiSummary.key_concepts.map((concept, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiSummary.important_points && aiSummary.important_points.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Important Points</h4>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {aiSummary.important_points.map((point, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiSummary.difficulty_level && (
                          <div className="pt-2 border-t">
                            <Badge className={`
                              ${aiSummary.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' : 
                                aiSummary.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}
                            `}>
                              {aiSummary.difficulty_level} level
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ) : (
                <Card className="glass-effect border-0 shadow-lg">
                  <CardContent className="p-8 lg:p-12 text-center">
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <FileImage className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
                    </motion.div>
                    <h3 className="text-lg lg:text-xl font-semibold text-slate-700 mb-2">
                      Upload Handwritten Notes
                    </h3>
                    <p className="text-sm lg:text-base text-slate-500 mb-4 lg:mb-6">
                      Upload photos of your handwritten notes and let AI convert them to digital text with analysis
                    </p>
                    <div className="max-w-md mx-auto text-left">
                      <h4 className="font-semibold text-slate-800 mb-3">What you'll get:</h4>
                      <ul className="text-sm text-slate-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-green-600" />
                          AI-powered text extraction from handwriting
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Automatic summary and key points
                        </li>
                        <li className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-green-600" />
                          Save as searchable study material
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}