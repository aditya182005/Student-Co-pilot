import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { 
  FileText, Download, Wand2, Loader2, Star, 
  Briefcase, GraduationCap, Award, User
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

export default function ResumeGenerator({ resume, className = "" }) {
  const [generatedResume, setGeneratedResume] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const templates = [
    { id: "modern", name: "Modern Professional", icon: Briefcase, description: "Clean, ATS-friendly design" },
    { id: "academic", name: "Academic", icon: GraduationCap, description: "Perfect for research positions" },
    { id: "creative", name: "Creative", icon: Award, description: "Stand out with style" },
    { id: "minimal", name: "Minimal", icon: User, description: "Simple and elegant" }
  ];

  const generateNewResume = async () => {
    if (!resume?.extracted_content) {
      toast.error("No resume content found to improve");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("AI is crafting your perfect resume...");

    try {
      const improvedResume = await InvokeLLM({
        prompt: `
          You are an expert resume writer and career coach. Based on the provided resume content, create a completely redesigned and improved version.

          ORIGINAL RESUME CONTENT:
          ${resume.extracted_content}
          
          TEMPLATE STYLE: ${selectedTemplate}
          TARGET: Entry-level to mid-level positions
          
          Create a new resume with these improvements:
          1. Better structure and formatting
          2. ATS-optimized keywords
          3. Quantified achievements where possible
          4. Modern professional language
          5. Industry-relevant skills highlighted
          6. Action-oriented bullet points
          
          Return the improved resume in a structured format with clear sections.
          Make it professional, compelling, and tailored for ${selectedTemplate} style.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            personal_info: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                location: { type: "string" },
                linkedin: { type: "string" },
                summary: { type: "string" }
              }
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  duration: { type: "string" },
                  achievements: { type: "array", items: { type: "string" } }
                }
              }
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  degree: { type: "string" },
                  institution: { type: "string" },
                  year: { type: "string" },
                  gpa: { type: "string" }
                }
              }
            },
            skills: {
              type: "object",
              properties: {
                technical: { type: "array", items: { type: "string" } },
                soft_skills: { type: "array", items: { type: "string" } }
              }
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  technologies: { type: "array", items: { type: "string" } }
                }
              }
            },
            improvements_made: { type: "array", items: { type: "string" } },
            ats_score: { type: "number" }
          }
        }
      });

      setGeneratedResume(improvedResume);
      toast.success("New resume generated successfully! 🎉", { id: toastId });

    } catch (error) {
      toast.error("Failed to generate new resume", { id: toastId });
      console.error("Resume generation error:", error);
    }

    setIsGenerating(false);
  };

  const downloadResume = (format) => {
    if (!generatedResume) return;
    
    // Create downloadable content
    let content = "";
    
    if (format === 'txt') {
      content = generatePlainTextResume();
    } else if (format === 'markdown') {
      content = generateMarkdownResume();
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `improved_resume.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Resume downloaded as ${format.toUpperCase()}`);
  };

  const generatePlainTextResume = () => {
    if (!generatedResume) return "";
    
    const { personal_info, experience, education, skills, projects } = generatedResume;
    
    return `
${personal_info.name}
${personal_info.email} | ${personal_info.phone} | ${personal_info.location}
${personal_info.linkedin ? `LinkedIn: ${personal_info.linkedin}` : ''}

PROFESSIONAL SUMMARY
${personal_info.summary}

EXPERIENCE
${experience?.map(exp => `
${exp.title} - ${exp.company} (${exp.duration})
${exp.achievements?.map(achievement => `• ${achievement}`).join('\n') || ''}
`).join('\n') || ''}

EDUCATION
${education?.map(edu => `
${edu.degree} - ${edu.institution} (${edu.year})
${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n') || ''}

TECHNICAL SKILLS
${skills?.technical?.join(' • ') || ''}

SOFT SKILLS
${skills?.soft_skills?.join(' • ') || ''}

PROJECTS
${projects?.map(project => `
${project.name}
${project.description}
Technologies: ${project.technologies?.join(', ') || ''}
`).join('\n') || ''}
    `.trim();
  };

  const generateMarkdownResume = () => {
    if (!generatedResume) return "";
    
    const { personal_info, experience, education, skills, projects } = generatedResume;
    
    return `
# ${personal_info.name}

**Contact:** ${personal_info.email} | ${personal_info.phone} | ${personal_info.location}
${personal_info.linkedin ? `**LinkedIn:** ${personal_info.linkedin}` : ''}

## Professional Summary
${personal_info.summary}

## Experience
${experience?.map(exp => `
### ${exp.title} - ${exp.company}
*${exp.duration}*

${exp.achievements?.map(achievement => `- ${achievement}`).join('\n') || ''}
`).join('\n') || ''}

## Education
${education?.map(edu => `
### ${edu.degree}
**${edu.institution}** (${edu.year})
${edu.gpa ? `*GPA: ${edu.gpa}*` : ''}
`).join('\n') || ''}

## Skills
**Technical:** ${skills?.technical?.join(', ') || ''}

**Soft Skills:** ${skills?.soft_skills?.join(', ') || ''}

## Projects
${projects?.map(project => `
### ${project.name}
${project.description}

**Technologies:** ${project.technologies?.join(', ') || ''}
`).join('\n') || ''}
    `.trim();
  };

  return (
    <div className={className}>
      {!generatedResume ? (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              AI Resume Generator 2.0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Generate a Brand New Resume
              </h3>
              <p className="text-slate-600 mb-6">
                AI will create a completely redesigned, professional resume based on your content
              </p>

              {/* Template Selection */}
              <div className="mb-6">
                <h4 className="font-medium text-slate-800 mb-3">Choose Template Style</h4>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedTemplate === template.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <template.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <p className="text-xs text-slate-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateNewResume}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate New Resume
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Your New Resume
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  ATS Score: {generatedResume.ats_score}/100
                </Badge>
                <Badge className="capitalize">{selectedTemplate}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Improvements Made */}
            {generatedResume.improvements_made && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">✨ Improvements Made</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  {generatedResume.improvements_made.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resume Preview */}
            <div className="space-y-6 p-6 bg-white rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
              {/* Personal Info */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-900">{generatedResume.personal_info?.name}</h2>
                <p className="text-slate-600">
                  {generatedResume.personal_info?.email} | {generatedResume.personal_info?.phone} | {generatedResume.personal_info?.location}
                </p>
                {generatedResume.personal_info?.linkedin && (
                  <p className="text-indigo-600">{generatedResume.personal_info.linkedin}</p>
                )}
              </div>

              {/* Professional Summary */}
              {generatedResume.personal_info?.summary && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">PROFESSIONAL SUMMARY</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">{generatedResume.personal_info.summary}</p>
                </div>
              )}

              {/* Experience */}
              {generatedResume.experience && generatedResume.experience.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">EXPERIENCE</h3>
                  <div className="space-y-3">
                    {generatedResume.experience.map((exp, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-slate-800">{exp.title}</h4>
                          <span className="text-sm text-slate-600">{exp.duration}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{exp.company}</p>
                        {exp.achievements && (
                          <ul className="text-sm text-slate-700 space-y-1">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-slate-400">•</span>
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {generatedResume.education && generatedResume.education.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">EDUCATION</h3>
                  {generatedResume.education.map((edu, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">{edu.degree}</h4>
                        <span className="text-sm text-slate-600">{edu.year}</span>
                      </div>
                      <p className="text-sm text-slate-600">{edu.institution}</p>
                      {edu.gpa && <p className="text-sm text-slate-600">GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {generatedResume.skills && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">SKILLS</h3>
                  {generatedResume.skills.technical && (
                    <div className="mb-2">
                      <h4 className="font-semibold text-slate-800 text-sm">Technical Skills</h4>
                      <p className="text-sm text-slate-700">{generatedResume.skills.technical.join(' • ')}</p>
                    </div>
                  )}
                  {generatedResume.skills.soft_skills && (
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Soft Skills</h4>
                      <p className="text-sm text-slate-700">{generatedResume.skills.soft_skills.join(' • ')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Projects */}
              {generatedResume.projects && generatedResume.projects.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">PROJECTS</h3>
                  {generatedResume.projects.map((project, index) => (
                    <div key={index} className="mb-3">
                      <h4 className="font-semibold text-slate-800">{project.name}</h4>
                      <p className="text-sm text-slate-700 mb-1">{project.description}</p>
                      {project.technologies && (
                        <p className="text-xs text-slate-600">
                          <strong>Technologies:</strong> {project.technologies.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Download Options */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => downloadResume('txt')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download TXT
              </Button>
              <Button
                onClick={() => downloadResume('markdown')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Markdown
              </Button>
              <Button
                onClick={() => setGeneratedResume(null)}
                variant="outline"
              >
                Generate Another
              </Button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Copy this content and paste it into Google Docs or Microsoft Word for PDF export and advanced formatting.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}