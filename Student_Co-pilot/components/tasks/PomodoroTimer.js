import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { StudySession } from "@/entities/StudySession";
import { Play, Pause, Square, Coffee, Brain, Settings } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PomodoroTimer() {
  const [durations, setDurations] = useState({ work: 25, 'short-break': 5, 'long-break': 15 });
  const [timeLeft, setTimeLeft] = useState(durations.work * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("work");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentSubject, setCurrentSubject] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const modes = useMemo(() => ({
    work: { label: "Focus Time", icon: Brain, color: "text-blue-600" },
    "short-break": { label: "Short Break", icon: Coffee, color: "text-green-600" },
    "long-break": { label: "Long Break", icon: Coffee, color: "text-green-600" }
  }), []);

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Literature", "History", "Other"];

  const handleTimerComplete = useCallback(async () => {
    setIsActive(false);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${modes[mode].label} completed!`, {
        body: mode === 'work' ? 'Time for a break!' : 'Time to focus!',
        icon: '/favicon.ico'
      });
    }

    if (mode === "work") {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      if (currentSubject && sessionStartTime) {
        try {
          await StudySession.create({
            date: new Date().toISOString().split('T')[0],
            subject: currentSubject,
            duration_minutes: durations.work,
            session_type: "study",
            focus_rating: 8,
            notes: `Pomodoro session #${newCount}`,
            pomodoro_completed: 1,
            breaks_taken: 0
          });
        } catch (error) {
          console.error("Error logging study session:", error);
        }
      }

      const nextMode = newCount % 4 === 0 ? "long-break" : "short-break";
      setMode(nextMode);
      setTimeLeft(durations[nextMode] * 60);
      toast.success(`Pomodoro ${newCount} completed! 🍅`);
    } else {
      setMode("work");
      setTimeLeft(durations.work * 60);
      toast.success("Break over! Time to focus! 💪");
    }
  }, [mode, modes, completedPomodoros, currentSubject, sessionStartTime, durations]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleTimerComplete]);

  const startTimer = () => {
    if (!isActive && mode === "work" && !sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setIsActive(true);
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(durations[mode] * 60);
    setSessionStartTime(null);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
    setIsActive(false);
    setSessionStartTime(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = durations[mode] * 60;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const CurrentIcon = modes[mode].icon;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-effect border-0 shadow-xl overflow-hidden">
        <CardHeader className="text-center flex flex-row items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center justify-center gap-2">
              <CurrentIcon className={`w-6 h-6 ${modes[mode].color}`} />
              <span className={modes[mode].color}>{modes[mode].label}</span>
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-5 h-5 text-slate-500 hover:text-slate-700" />
          </Button>
        </CardHeader>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-slate-200"
            >
              <div className="p-6 space-y-4">
                <h4 className="font-semibold">Timer Settings</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="work-duration">Focus (min)</Label>
                    <Input id="work-duration" type="number" value={durations.work} onChange={(e) => setDurations({...durations, work: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <Label htmlFor="short-break-duration">Short Break (min)</Label>
                    <Input id="short-break-duration" type="number" value={durations['short-break']} onChange={(e) => setDurations({...durations, 'short-break': parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <Label htmlFor="long-break-duration">Long Break (min)</Label>
                    <Input id="long-break-duration" type="number" value={durations['long-break']} onChange={(e) => setDurations({...durations, 'long-break': parseInt(e.target.value)})} />
                  </div>
                </div>
                 <Button size="sm" onClick={() => { switchMode(mode); setShowSettings(false); }}>Apply & Close</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CardContent className="space-y-8 pt-8">
          <div className="text-center">
            <div className="text-8xl font-mono font-bold text-slate-800 mb-4">
              {formatTime(timeLeft)}
            </div>
            <Progress value={progress} className="h-4 mb-6" />
          </div>

          {mode === "work" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Study Subject</label>
              <Select value={currentSubject} onValueChange={setCurrentSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject to study" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={isActive ? pauseTimer : startTimer} disabled={mode === "work" && !currentSubject} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isActive ? "Pause" : "Start"}
            </Button>
            <Button onClick={resetTimer} variant="outline" size="lg">
              <Square className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>

          <div className="flex justify-center gap-2">
            <Button variant={mode === "work" ? "default" : "outline"} onClick={() => switchMode("work")} size="sm">
              Focus ({durations.work}m)
            </Button>
            <Button variant={mode === "short-break" ? "default" : "outline"} onClick={() => switchMode("short-break")} size="sm">
              Short Break ({durations['short-break']}m)
            </Button>
            <Button variant={mode === "long-break" ? "default" : "outline"} onClick={() => switchMode("long-break")} size="sm">
              Long Break ({durations['long-break']}m)
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{completedPomodoros}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{completedPomodoros * durations.work}</div>
              <div className="text-sm text-slate-600">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{Math.floor(completedPomodoros / 4)}</div>
              <div className="text-sm text-slate-600">Cycles</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}