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
    const response = await api.get('/activity-logs', { params });
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
