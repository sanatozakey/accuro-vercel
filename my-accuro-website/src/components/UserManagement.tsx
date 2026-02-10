import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  UserCog,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  CheckSquare2,
  Square,
  ChevronLeft,
  ChevronRight,
  History,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  LogIn,
  TrendingUp,
  UserPlus,
  UserCheck,
  Activity,
  AlertTriangle,
  Crown,
  Star,
  CalendarDays,
  BarChart3,
  List,
} from 'lucide-react';
import bookingService from '../services/bookingService';
import userService, {
  User,
  UserRole,
  CreateUserData,
  UpdateUserData,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_HIERARCHY,
} from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface UserManagementProps {
  darkMode?: boolean;
}

type RoleFilter = 'all' | UserRole;

const ITEMS_PER_PAGE = 10;

type ViewTab = 'overview' | 'users';

interface UserWithBookings extends User {
  bookingCount?: number;
}

export function UserManagement({ darkMode = false }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    company: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  useEffect(() => {
    const total = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    setTotalPages(total || 1);
    if (currentPage > total) {
      setCurrentPage(1);
    }
  }, [filteredUsers, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, bookingsResponse] = await Promise.all([
        userService.getAll(),
        bookingService.getAll().catch(() => ({ data: [] })),
      ]);
      setUsers(usersResponse.data || []);
      setBookings(bookingsResponse.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Computed statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: users.length,
      newThisMonth: users.filter(u => new Date(u.createdAt) >= thisMonth).length,
      activeRecently: users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) >= sevenDaysAgo).length,
      verified: users.filter(u => u.isEmailVerified).length,
      admins: users.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
      inactive: users.filter(u => !u.lastLoginAt || new Date(u.lastLoginAt) < thirtyDaysAgo).length,
    };
  }, [users]);

  // User booking counts
  const userBookingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(booking => {
      if (booking.userId) {
        counts[booking.userId] = (counts[booking.userId] || 0) + 1;
      }
    });
    return counts;
  }, [bookings]);

  // Top users lists
  const topLists = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Most logins
    const mostLogins = [...users]
      .filter(u => (u.loginCount || 0) > 0)
      .sort((a, b) => (b.loginCount || 0) - (a.loginCount || 0))
      .slice(0, 5);

    // Most bookings
    const mostBookings = [...users]
      .map(u => ({ ...u, bookingCount: userBookingCounts[u._id] || 0 }))
      .filter(u => u.bookingCount > 0)
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    // Recently joined
    const recentlyJoined = [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Recently active
    const recentlyActive = [...users]
      .filter(u => u.lastLoginAt)
      .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
      .slice(0, 5);

    // Inactive users (no login in 30+ days)
    const inactive = [...users]
      .filter(u => !u.lastLoginAt || new Date(u.lastLoginAt) < thirtyDaysAgo)
      .sort((a, b) => {
        if (!a.lastLoginAt && !b.lastLoginAt) return 0;
        if (!a.lastLoginAt) return -1;
        if (!b.lastLoginAt) return 1;
        return new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime();
      })
      .slice(0, 5);

    // Unverified users
    const unverified = [...users]
      .filter(u => !u.isEmailVerified)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return { mostLogins, mostBookings, recentlyJoined, recentlyActive, inactive, unverified };
  }, [users, userBookingCounts]);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.company?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      phone: '',
      company: '',
    });
    setFormErrors({});
    setShowPassword(false);
    setSubmitting(false);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      company: user.company || '',
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setShowDeleteDialog(true);
  };

  const openViewDialog = (user: User) => {
    setViewingUser(user);
    setShowViewDialog(true);
  };

  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!isEdit && !formData.password) {
      errors.password = 'Password is required';
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await userService.create(formData);
      toast.success('User created successfully!');
      setShowAddDialog(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !validateForm(true)) return;

    try {
      setSubmitting(true);
      const updateData: UpdateUserData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        company: formData.company,
      };
      await userService.update(editingUser._id, updateData);
      toast.success('User updated successfully!');
      setShowEditDialog(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setSubmitting(true);
      await userService.delete(deletingUser._id);
      toast.success('User deleted successfully!');
      setShowDeleteDialog(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await userService.changeRole(userId, newRole);
      toast.success('Role updated successfully!');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((u) => u._id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role: UserRole) => {
    const colors = ROLE_COLORS[role];
    const label = ROLE_LABELS[role];
    const Icon = role === 'superadmin' ? ShieldCheck : role === 'admin' ? Shield : UserCog;

    return (
      <Badge className={`${colors.bg} ${colors.text} hover:${colors.bg} gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const canEditUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    if (currentUser._id === targetUser._id) return true;
    return ROLE_HIERARCHY[currentUser.role as UserRole] > ROLE_HIERARCHY[targetUser.role];
  };

  const canDeleteUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    if (currentUser._id === targetUser._id) return false;
    return ROLE_HIERARCHY[currentUser.role as UserRole] > ROLE_HIERARCHY[targetUser.role];
  };

  const getAssignableRoles = (): UserRole[] => {
    if (!currentUser) return [];
    return userService.getAssignableRoles(currentUser.role as UserRole);
  };

  const getRoleCount = (role: RoleFilter): number => {
    if (role === 'all') return users.length;
    return users.filter((u) => u.role === role).length;
  };

  if (loading && users.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <RefreshCw className="h-8 w-8 animate-spin mr-3" />
        <span>Loading users...</span>
      </div>
    );
  }

  const UserMiniCard = ({ user, metric, metricLabel, icon: Icon }: { user: User | UserWithBookings; metric: string | number; metricLabel: string; icon?: any }) => (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}
      onClick={() => openViewDialog(user)}
    >
      {user.profilePicture ? (
        <img src={user.profilePicture} alt={user.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{getInitials(user.name)}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.name}</p>
        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1">
          {Icon && <Icon className={`h-3.5 w-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />}
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{metric}</span>
        </div>
        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{metricLabel}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              User management
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your team members and their account permissions here.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              className={darkMode ? 'border-gray-600 text-gray-300' : ''}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={openAddDialog} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add user
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <List className="h-4 w-4 mr-2" />
            All Users
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Users</p>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.newThisMonth}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New This Month</p>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeRecently}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active (7 days)</p>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.verified}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Verified</p>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.admins}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Admins</p>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.inactive}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Inactive (30d)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top User Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Most Logins */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Most Logins</h3>
              </div>
              <div className="space-y-2">
                {topLists.mostLogins.length > 0 ? (
                  topLists.mostLogins.map((user, idx) => (
                    <UserMiniCard
                      key={user._id}
                      user={user}
                      metric={user.loginCount || 0}
                      metricLabel="logins"
                      icon={LogIn}
                    />
                  ))
                ) : (
                  <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No login data yet</p>
                )}
              </div>
            </div>

            {/* Most Bookings */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-blue-500" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Most Bookings</h3>
              </div>
              <div className="space-y-2">
                {topLists.mostBookings.length > 0 ? (
                  topLists.mostBookings.map((user) => (
                    <UserMiniCard
                      key={user._id}
                      user={user}
                      metric={(user as UserWithBookings).bookingCount || 0}
                      metricLabel="bookings"
                      icon={CalendarDays}
                    />
                  ))
                ) : (
                  <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No booking data yet</p>
                )}
              </div>
            </div>

            {/* Recently Joined */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-5 w-5 text-green-500" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recently Joined</h3>
              </div>
              <div className="space-y-2">
                {topLists.recentlyJoined.map((user) => (
                  <UserMiniCard
                    key={user._id}
                    user={user}
                    metric={getRelativeTime(user.createdAt)}
                    metricLabel="joined"
                  />
                ))}
              </div>
            </div>

            {/* Recently Active */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-purple-500" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recently Active</h3>
              </div>
              <div className="space-y-2">
                {topLists.recentlyActive.length > 0 ? (
                  topLists.recentlyActive.map((user) => (
                    <UserMiniCard
                      key={user._id}
                      user={user}
                      metric={getRelativeTime(user.lastLoginAt)}
                      metricLabel="last seen"
                    />
                  ))
                ) : (
                  <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No activity data yet</p>
                )}
              </div>
            </div>

            {/* Inactive Users */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Inactive Users</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                  30+ days
                </span>
              </div>
              <div className="space-y-2">
                {topLists.inactive.length > 0 ? (
                  topLists.inactive.map((user) => (
                    <UserMiniCard
                      key={user._id}
                      user={user}
                      metric={user.lastLoginAt ? getRelativeTime(user.lastLoginAt) : 'Never'}
                      metricLabel="last seen"
                    />
                  ))
                ) : (
                  <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>All users are active!</p>
                )}
              </div>
            </div>

            {/* Unverified Users */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-red-500" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Unverified Email</h3>
              </div>
              <div className="space-y-2">
                {topLists.unverified.length > 0 ? (
                  topLists.unverified.map((user) => (
                    <UserMiniCard
                      key={user._id}
                      user={user}
                      metric={getRelativeTime(user.createdAt)}
                      metricLabel="joined"
                    />
                  ))
                ) : (
                  <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>All users verified!</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* All Users Tab - Main Content */}
      {activeTab === 'users' && (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
        {/* Toolbar */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title with count */}
            <div className="flex items-center gap-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                All users{' '}
                <span className={`font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {filteredUsers.length}
                </span>
              </h2>

              {/* Role Filter Pills */}
              <div className="hidden md:flex gap-1">
                {(['all', 'superadmin', 'admin', 'user'] as RoleFilter[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      roleFilter === role
                        ? 'bg-blue-600 text-white'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {role === 'all' ? 'All' : ROLE_LABELS[role]} ({getRoleCount(role)})
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 lg:w-64">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 h-9 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}`}
                />
              </div>

              {/* Mobile Filter Button */}
              <div className="md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden mt-4 flex flex-wrap gap-2">
              {(['all', 'superadmin', 'admin', 'user'] as RoleFilter[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setRoleFilter(role);
                    setShowFilters(false);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    roleFilter === role
                      ? 'bg-blue-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {role === 'all' ? 'All' : ROLE_LABELS[role]} ({getRoleCount(role)})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className={`px-4 py-3 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border-b flex items-center justify-between`}>
            <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
              className={darkMode ? 'border-gray-600 text-gray-300' : ''}
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`w-full ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead>
              <tr className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className={`p-1 rounded hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-300'}`}
                  >
                    {selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0 ? (
                      <CheckSquare2 className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    ) : (
                      <Square className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                  </button>
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                  User name
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                  Access
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                  Last active
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                  Logins
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                  Date added
                </th>
                <th className={`px-4 py-3 w-12`}></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} ${
                      selectedUsers.has(user._id) ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleSelectUser(user._id)}
                        className={`p-1 rounded hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-300'}`}
                      >
                        {selectedUsers.has(user._id) ? (
                          <CheckSquare2 className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        ) : (
                          <Square className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">{getInitials(user.name)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <button
                            onClick={() => openViewDialog(user)}
                            className={`font-medium hover:underline ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
                          >
                            {user.name}
                          </button>
                          <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getRoleBadge(user.role)}
                        {user.isEmailVerified && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getRelativeTime(user.lastLoginAt)}
                    </td>
                    <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-1.5">
                        <LogIn className="h-3.5 w-3.5" />
                        <span>{user.loginCount ?? 0}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                          <DropdownMenuItem onClick={() => openViewDialog(user)} className={darkMode ? 'text-gray-200 focus:bg-gray-700' : ''}>
                            <Users className="h-4 w-4 mr-2" />
                            View profile
                          </DropdownMenuItem>
                          {canEditUser(user) && (
                            <DropdownMenuItem onClick={() => openEditDialog(user)} className={darkMode ? 'text-gray-200 focus:bg-gray-700' : ''}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit user
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className={darkMode ? 'bg-gray-700' : ''} />
                          {canDeleteUser(user) && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete user
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={`px-6 py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Users className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className="text-lg font-medium mb-1">No users found</p>
                    <p className="text-sm">
                      {searchQuery || roleFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Add your first user to get started'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-4 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={darkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 ${currentPage !== pageNum && darkMode ? 'border-gray-600 text-gray-300' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={darkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className={`max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>Add New User</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              Create a new user account with specified access level.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label htmlFor="name" className={darkMode ? 'text-gray-200' : ''}>
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className={`mt-1 ${formErrors.name ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
              {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email" className={darkMode ? 'text-gray-200' : ''}>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className={`mt-1 ${formErrors.email ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
              {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password" className={darkMode ? 'text-gray-200' : ''}>
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className={`pr-10 ${formErrors.password ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role" className={darkMode ? 'text-gray-200' : ''}>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                    {getAssignableRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone" className={darkMode ? 'text-gray-200' : ''}>Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+63 912 345 6789"
                  className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company" className={darkMode ? 'text-gray-200' : ''}>Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company name"
                className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                disabled={submitting}
                className={darkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={`max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>Edit User</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              Update user information and access level.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className={darkMode ? 'text-gray-200' : ''}>
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 ${formErrors.name ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
              {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <Label htmlFor="edit-email" className={darkMode ? 'text-gray-200' : ''}>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`mt-1 ${formErrors.email ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
              {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role" className={darkMode ? 'text-gray-200' : ''}>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  disabled={editingUser?._id === currentUser?._id}
                >
                  <SelectTrigger className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                    {getAssignableRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingUser?._id === currentUser?._id && (
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    You cannot change your own role
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-phone" className={darkMode ? 'text-gray-200' : ''}>Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-company" className={darkMode ? 'text-gray-200' : ''}>Company</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingUser(null);
                  resetForm();
                }}
                disabled={submitting}
                className={darkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>Delete User</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              Are you sure you want to delete "{deletingUser?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingUser(null);
              }}
              disabled={submitting}
              className={darkMode ? 'border-gray-600 text-gray-300' : ''}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className={`max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>User Profile</DialogTitle>
          </DialogHeader>

          {viewingUser && (
            <div className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                {viewingUser.profilePicture ? (
                  <img
                    src={viewingUser.profilePicture}
                    alt={viewingUser.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{getInitials(viewingUser.name)}</span>
                  </div>
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {viewingUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(viewingUser.role)}
                    {viewingUser.isEmailVerified && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className={`space-y-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Mail className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{viewingUser.email}</span>
                </div>
                {viewingUser.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{viewingUser.phone}</span>
                  </div>
                )}
                {viewingUser.company && (
                  <div className="flex items-center gap-3">
                    <Building className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{viewingUser.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                    Joined {formatDate(viewingUser.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                    Last active: {getRelativeTime(viewingUser.lastLoginAt)}
                  </span>
                </div>
                {viewingUser.loginCount !== undefined && (
                  <div className="flex items-center gap-3">
                    <History className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                      {viewingUser.loginCount} total logins
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  Close
                </Button>
                {canEditUser(viewingUser) && (
                  <Button
                    onClick={() => {
                      setShowViewDialog(false);
                      openEditDialog(viewingUser);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;
