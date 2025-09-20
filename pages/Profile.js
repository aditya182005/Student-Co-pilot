import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, Edit, Save, Upload, Camera, 
  GraduationCap, BookOpen, Target, Brain
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    study_year: "",
    major: "",
    university: "",
    interests: [],
    learning_style: "",
    study_goals: [],
    bio: "",
    profile_image_url: ""
  });
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFormData({
        study_year: currentUser.study_year || "",
        major: currentUser.major || "",
        university: currentUser.university || "",
        interests: currentUser.interests || [],
        learning_style: currentUser.learning_style || "",
        study_goals: currentUser.study_goals || [],
        bio: currentUser.bio || "",
        profile_image_url: currentUser.profile_image_url || ""
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading profile picture...");

    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_image_url: file_url }));
      toast.success("Profile picture uploaded!", { id: toastId });
    } catch (error) {
      toast.error("Failed to upload image", { id: toastId });
    }

    setIsUploading(false);
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !formData.study_goals.includes(newGoal.trim())) {
      setFormData(prev => ({
        ...prev,
        study_goals: [...prev.study_goals, newGoal.trim()]
      }));
      setNewGoal("");
    }
  };

  const removeGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      study_goals: prev.study_goals.filter(g => g !== goal)
    }));
  };

  const handleSave = async () => {
    const toastId = toast.loading("Updating profile...");
    
    try {
      await User.updateMyUserData(formData);
      await loadUserProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to update profile", { id: toastId });
      console.error("Error updating profile:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 animate-spin border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-slate-600">Manage your academic profile and preferences</p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative mb-4">
                  <Avatar className="w-32 h-32 mx-auto">
                    <AvatarImage src={formData.profile_image_url} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                      {user.full_name?.[0] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 cursor-pointer">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
                <h3 className="font-bold text-xl text-slate-800">{user.full_name}</h3>
                <p className="text-slate-500">{user.email}</p>
                {formData.bio && (
                  <p className="text-sm text-slate-600 mt-3 p-3 bg-slate-50 rounded-lg">
                    {formData.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-effect border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Learning Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.learning_style && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Learning Style</span>
                    <Badge className="bg-indigo-100 text-indigo-800 capitalize">
                      {formData.learning_style}
                    </Badge>
                  </div>
                )}
                {formData.study_year && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Study Year</span>
                    <Badge variant="outline">{formData.study_year}</Badge>
                  </div>
                )}
                {formData.interests.length > 0 && (
                  <div>
                    <span className="text-slate-600 text-sm">Interests</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="study_year">Study Year</Label>
                    {isEditing ? (
                      <Select value={formData.study_year} onValueChange={(value) => setFormData(prev => ({ ...prev, study_year: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                          <SelectItem value="Graduate">Graduate</SelectItem>
                          <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="p-2 text-slate-700">{formData.study_year || "Not specified"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="learning_style">Learning Style</Label>
                    {isEditing ? (
                      <Select value={formData.learning_style} onValueChange={(value) => setFormData(prev => ({ ...prev, learning_style: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visual">Visual</SelectItem>
                          <SelectItem value="auditory">Auditory</SelectItem>
                          <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                          <SelectItem value="reading">Reading/Writing</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="p-2 text-slate-700 capitalize">{formData.learning_style || "Not specified"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="major">Major/Field of Study</Label>
                  {isEditing ? (
                    <Input
                      value={formData.major}
                      onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                      placeholder="e.g., Computer Science"
                    />
                  ) : (
                    <p className="p-2 text-slate-700">{formData.major || "Not specified"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="university">University/College</Label>
                  {isEditing ? (
                    <Input
                      value={formData.university}
                      onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="e.g., MIT"
                    />
                  ) : (
                    <p className="p-2 text-slate-700">{formData.university || "Not specified"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  ) : (
                    <p className="p-2 text-slate-700">{formData.bio || "No bio added"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card className="glass-effect border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Academic Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an interest..."
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    />
                    <Button onClick={addInterest} size="sm">Add</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <Badge 
                      key={index} 
                      className={`bg-emerald-100 text-emerald-800 ${isEditing ? 'cursor-pointer hover:bg-emerald-200' : ''}`}
                      onClick={() => isEditing && removeInterest(interest)}
                    >
                      {interest} {isEditing && '×'}
                    </Badge>
                  ))}
                  {formData.interests.length === 0 && (
                    <p className="text-slate-500 text-sm">No interests added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Study Goals */}
            <Card className="glass-effect border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  Study Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add a study goal..."
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    />
                    <Button onClick={addGoal} size="sm">Add</Button>
                  </div>
                )}
                <div className="space-y-2">
                  {formData.study_goals.map((goal, index) => (
                    <div 
                      key={index} 
                      className={`p-3 bg-amber-50 rounded-lg flex items-center justify-between ${isEditing ? 'hover:bg-amber-100' : ''}`}
                    >
                      <span className="text-amber-800">{goal}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeGoal(goal)}
                          className="text-amber-600 hover:text-amber-800 text-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.study_goals.length === 0 && (
                    <p className="text-slate-500 text-sm">No study goals added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button (Mobile) */}
        {isEditing && (
          <div className="mt-8 lg:hidden">
            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}