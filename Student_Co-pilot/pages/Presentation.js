import React, { useState, useEffect } from "react";
import { Presentation } from "@/entities/Presentation";
import { StudyMaterial } from "@/entities/StudyMaterial";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Presentation as PresentationIcon, Wand2, Eye, Download, 
  Clock, Users, FileText, Loader2, Sparkles, Play
} from "lucide-react";
import { toast } from "sonner";

export default function Presentations() {
  const [presentations, setPresentations] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [presentationData, setPresentationData] = useState({
    title: "",
    template_style: "academic",
    target_audience: "peers"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [presentationList, materialList] = await Promise.all([
      Presentation.list("-created_date"),
      StudyMaterial.list("-created_date")
    ]);
    
    setPresentations(presentationList);
    setStudyMaterials(materialList);
  };

  const generatePresentation = async () => {
    if (!selectedMaterial || !presentationData.title) {
      toast.error("Please select a material and provide a title");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating AI-powered presentation...");

    try {
      const material = studyMaterials.find(m => m.id === selectedMaterial);
      
      const result = await InvokeLLM({
        prompt: `
          Create a presentation from this study material:
          
          Title: ${material.title}
          Subject: ${material.subject}
          Content: ${material.extracted_content}
          
          Presentation Requirements:
          - Title: ${presentationData.title}
          - Style: ${presentationData.template_style}
          - Target Audience: ${presentationData.target_audience}
          
          Create 8-12 slides with:
          1. Title slide
          2. Agenda/Overview
          3. Main content slides (organized logically)
          4. Key takeaways
          5. Conclusion
          6. References (if applicable)
          
          For each slide, provide:
          - Slide title
          - Main content
          - 3-5 bullet points
          - Slide type (title/content/conclusion/references)
        `,
        response_json_schema: {
          type: "object",
          properties: {
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slide_number: { type: "number" },
                  title: { type: "string" },
                  content: { type: "string" },
                  bullet_points: { type: "array", items: { type: "string" } },
                  slide_type: { 
                    type: "string", 
                    enum: ["title", "content", "conclusion", "references"] 
                  }
                }
              }
            },
            estimated_duration: { type: "number" }
          }
        }
      });

      const presentation = await Presentation.create({
        title: presentationData.title,
        source_material_id: selectedMaterial,
        slides: result.slides || [],
        template_style: presentationData.template_style,
        estimated_duration: result.estimated_duration || 10,
        target_audience: presentationData.target_audience
      });

      setSelectedPresentation(presentation);
      await loadData();
      toast.success("Presentation generated successfully! 🎉", { id: toastId });

    } catch (error) {
      toast.error("Failed to generate presentation", { id: toastId });
      console.error("Error generating presentation:", error);
    }

    setIsGenerating(false);
  };

  const exportPresentation = (presentation) => {
    const slides = presentation.slides || [];
    let content = `# ${presentation.title}\n\n`;
    
    slides.forEach((slide, index) => {
      content += `## Slide ${slide.slide_number}: ${slide.title}\n\n`;
      content += `${slide.content}\n\n`;
      
      if (slide.bullet_points && slide.bullet_points.length > 0) {
        slide.bullet_points.forEach(point => {
          content += `• ${point}\n`;
        });
        content += '\n';
      }
      
      content += '---\n\n';
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentation.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Presentation exported as Markdown file!");
  };

  const templateStyles = {
    academic: { name: "Academic", color: "bg-blue-100 text-blue-800" },
    modern: { name: "Modern", color: "bg-purple-100 text-purple-800" },
    minimal: { name: "Minimal", color: "bg-gray-100 text-gray-800" },
    creative: { name: "Creative", color: "bg-pink-100 text-pink-800" }
  };

  const audienceTypes = {
    students: "Fellow Students",
    professors: "Professors/Faculty", 
    general: "General Audience",
    peers: "Study Group Peers"
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <PresentationIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                AI Presentation Maker
              </h1>
              <p className="text-slate-600">Transform your study materials into professional presentations</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Creation Panel */}
          <div className="lg:col-span-1">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-violet-600" />
                  Create Presentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="material">Source Material</Label>
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger id="material">
                      <SelectValue placeholder="Select study material" />
                    </SelectTrigger>
                    <SelectContent>
                      {studyMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.title} - {material.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Presentation Title</Label>
                  <Input
                    id="title"
                    value={presentationData.title}
                    onChange={(e) => setPresentationData({...presentationData, title: e.target.value})}
                    placeholder="e.g., Introduction to Machine Learning"
                  />
                </div>

                <div>
                  <Label htmlFor="style">Template Style</Label>
                  <Select 
                    value={presentationData.template_style} 
                    onValueChange={(value) => setPresentationData({...presentationData, template_style: value})}
                  >
                    <SelectTrigger id="style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(templateStyles).map(([key, style]) => (
                        <SelectItem key={key} value={key}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select 
                    value={presentationData.target_audience} 
                    onValueChange={(value) => setPresentationData({...presentationData, target_audience: value})}
                  >
                    <SelectTrigger id="audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(audienceTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generatePresentation}
                  disabled={isGenerating || !selectedMaterial || !presentationData.title}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Presentation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Presentations */}
            {presentations.length > 0 && (
              <Card className="glass-effect border-0 shadow-lg mt-6">
                <CardHeader>
                  <CardTitle>Recent Presentations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {presentations.slice(0, 5).map((presentation) => (
                    <div
                      key={presentation.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPresentation?.id === presentation.id 
                          ? 'border-violet-500 bg-violet-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedPresentation(presentation)}
                    >
                      <h4 className="font-medium text-sm line-clamp-2">{presentation.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={templateStyles[presentation.template_style]?.color}>
                          {templateStyles[presentation.template_style]?.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {presentation.slides?.length || 0} slides
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Presentation Viewer */}
          <div className="lg:col-span-2">
            {selectedPresentation ? (
              <div className="space-y-6">
                {/* Header */}
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedPresentation.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={templateStyles[selectedPresentation.template_style]?.color}>
                            {templateStyles[selectedPresentation.template_style]?.name}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {selectedPresentation.estimated_duration} min
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {audienceTypes[selectedPresentation.target_audience]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => exportPresentation(selectedPresentation)}
                          variant="outline" 
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600">
                          <Play className="w-4 h-4 mr-2" />
                          Present
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Slides */}
                <div className="grid gap-6">
                  {selectedPresentation.slides?.map((slide, index) => (
                    <Card key={index} className="glass-effect border-0 shadow-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Slide {slide.slide_number}: {slide.title}
                          </CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {slide.slide_type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-lg p-6 border-2 border-dashed border-slate-200 min-h-[300px]">
                          <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                            {slide.title}
                          </h2>
                          
                          {slide.content && (
                            <p className="text-slate-700 mb-6 text-center leading-relaxed">
                              {slide.content}
                            </p>
                          )}

                          {slide.bullet_points && slide.bullet_points.length > 0 && (
                            <ul className="space-y-3 max-w-2xl mx-auto">
                              {slide.bullet_points.map((point, pointIndex) => (
                                <li key={pointIndex} className="flex items-start gap-3 text-slate-700">
                                  <span className="w-2 h-2 bg-violet-600 rounded-full mt-2 flex-shrink-0"></span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <PresentationIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    Create Your First AI Presentation
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Transform your study materials into professional presentations with AI assistance
                  </p>
                  <div className="max-w-md mx-auto text-left">
                    <h4 className="font-semibold text-slate-800 mb-3">Features:</h4>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                        AI-generated slide content
                      </li>
                      <li className="flex items-center gap-2">
                        <PresentationIcon className="w-4 h-4 text-violet-600" />
                        Professional templates
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-600" />
                        Export to multiple formats
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-600" />
                        Estimated presentation time
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