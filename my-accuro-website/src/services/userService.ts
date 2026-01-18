import api from './api';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  company?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  // Login activity tracking
  loginCount?: number;
  lastLoginAt?: string;
  lastLoginIP?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  company?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  company?: string;
}

// Role hierarchy and permissions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  user: { bg: 'bg-gray-100', text: 'text-gray-700' },
  admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  superadmin: { bg: 'bg-red-100', text: 'text-red-700' },
};

const userService = {
  // Get all users (Admin only)
  getAll: async (): Promise<{ success: boolean; data: User[] }> => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID (Admin only)
  getById: async (id: string): Promise<{ success: boolean; data: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user (Admin only)
  create: async (userData: CreateUserData): Promise<{ success: boolean; data: User }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Update user (Admin only)
  update: async (id: string, userData: UpdateUserData): Promise<{ success: boolean; data: User }> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Change user role (Admin/Super Admin only)
  changeRole: async (id: string, role: UserRole): Promise<{ success: boolean; data: User }> => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // Delete user (Admin only)
  delete: async (id: string): Promise<{ success: boolean; data: {} }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get user history (Admin only)
  getUserHistory: async (userId: string) => {
    const response = await api.get(`/user-history/${userId}`);
    return response.data;
  },

  // Check if current user can manage target user based on role hierarchy
  canManageUser: (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
    return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetUserRole];
  },

  // Get available roles that a user can assign based on their own role
  getAssignableRoles: (currentUserRole: UserRole): UserRole[] => {
    const roles: UserRole[] = [];
    if (ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY.user) {
      roles.push('user');
    }
    if (ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY.admin) {
      roles.push('admin');
    }
    // Only superadmin can create other superadmins
    if (currentUserRole === 'superadmin') {
      roles.push('superadmin');
    }
    return roles;
  },
};

export default userService;
