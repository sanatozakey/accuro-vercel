// quotationService - Admin-facing quotation management (CRUD, approve/reject, stats)
// For customer-facing cart-to-quote flow, see quoteService.ts
import api from './api';

export interface QuotationItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  specifications?: string;
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  items: QuotationItem[];
  additionalRequirements?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  validUntil?: string;
  totalAmount?: number;
  currency: 'PHP' | 'USD';
  paymentTerms?: string;
  deliveryTerms?: string;
  adminNotes?: string;
  termsAndConditions?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface CreateQuotationData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  items: QuotationItem[];
  additionalRequirements?: string;
  currency?: 'PHP' | 'USD';
}

export interface UpdateQuotationData {
  totalAmount?: number;
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  adminNotes?: string;
  termsAndConditions?: string;
  currency?: 'PHP' | 'USD';
}

class QuotationService {
  async createQuotation(data: CreateQuotationData) {
    const response = await api.post('/quotations', data);
    return response.data;
  }

  async getQuotations(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);

    const response = await api.get(`/quotations?${queryParams.toString()}`);
    return response.data;
  }

  async getQuotationById(id: string) {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  }

  async updateQuotation(id: string, data: UpdateQuotationData) {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  }

  async approveQuotation(id: string, data: UpdateQuotationData) {
    const response = await api.put(`/quotations/${id}/approve`, data);
    return response.data;
  }

  async rejectQuotation(id: string, adminNotes?: string) {
    const response = await api.put(`/quotations/${id}/reject`, { adminNotes });
    return response.data;
  }

  async deleteQuotation(id: string) {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  }

  async getQuotationStats() {
    const response = await api.get('/quotations/stats/overview');
    return response.data;
  }
}

export default new QuotationService();
