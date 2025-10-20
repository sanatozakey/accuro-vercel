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
  totalUsers: number;
  totalQuotes: number;
  totalContacts: number;
}

export interface AnalyticsDetailParams {
  productId?: string;
  eventType?: string;
  status?: string;
  role?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
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
  getDashboardAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
  },

  // Product Views
  getProductViewsAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/product-views', { params });
    return response.data;
  },

  getProductViewDetails: async (params: AnalyticsDetailParams) => {
    const response = await api.get('/analytics/product-views/details', { params });
    return response.data;
  },

  // Cart Analytics
  getCartAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/cart', { params });
    return response.data;
  },

  getCartDetails: async (params: AnalyticsDetailParams) => {
    const response = await api.get('/analytics/cart/details', { params });
    return response.data;
  },

  // Quote Analytics
  getQuoteAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/quotes', { params });
    return response.data;
  },

  getQuoteDetails: async (params: AnalyticsDetailParams) => {
    const response = await api.get('/analytics/quotes/details', { params });
    return response.data;
  },

  // Contact Analytics
  getContactAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/contacts', { params });
    return response.data;
  },

  getContactDetails: async (params: AnalyticsDetailParams) => {
    const response = await api.get('/analytics/contacts/details', { params });
    return response.data;
  },

  // Registration Analytics
  getRegistrationAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/registrations', { params });
    return response.data;
  },

  getRegistrationDetails: async (params: AnalyticsDetailParams) => {
    const response = await api.get('/analytics/registrations/details', { params });
    return response.data;
  },

  // Search Analytics
  getSearchAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/searches', { params });
    return response.data;
  },

  getSearchDetails: async (params: AnalyticsDetailParams) => {
    const response = await api.get('/analytics/searches/details', { params });
    return response.data;
  },

  // Track Event
  trackEvent: async (eventData: {
    eventType: string;
    productId?: string;
    productName?: string;
    category?: string;
    searchTerm?: string;
    metadata?: any;
  }) => {
    const response = await api.post('/analytics/track', eventData);
    return response.data;
  },
};

export default analyticsService;
