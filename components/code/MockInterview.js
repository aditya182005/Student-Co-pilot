import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InvokeLLM } from "@/integrations/Core";
import { Brain, Loader2, Play, Send, RefreshCw, MessageSquare } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function MockInterview() {
  const [interviewState, setInterviewState] = useState('idle'); // idle, generating_question, question, submitting, feedback
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const startInterview = async () => {
    setInterviewState('generating_question');
    setFeedback(null);
    setAnswer('');
    try {
      const result = await InvokeLLM({
        prompt: "Generate a medium-difficulty technical interview question suitable for a student. Focus on data structures or algorithms. Present it clearly.",
      });
      setQuestion(result);
      setInterviewState('question');
    } catch (error) {
      console.error("Error generating question:", error);
      setInterviewState('idle');
    }
  };
  
  const submitAnswer = async () => {
    setInterviewState('submitting');
    try {
      const result = await InvokeLLM({
        prompt: `A student was asked the following interview question: "${question}". Their answer was: "${answer}". Provide constructive feedback on their answer. Analyze correctness, efficiency, and code clarity.`,
        response_json_schema: {
          type: "object",
          properties: {
            correctness: { type: "string" },
            efficiency: { type: "string" },
            clarity: { type: "string" },
            overall_feedback: { type: "string" }
          }
        }
      });
      setFeedback(result);
      setInterviewState('feedback');
    } catch (error) {
      console.error("Error getting feedback:", error);
      setInterviewState('question');
    }
  };

  const resetInterview = () => {
    setInterviewState('idle');
    setQuestion(null);
    setAnswer('');
    setFeedback(null);
  };

  return (
    <Card className="glass-effect border-0 shadow-xl min-h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          Mock Coding Interview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-center text-center">
        {interviewState === 'idle' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-700">Ready to practice?</h3>
            <p className="text-slate-500">Start a mock interview to test your skills.</p>
            <Button onClick={startInterview}>
              <Play className="w-4 h-4 mr-2" /> Start Interview
            </Button>
          </div>
        )}

        {(interviewState === 'generating_question' || interviewState === 'submitting') && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <p className="text-slate-500">{interviewState === 'generating_question' ? 'Generating question...' : 'Analyzing your answer...'}</p>
          </div>
        )}

        {(interviewState === 'question' || interviewState === 'feedback') && question && (
          <div className="w-full text-left space-y-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Question:</h4>
              <div className="p-4 bg-slate-50 rounded-lg border">
                <ReactMarkdown className="prose prose-sm max-w-none">{question}</ReactMarkdown>
              </div>
            </div>
            <div>
              <Textarea
                placeholder="Write your code and explanation here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[200px] font-mono"
                disabled={interviewState === 'feedback'}
              />
            </div>
            {interviewState === 'question' && (
              <div className="flex justify-end">
                <Button onClick={submitAnswer} disabled={!answer.trim()}>
                  <Send className="w-4 h-4 mr-2" /> Submit for Feedback
                </Button>
              </div>
            )}
          </div>
        )}

        {interviewState === 'feedback' && feedback && (
          <div className="w-full text-left mt-6 space-y-4">
             <h4 className="font-semibold text-slate-800">Feedback:</h4>
             <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                <ReactMarkdown className="prose prose-sm max-w-none">{feedback.overall_feedback}</ReactMarkdown>
                <div><strong>Correctness:</strong> {feedback.correctness}</div>
                <div><strong>Efficiency:</strong> {feedback.efficiency}</div>
                <div><strong>Clarity:</strong> {feedback.clarity}</div>
             </div>
             <div className="flex justify-end">
               <Button onClick={resetInterview} variant="outline">
                 <RefreshCw className="w-4 h-4 mr-2" /> Start New Interview
               </Button>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}