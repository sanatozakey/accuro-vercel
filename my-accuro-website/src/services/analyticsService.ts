import api from './api';

export interface AnalyticsData {
  _id: string;
  count: number;
}

export interface DashboardAnalytics {
  products: AnalyticsData[];
  locations: AnalyticsData[];
  statuses: AnalyticsData[];
  totalBookings: number;
}

const analyticsService = {
  // Get product analytics
  getProductAnalytics: async () => {
    const response = await api.get('/analytics/products');
    return response.data;
  },

  // Get location analytics
  getLocationAnalytics: async () => {
    const response = await api.get('/analytics/locations');
    return response.data;
  },

  // Get dashboard analytics
  getDashboardAnalytics: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
};

export default analyticsService;
