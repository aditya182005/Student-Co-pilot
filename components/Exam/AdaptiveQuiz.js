import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Brain, Target, AlertTriangle } from "lucide-react";

export default function AdaptiveQuiz({ exam }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    // Generate questions based on weak areas and predicted questions
    const weakAreaQuestions = exam.weak_areas.map(area => ({
      text: `Explain the concept of ${area}.`,
      type: 'weak_area',
      options: ['Option A', 'Option B', 'Option C', 'Option D'], // Dummy options for multiple choice
      answer: 'Option A'
    }));

    const predictedQuestions = exam.predicted_questions.slice(0, 10).map(q => ({
      text: q,
      type: 'predicted',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option B'
    }));

    // Simple shuffle and combine
    const allQuestions = [...weakAreaQuestions, ...predictedQuestions].sort(() => Math.random() - 0.5);
    setQuestions(allQuestions.slice(0, 10)); // Limit to 10 questions for a quick quiz
  }, [exam]);

  const handleAnswer = (answer) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz finished
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    return Object.keys(userAnswers).reduce((score, index) => {
      if (userAnswers[index] === questions[index].answer) {
        return score + 1;
      }
      return score;
    }, 0);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setQuizStarted(false);
  };

  if (!quizStarted) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Adaptive Quiz</h3>
          <p className="text-slate-500 mb-6">
            This quiz focuses on your identified weak areas and AI-predicted questions to maximize your learning.
          </p>
          <Button onClick={() => setQuizStarted(true)}>Start Adaptive Quiz</Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-4xl font-bold mb-2">{score} / {questions.length}</p>
          <p className="text-lg text-slate-600 mb-6">You did great! Keep practicing.</p>
          <Button onClick={resetQuiz}>Take Again</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Adaptive Quiz</span>
          <Badge variant="outline">Question {currentQuestionIndex + 1}/{questions.length}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          {currentQuestion.type === 'weak_area' && (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Focus Area
            </Badge>
          )}
          {currentQuestion.type === 'predicted' && (
            <Badge className="bg-green-100 text-green-800">
              <Target className="w-3 h-3 mr-1" />
              Predicted Question
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg font-medium mb-6 min-h-24">{currentQuestion.text}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-3 justify-start text-left"
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}