import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  Activity,
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import bookingService from '../services/bookingService';
import activityLogService, { ActivityLog } from '../services/activityLogService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface DashboardOverviewProps {
  darkMode: boolean;
  onNavigate: (view: string) => void;
}

interface Booking {
  _id: string;
  date: string;
  time: string;
  company: string;
  contactName: string;
  status: string;
  isCompleted?: boolean;
}

interface LowStockProduct {
  _id: string;
  name: string;
  stockQuantity: number;
  stockStatus: string;
}

interface DashboardStats {
  todayBookings: Booking[];
  pendingBookings: Booking[];
  confirmedBookings: Booking[];
  lowStockProducts: LowStockProduct[];
  recentActivity: ActivityLog[];
  totalBookingsThisMonth: number;
  completedThisMonth: number;
}

export function DashboardOverview({ darkMode, onNavigate }: DashboardOverviewProps): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: [],
    pendingBookings: [],
    confirmedBookings: [],
    lowStockProducts: [],
    recentActivity: [],
    totalBookingsThisMonth: 0,
    completedThisMonth: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [bookingsRes, activityRes, lowStockRes] = await Promise.all([
        bookingService.getAll(),
        activityLogService.getAll({ limit: 10 }),
        axios.get(`${API_URL}/api/products/low-stock`, { headers }).catch(() => ({ data: { data: [] } })),
      ]);

      const allBookings = bookingsRes.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Get start of current month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Filter bookings
      const todayBookings = allBookings.filter((b: Booking) => {
        const bookingDate = new Date(b.date);
        return bookingDate >= today && bookingDate <= todayEnd;
      });

      const pendingBookings = allBookings.filter((b: Booking) => b.status === 'pending');
      const confirmedBookings = allBookings.filter((b: Booking) =>
        b.status === 'confirmed' && new Date(b.date) >= today
      );

      // This month stats
      const thisMonthBookings = allBookings.filter((b: Booking) => {
        const bookingDate = new Date(b.date);
        return bookingDate >= monthStart;
      });

      const completedThisMonth = thisMonthBookings.filter((b: Booking) =>
        b.isCompleted === true
      ).length;

      setStats({
        todayBookings,
        pendingBookings,
        confirmedBookings,
        lowStockProducts: lowStockRes.data?.data || [],
        recentActivity: activityRes.data || [],
        totalBookingsThisMonth: thisMonthBookings.length,
        completedThisMonth,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardData]);

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-green-500';
    if (action.includes('UPDATED') || action.includes('COMPLETED')) return 'text-blue-500';
    if (action.includes('DELETED') || action.includes('CANCELLED')) return 'text-red-500';
    return 'text-gray-500';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className={`ml-2 ${textClass}`}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${bgClass} ${borderClass} border`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Today's Bookings</p>
                <p className={`text-3xl font-bold ${textClass}`}>{stats.todayBookings.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${bgClass} ${borderClass} border`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Pending Approval</p>
                <p className={`text-3xl font-bold ${stats.pendingBookings.length > 0 ? 'text-yellow-500' : textClass}`}>
                  {stats.pendingBookings.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${bgClass} ${borderClass} border`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Low Stock Items</p>
                <p className={`text-3xl font-bold ${stats.lowStockProducts.length > 0 ? 'text-red-500' : textClass}`}>
                  {stats.lowStockProducts.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${bgClass} ${borderClass} border`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Completed (Month)</p>
                <p className={`text-3xl font-bold text-green-500`}>{stats.completedThisMonth}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className={`${bgClass} ${borderClass} border`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 text-lg ${textClass}`}>
                <Calendar className="h-5 w-5 text-blue-500" />
                Today's Schedule
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('table')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.todayBookings.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No bookings scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.todayBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                        <Clock className="h-4 w-4 text-blue-500 mx-auto" />
                        <p className={`text-sm font-medium ${textClass}`}>{booking.time}</p>
                      </div>
                      <div>
                        <p className={`font-medium ${textClass}`}>{booking.company}</p>
                        <p className={`text-sm ${mutedClass}`}>{booking.contactName}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className={`${bgClass} ${borderClass} border`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 text-lg ${textClass}`}>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Pending Actions
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('table')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.pendingBookings.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending bookings to review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div>
                      <p className={`font-medium ${textClass}`}>{booking.company}</p>
                      <p className={`text-sm ${mutedClass}`}>
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Needs Approval
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className={`${bgClass} ${borderClass} border`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 text-lg ${textClass}`}>
                <Activity className="h-5 w-5 text-purple-500" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('activityLogs')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 6).map((log) => (
                  <div key={log._id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${getActionColor(log.action).replace('text-', 'bg-')}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${textClass} truncate`}>
                        {log.details || log.action.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <p className={`text-xs ${mutedClass}`}>
                        {log.userName} • {formatTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className={`${bgClass} ${borderClass} border`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 text-lg ${textClass}`}>
                <Package className="h-5 w-5 text-red-500" />
                Low Stock Alert
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('products')}>
                Manage <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>All products are well-stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <p className={`font-medium truncate ${textClass}`}>{product.name}</p>
                    <Badge className={product.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                      {product.stockQuantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className={`${bgClass} ${borderClass} border`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${textClass}`}>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate('table')}>
              <FileText className="h-4 w-4 mr-2" />
              View Bookings
            </Button>
            <Button variant="outline" onClick={() => onNavigate('calendar')}>
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
            <Button variant="outline" onClick={() => onNavigate('analytics')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => onNavigate('users')}>
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="ghost" onClick={fetchDashboardData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardOverview;
