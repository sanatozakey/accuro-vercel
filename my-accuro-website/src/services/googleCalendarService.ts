import api from './api';

export interface CalendarStatus {
  isConfigured: boolean;
  isConnected: boolean;
  settings: {
    calendarEmail: string;
    syncEnabled: boolean;
    lastSyncAt: string | null;
    connectedAt: string;
  } | null;
  stats: CalendarStats | null;
}

export interface CalendarStats {
  totalBookings: number;
  syncedBookings: number;
  failedSyncs: number;
  pendingSyncs: number;
  lastSyncAt: string | null;
}

export interface SyncLog {
  _id: string;
  bookingId: {
    _id: string;
    company: string;
    contactName: string;
    date: string;
    time: string;
  } | null;
  googleEventId: string;
  direction: 'booking_to_google' | 'google_to_booking';
  action: 'create' | 'update' | 'delete';
  status: 'success' | 'failed' | 'pending' | 'skipped';
  error?: string;
  details?: string;
  createdAt: string;
}

export interface SyncResult {
  success: number;
  failed: number;
}

class GoogleCalendarService {
  // Get calendar connection status
  async getStatus(): Promise<{ success: boolean; data: CalendarStatus }> {
    const response = await api.get('/google-calendar/status');
    return response.data;
  }

  // Get OAuth authorization URL
  async getAuthUrl(): Promise<{ success: boolean; data: { authUrl: string } }> {
    const response = await api.get('/google-calendar/auth-url');
    return response.data;
  }

  // Connect calendar (get auth URL with state)
  async connect(): Promise<{ success: boolean; data: { authUrl: string } }> {
    const response = await api.post('/google-calendar/connect');
    return response.data;
  }

  // Disconnect calendar
  async disconnect(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/google-calendar/disconnect');
    return response.data;
  }

  // Sync a single booking
  async syncBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/google-calendar/sync/${bookingId}`);
    return response.data;
  }

  // Sync all bookings
  async syncAllBookings(): Promise<{ success: boolean; message: string; data: SyncResult }> {
    const response = await api.post('/google-calendar/sync-all');
    return response.data;
  }

  // Retry failed syncs
  async retryFailedSyncs(): Promise<{ success: boolean; message: string; data: SyncResult }> {
    const response = await api.post('/google-calendar/retry-failed');
    return response.data;
  }

  // Get sync logs
  async getSyncLogs(limit: number = 50): Promise<{ success: boolean; count: number; data: SyncLog[] }> {
    const response = await api.get('/google-calendar/logs', { params: { limit } });
    return response.data;
  }

  // Get sync statistics
  async getStats(): Promise<{ success: boolean; data: CalendarStats }> {
    const response = await api.get('/google-calendar/stats');
    return response.data;
  }

  // Setup webhook for real-time sync
  async setupWebhook(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/google-calendar/setup-webhook');
    return response.data;
  }
}

const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
