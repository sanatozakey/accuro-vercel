// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  priceRange?: string;
  imageUrl?: string;
  discontinued?: boolean;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Booking types
export interface Booking {
  _id: string;
  user: string | User;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  date: string;
  time: string;
  purpose: string;
  productOfInterest?: string;
  location: 'client_site' | 'accuro_office' | 'virtual';
  additionalNotes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  conclusionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Quotation types
export interface QuotationItem {
  product: string;
  quantity: number;
  specifications?: string;
}

export interface Quotation {
  _id: string;
  user: string | User;
  quotationNumber: string;
  items: QuotationItem[];
  status: 'pending' | 'approved' | 'rejected';
  totalAmount?: number;
  currency: 'PHP' | 'USD';
  paymentTerms?: string;
  deliveryTerms?: string;
  validUntil?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  _id: string;
  user: string;
  type: 'booking' | 'quotation' | 'system' | 'admin_message';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
  specifications?: string;
}

// Review types
export interface Review {
  _id: string;
  user: string | User;
  booking: string;
  rating: number;
  comment: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface AnalyticsData {
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  quotations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
  userEngagement: {
    activeUsers: number;
    newUsers: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}
