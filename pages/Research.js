import React, { useState, useEffect } from "react";
import { ResearchPaper } from "@/entities/ResearchPaper";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSearch, Upload, Brain, BookOpen, Users, Lightbulb,
  FileText, AlertTriangle, Loader2, CheckCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function Research() {
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    const fetchedPapers = await ResearchPaper.list("-created_date");
    setPapers(fetchedPapers);
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    const toastId = toast.loading("Uploading research paper...");

    try {
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB");
      }

      // Check file type (PDF only)
      if (file.type !== 'application/pdf') {
        throw new Error("Only PDF files are supported");
      }

      const { file_url } = await UploadFile({ file });
      toast.loading("Analyzing paper with AI...", { id: toastId });
      
      await analyzePaper(file_url, file.name, toastId);

    } catch (error) {
      setError(error.message);
      toast.error(error.message, { id: toastId });
    }

    setIsUploading(false);
  };

  const analyzePaper = async (fileUrl, fileName, toastId) => {
    setIsAnalyzing(true);

    try {
      // Extract content from PDF
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            title: { type: "string" },
            authors: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (extractResult.status !== "success" || !extractResult.output?.content) {
        throw new Error("Failed to extract text from PDF. Ensure the PDF contains selectable text.");
      }

      const extractedContent = extractResult.output.content;
      const extractedTitle = extractResult.output.title || fileName.replace('.pdf', '');
      const extractedAuthors = extractResult.output.authors || [];

      // Analyze with AI
      const analysisResult = await InvokeLLM({
        prompt: `
          Analyze this research paper and provide a comprehensive summary:
          
          Title: ${extractedTitle}
          Content: ${extractedContent.substring(0, 8000)} // Limit content to avoid token limits
          
          Provide:
          1. A clear summary (2-3 paragraphs)
          2. Key findings and contributions
          3. Important definitions and terms
          4. Research methodology used
          5. Main conclusions
          6. Difficulty level (undergraduate/graduate/phd/expert)
          7. Research field/domain
        `,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            definitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string" },
                  definition: { type: "string" }
                }
              }
            },
            methodology: { type: "string" },
            conclusions: { type: "string" },
            difficulty_level: { 
              type: "string", 
              enum: ["undergraduate", "graduate", "phd", "expert"] 
            },
            field: { type: "string" }
          }
        }
      });

      // Save to database
      const paperData = {
        title: extractedTitle,
        authors: extractedAuthors,
        file_url: fileUrl,
        summary: analysisResult.summary,
        key_points: analysisResult.key_points || [],
        definitions: analysisResult.definitions || [],
        methodology: analysisResult.methodology,
        conclusions: analysisResult.conclusions,
        difficulty_level: analysisResult.difficulty_level || "undergraduate",
        field: analysisResult.field || "General"
      };

      const savedPaper = await ResearchPaper.create(paperData);
      setSelectedPaper(savedPaper);
      await loadPapers();
      
      toast.success("Paper analyzed successfully!", { id: toastId });

    } catch (error) {
      setError(error.message || "Error analyzing paper");
      toast.error(error.message || "Analysis failed", { id: toastId });
    }

    setIsAnalyzing(false);
  };

  const difficultyColors = {
    undergraduate: "bg-green-100 text-green-800",
    graduate: "bg-blue-100 text-blue-800", 
    phd: "bg-purple-100 text-purple-800",
    expert: "bg-red-100 text-red-800"
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileSearch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                AI Research Assistant
              </h1>
              <p className="text-slate-600">Upload and analyze research papers with AI-powered insights</p>
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
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  Upload Paper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-indigo-200 bg-indigo-50">
                  <AlertTriangle className="h-4 w-4 text-indigo-600" />
                  <AlertDescription className="text-indigo-800">
                    <strong>Requirements:</strong> PDF files only, max 5MB
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  {isUploading || isAnalyzing ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        {isAnalyzing ? (
                          <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />
                        ) : (
                          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {isAnalyzing ? "Analyzing Paper..." : "Uploading..."}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {isAnalyzing ? "AI is processing your paper" : "Please wait"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Upload Research Paper</h3>
                        <p className="text-sm text-slate-500">Drag & drop or click to browse</p>
                      </div>
                      <label htmlFor="file-upload">
                        <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Papers */}
            {papers.length > 0 && (
              <Card className="glass-effect border-0 shadow-lg mt-6">
                <CardHeader>
                  <CardTitle>Recent Papers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {papers.slice(0, 5).map((paper) => (
                    <div
                      key={paper.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPaper?.id === paper.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedPaper(paper)}
                    >
                      <h4 className="font-medium text-sm line-clamp-2">{paper.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={difficultyColors[paper.difficulty_level]}>
                          {paper.difficulty_level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {paper.field}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Section */}
          <div className="lg:col-span-2">
            {selectedPaper ? (
              <div className="space-y-6">
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-slate-800 mb-2">
                          {selectedPaper.title}
                        </CardTitle>
                        {selectedPaper.authors && selectedPaper.authors.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users className="w-4 h-4" />
                            {selectedPaper.authors.join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={difficultyColors[selectedPaper.difficulty_level]}>
                          {selectedPaper.difficulty_level}
                        </Badge>
                        <Badge variant="outline">{selectedPaper.field}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-slate-700 leading-relaxed">
                        {selectedPaper.summary}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Key Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {selectedPaper.key_points?.map((point, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {selectedPaper.definitions && selectedPaper.definitions.length > 0 && (
                    <Card className="glass-effect border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          Key Definitions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedPaper.definitions.slice(0, 5).map((def, index) => (
                          <div key={index}>
                            <h4 className="font-semibold text-sm text-slate-800">{def.term}</h4>
                            <p className="text-sm text-slate-600 mt-1">{def.definition}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {(selectedPaper.methodology || selectedPaper.conclusions) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {selectedPaper.methodology && (
                      <Card className="glass-effect border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle>Methodology</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700 text-sm leading-relaxed">
                            {selectedPaper.methodology}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {selectedPaper.conclusions && (
                      <Card className="glass-effect border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle>Conclusions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700 text-sm leading-relaxed">
                            {selectedPaper.conclusions}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <FileSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    Upload Your First Research Paper
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Get AI-powered analysis, summaries, and key insights from academic papers
                  </p>
                  <div className="max-w-md mx-auto text-left">
                    <h4 className="font-semibold text-slate-800 mb-3">What you'll get:</h4>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        AI-generated summary and analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-indigo-600" />
                        Key findings and contributions
                      </li>
                      <li className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        Important definitions and terms
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        Methodology and conclusions
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}