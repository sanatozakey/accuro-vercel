import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  async createQuotation(data: CreateQuotationData) {
    const response = await axios.post(
      `${API_URL}/api/quotations`,
      data,
      this.getAuthHeader()
    );
    return response.data;
  }

  async getQuotations(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);

    const response = await axios.get(
      `${API_URL}/api/quotations?${queryParams.toString()}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  async getQuotationById(id: string) {
    const response = await axios.get(
      `${API_URL}/api/quotations/${id}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  async updateQuotation(id: string, data: UpdateQuotationData) {
    const response = await axios.put(
      `${API_URL}/api/quotations/${id}`,
      data,
      this.getAuthHeader()
    );
    return response.data;
  }

  async approveQuotation(id: string, data: UpdateQuotationData) {
    const response = await axios.put(
      `${API_URL}/api/quotations/${id}/approve`,
      data,
      this.getAuthHeader()
    );
    return response.data;
  }

  async rejectQuotation(id: string, adminNotes?: string) {
    const response = await axios.put(
      `${API_URL}/api/quotations/${id}/reject`,
      { adminNotes },
      this.getAuthHeader()
    );
    return response.data;
  }

  async deleteQuotation(id: string) {
    const response = await axios.delete(
      `${API_URL}/api/quotations/${id}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  async getQuotationStats() {
    const response = await axios.get(
      `${API_URL}/api/quotations/stats/overview`,
      this.getAuthHeader()
    );
    return response.data;
  }
}

export default new QuotationService();
