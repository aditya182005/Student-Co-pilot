import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Bell, Palette, Shield, User as UserIcon, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsDialog({ open, onOpenChange }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    study_reminders: true,
    weekly_reports: true,
    preferred_study_time: '09:00',
    focus_sound: true,
    pomodoro_length: 25,
    break_length: 5,
    daily_goal_hours: 4
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUser();
    }
  }, [open]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Load user settings if they exist
      if (currentUser.settings) {
        setSettings(prev => ({ ...prev, ...currentUser.settings }));
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      toast.error("Failed to load user data");
    }
    setIsLoading(false);
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await User.updateMyUserData({ settings });
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings");
    }
    setIsSaving(false);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings & Profile</DialogTitle>
          <DialogDescription>
            Manage your account, preferences, and application settings.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : user ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Study</TabsTrigger>
              <TabsTrigger value="notifications">Alerts</TabsTrigger>
              <TabsTrigger value="appearance">Theme</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800">{user.full_name}</h3>
                  <p className="text-slate-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium Plan
                    </Badge>
                    <Badge variant="outline">
                      <UserIcon className="w-3 h-3 mr-1" />
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Account Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Member since:</span>
                      <span className="text-blue-800 font-medium">{formatJoinDate(user.created_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Status:</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Premium Features</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      <span>Unlimited AI analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-3 h-3" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="w-3 h-3" />
                      <span>Smart notifications</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-700">Actions</h4>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => User.logout()}>
                    Log Out
                  </Button>
                  <Button variant="outline" disabled>
                    Export Data
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="study-time">Preferred Study Start Time</Label>
                    <Input
                      id="study-time"
                      type="time"
                      value={settings.preferred_study_time}
                      onChange={(e) => updateSetting('preferred_study_time', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily-goal">Daily Study Goal (hours)</Label>
                    <Select 
                      value={settings.daily_goal_hours.toString()} 
                      onValueChange={(value) => updateSetting('daily_goal_hours', parseInt(value))}
                    >
                      <SelectTrigger id="daily-goal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="3">3 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pomodoro-length">Pomodoro Length (minutes)</Label>
                    <Select 
                      value={settings.pomodoro_length.toString()} 
                      onValueChange={(value) => updateSetting('pomodoro_length', parseInt(value))}
                    >
                      <SelectTrigger id="pomodoro-length">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="20">20 minutes</SelectItem>
                        <SelectItem value="25">25 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="break-length">Break Length (minutes)</Label>
                    <Select 
                      value={settings.break_length.toString()} 
                      onValueChange={(value) => updateSetting('break_length', parseInt(value))}
                    >
                      <SelectTrigger id="break-length">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 minutes</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Focus Sound</Label>
                    <p className="text-sm text-slate-500">Play sound when timer completes</p>
                  </div>
                  <Switch
                    checked={settings.focus_sound}
                    onCheckedChange={(checked) => updateSetting('focus_sound', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-slate-500">Receive notifications in your browser</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Study Reminders</Label>
                    <p className="text-sm text-slate-500">Get reminded when it's time to study</p>
                  </div>
                  <Switch
                    checked={settings.study_reminders}
                    onCheckedChange={(checked) => updateSetting('study_reminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-slate-500">Receive weekly progress summaries</p>
                  </div>
                  <Switch
                    checked={settings.weekly_reports}
                    onCheckedChange={(checked) => updateSetting('weekly_reports', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={settings.theme === 'light' ? 'default' : 'outline'}
                      onClick={() => updateSetting('theme', 'light')}
                      className="h-20 flex flex-col gap-2"
                    >
                      <Sun className="w-6 h-6" />
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={settings.theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => updateSetting('theme', 'dark')}
                      className="h-20 flex flex-col gap-2"
                      disabled
                    >
                      <Moon className="w-6 h-6" />
                      <span>Dark (Coming Soon)</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Color Scheme</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: 'Default', color: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
                      { name: 'Ocean', color: 'bg-gradient-to-r from-blue-500 to-teal-600' },
                      { name: 'Forest', color: 'bg-gradient-to-r from-green-500 to-emerald-600' },
                      { name: 'Sunset', color: 'bg-gradient-to-r from-orange-500 to-red-600' }
                    ].map((scheme) => (
                      <Button
                        key={scheme.name}
                        variant="outline"
                        className="h-16 flex flex-col gap-1 relative overflow-hidden"
                        disabled
                      >
                        <div className={`absolute inset-0 opacity-20 ${scheme.color}`}></div>
                        <div className={`w-6 h-6 rounded ${scheme.color}`}></div>
                        <span className="text-xs">{scheme.name}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">Custom themes coming soon in premium update</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">Could not load user information.</p>
            <Button onClick={fetchUser} className="mt-4">
              Try Again
            </Button>
          </div>
        )}
        
        {user && (
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}