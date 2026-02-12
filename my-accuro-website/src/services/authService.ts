import api from './api';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  profilePicture?: string;
}

export interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AuthResponse {
  success: boolean;
  requiresTwoFactor?: boolean;
  message?: string;
  data?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    company?: string;
    profilePicture?: string;
    isEmailVerified?: boolean;
    twoFactorEnabled?: boolean;
    token: string;
    refreshToken?: string;
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
    profilePicture?: string;
    isEmailVerified?: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Session {
  _id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SessionsResponse {
  success: boolean;
  data: Session[];
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);

    // If 2FA is required, return without storing tokens
    if (response.data.success && response.data.requiresTwoFactor) {
      return response.data;
    }

    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
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

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      // Invalidate refresh token on backend
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Intentionally silent - user is being redirected to login anyway
      console.error('Error during logout:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.error('Error during logout all:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  async getSessions(): Promise<SessionsResponse> {
    const response = await api.get<SessionsResponse>('/auth/sessions');
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/auth/sessions/${sessionId}`);
    return response.data;
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await api.post<{ success: boolean; data: { token: string } }>('/auth/refresh-token', {
        refreshToken,
      });
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        return response.data.data.token;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'superadmin');
  }
}

export default new AuthService();
