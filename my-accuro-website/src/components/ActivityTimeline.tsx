import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Bell, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import activityService, { ActivityEvent } from '../services/activityService';
import toast from 'react-hot-toast';

export function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(20);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityService.getActivity({ limit });
      setActivities(response.data);
    } catch (error: any) {
      toast.error('Failed to load activity');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string, status?: string) => {
    if (type === 'booking') {
      if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
      if (status === 'confirmed') return <Calendar className="h-5 w-5 text-blue-600" />;
      if (status === 'cancelled') return <XCircle className="h-5 w-5 text-red-600" />;
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    if (type === 'quotation') {
      if (status === 'approved') return <CheckCircle className="h-5 w-5 text-green-600" />;
      if (status === 'rejected') return <XCircle className="h-5 w-5 text-red-600" />;
      return <FileText className="h-5 w-5 text-yellow-600" />;
    }
    return <Bell className="h-5 w-5 text-blue-600" />;
  };

  const getStatusColor = (type: string, status?: string) => {
    if (type === 'booking' || type === 'quotation') {
      if (status === 'completed' || status === 'approved') return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      if (status === 'cancelled' || status === 'rejected') return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      if (status === 'confirmed') return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    }
    return 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 60) {
      return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No activity yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your activity timeline will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

      {/* Activity Items */}
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative pl-14">
            {/* Icon Circle */}
            <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              {getIcon(activity.type, activity.status)}
            </div>

            {/* Activity Card */}
            <div className={`border-l-4 rounded-lg p-4 shadow-sm ${getStatusColor(activity.type, activity.status)}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                </div>
                {activity.status && (
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    activity.status === 'completed' || activity.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : activity.status === 'cancelled' || activity.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : activity.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {activity.status}
                  </span>
                )}
              </div>

              {/* Metadata */}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {activity.metadata.service && (
                      <span>Service: {activity.metadata.service}</span>
                    )}
                    {activity.metadata.quotationNumber && (
                      <span>Quote #: {activity.metadata.quotationNumber}</span>
                    )}
                    {activity.metadata.items && (
                      <span>Items: {activity.metadata.items}</span>
                    )}
                    {activity.metadata.totalAmount && (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        Amount: {activity.metadata.currency === 'USD' ? '$' : '₱'}
                        {activity.metadata.totalAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(activity.date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
