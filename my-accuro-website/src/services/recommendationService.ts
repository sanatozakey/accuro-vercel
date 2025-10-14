import api from './api';

export interface Recommendation {
  productId: string;
  score: number;
  reasons: string[];
}

export interface RecommendationsResponse {
  success: boolean;
  count: number;
  data: Recommendation[];
}

class RecommendationService {
  async getRecommendations(limit: number = 5): Promise<RecommendationsResponse> {
    const response = await api.get<RecommendationsResponse>('/recommendations', {
      params: { limit },
    });
    return response.data;
  }

  async recordInteraction(data: {
    productId: string;
    interactionType: 'view' | 'booking' | 'inquiry' | 'purchase';
    productCategory: string;
    metadata?: any;
  }): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/recommendations/interaction', data);
    return response.data;
  }
}

export default new RecommendationService();
