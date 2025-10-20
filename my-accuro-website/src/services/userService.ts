import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  phone?: string;
  company?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const userService = {
  // Get all users (Admin only)
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID (Admin only)
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user (Admin only)
  update: async (id: string, userData: Partial<User>) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Change user role (Admin/Super Admin only)
  changeRole: async (id: string, role: 'user' | 'admin' | 'superadmin') => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // Delete user (Admin only)
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get user history (Admin only)
  getUserHistory: async (userId: string) => {
    const response = await api.get(`/user-history/${userId}`);
    return response.data;
  },
};

export default userService;
