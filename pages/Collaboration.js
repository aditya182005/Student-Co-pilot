import React, { useState, useEffect, useCallback } from "react";
import { StudyGroup } from "@/entities/StudyGroup";
import { User } from "@/entities/User";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Plus, Search, UserPlus, Calendar, Target, 
  BookOpen, MessageCircle, Share, Crown, Clock, Loader2, Sparkles, AlertCircle
} from "lucide-react";
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

export default function Collaboration() {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [matchedPeers, setMatchedPeers] = useState([]);
  const [error, setError] = useState(null);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
      setError("Failed to load user profile. Please refresh the page.");
    }
  };

  const loadGroups = useCallback(async () => {
    try {
      setError(null);
      const allGroups = await StudyGroup.list("-created_date");
      console.log("Loaded groups:", allGroups); // Debug log
      
      const activeGroups = allGroups.filter(group => group.is_active !== false);
      setGroups(activeGroups);
      
      if (user) {
        const userGroups = activeGroups.filter(group => 
          group.members?.includes(user.email)
        );
        setMyGroups(userGroups);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
      setError("Failed to load study groups. Please try refreshing the page.");
      setGroups([]);
      setMyGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadGroups();
    } else {
      setIsLoading(false);
    }
  }, [user, loadGroups]);

  const findCognitiveMatches = async () => {
    setIsMatching(true);
    setMatchedPeers([]);
    const toastId = toast.loading("Analyzing your cognitive profile...");

    try {
      if (!user) {
        toast.error("User not loaded. Please refresh the page.", { id: toastId });
        return;
      }

      const allUsers = await User.list();
      const otherUsers = allUsers.filter(u =>
        u.id !== user.id && u.major && u.learning_style && u.interests?.length > 0
      );

      if (otherUsers.length === 0) {
        toast.info("No other users available for matching at this time.", { id: toastId });
        setIsMatching(false);
        return;
      }

      const result = await InvokeLLM({
        prompt: `
          You are a sophisticated AI for educational matchmaking. Find the best study partners for a user based on their profile.

          TARGET USER PROFILE:
          - Name: ${user.full_name}
          - Major: ${user.major || 'Not specified'}
          - Learning Style: ${user.learning_style || 'Not specified'}
          - Interests: ${(user.interests || []).join(', ')}
          - Study Goals: ${(user.study_goals || []).join(', ')}

          POTENTIAL PEERS:
          ${JSON.stringify(otherUsers.map(u => ({ 
            id: u.id, 
            name: u.full_name, 
            major: u.major, 
            learning_style: u.learning_style, 
            interests: u.interests, 
            study_goals: u.study_goals 
          })))}

          Return the top 3 matches with compelling reasons for compatibility.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  user_id: { type: "string" },
                  reason: { type: "string" }
                },
                required: ["user_id", "reason"]
              }
            }
          },
          required: ["matches"]
        }
      });
      
      const matchedUsers = result.matches.map(match => {
        const peer = allUsers.find(u => u.id === match.user_id);
        return peer ? { ...peer, reason: match.reason } : null;
      }).filter(Boolean);

      setMatchedPeers(matchedUsers);
      toast.success("Found your study tribe!", { id: toastId });

    } catch (error) {
      console.error("Matching error:", error);
      toast.error("Could not find matches right now. Please try again later.", { id: toastId });
    } finally {
      setIsMatching(false);
    }
  };

  const createGroup = async (formData) => {
    setIsCreating(true);
    const toastId = toast.loading("Creating study group...");

    try {
      const aiEnhancement = await InvokeLLM({
        prompt: `
          A student wants to create a study group:
          Name: ${formData.name}
          Subject: ${formData.subject}  
          Description: ${formData.description}
          
          Enhance the description to make it more appealing and suggest 3-5 specific study goals.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            enhanced_description: { type: "string" },
            suggested_goals: { type: "array", items: { type: "string" } }
          },
          required: ["enhanced_description", "suggested_goals"]
        }
      });

      const groupData = {
        name: formData.name,
        subject: formData.subject,
        description: aiEnhancement.enhanced_description || formData.description,
        members: [user.email],
        max_members: parseInt(formData.maxMembers) || 8,
        meeting_schedule: formData.schedule,
        goals: aiEnhancement.suggested_goals || [],
        resources_shared: [],
        is_active: true
      };

      await StudyGroup.create(groupData);
      await loadGroups();
      setShowCreateForm(false);
      toast.success("Study group created successfully!", { id: toastId });

    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create study group. Please try again.", { id: toastId });
    }

    setIsCreating(false);
  };

  const joinGroup = async (group) => {
    if (!user) {
      toast.error("Please refresh the page and try again.");
      return;
    }

    const toastId = toast.loading("Joining group...");
    
    try {
      if (!group.members?.includes(user.email) && (group.members?.length || 0) < group.max_members) {
        const updatedMembers = [...(group.members || []), user.email];
        
        await StudyGroup.update(group.id, {
          members: updatedMembers
        });
        
        await loadGroups();
        toast.success(`Welcome to ${group.name}! 🎉`, { id: toastId });
      } else if (group.members?.includes(user.email)) {
        toast.info("You're already a member of this group", { id: toastId });
      } else {
        toast.error("This group is full", { id: toastId });
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group. Please try again.", { id: toastId });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Collaboration Hub
                </h1>
                <p className="text-slate-600">Loading study groups...</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Collaboration Hub
                </h1>
              </div>
            </div>
          </div>
          <Card className="glass-effect border-0 shadow-lg border-l-4 border-l-red-500">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Connection Error</h3>
              <p className="text-slate-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-orange-600 hover:bg-orange-700">
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Collaboration Hub
              </h1>
              <p className="text-slate-600">Connect with study partners and join learning communities</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search groups by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Cognitive Matchmaking Section */}
        <div className="mb-8">
          <Card className="glass-effect border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Find Your Study Tribe
              </CardTitle>
              <p className="text-sm text-slate-600">AI-powered peer matching based on your learning style and goals.</p>
            </CardHeader>
            <CardContent>
              {matchedPeers.length === 0 ? (
                <div className="text-center">
                  <p className="mb-4 text-slate-700">Discover students who think and learn like you for deeper collaboration.</p>
                  <Button
                    onClick={findCognitiveMatches}
                    disabled={isMatching || !user}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {isMatching ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                    ) : (
                      "Match Me with Peers"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Top {matchedPeers.length} Matches for You:</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {matchedPeers.map(peer => (
                      <Card key={peer.id} className="bg-white/50">
                        <CardContent className="p-4 text-center">
                          <Avatar className="w-16 h-16 mx-auto mb-3">
                            <AvatarImage src={peer.profile_image_url} alt={peer.full_name} />
                            <AvatarFallback>{peer.full_name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <p className="font-semibold text-slate-800">{peer.full_name}</p>
                          <p className="text-xs text-slate-500 mb-2">{peer.major || 'N/A'}</p>
                          <p className="text-sm text-slate-600 p-2 bg-indigo-50 rounded-md">
                            <span className="font-bold text-indigo-600">Why?</span> {peer.reason}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="text-center mt-4">
                    <Button variant="outline" onClick={() => setMatchedPeers([])}>Clear Matches</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Groups Section */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">My Study Groups</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              {myGroups.map((group) => (
                <Card key={group.id} className="glass-effect border-0 shadow-lg border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <Badge className="bg-orange-100 text-orange-800 mt-2">
                          {group.subject}
                        </Badge>
                      </div>
                      <Crown className="w-5 h-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {group.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members?.length || 0}/{group.max_members}
                      </span>
                      {group.meeting_schedule && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {group.meeting_schedule}
                        </span>
                      )}
                    </div>

                    {group.goals && group.goals.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-800 mb-2">Goals:</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {group.goals.slice(0, 2).map((goal, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button variant="outline" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open Group Chat
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Groups */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Available Study Groups ({filteredGroups.length})
          </h2>
          
          {filteredGroups.length > 0 ? (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                const isMember = group.members?.includes(user?.email);
                const isFull = (group.members?.length || 0) >= group.max_members;
                
                return (
                  <Card key={group.id} className="glass-effect border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <Badge variant="outline" className="mt-2">
                            {group.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">
                            {group.members?.length || 0}/{group.max_members}
                          </span>
                          <Users className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                        {group.description}
                      </p>

                      {group.meeting_schedule && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                          <Clock className="w-4 h-4" />
                          <span>Meets {group.meeting_schedule}</span>
                        </div>
                      )}

                      {group.goals && group.goals.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-slate-800 mb-2">Study Goals:</h4>
                          <div className="flex flex-wrap gap-1">
                            {group.goals.slice(0, 3).map((goal, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => joinGroup(group)}
                        disabled={isMember || isFull}
                        className={`w-full ${
                          isMember 
                            ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                        }`}
                      >
                        {isMember ? (
                          <>
                            <Users className="w-4 h-4 mr-2" />
                            Already Joined
                          </>
                        ) : isFull ? (
                          "Group Full"
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Join Group
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="glass-effect border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  {searchTerm ? "No groups found" : "No study groups yet"}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm 
                    ? "Try adjusting your search terms" 
                    : "Be the first to create a study group and connect with fellow students"
                  }
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Study Group
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create Study Group</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    createGroup({
                      name: formData.get('name'),
                      subject: formData.get('subject'),
                      description: formData.get('description'),
                      maxMembers: formData.get('maxMembers'),
                      schedule: formData.get('schedule')
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input id="name" name="name" placeholder="e.g., GATE 2024 Prep" required />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" placeholder="e.g., Computer Science" required />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="What will your group focus on?" rows={3} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxMembers">Max Members</Label>
                      <Input id="maxMembers" name="maxMembers" type="number" min="2" max="20" defaultValue="8" />
                    </div>
                    <div>
                      <Label htmlFor="schedule">Meeting Schedule</Label>
                      <Input id="schedule" name="schedule" placeholder="e.g., Daily 7-9 PM" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Group"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}