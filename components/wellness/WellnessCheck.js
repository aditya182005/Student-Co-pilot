import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Loader2, CheckCircle } from "lucide-react";

export default function WellnessCheck({ onSubmit, todayEntry, isLoading }) {
  const [wellnessData, setWellnessData] = useState({
    mood_rating: todayEntry?.mood_rating || 5,
    stress_level: todayEntry?.stress_level || 5,
    study_hours: todayEntry?.study_hours || 0,
    journal_entry: todayEntry?.journal_entry || "",
    goals_completed: todayEntry?.goals_completed || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(wellnessData);
  };

  const handleSliderChange = (field, value) => {
    setWellnessData(prev => ({ ...prev, [field]: parseInt(value) }));
  };

  const getMoodEmoji = (rating) => {
    if (rating <= 2) return "😢";
    if (rating <= 4) return "😕";
    if (rating <= 6) return "😐";
    if (rating <= 8) return "🙂";
    return "😊";
  };

  const getStressColor = (level) => {
    if (level <= 3) return "text-green-600";
    if (level <= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-600" />
          Daily Wellness Check-in
        </CardTitle>
        <p className="text-sm text-slate-500">
          {todayEntry ? "Update today's check-in" : "How are you feeling today?"}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Mood Rating</Label>
            <div className="flex items-center gap-4">
              <span className="text-3xl">{getMoodEmoji(wellnessData.mood_rating)}</span>
              <div className="flex-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wellnessData.mood_rating}
                  onChange={(e) => handleSliderChange('mood_rating', e.target.value)}
                  className="w-full h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Very Low</span>
                  <span>{wellnessData.mood_rating}/10</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stress Level */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Stress Level</Label>
            <div className="flex items-center gap-4">
              <Badge className={`${getStressColor(wellnessData.stress_level)} bg-transparent border`}>
                {wellnessData.stress_level <= 3 ? "Low" : wellnessData.stress_level <= 6 ? "Medium" : "High"}
              </Badge>
              <div className="flex-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wellnessData.stress_level}
                  onChange={(e) => handleSliderChange('stress_level', e.target.value)}
                  className="w-full h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Very Low</span>
                  <span>{wellnessData.stress_level}/10</span>
                  <span>Very High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Study Hours */}
          <div className="space-y-2">
            <Label htmlFor="study_hours" className="text-base font-medium">Hours Studied Today</Label>
            <Input
              id="study_hours"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={wellnessData.study_hours}
              onChange={(e) => setWellnessData(prev => ({ ...prev, study_hours: parseFloat(e.target.value) || 0 }))}
              className="w-24"
            />
          </div>

          {/* Journal Entry */}
          <div className="space-y-2">
            <Label htmlFor="journal" className="text-base font-medium">Journal Reflection</Label>
            <Textarea
              id="journal"
              placeholder="How was your day? Any challenges or victories?"
              value={wellnessData.journal_entry}
              onChange={(e) => setWellnessData(prev => ({ ...prev, journal_entry: e.target.value }))}
              className="min-h-24"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating AI Insights...
              </>
            ) : todayEntry ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Check-in
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Complete Check-in
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}