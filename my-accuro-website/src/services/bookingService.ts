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
}

export interface Booking extends BookingData {
  _id: string;
  userId?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  conclusion?: string;
  rescheduleReason?: string;
  originalDate?: string;
  originalTime?: string;
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
}

export default new BookingService();
