
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Clock, Edit, Trash2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
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


export default function TaskList({ tasks, onUpdateTask, onDeleteTask }) {

  const handleStatusChange = (task, checked) => {
    onUpdateTask({ ...task, status: checked ? "completed" : "pending" });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDateBadge = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    let dateStatus = "upcoming";
    if (isPast(date) && !isToday(date)) {
      dateStatus = "overdue";
    } else if (isToday(date)) {
      dateStatus = "due-today";
    }

    let badgeClass = "";
    switch (dateStatus) {
      case "overdue":
        badgeClass = "bg-red-50 text-red-700 border-red-200";
        break;
      case "due-today":
        badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      default:
        badgeClass = "bg-slate-50 text-slate-600";
        break;
    }

    return (
      <Badge variant="outline" className={`text-xs ${badgeClass}`}>
        <Clock className="w-3 h-3 mr-1" />
        {format(date, 'MMM d')}
      </Badge>
    );
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // Prioritize pending tasks over completed tasks
    if (a.status !== b.status) {
      if (a.status === "completed") return 1;
      if (b.status === "completed") return -1;
    }

    // Define priority order
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 0;
    const bPriority = priorityOrder[b.priority] || 0;

    // Sort by priority (descending)
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    // If priorities are same, sort by due date (earliest first)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1; // Task with due date comes first
    if (b.due_date) return 1;

    // Finally, sort by creation time (assuming 'id' is a good proxy or adding a createdAt field)
    return 0;
  });

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTasks.length > 0 ? (
          <div className="space-y-4">
            {sortedTasks.map((task) => (
              <div key={task.id} className="group flex items-start gap-4 p-4 hover:bg-slate-50/50 rounded-lg transition-colors">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.status === "completed"}
                  onCheckedChange={(checked) => handleStatusChange(task, checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`font-medium text-slate-800 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}
                  >
                    {task.title}
                  </label>
                  {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {getDateBadge(task.due_date)}
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    {task.subject && <Badge variant="secondary" className="text-xs">{task.subject}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* The outline has an edit button here, but the functionality isn't provided. Keeping it disabled for now */}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will permanently delete the task "{task.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteTask(task.id)}>
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
            <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h4 className="font-semibold text-slate-700">All tasks completed!</h4>
            <p className="text-sm text-slate-500 mt-1">Ready for the next challenge?</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
