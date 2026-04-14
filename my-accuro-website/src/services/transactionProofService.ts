import api from './api';

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface TransactionProof {
  _id: string;
  bookingId: string | any;
  quotationId: string | any;
  items: TransactionItem[];
  totalAmount: number;
  currency: 'PHP' | 'USD';
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    uploadedAt: string;
  }[];
  customerNotes?: string;
  status: 'pending_upload' | 'pending_review' | 'approved' | 'rejected';
  submittedBy?: any;
  submittedAt?: string;
  reviewedBy?: any;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewFeedback?: string;
  inventoryDeducted: boolean;
  createdAt: string;
  updatedAt: string;
}

class TransactionProofService {
  async getByBookingId(bookingId: string) {
    const response = await api.get(`/transaction-proofs/booking/${bookingId}`);
    return response.data;
  }

  async getPendingReview() {
    const response = await api.get('/transaction-proofs/pending-review');
    return response.data;
  }

  async getAll(params?: { status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    const response = await api.get(`/transaction-proofs?${queryParams.toString()}`);
    return response.data;
  }

  async submitPaymentProof(id: string, files: File[], customerNotes?: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('attachments', file));
    if (customerNotes) formData.append('customerNotes', customerNotes);

    const response = await api.post(`/transaction-proofs/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async approve(id: string, reviewFeedback?: string) {
    const response = await api.put(`/transaction-proofs/${id}/approve`, { reviewFeedback });
    return response.data;
  }

  async reject(id: string, reviewFeedback: string) {
    const response = await api.put(`/transaction-proofs/${id}/reject`, { reviewFeedback });
    return response.data;
  }

  async revise(id: string, files: File[], customerNotes?: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('attachments', file));
    if (customerNotes) formData.append('customerNotes', customerNotes);

    const response = await api.put(`/transaction-proofs/${id}/revise`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async adjustItems(id: string, items: TransactionItem[]) {
    const response = await api.put(`/transaction-proofs/${id}/adjust-items`, { items });
    return response.data;
  }
}

export default new TransactionProofService();
