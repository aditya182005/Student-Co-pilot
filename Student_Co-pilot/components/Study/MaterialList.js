
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Image, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function MaterialsList({ materials, activeMaterial, setActiveMaterial, onDeleteMaterial }) {
  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'image': return <Image className="w-4 h-4 text-blue-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          My Study Materials
        </CardTitle>
      </CardHeader>
      <CardContent>
        {materials && materials.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className={`p-4 rounded-xl border group transition-all duration-200 ${
                  activeMaterial?.id === material.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div 
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setActiveMaterial(material)}
                >
                    <div className="flex items-center gap-3">
                        {getFileIcon(material.file_type)}
                        <div>
                            <p className="font-semibold text-slate-800">{material.title}</p>
                            <p className="text-sm text-slate-500 mt-1">{material.subject}</p>
                        </div>
                    </div>
                  <Badge variant="outline">{material.difficulty_level}</Badge>
                </div>
                <div className="flex justify-end mt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{material.title}" and all associated data, including flashcards.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDeleteMaterial(material.id)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center py-10">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h4 className="font-semibold text-slate-700">No study materials yet</h4>
                <p className="text-sm text-slate-500 mt-1">Upload your notes to get started.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
