// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
    UPDATE_DETAILS: '/auth/update-details',
  },

  // Bookings
  BOOKINGS: {
    BASE: '/bookings',
    UPCOMING: '/bookings/upcoming',
    BY_ID: (id: string) => `/bookings/${id}`,
    UPDATE_STATUS: (id: string) => `/bookings/${id}/status`,
  },

  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    UPLOAD_IMAGE: '/products/upload-image',
  },

  // Quotations
  QUOTATIONS: {
    BASE: '/quotations',
    BY_ID: (id: string) => `/quotations/${id}`,
    APPROVE: (id: string) => `/quotations/${id}/approve`,
    REJECT: (id: string) => `/quotations/${id}/reject`,
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
  },

  // Analytics
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    REAL_TIME: '/analytics/real-time',
    BOOKING_STATS: '/analytics/booking-stats',
    REVENUE: '/analytics/revenue',
    USER_ENGAGEMENT: '/analytics/user-engagement',
  },

  // Reviews
  REVIEWS: {
    BASE: '/reviews',
    BY_ID: (id: string) => `/reviews/${id}`,
    APPROVE: (id: string) => `/reviews/${id}/approve`,
  },

  // Activity Logs
  ACTIVITY_LOGS: {
    BASE: '/activity-logs',
  },

  // Recommendations
  RECOMMENDATIONS: {
    BASE: '/recommendations',
    INTERACTION: '/recommendations/interaction',
    ADMIN_MONITOR: '/recommendations/admin/monitor',
  },

  // Contacts
  CONTACTS: {
    BASE: '/contacts',
  },

  // Users (Admin)
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },

  // Reports
  REPORTS: {
    GENERATE: '/reports/generate',
    EXPORT: '/reports/export',
  },
};

export default API_ENDPOINTS;
