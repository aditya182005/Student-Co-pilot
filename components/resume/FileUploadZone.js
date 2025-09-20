import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, Brain, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FileUploadZone({ onFileUpload, isUploading, isAnalyzing }) {
  const [dragActive, setDragActive] = React.useState(false);
  const [fileError, setFileError] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = useCallback((file) => {
    setFileError(null);
    
    // Only accept PDF files for now (supported by ExtractDataFromUploadedFile)
    const allowedTypes = ['application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      setFileError('Please upload a PDF file. DOCX support coming soon!');
      return;
    }

    // Check file size (5MB limit to be safe with the 10MB integration limit)
    const maxSize = 5 * 1024 * 1024; // 5MB to be safe
    if (file.size > maxSize) {
      setFileError(`File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please use a file smaller than 5MB.`);
      return;
    }

    onFileUpload(file);
  }, [onFileUpload]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const openFileSelector = () => {
    setFileError(null);
    fileInputRef.current?.click();
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Upload Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* File Type Notice */}
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Requirements:</strong> PDF files only, max 5MB size
          </AlertDescription>
        </Alert>

        {/* File Error */}
        {fileError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive 
              ? "border-blue-400 bg-blue-50" 
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {isUploading || isAnalyzing ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  {isAnalyzing ? (
                    <Brain className="w-8 h-8 text-white animate-pulse" />
                  ) : (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {isAnalyzing ? "Analyzing Resume..." : "Uploading..."}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {isAnalyzing ? "AI is reviewing your resume" : "Please wait"}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Drop your PDF resume here
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Or click to browse files
                  </p>
                </div>
                <Button
                  onClick={openFileSelector}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose PDF File
                </Button>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Requirements:</p>
                  <p>• PDF format only</p>
                  <p>• Maximum 5MB file size</p>
                  <p>• Text must be selectable (not scanned images)</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tips for large files */}
        <Alert className="mt-4 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>File too large?</strong> Try compressing your PDF or creating a shorter version with just 1-2 pages containing your key information.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}