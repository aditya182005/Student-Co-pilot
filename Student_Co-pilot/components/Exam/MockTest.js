import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InvokeLLM } from "@/integrations/Core";
import { Brain, Play, CheckCircle, RotateCcw, Trophy, Clock } from "lucide-react";

export default function MockTest({ exam, onTestComplete }) {
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const handleTestComplete = useCallback(() => {
    setIsActive(false);
    setTestComplete(true);
    
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      return count + (answer === currentTest.questions[index]?.correct_answer ? 1 : 0);
    }, 0);

    onTestComplete(correctAnswers, currentTest.questions.length);
  }, [userAnswers, currentTest, onTestComplete]);

  React.useEffect(() => {
    let timer;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTestComplete();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, handleTestComplete]);

  const generateMockTest = async () => {
    setIsGenerating(true);
    
    try {
      const test = await InvokeLLM({
        prompt: `
          Create a mock test for the exam: ${exam.exam_name}
          Subject: ${exam.subject}
          
          Generate 10 multiple choice questions that are likely to appear in this exam.
          Base questions on these predicted topics: ${exam.predicted_questions?.slice(0, 3).join(", ") || "General topics"}
          
          Make questions challenging but fair for the exam level.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            duration_minutes: { type: "number" },
            questions: {
              type: "array",
              items: {
                type: "object", 
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4
                  },
                  correct_answer: { type: "number" },
                  explanation: { type: "string" }
                }
              },
              minItems: 10,
              maxItems: 10
            }
          }
        }
      });

      setCurrentTest(test);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setSelectedAnswer("");
      setTestComplete(false);
      setTimeLeft(test.duration_minutes * 60);
      setIsActive(true);
      
    } catch (error) {
      console.error("Error generating mock test:", error);
    }
    
    setIsGenerating(false);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    setSelectedAnswer("");

    if (currentQuestion + 1 < currentTest.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleTestComplete();
    }
  };

  const resetTest = () => {
    setCurrentTest(null);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer("");
    setTestComplete(false);
    setTimeLeft(0);
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    if (!currentTest || userAnswers.length === 0) return 0;
    const correct = userAnswers.reduce((count, answer, index) => {
      return count + (answer === currentTest.questions[index]?.correct_answer ? 1 : 0);
    }, 0);
    return Math.round((correct / currentTest.questions.length) * 100);
  };

  if (!currentTest) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Mock Test Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Ready for a Mock Test?
          </h3>
          <p className="text-slate-600 mb-6">
            I'll generate a realistic practice exam based on "{exam.exam_name}"
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 mb-1">10</div>
              <div className="text-sm text-blue-700">Questions</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 mb-1">30</div>
              <div className="text-sm text-purple-700">Minutes</div>
            </div>
          </div>

          <Button
            onClick={generateMockTest}
            disabled={isGenerating}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Generating Test...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Mock Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (testComplete) {
    const score = calculateScore();
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      return count + (answer === currentTest.questions[index]?.correct_answer ? 1 : 0);
    }, 0);

    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Test Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <div className="text-4xl font-bold text-slate-800 mb-2">{score}%</div>
          <p className="text-lg text-slate-600 mb-6">
            {correctAnswers} out of {currentTest.questions.length} correct
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div className="text-xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
              <div className="text-xl font-bold text-red-600">{currentTest.questions.length - correctAnswers}</div>
              <div className="text-sm text-red-700">Incorrect</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="text-xl font-bold text-blue-600">{score >= 70 ? "Pass" : "Review"}</div>
              <div className="text-sm text-blue-700">Result</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={generateMockTest}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              New Test
            </Button>
            <Button variant="outline" onClick={resetTest}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Back to Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = currentTest.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / currentTest.questions.length) * 100;

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            {currentTest.title}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Question {currentQuestion + 1} of {currentTest.questions.length}
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className={timeLeft <= 300 ? 'text-red-600 font-bold' : 'text-slate-600'}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-lg font-medium text-slate-800 leading-relaxed">
          {question.question}
        </div>
        
        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`p-4 text-left rounded-xl border-2 transition-all duration-300 ${
                selectedAnswer === index
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedAnswer === index 
                    ? 'border-indigo-500 bg-indigo-500' 
                    : 'border-slate-300'
                }`}>
                  {selectedAnswer === index && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={resetTest}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Exit Test
          </Button>
          
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === ""}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {currentQuestion + 1 === currentTest.questions.length ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finish Test
              </>
            ) : (
              'Next Question'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}