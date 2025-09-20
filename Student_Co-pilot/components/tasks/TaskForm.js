import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";

export default function TaskForm({ task, onSubmit, onCancel }) {
  const [currentTask, setCurrentTask] = useState(task || {
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    category: "study",
    estimated_hours: 1,
    subject: "",
    due_date: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(currentTask);
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {task ? "Edit Task" : "New Task"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={currentTask.title}
              onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details..."
              value={currentTask.description}
              onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={currentTask.priority}
                onValueChange={(value) => setCurrentTask({...currentTask, priority: value})}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={currentTask.category}
                onValueChange={(value) => setCurrentTask({...currentTask, category: value})}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics"
                value={currentTask.subject}
                onChange={(e) => setCurrentTask({...currentTask, subject: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="hours">Estimated Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0.5"
                step="0.5"
                value={currentTask.estimated_hours}
                onChange={(e) => setCurrentTask({...currentTask, estimated_hours: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {currentTask.due_date ? format(new Date(currentTask.due_date), 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={currentTask.due_date ? new Date(currentTask.due_date) : undefined}
                  onSelect={(date) => setCurrentTask({...currentTask, due_date: date ? date.toISOString().split('T')[0] : ""})}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {task ? "Update" : "Create"} Task
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}