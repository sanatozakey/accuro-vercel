import api from './api';

export interface Review {
  _id: string;
  user: string;
  booking?: string; // Optional for general reviews
  userName: string;
  userEmail: string;
  company?: string;
  rating: number;
  comment: string;
  reviewType: 'booking' | 'general';
  isApproved: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const reviewService = {
  // Get public approved reviews
  getPublicReviews: async (rating?: number) => {
    const params = rating ? { rating } : {};
    const response = await api.get('/reviews', { params });
    return response.data;
  },

  // Get all reviews (Admin only)
  getAllReviews: async (isApproved?: boolean, rating?: number) => {
    const params: any = {};
    if (isApproved !== undefined) params.isApproved = isApproved;
    if (rating) params.rating = rating;
    const response = await api.get('/reviews/admin', { params });
    return response.data;
  },

  // Create review (for booking or general testimonial)
  createReview: async (reviewData: {
    bookingId?: string; // Optional for general reviews
    rating: number;
    comment: string;
    reviewType?: 'booking' | 'general';
    isPublic?: boolean;
  }) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Get user's own reviews
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  // Approve/reject review (Admin only)
  approveReview: async (id: string, isApproved: boolean) => {
    const response = await api.put(`/reviews/${id}/approve`, { isApproved });
    return response.data;
  },

  // Delete review (Admin only)
  deleteReview: async (id: string) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
};

export default reviewService;
