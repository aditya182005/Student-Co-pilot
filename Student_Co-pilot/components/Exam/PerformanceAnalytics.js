import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { FileUp, TrendingUp, Target } from "lucide-react";

export default function PerformanceAnalytics({ exam }) {
  const chartData = exam.mock_test_scores.map(score => ({
    date: new Date(score.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: score.score
  }));

  const averageScore = chartData.length > 0
    ? chartData.reduce((acc, curr) => acc + curr.score, 0) / chartData.length
    : 0;

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="w-5 h-5 text-indigo-600" />
          Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6 text-center">
              <div className="p-4 bg-indigo-50 rounded-xl">
                <p className="text-sm text-indigo-700">Average Score</p>
                <p className="text-3xl font-bold text-indigo-600">{averageScore.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-700">Highest Score</p>
                <p className="text-3xl font-bold text-green-600">{Math.max(...chartData.map(d => d.score))}%</p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    dot={{ fill: '#4f46e5', r: 5 }}
                    name="Mock Test Score (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700">No data to analyze</h3>
            <p className="text-sm text-slate-500 mt-1">Complete mock tests to track your performance.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}