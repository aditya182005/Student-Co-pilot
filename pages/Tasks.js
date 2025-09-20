
import React, { useState, useEffect } from "react";
import { Task } from "@/entities/Task";
import { StudySession } from "@/entities/StudySession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus, Timer, TrendingUp, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";
import PomodoroTimer from "../components/tasks/PomodoroTimer";
import TaskAnalytics from "../components/tasks/TaskAnalytics";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const fetchedTasks = await Task.list("-created_date");
    setTasks(fetchedTasks);
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await Task.update(editingTask.id, taskData);
        toast.success("Task updated successfully!");
      } else {
        await Task.create(taskData);
        toast.success("Task created successfully!");
      }
      setShowForm(false);
      setEditingTask(null);
      await loadTasks();
    } catch (error) {
      toast.error("Error saving task");
    }
  };

  const handleTaskComplete = async (task) => {
    try {
      await Task.update(task.id, { 
        status: "completed",
        actual_hours: task.actual_hours || task.estimated_hours || 1
      });

      // Log study session
      await StudySession.create({
        date: new Date().toISOString().split('T')[0],
        subject: task.subject || "General",
        duration_minutes: (task.actual_hours || 1) * 60,
        session_type: "study",
        focus_rating: 8,
        notes: `Completed task: ${task.title}`
      });

      toast.success("Task completed! 🎉");
      await loadTasks();
    } catch (error) {
      toast.error("Error completing task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const toastId = toast.loading("Deleting task...");
    try {
      await Task.delete(taskId);
      toast.success("Task deleted!", { id: toastId });
      await loadTasks(); // Reload tasks to update the UI
    } catch (error) {
      toast.error("Failed to delete task.", { id: toastId });
      console.error("Error deleting task:", error);
    }
  };

  const tabContent = {
    tasks: (
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskList 
            tasks={tasks}
            onTaskComplete={handleTaskComplete}
            onTaskEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onDeleteTask={handleDeleteTask}
          />
        </div>
        <div>
          {showForm ? (
            <TaskForm
              task={editingTask}
              onSubmit={handleTaskSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
            />
          ) : (
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="w-full mb-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
                
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Total Tasks</p>
                    <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {tasks.filter(t => t.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    ),
    pomodoro: <PomodoroTimer />,
    analytics: <TaskAnalytics tasks={tasks} />
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Task Manager
              </h1>
              <p className="text-slate-600">Organize your academic life with AI-powered productivity</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button 
              variant={activeTab === "tasks" ? "default" : "outline"} 
              onClick={() => setActiveTab("tasks")}
              className="flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
            </Button>
            <Button 
              variant={activeTab === "pomodoro" ? "default" : "outline"} 
              onClick={() => setActiveTab("pomodoro")}
              className="flex items-center gap-2"
            >
              <Timer className="w-4 h-4" />
              Pomodoro
            </Button>
            <Button 
              variant={activeTab === "analytics" ? "default" : "outline"} 
              onClick={() => setActiveTab("analytics")}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </Button>
          </div>
        </div>

        {tabContent[activeTab]}
      </div>
    </div>
  );
}
