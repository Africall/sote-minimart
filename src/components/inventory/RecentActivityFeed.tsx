
import React from 'react';
import { Activity } from '@/utils/inventoryUtils';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';

interface RecentActivityFeedProps {
  activities: Activity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'restock':
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      case 'edit':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'add':
        return <Plus className="h-4 w-4 text-purple-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Edit className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-0 dark:border-gray-700">
            <div className="bg-muted dark:bg-gray-700 rounded-full p-2">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{activity.description}</p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                By {activity.performedByName} • {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
              </p>
              {activity.remarks && (
                <p className="text-xs text-muted-foreground dark:text-gray-500">{activity.remarks}</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground dark:text-gray-400">No recent activity found</p>
        </div>
      )}
    </div>
  );
};
