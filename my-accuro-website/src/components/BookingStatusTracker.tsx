import React, { useEffect, useState, useCallback } from 'react';
import { Check, Clock, Calendar, XCircle, RefreshCw } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  changedBy?: string;
  note?: string;
}

interface BookingStatusTrackerProps {
  bookingId: string;
  currentStatus: BookingStatus;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  compact?: boolean;
  onStatusUpdate?: (newStatus: BookingStatus) => void;
}

const STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  pending: {
    label: 'Pending',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  confirmed: {
    label: 'Confirmed',
    icon: <Check className="h-4 w-4" />,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  completed: {
    label: 'Completed',
    icon: <Check className="h-4 w-4" />,
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
};

const TIMELINE_STEPS: BookingStatus[] = ['pending', 'confirmed', 'completed'];

export function BookingStatusTracker({
  bookingId,
  currentStatus,
  statusHistory = [],
  createdAt,
  compact = false,
  onStatusUpdate,
}: BookingStatusTrackerProps) {
  const [status, setStatus] = useState<BookingStatus>(currentStatus);
  const [history, setHistory] = useState<StatusHistoryEntry[]>(statusHistory);
  const { socket, isConnected } = useSocket();

  // Handle real-time status updates via socket
  const handleStatusUpdate = useCallback((data: {
    bookingId: string;
    status: BookingStatus;
    statusHistory: StatusHistoryEntry[];
  }) => {
    if (data.bookingId === bookingId) {
      setStatus(data.status);
      setHistory(data.statusHistory || []);
      onStatusUpdate?.(data.status);
    }
  }, [bookingId, onStatusUpdate]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('booking:statusUpdate', handleStatusUpdate);

    return () => {
      socket.off('booking:statusUpdate', handleStatusUpdate);
    };
  }, [socket, isConnected, handleStatusUpdate]);

  // Update local state when props change
  useEffect(() => {
    setStatus(currentStatus);
    setHistory(statusHistory);
  }, [currentStatus, statusHistory]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateTime(dateString);
  };

  const getStatusIndex = (s: BookingStatus): number => {
    if (s === 'cancelled' || s === 'rescheduled') return -1;
    return TIMELINE_STEPS.indexOf(s);
  };

  const currentIndex = getStatusIndex(status);
  const isCancelledOrRescheduled = status === 'cancelled' || status === 'rescheduled';

  // Compact view (for cards/lists)
  if (compact) {
    const config = STATUS_CONFIG[status];
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="w-full">
      {/* Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCancelledOrRescheduled
                ? 'bg-gray-400'
                : currentIndex >= 2
                ? 'bg-green-500'
                : currentIndex >= 1
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{
              width: isCancelledOrRescheduled
                ? '0%'
                : `${Math.max(0, (currentIndex / (TIMELINE_STEPS.length - 1)) * 100)}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {TIMELINE_STEPS.map((step, index) => {
            const stepConfig = STATUS_CONFIG[step];
            const isActive = currentIndex >= index && !isCancelledOrRescheduled;
            const isCurrent = currentIndex === index && !isCancelledOrRescheduled;

            return (
              <div
                key={step}
                className="flex flex-col items-center"
                style={{ width: `${100 / TIMELINE_STEPS.length}%` }}
              >
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                    isActive
                      ? `${stepConfig.bgColor} ${stepConfig.borderColor} ${stepConfig.color}`
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  } ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                >
                  {isActive ? stepConfig.icon : <span className="text-sm">{index + 1}</span>}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? stepConfig.color
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {stepConfig.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancelled/Rescheduled Badge */}
        {isCancelledOrRescheduled && (
          <div className="mt-4 flex justify-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${STATUS_CONFIG[status].bgColor} ${STATUS_CONFIG[status].borderColor}`}
            >
              {STATUS_CONFIG[status].icon}
              <span className={`font-medium ${STATUS_CONFIG[status].color}`}>
                Booking {STATUS_CONFIG[status].label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status History */}
      {history.length > 0 && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Status History
          </h4>
          <div className="space-y-2">
            {history.map((entry, index) => {
              const entryConfig = STATUS_CONFIG[entry.status as BookingStatus] || STATUS_CONFIG.pending;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <span className={`${entryConfig.color}`}>{entryConfig.icon}</span>
                  <span className={`font-medium ${entryConfig.color}`}>
                    {entryConfig.label}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-gray-600 dark:text-gray-400" title={formatDateTime(entry.changedAt)}>
                    {formatTimeAgo(entry.changedAt)}
                  </span>
                  {entry.note && (
                    <span className="text-gray-500 dark:text-gray-500 italic text-xs">
                      ({entry.note})
                    </span>
                  )}
                </div>
              );
            })}

            {/* Created entry */}
            <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-gray-500"><Calendar className="h-4 w-4" /></span>
              <span className="font-medium text-gray-600 dark:text-gray-400">Created</span>
              <span className="text-gray-400 dark:text-gray-500">-</span>
              <span className="text-gray-600 dark:text-gray-400" title={formatDateTime(createdAt)}>
                {formatTimeAgo(createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingStatusTracker;
