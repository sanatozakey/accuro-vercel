import api from './api';

export interface BookingData {
  date: string;
  time: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  purpose: string;
  location: string;
  product: string;
  additionalInfo?: string;
  quotationId?: string;
}

export interface TechnicianInfo {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  technicianNumber?: number;
  specialization?: string;
}

export interface TechnicianAvailability extends TechnicianInfo {
  isAvailable: boolean;
}

// Helper to get technician display label
export const getTechnicianLabel = (tech: TechnicianInfo | TechnicianAvailability): string => {
  if (tech.technicianNumber) {
    return `Technician ${tech.technicianNumber}`;
  }
  return tech.name;
};

export const getTechnicianRealName = (tech: TechnicianInfo): string => {
  if (tech.firstName && tech.lastName) {
    return `${tech.firstName} ${tech.lastName}`;
  }
  // Fallback: if name is still the default "Technician X", show nothing
  if (tech.name && !tech.name.match(/^Technician \d+$/)) {
    return tech.name;
  }
  return '';
};

export interface Booking extends BookingData {
  _id: string;
  userId?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'pending_review' | 'awaiting_payment' | 'payment_submitted' | 'verified';
  conclusion?: string;
  rescheduleReason?: string;
  originalDate?: string;
  originalTime?: string;
  assignedTechnician?: TechnicianInfo | string;
  assignedAt?: string;
  assignedBy?: string;
  quotationId?: any;
  createdAt: string;
  updatedAt: string;
}

export interface BookingsResponse {
  success: boolean;
  count: number;
  data: Booking[];
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
  hasConflict?: boolean;
  message?: string;
}

class BookingService {
  async getAll(params?: { status?: string; startDate?: string; endDate?: string }): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings', { params });
    return response.data;
  }

  async getUpcoming(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/upcoming');
    return response.data;
  }

  async getById(id: string): Promise<BookingResponse> {
    const response = await api.get<BookingResponse>(`/bookings/${id}`);
    return response.data;
  }

  async getMyBookings(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/my');
    return response.data;
  }

  async create(data: BookingData): Promise<BookingResponse> {
    const response = await api.post<BookingResponse>('/bookings', data);
    return response.data;
  }

  async update(id: string, data: Partial<Booking>): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/bookings/${id}`);
    return response.data;
  }

  async cancel(id: string, cancellationReason: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/cancel`, {
      cancellationReason,
    });
    return response.data;
  }

  async reschedule(
    id: string,
    newDate: string,
    newTime: string,
    rescheduleReason: string
  ): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/reschedule`, {
      newDate,
      newTime,
      rescheduleReason,
    });
    return response.data;
  }

  async checkAvailability(date: string, time: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/bookings/check-availability`, {
      params: { date, time },
    });
    return response.data;
  }

  // Confirm booking and dispatch technician (superadmin only)
  async confirmAndDispatch(id: string, assignedTechnician: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/confirm-dispatch`, {
      assignedTechnician,
    });
    return response.data;
  }

  // Reassign technician (superadmin only)
  async reassignTechnician(id: string, assignedTechnician: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/reassign`, {
      assignedTechnician,
    });
    return response.data;
  }

  // Mark booking as in-progress (technician)
  async startBooking(id: string): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/start`);
    return response.data;
  }

  // Get technician assignments
  async getMyAssignments(params?: { status?: string; startDate?: string; endDate?: string }): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/my-assignments', { params });
    return response.data;
  }

  // Update technician fee status (admin/superadmin)
  async updateFeeStatus(
    id: string,
    feeStatus: 'paid' | 'waived' | 'pending',
    revertReason?: string
  ): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(`/bookings/${id}/fee-status`, {
      feeStatus,
      ...(revertReason ? { revertReason } : {}),
    });
    return response.data;
  }

  // Submit technician fee payment proof (GCash receipt)
  async submitFeeProof(id: string, file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await api.post(`/bookings/${id}/fee-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Resend technician fee receipt email (admin/superadmin)
  async resendFeeReceipt(
    id: string,
    target: 'customer' | 'technician' | 'both' = 'both'
  ): Promise<{
    success: boolean;
    target: 'customer' | 'technician' | 'both';
    results: { customer?: string; technician?: string };
  }> {
    const response = await api.post(`/bookings/${id}/resend-fee-receipt`, { target });
    return response.data;
  }

  // Check technician availability for a date/time (superadmin only)
  async checkTechnicianAvailability(date: string, time: string): Promise<{ success: boolean; data: TechnicianAvailability[] }> {
    const response = await api.get('/bookings/technician-availability', {
      params: { date, time },
    });
    return response.data;
  }
}

export default new BookingService();
