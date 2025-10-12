import api from './api';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    company?: string;
    token: string;
  };
}

export interface UserResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    company?: string;
    createdAt: string;
    updatedAt: string;
  };
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  }

  async getMe(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  }

  async updateDetails(data: Partial<RegisterData>): Promise<UserResponse> {
    const response = await api.put<UserResponse>('/auth/updatedetails', data);
    if (response.data.success) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.data.data }));
    }
    return response.data;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const response = await api.put<AuthResponse>('/auth/updatepassword', {
      currentPassword,
      newPassword,
    });
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }
}

export default new AuthService();
