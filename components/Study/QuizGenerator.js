import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { Zap, CheckCircle, X, RotateCcw, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizGenerator({ material }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  const generateQuiz = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Generating quiz questions...");
    
    try {
      const response = await InvokeLLM({
        prompt: `
          Based on this study material, create 10 multiple-choice questions to test understanding.
          Make questions challenging but fair, covering key concepts.
          
          Study Material: "${material.extracted_content}"
          
          For each question, provide:
          1. The question text
          2. 4 answer options (A, B, C, D)
          3. The correct answer (A, B, C, or D)
          4. A brief explanation of why the answer is correct
        `,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "object",
                    properties: {
                      A: { type: "string" },
                      B: { type: "string" },
                      C: { type: "string" },
                      D: { type: "string" }
                    }
                  },
                  correct_answer: { type: "string", enum: ["A", "B", "C", "D"] },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setQuestions(response.questions || []);
      setCurrentQuestion(0);
      setAnswers({});
      setShowResults(false);
      setScore(0);
      setQuizStarted(true);
      toast.success("Quiz generated successfully!", { id: toastId });
      
    } catch (error) {
      toast.error("Failed to generate quiz", { id: toastId });
      console.error("Quiz generation error:", error);
    }
    
    setIsGenerating(false);
  };

  const handleAnswerSelect = (answer) => {
    setAnswers({
      ...answers,
      [currentQuestion]: answer
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishQuiz = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctCount++;
      }
    });
    
    setScore(correctCount);
    setShowResults(true);
    
    const percentage = (correctCount / questions.length) * 100;
    if (percentage >= 80) {
      toast.success(`Excellent! You scored ${correctCount}/${questions.length}!`);
    } else if (percentage >= 60) {
      toast.success(`Good job! You scored ${correctCount}/${questions.length}!`);
    } else {
      toast.error(`Keep studying! You scored ${correctCount}/${questions.length}.`);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setQuizStarted(false);
  };

  if (!quizStarted) {
    return (
      <Card className="glass-effect border-0 shadow-lg h-[60vh] lg:h-[70vh] flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="text-center space-y-4 lg:space-y-6">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto"
            >
              <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" />
            </motion.div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold text-slate-700 mb-2">
                Generate Quiz from Notes
              </h3>
              <p className="text-sm lg:text-base text-slate-500 mb-4 lg:mb-6">
                Test your knowledge with AI-generated questions based on "{material.title}"
              </p>
              <Button
                onClick={generateQuiz}
                disabled={isGenerating}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-sm lg:text-base"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card className="glass-effect border-0 shadow-lg h-[60vh] lg:h-[70vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                percentage >= 80 ? 'bg-green-100' :
                percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}
            >
              <Trophy className={`w-8 h-8 lg:w-10 lg:h-10 ${
                percentage >= 80 ? 'text-green-600' :
                percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </motion.div>
            <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2">
              {score}/{questions.length} Correct
            </h3>
            <Badge className={`text-base lg:text-lg px-3 py-1 ${
              percentage >= 80 ? 'bg-green-100 text-green-800' :
              percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {percentage}%
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            <h4 className="font-semibold text-slate-800 text-sm lg:text-base">Review Answers:</h4>
            {questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <div key={index} className="p-3 lg:p-4 rounded-lg border bg-white">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm lg:text-base font-medium text-slate-800">
                      Q{index + 1}: {question.question}
                    </p>
                  </div>
                  <div className="ml-6 text-xs lg:text-sm">
                    <p className="text-slate-600 mb-1">
                      Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {userAnswer ? `${userAnswer}) ${question.options[userAnswer]}` : 'Not answered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-green-600 mb-2">
                        Correct: {question.correct_answer}) {question.options[question.correct_answer]}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 lg:gap-3">
            <Button
              onClick={generateQuiz}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm lg:text-base"
            >
              <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              New Quiz
            </Button>
            <Button
              onClick={resetQuiz}
              variant="outline"
              className="text-sm lg:text-base"
            >
              <RotateCcw className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card className="glass-effect border-0 shadow-lg h-[60vh] lg:h-[70vh] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Quiz Question {currentQuestion + 1}/{questions.length}
          </CardTitle>
          <Badge variant="outline">
            {Object.keys(answers).length}/{questions.length} answered
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div
            className="bg-gradient-to-r from-orange-600 to-yellow-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 lg:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1"
          >
            <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-4 lg:mb-6">
              {currentQ.question}
            </h3>
            
            <div className="space-y-3 mb-6">
              {Object.entries(currentQ.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(key)}
                  className={`w-full p-3 lg:p-4 text-left rounded-xl border transition-all text-sm lg:text-base ${
                    answers[currentQuestion] === key
                      ? 'border-orange-500 bg-orange-50 text-orange-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="font-medium mr-2 lg:mr-3">{key})</span>
                  {value}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={nextQuestion}
                size="sm"
                className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={finishQuiz}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Trophy className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                Finish Quiz
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}