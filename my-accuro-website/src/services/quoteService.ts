import api from './api';

export interface QuoteItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
}

export interface QuoteData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  items: QuoteItem[];
  totalEstimatedPrice: number;
  message?: string;
}

export interface Quote extends QuoteData {
  _id: string;
  userId?: string;
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteResponse {
  success: boolean;
  data: Quote;
}

export interface QuotesResponse {
  success: boolean;
  count: number;
  data: Quote[];
}

class QuoteService {
  async create(data: QuoteData): Promise<QuoteResponse> {
    const response = await api.post<QuoteResponse>('/quotes', data);
    return response.data;
  }

  async getMyQuotes(): Promise<QuotesResponse> {
    const response = await api.get<QuotesResponse>('/quotes/my');
    return response.data;
  }

  async getAll(params?: { status?: string }): Promise<QuotesResponse> {
    const response = await api.get<QuotesResponse>('/quotes', { params });
    return response.data;
  }

  async getById(id: string): Promise<QuoteResponse> {
    const response = await api.get<QuoteResponse>(`/quotes/${id}`);
    return response.data;
  }

  async updateStatus(id: string, status: string, adminNotes?: string): Promise<QuoteResponse> {
    const response = await api.put<QuoteResponse>(`/quotes/${id}/status`, {
      status,
      adminNotes,
    });
    return response.data;
  }
}

export default new QuoteService();
