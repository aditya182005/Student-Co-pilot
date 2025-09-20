
import React, { useState, useEffect } from "react";
import { CareerPath } from "@/entities/CareerPath";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Compass, Search, BookmarkPlus, TrendingUp, DollarSign, 
  Users, Clock, Star, Bookmark, Target, Lightbulb, Loader2
} from "lucide-react";
import { toast } from "sonner";
import PortfolioBuilder from "../components/career/PortfolioBuilder";

export default function Career() {
  const [savedPaths, setSavedPaths] = useState([]);
  const [interests, setInterests] = useState([]);
  const [currentInterest, setCurrentInterest] = useState("");
  const [suggestedCareers, setSuggestedCareers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);

  useEffect(() => {
    loadSavedPaths();
  }, []);

  const loadSavedPaths = async () => {
    const paths = await CareerPath.filter({ is_saved: true });
    setSavedPaths(paths);
  };

  const addInterest = () => {
    if (currentInterest.trim() && !interests.includes(currentInterest.trim())) {
      setInterests([...interests, currentInterest.trim()]);
      setCurrentInterest("");
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const generateCareerPaths = async () => {
    if (interests.length === 0) {
      toast.error("Please add at least one interest");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating personalized career paths...");

    try {
      const result = await InvokeLLM({
        prompt: `
          Based on these student interests: ${interests.join(", ")}, suggest 5 relevant career paths.
          
          For each career, provide:
          1. Career title
          2. Required skills (technical and soft skills)
          3. Recommended courses/certifications
          4. Career roadmap (short-term: 6-12 months, medium-term: 1-3 years, long-term: 3-5+ years)
          5. Salary range
          6. Job market outlook
          
          Focus on realistic, achievable paths for students.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            career_paths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  career_title: { type: "string" },
                  required_skills: { type: "array", items: { type: "string" } },
                  recommended_courses: { type: "array", items: { type: "string" } },
                  roadmap: {
                    type: "object",
                    properties: {
                      short_term: { type: "array", items: { type: "string" } },
                      medium_term: { type: "array", items: { type: "string" } },
                      long_term: { type: "array", items: { type: "string" } }
                    }
                  },
                  salary_range: { type: "string" },
                  job_market_outlook: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestedCareers(result.career_paths || []);
      toast.success("Career paths generated successfully!", { id: toastId });

    } catch (error) {
      toast.error("Failed to generate career paths", { id: toastId });
      console.error("Error generating careers:", error);
    }

    setIsGenerating(false);
  };

  const saveCareerPath = async (career) => {
    try {
      const savedCareer = await CareerPath.create({
        ...career,
        interests: interests,
        is_saved: true
      });
      
      setSavedPaths([...savedPaths, savedCareer]);
      toast.success(`${career.career_title} saved to your career paths!`);
    } catch (error) {
      toast.error("Failed to save career path");
      console.error("Error saving career:", error);
    }
  };

  const popularInterests = [
    "Technology", "Healthcare", "Business", "Education", "Creative Arts", 
    "Science", "Engineering", "Finance", "Marketing", "Design"
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Career Path Navigator
              </h1>
              <p className="text-slate-600">Discover your ideal career based on your interests and goals</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Interest Input Section */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-emerald-600" />
                  Your Interests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="interest">Add Interest</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="interest"
                      value={currentInterest}
                      onChange={(e) => setCurrentInterest(e.target.value)}
                      placeholder="e.g., Machine Learning"
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    />
                    <Button onClick={addInterest} size="sm">Add</Button>
                  </div>
                </div>

                {interests.length > 0 && (
                  <div>
                    <Label>Your Interests</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {interests.map((interest, index) => (
                        <Badge 
                          key={index} 
                          className="bg-emerald-100 text-emerald-800 cursor-pointer hover:bg-emerald-200"
                          onClick={() => removeInterest(interest)}
                        >
                          {interest} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Popular Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {popularInterests.map((interest) => (
                      <Badge 
                        key={interest}
                        variant="outline"
                        className="cursor-pointer hover:bg-emerald-50 hover:border-emerald-200"
                        onClick={() => {
                          if (!interests.includes(interest)) {
                            setInterests([...interests, interest]);
                          }
                        }}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={generateCareerPaths}
                  disabled={isGenerating || interests.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Find Career Paths
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Saved Career Paths */}
            {savedPaths.length > 0 && (
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-emerald-600" />
                    Saved Paths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedPaths.map((path) => (
                    <div
                      key={path.id}
                      className="p-3 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors"
                      onClick={() => setSelectedCareer(path)}
                    >
                      <p className="font-medium text-emerald-900">{path.career_title}</p>
                      <p className="text-sm text-emerald-700">{path.salary_range}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            {selectedCareer ? (
              <PortfolioBuilder career={selectedCareer} />
            ) : suggestedCareers.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Recommended Career Paths</h2>
                {suggestedCareers.map((career, index) => (
                  <Card key={index} className="glass-effect border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl text-slate-800">
                            {career.career_title}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className="bg-green-100 text-green-800">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {career.salary_range}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Growing Field
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => saveCareerPath(career)}
                          variant="outline"
                          size="sm"
                        >
                          <BookmarkPlus className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-slate-600 mb-4">{career.job_market_outlook}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-3">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {career.required_skills?.map((skill, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-800 mb-3">Recommended Courses</h4>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {career.recommended_courses?.slice(0, 4).map((course, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {course}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Career Roadmap</h4>
                        <div className="grid gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4" />
                              Short-term (6-12 months)
                            </h5>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {career.roadmap?.short_term?.map((item, i) => (
                                <li key={i}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-green-900 flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4" />
                              Medium-term (1-3 years)
                            </h5>
                            <ul className="text-sm text-green-800 space-y-1">
                              {career.roadmap?.medium_term?.map((item, i) => (
                                <li key={i}>• {item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h5 className="font-medium text-purple-900 flex items-center gap-2 mb-2">
                              <Star className="w-4 h-4" />
                              Long-term (3-5+ years)
                            </h5>
                            <ul className="text-sm text-purple-800 space-y-1">
                              {career.roadmap?.long_term?.map((item, i) => (
                                <li key={i}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    Discover Your Career Path
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Add your interests to get personalized career recommendations with detailed roadmaps
                  </p>
                  <div className="max-w-md mx-auto text-left">
                    <h4 className="font-semibold text-slate-800 mb-3">What you'll get:</h4>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-600" />
                        Personalized career suggestions
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Required skills and courses
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Step-by-step career roadmap
                      </li>
                      <li className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Salary expectations and market outlook
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
