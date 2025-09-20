
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Brain, FileUp, Paperclip, X } from "lucide-react";

export default function ExamSetup({ onExamCreate }) {
  const [examData, setExamData] = useState({
    exam_name: "",
    exam_date: "",
    subject: "",
    syllabus: ""
  });
  const [files, setFiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examData.exam_name || !examData.exam_date || !examData.subject) return;
    
    setIsCreating(true);
    await onExamCreate(examData, files);
    setExamData({ exam_name: "", exam_date: "", subject: "", syllabus: "" });
    setFiles([]);
    setIsCreating(false);
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-600" />
          Create New Exam
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="exam_name">Exam Name</Label>
            <Input
              id="exam_name"
              value={examData.exam_name}
              onChange={(e) => setExamData({...examData, exam_name: e.target.value})}
              placeholder="e.g., Data Structures Final"
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={examData.subject}
              onChange={(e) => setExamData({...examData, subject: e.target.value})}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <Label htmlFor="exam_date">Exam Date</Label>
            <Input
              id="exam_date"
              type="date"
              value={examData.exam_date}
              onChange={(e) => setExamData({...examData, exam_date: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="syllabus">Syllabus</Label>
            <Textarea
              id="syllabus"
              value={examData.syllabus}
              onChange={(e) => setExamData({...examData, syllabus: e.target.value})}
              placeholder="Paste exam syllabus or topics to cover..."
              className="min-h-24"
            />
          </div>

          <div>
            <Label>Past Papers (Optional)</Label>
            <div className="mt-2 flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-6 h-6 mb-2 text-slate-500" />
                  <p className="mb-2 text-sm text-slate-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} multiple />
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-1 bg-slate-100 rounded text-xs">
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      {file.name}
                    </span>
                    <button type="button" onClick={() => removeFile(file.name)}>
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!examData.exam_name || !examData.exam_date || !examData.subject || isCreating}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {isCreating ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Generating AI Study Plan...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Create Exam Prep
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
