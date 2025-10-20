import api from './api';

export interface PurchaseItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseHistory {
  _id: string;
  user: string;
  userName: string;
  userEmail: string;
  orderNumber: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'other';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  notes?: string;
  relatedQuote?: string;
  relatedBooking?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseHistoryResponse {
  success: boolean;
  data: PurchaseHistory;
}

export interface PurchaseHistoriesResponse {
  success: boolean;
  count: number;
  data: PurchaseHistory[];
}

class PurchaseHistoryService {
  async getMyPurchases(): Promise<PurchaseHistoriesResponse> {
    const response = await api.get<PurchaseHistoriesResponse>('/purchases/my-purchases');
    return response.data;
  }

  async getById(id: string): Promise<PurchaseHistoryResponse> {
    const response = await api.get<PurchaseHistoryResponse>(`/purchases/${id}`);
    return response.data;
  }

  async cancelPurchase(id: string, reason: string): Promise<PurchaseHistoryResponse> {
    const response = await api.put<PurchaseHistoryResponse>(`/purchases/${id}/cancel`, {
      reason,
    });
    return response.data;
  }
}

export default new PurchaseHistoryService();
