import React, { memo } from 'react';
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
import { ActivityLog } from '../services/activityLogService';
import { useDashboardData } from '../hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';

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

const StatCard = memo(function StatCard({ label, value, valueClass, icon, iconBg, bgClass, borderClass, mutedClass }: {
  label: string; value: number; valueClass: string; icon: React.ReactNode; iconBg: string; bgClass: string; borderClass: string; mutedClass: string;
}) {
  return (
    <Card className={`${bgClass} ${borderClass} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${mutedClass}`}>{label}</p>
            <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export function DashboardOverview({ darkMode, onNavigate }: DashboardOverviewProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: loading } = useDashboardData();

  const defaultStats = {
    todayBookings: [],
    pendingBookings: [],
    confirmedBookings: [],
    lowStockProducts: [],
    recentActivity: [],
    totalBookingsThisMonth: 0,
    completedThisMonth: 0,
  };

  const s = stats || defaultStats;

  const fetchDashboardData = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
  };

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
        <StatCard label="Today's Bookings" value={s.todayBookings.length} valueClass={textClass} icon={<Calendar className="h-6 w-6 text-blue-600" />} iconBg="bg-blue-100" bgClass={bgClass} borderClass={borderClass} mutedClass={mutedClass} />
        <StatCard label="Pending Approval" value={s.pendingBookings.length} valueClass={s.pendingBookings.length > 0 ? 'text-yellow-500' : textClass} icon={<Clock className="h-6 w-6 text-yellow-600" />} iconBg="bg-yellow-100" bgClass={bgClass} borderClass={borderClass} mutedClass={mutedClass} />
        <StatCard label="Low Stock Items" value={s.lowStockProducts.length} valueClass={s.lowStockProducts.length > 0 ? 'text-red-500' : textClass} icon={<Package className="h-6 w-6 text-red-600" />} iconBg="bg-red-100" bgClass={bgClass} borderClass={borderClass} mutedClass={mutedClass} />
        <StatCard label="Completed (Month)" value={s.completedThisMonth} valueClass="text-green-500" icon={<CheckCircle className="h-6 w-6 text-green-600" />} iconBg="bg-green-100" bgClass={bgClass} borderClass={borderClass} mutedClass={mutedClass} />
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
            {s.todayBookings.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No bookings scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {s.todayBookings.slice(0, 5).map((booking) => (
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
            {s.pendingBookings.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending bookings to review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {s.pendingBookings.slice(0, 5).map((booking) => (
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
            {s.recentActivity.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {s.recentActivity.slice(0, 6).map((log) => (
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
            {s.lowStockProducts.length === 0 ? (
              <div className={`text-center py-8 ${mutedClass}`}>
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>All products are well-stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {s.lowStockProducts.slice(0, 5).map((product) => (
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
