import api from './api';

export interface ActiveSession {
  _id: string;
  sessionId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  isAnonymous: boolean;
  ipAddress?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  currentPage: string;
  referrer?: string;
  lastActivity: string;
  startedAt: string;
  isActive: boolean;
}

export interface ActiveSessionsResponse {
  totalActive: number;
  anonymousSessions: number;
  authenticatedSessions: number;
  sessions: ActiveSession[];
  stats: {
    locationDistribution: Record<string, number>;
    pageDistribution: Record<string, number>;
    deviceDistribution: Record<string, number>;
    browserDistribution: Record<string, number>;
  };
}

export interface HeatmapInteraction {
  x: number;
  y: number;
  page: string;
  element?: string;
  timestamp: string;
}

export interface HeatmapResponse {
  total: number;
  interactions: HeatmapInteraction[];
}

const activeSessionService = {
  getActiveSessions: async (): Promise<ActiveSessionsResponse> => {
    const response = await api.get('/sessions/active');
    return response.data;
  },

  getSessionHeatmap: async (page?: string, startDate?: string, endDate?: string): Promise<HeatmapResponse> => {
    const response = await api.get('/sessions/heatmap', {
      params: { page, startDate, endDate },
    });
    return response.data;
  },

  getSessionDetails: async (sessionId: string): Promise<ActiveSession> => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  cleanupInactiveSessions: async () => {
    const response = await api.post('/sessions/cleanup');
    return response.data;
  },
};

export default activeSessionService;
