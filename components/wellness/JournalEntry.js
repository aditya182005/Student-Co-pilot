import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Smile, Heart, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export default function JournalEntry({ entries, onEntryUpdate }) {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const getMoodEmoji = (rating) => {
    if (!rating) return "😐";
    if (rating <= 2) return "😢";
    if (rating <= 4) return "😕";
    if (rating <= 6) return "😐";
    if (rating <= 8) return "🙂";
    return "😊";
  };

  const getStressColor = (level) => {
    if (!level) return "bg-gray-100 text-gray-600";
    if (level <= 3) return "bg-green-100 text-green-700";
    if (level <= 6) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Entries List */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedEntry?.id === entry.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMoodEmoji(entry.mood_rating)}</span>
                      <Badge className={getStressColor(entry.stress_level)}>
                        Stress: {entry.stress_level || 'N/A'}/10
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {entry.journal_entry || "No journal entry for this day"}
                  </p>
                  <div className="text-xs text-slate-400 mt-2">
                    {formatDistanceToNow(new Date(entry.created_date), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No journal entries yet</p>
              <p className="text-sm text-slate-400">Complete daily check-ins to build your journal</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Entry Detail */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            {selectedEntry ? `Entry from ${new Date(selectedEntry.date).toLocaleDateString()}` : "Select an Entry"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEntry ? (
            <div className="space-y-6">
              {/* Wellness Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="text-2xl mb-2">{getMoodEmoji(selectedEntry.mood_rating)}</div>
                  <div className="text-lg font-bold text-indigo-600">{selectedEntry.mood_rating || 'N/A'}/10</div>
                  <div className="text-sm text-indigo-700">Mood</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                  <div className="text-2xl mb-2">😰</div>
                  <div className="text-lg font-bold text-rose-600">{selectedEntry.stress_level || 'N/A'}/10</div>
                  <div className="text-sm text-rose-700">Stress</div>
                </div>
              </div>

              {/* Study Hours */}
              {selectedEntry.study_hours && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h4 className="font-medium text-green-900 mb-1">Study Hours</h4>
                  <p className="text-2xl font-bold text-green-600">{selectedEntry.study_hours}h</p>
                </div>
              )}

              {/* Journal Content */}
              {selectedEntry.journal_entry && (
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800">Journal Entry</h4>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.journal_entry}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Affirmation */}
              {selectedEntry.affirmation && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">AI Generated Affirmation</h4>
                  <p className="text-purple-800 italic">"{selectedEntry.affirmation}"</p>
                </div>
              )}

              {/* Goals Completed */}
              {selectedEntry.goals_completed?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800">Goals Completed</h4>
                  <div className="space-y-1">
                    {selectedEntry.goals_completed.map((goal, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-800">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Select an entry to view details</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}