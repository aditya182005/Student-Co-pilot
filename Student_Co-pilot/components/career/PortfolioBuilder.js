import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { User } from "@/entities/User";
import { toast } from "sonner";
import { Linkedin, FileText, Github, Globe, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function PortfolioBuilder({ career }) {
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentType, setContentType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateAsset = async (assetType) => {
    setIsLoading(true);
    setGeneratedContent(null);
    setContentType(assetType);
    const toastId = toast.loading(`Generating ${assetType}...`);

    try {
      const currentUser = await User.me();
      
      const promptMap = {
        'LinkedIn Summary': `
          Based on the career path of a "${career.career_title}" and the user's profile, write a compelling LinkedIn "About" summary.
          User Profile: Name: ${currentUser.full_name}, Major: ${currentUser.major}, Year: ${currentUser.study_year}, Bio: ${currentUser.bio}.
          Career Interests: ${career.interests.join(', ')}.
          Highlight key skills like ${career.required_skills.slice(0, 5).join(', ')}.
          Keep it professional, engaging, and around 3-4 paragraphs.
        `,
        'Cover Letter Draft': `
          Write a versatile cover letter template for a student aspiring to be a "${career.career_title}".
          The user's name is ${currentUser.full_name}. The letter should be easily adaptable for various job applications.
          It should express enthusiasm for the field, mention relevant skills like ${career.required_skills.join(', ')}, and show eagerness to learn.
          Structure it professionally with placeholders like [Company Name] and [Hiring Manager Name].
        `,
        'GitHub README': `
          Create a template for a personal GitHub profile README.md for a student interested in "${career.career_title}".
          User: ${currentUser.full_name}, Major: ${currentUser.major}.
          Include sections for: a brief intro, tech stack/skills (${career.required_skills.join(', ')}), current projects, and contact info.
          Use Markdown formatting.
        `,
        'Personal Website Draft': `
          Generate a content draft for a personal portfolio website's homepage for an aspiring "${career.career_title}".
          User: ${currentUser.full_name}.
          Include a hero section with a headline, a brief "About Me" section, a "Skills" section (${career.required_skills.join(', ')}), and a "Projects" section placeholder.
          Keep the tone professional but personal.
        `,
      };

      const result = await InvokeLLM({ prompt: promptMap[assetType] });
      setGeneratedContent(result);
      toast.success(`${assetType} generated successfully!`, { id: toastId });

    } catch (error) {
      toast.error(`Failed to generate ${assetType}`, { id: toastId });
      console.error("Asset generation error:", error);
    }
    setIsLoading(false);
  };
  
  const assetButtons = [
    { type: 'LinkedIn Summary', icon: Linkedin },
    { type: 'Cover Letter Draft', icon: FileText },
    { type: 'GitHub README', icon: Github },
    { type: 'Personal Website Draft', icon: Globe },
  ];

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Career Portfolio Builder
        </CardTitle>
        <p className="text-sm text-slate-500">
          Generate professional assets for your career path: <span className="font-semibold text-emerald-800">{career.career_title}</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {assetButtons.map(asset => (
            <Button
              key={asset.type}
              variant="outline"
              onClick={() => generateAsset(asset.type)}
              disabled={isLoading}
              className={`flex-col h-20 ${contentType === asset.type ? 'bg-emerald-50 border-emerald-300' : ''}`}
            >
              <asset.icon className="w-5 h-5 mb-1" />
              <span className="text-xs text-center">{asset.type}</span>
            </Button>
          ))}
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 min-h-80">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          )}
          {generatedContent && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{generatedContent}</ReactMarkdown>
            </div>
          )}
          {!isLoading && !generatedContent && (
            <div className="text-center flex flex-col items-center justify-center h-full">
              <Sparkles className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500">Select an asset to generate it with AI</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}