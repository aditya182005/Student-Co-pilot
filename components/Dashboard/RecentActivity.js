import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, BookOpen, Code, User } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

const ActivityItem = ({ activity }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'resume': return User;
      case 'study': return BookOpen;
      case 'code': return Code;
      default: return FileText;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'resume': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'study': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'code': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const Icon = getIcon(activity.type);

  return (
    <div className="flex items-start gap-3 p-4 hover:bg-white/50 rounded-xl transition-colors duration-200">
      <div className={`p-2 rounded-lg ${getColor(activity.type).replace('text-', 'bg-').replace('-700', '-500')} bg-opacity-20`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{activity.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
          </span>
        </div>
      </div>
      <Badge variant="outline" className={getColor(activity.type)}>
        {activity.type}
      </Badge>
    </div>
  );
};

export default function RecentActivity({ activity, isLoading }) {
  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))
          ) : activity.length > 0 ? (
            activity.map((item, index) => (
              <ActivityItem key={index} activity={item} />
            ))
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No recent activity yet</p>
              <p className="text-sm text-slate-400 mt-1">Start using the tools to see your progress here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
