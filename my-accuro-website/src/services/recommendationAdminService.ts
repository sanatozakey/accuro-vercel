import api from './api';

export interface UserInteraction {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  productId: string;
  interactionType: 'view' | 'booking' | 'inquiry' | 'purchase';
  productCategory: string;
  weight: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationStats {
  totalInteractions: number;
  totalUsers: number;
  interactionsByType: Array<{
    _id: string;
    count: number;
  }>;
  interactionsByCategory: Array<{
    _id: string;
    count: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalWeight: number;
    interactionCount: number;
  }>;
  recentInteractions: UserInteraction[];
}

export interface InteractionsResponse {
  success: boolean;
  count: number;
  data: UserInteraction[];
}

export interface StatsResponse {
  success: boolean;
  data: RecommendationStats;
}

class RecommendationAdminService {
  /**
   * Get all user interactions (Admin only)
   */
  async getAllInteractions(): Promise<InteractionsResponse> {
    const response = await api.get<InteractionsResponse>('/recommendations/interactions');
    return response.data;
  }

  /**
   * Get recommendation statistics (Admin only)
   */
  async getStats(): Promise<StatsResponse> {
    const response = await api.get<StatsResponse>('/recommendations/stats');
    return response.data;
  }
}

export default new RecommendationAdminService();
