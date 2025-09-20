import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Task } from "@/entities/Task";
import { Skeleton } from "@/components/ui/skeleton";

const TaskItem = ({ task }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'exam': return '🎓';
      case 'code': return '💻';
      case 'resume': return '📄';
      case 'wellness': return '❤️';
      case 'assignment': return '📝';
      case 'project': return '🏗️';
      default: return '📌';
    }
  };
  
  const getPageUrl = (category) => {
      switch (category) {
          case 'exam': return createPageUrl("Exam");
          case 'code': return createPageUrl("Code");
          case 'resume': return createPageUrl("Resume");
          case 'wellness': return createPageUrl("Wellness");
          default: return createPageUrl("Tasks");
      }
  };

  return (
    <div className="p-4 hover:bg-white/50 rounded-xl transition-colors duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-lg">{getCategoryIcon(task.category)}</span>
          <div className="flex-1">
            <h4 className="font-medium text-slate-800 group-hover:text-slate-900 transition-colors duration-200">
              {task.title}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
              </span>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
          </div>
        </div>
        <Link to={getPageUrl(task.category)}>
          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default function UpcomingTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const allTasks = await Task.list('-due_date');
        const upcoming = allTasks
          .filter(t => t.status !== 'completed' && t.due_date)
          .sort((a,b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 4);
        setTasks(upcoming);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
      setIsLoading(false);
    };

    fetchTasks();
  }, []);

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Upcoming Tasks
          </div>
          <Link to={createPageUrl('Tasks')}>
            <Button variant="ghost" size="sm" className="text-indigo-600">
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : tasks.length > 0 ? (
            tasks.map((task, index) => (
              <TaskItem key={index} task={task} />
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2"/>
              No upcoming tasks. Great job!
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <Link to={createPageUrl('Tasks')}>
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
              <CheckCircle className="w-4 h-4 mr-2" />
              Manage All Tasks
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}