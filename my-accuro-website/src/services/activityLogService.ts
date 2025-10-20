import api from './api';

export interface ActivityLog {
  _id: string;
  user: string;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: 'user' | 'booking' | 'review' | 'auth' | 'system';
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ActivityLogsResponse {
  success: boolean;
  count: number;
  data: ActivityLog[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const activityLogService = {
  // Get all activity logs with pagination and filters (Admin only)
  getAllActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    userId?: string;
    productCategory?: string;
  }) => {
    const response = await api.get<ActivityLogsResponse>('/activity-logs', { params });
    return response.data;
  },

  // Get current user's activity logs
  getMyActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    resourceType?: string;
  }) => {
    const response = await api.get<ActivityLogsResponse>('/activity-logs/my', { params });
    return response.data;
  },

  // Create activity log entry
  createActivityLog: async (logData: {
    action: string;
    resourceType: 'user' | 'booking' | 'review' | 'auth' | 'system';
    resourceId?: string;
    details?: string;
  }) => {
    const response = await api.post('/activity-logs', logData);
    return response.data;
  },
};

export default activityLogService;
