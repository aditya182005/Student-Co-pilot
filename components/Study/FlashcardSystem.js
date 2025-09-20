import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flashcard } from "@/entities/Flashcard";
import { InvokeLLM } from "@/integrations/Core";
import { Brain, RotateCcw, CheckCircle, XCircle, Zap, Target } from "lucide-react";
import { toast } from "sonner";

export default function FlashcardSystem({ material }) {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });

  const loadFlashcards = useCallback(async () => {
    try {
      const cards = await Flashcard.filter({ study_material_id: material.id });
      
      if (cards.length === 0) {
        generateFlashcards();
      } else {
        // Sort by spaced repetition algorithm
        const sortedCards = cards.sort((a, b) => {
          const aNextReview = new Date(a.next_review || new Date());
          const bNextReview = new Date(b.next_review || new Date());
          return aNextReview - bNextReview;
        });
        setFlashcards(sortedCards);
      }
    } catch (error) {
      console.error("Error loading flashcards:", error);
    }
  }, [material.id]);

  useEffect(() => {
    if (material) {
      loadFlashcards();
    }
  }, [material, loadFlashcards]);

  const generateFlashcards = async () => {
    setIsGenerating(true);
    
    try {
      const result = await InvokeLLM({
        prompt: `
          Based on this study material, create 15-20 high-quality flashcards for active recall.
          Create a good mix of:
          - Definition/concept cards
          - Example/application cards  
          - Comparison cards
          - Process/procedure cards
          
          Material: ${material.extracted_content}
          Subject: ${material.subject}
          Title: ${material.title}
        `,
        response_json_schema: {
          type: "object",
          properties: {
            flashcards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: { type: "string" },
                  back: { type: "string" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                }
              }
            }
          }
        }
      });

      const cardData = result.flashcards.map(card => ({
        ...card,
        study_material_id: material.id,
        subject: material.subject,
        next_review: new Date().toISOString().split('T')[0],
        review_count: 0,
        correct_streak: 0
      }));

      // Bulk create flashcards
      for (const card of cardData) {
        await Flashcard.create(card);
      }

      toast.success(`Generated ${cardData.length} flashcards!`);
      await loadFlashcards();
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error("Failed to generate flashcards");
    }
    
    setIsGenerating(false);
  };

  const handleAnswer = async (isCorrect) => {
    if (flashcards.length === 0) return;
    
    const card = flashcards[currentCard];
    const newStreak = isCorrect ? card.correct_streak + 1 : 0;
    const newReviewCount = card.review_count + 1;
    
    // Spaced repetition algorithm
    let nextReviewDays = 1;
    if (isCorrect) {
      if (newStreak === 1) nextReviewDays = 1;
      else if (newStreak === 2) nextReviewDays = 3;
      else if (newStreak === 3) nextReviewDays = 7;
      else nextReviewDays = Math.min(30, Math.pow(2, newStreak - 3) * 7);
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);
    
    try {
      await Flashcard.update(card.id, {
        correct_streak: newStreak,
        review_count: newReviewCount,
        next_review: nextReviewDate.toISOString().split('T')[0]
      });
      
      setSessionStats(prev => ({
        ...prev,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        total: prev.total + 1
      }));
      
      // Move to next card or restart
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(currentCard + 1);
      } else {
        setCurrentCard(0);
      }
      
      setShowAnswer(false);
      await loadFlashcards(); // Refresh with updated cards
      
    } catch (error) {
      console.error("Error updating flashcard:", error);
    }
  };

  const resetSession = () => {
    setCurrentCard(0);
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
  };

  if (isGenerating) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Brain className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Generating Smart Flashcards</h3>
          <p className="text-slate-500">AI is creating personalized flashcards from your notes...</p>
        </CardContent>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Create Smart Flashcards</h3>
          <p className="text-slate-500 mb-6">Generate AI-powered flashcards with spaced repetition for effective learning.</p>
          <Button onClick={generateFlashcards} className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <Zap className="w-4 h-4 mr-2" />
            Generate Flashcards
          </Button>
        </CardContent>
      </Card>
    );
  }

  const card = flashcards[currentCard];
  const progress = flashcards.length > 0 ? ((currentCard + 1) / flashcards.length) * 100 : 0;
  const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress and Stats */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">
              Card {currentCard + 1} of {flashcards.length}
            </h3>
            <div className="flex gap-2">
              <Badge className="bg-green-100 text-green-800">
                ✓ {sessionStats.correct}
              </Badge>
              <Badge className="bg-red-100 text-red-800">
                ✗ {sessionStats.incorrect}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          {sessionStats.total > 0 && (
            <p className="text-sm text-slate-600">
              Session Accuracy: {accuracy.toFixed(0)}%
            </p>
          )}
        </CardContent>
      </Card>

      {/* Flashcard */}
      <Card className="glass-effect border-0 shadow-xl min-h-[400px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className={
              card.difficulty === "easy" ? "bg-green-100 text-green-800" :
              card.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }>
              {card.difficulty}
            </Badge>
            <Badge variant="outline">
              Review #{card.review_count + 1}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="min-h-[200px] flex items-center justify-center">
              <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {!showAnswer ? (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Question</h2>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      {card.front}
                    </p>
                    <p className="text-sm text-slate-500 mt-6">
                      Click to reveal answer
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Answer</h2>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      {card.back}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {showAnswer && (
              <div className="flex justify-center gap-4 pt-6 border-t border-slate-200">
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="outline"
                  className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  Incorrect
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Correct
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => setShowAnswer(!showAnswer)} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          {showAnswer ? "Hide Answer" : "Show Answer"}
        </Button>
        <Button onClick={resetSession} variant="outline">
          Reset Session
        </Button>
        <Button onClick={generateFlashcards} variant="outline">
          <Zap className="w-4 h-4 mr-2" />
          Regenerate Cards
        </Button>
      </div>
    </div>
  );
}
