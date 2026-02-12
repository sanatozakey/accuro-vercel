import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export interface ActivityEvent {
  id: string;
  type: 'booking' | 'quotation' | 'notification';
  title: string;
  description: string;
  status?: string;
  date: string;
  metadata?: any;
}

export interface ActivityStats {
  bookings: {
    total: number;
    completed: number;
    pending: number;
  };
  quotations: {
    total: number;
    approved: number;
    pending: number;
  };
  notifications: {
    unread: number;
  };
}

class ActivityService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async getActivity(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await axios.get(
      `${API_URL}/api/activity?${queryParams.toString()}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  async getActivityStats() {
    const response = await axios.get(
      `${API_URL}/api/activity/stats`,
      this.getAuthHeader()
    );
    return response.data;
  }
}

export default new ActivityService();
