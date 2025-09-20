import React, { useState, useEffect } from "react";
import { WellnessEntry } from "@/entities/WellnessEntry";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Smile, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import WellnessCheck from "../components/wellness/WellnessCheck";
import JournalEntry from "../components/wellness/JournalEntry";
import MoodTracker from "../components/wellness/MoodTracker";
import StudyScheduler from "../components/wellness/StudyScheduler";

export default function Wellness() {
  const [entries, setEntries] = useState([]);
  const [todayEntry, setTodayEntry] = useState(null);
  const [activeTab, setActiveTab] = useState("checkin");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const fetchedEntries = await WellnessEntry.list("-created_date");
    setEntries(fetchedEntries);
    const today = new Date().toISOString().split('T')[0];
    const todaysEntry = fetchedEntries.find(entry => entry.date === today);
    setTodayEntry(todaysEntry);
  };

  const handleWellnessSubmit = async (wellnessData) => {
    setIsLoading(true);
    const toastId = toast.loading("Saving your check-in...");
    
    try {
      const affirmationResult = await InvokeLLM({
        prompt: `A student's wellness check-in shows: Mood ${wellnessData.mood_rating}/10, Stress ${wellnessData.stress_level}/10. Journal: "${wellnessData.journal_entry || 'N/A'}". Generate a personalized daily affirmation, stress management tips, and study-life balance recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            affirmation: { type: "string" },
            stress_tips: { type: "array", items: { type: "string" } },
            balance_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      const entryData = {
        ...wellnessData,
        affirmation: affirmationResult.affirmation,
        date: new Date().toISOString().split('T')[0]
      };

      if (todayEntry) {
        await WellnessEntry.update(todayEntry.id, entryData);
      } else {
        await WellnessEntry.create(entryData);
      }
      
      await loadEntries();
      toast.success("Check-in saved successfully!", { id: toastId });
      
    } catch (error) {
      toast.error("Failed to save check-in.", { id: toastId });
      console.error("Error saving wellness entry:", error);
    }
    
    setIsLoading(false);
  };

  const tabContent = {
    checkin: <WellnessCheck onSubmit={handleWellnessSubmit} todayEntry={todayEntry} isLoading={isLoading} />,
    journal: <JournalEntry entries={entries} onEntryUpdate={loadEntries} />,
    mood: <MoodTracker entries={entries} />,
    schedule: <StudyScheduler />,
  };

  const getWellnessScore = () => {
    if (entries.length === 0) return 0;
    const recentEntries = entries.slice(0, 7);
    const avgMood = recentEntries.reduce((sum, entry) => sum + (entry.mood_rating || 5), 0) / recentEntries.length;
    const avgStress = recentEntries.reduce((sum, entry) => sum + (entry.stress_level || 5), 0) / recentEntries.length;
    return Math.round(((avgMood + (10 - avgStress)) / 2) * 10);
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Wellness & Balance Hub
              </h1>
              <p className="text-slate-600">Maintain mental health and study-life balance</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smile className="w-6 h-6 text-rose-600" />
                <div>
                  <h3 className="font-semibold text-rose-900">Wellness Score</h3>
                  <p className="text-sm text-rose-700">Based on recent check-ins</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-rose-600">
                {getWellnessScore()}/100
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant={activeTab === "checkin" ? "default" : "outline"} onClick={() => setActiveTab("checkin")} className="flex items-center gap-2"><Heart className="w-4 h-4" />Daily Check-in</Button>
            <Button variant={activeTab === "journal" ? "default" : "outline"} onClick={() => setActiveTab("journal")} className="flex items-center gap-2"><Brain className="w-4 h-4" />Journal</Button>
            <Button variant={activeTab === "mood" ? "default" : "outline"} onClick={() => setActiveTab("mood")} className="flex items-center gap-2"><Smile className="w-4 h-4" />Mood Tracker</Button>
            <Button variant={activeTab === "schedule" ? "default" : "outline"} onClick={() => setActiveTab("schedule")} className="flex items-center gap-2"><Clock className="w-4 h-4" />Study Scheduler</Button>
          </div>
        </div>

        {todayEntry?.affirmation && (
          <Alert className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <Heart className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              💚 Today's Affirmation: "{todayEntry.affirmation}"
            </AlertDescription>
          </Alert>
        )}

        <div className="min-h-96">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}