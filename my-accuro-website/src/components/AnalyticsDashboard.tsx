import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  FileText,
  Mail,
  TrendingUp,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3,
  Target,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import analyticsService from '../services/analyticsService';

interface AnalyticsDashboardProps {
  darkMode?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ darkMode = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [bookingTrends, setBookingTrends] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<any>(null);
  const [quoteData, setQuoteData] = useState<any>(null);

  const [trendPeriod, setTrendPeriod] = useState<number>(30);
  const [isSampleData, setIsSampleData] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [trendPeriod]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, trends, pending, activity, funnel, quotes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        analyticsService.getBookingTrends(trendPeriod),
        analyticsService.getPendingActions(),
        analyticsService.getRecentActivity(10),
        analyticsService.getConversionFunnel(),
        analyticsService.getQuoteAnalytics(),
      ]);

      setDashboardData(dashboard.data);
      setIsSampleData(dashboard.isSampleData || false);
      setBookingTrends(trends.data || []);
      setPendingActions(pending.data || null);
      setRecentActivity(activity.data || []);
      setConversionFunnel(funnel.data || null);
      setQuoteData(quotes.data || null);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      confirmed: darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
      completed: darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
      cancelled: darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800',
      new: darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800',
      sent: darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
      accepted: darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
    };
    return colors[status] || (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'quote':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'contact':
        return <Mail className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}>
        <div className="flex items-start">
          <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} mr-3 mt-0.5`} />
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-red-200' : 'text-red-800'} mb-2`}>Failed to Load Analytics</h3>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'} mb-4`}>{error}</p>
            <button
              onClick={fetchAllData}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Analytics Overview
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Business insights at a glance
          </p>
        </div>
        <button
          onClick={fetchAllData}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
            darkMode
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Sample Data Warning */}
      {isSampleData && (
        <div className={`${darkMode ? 'bg-yellow-900/50 border-yellow-700' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 rounded-r-lg`}>
          <div className="flex">
            <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mr-3 flex-shrink-0`} />
            <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
              <strong>Sample Data:</strong> Displaying demonstration data. Real metrics will appear once you have actual bookings.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-500 to-blue-600'} rounded-xl p-4 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Bookings</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{dashboardData.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-blue-200 opacity-60" />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-500 to-green-600'} rounded-xl p-4 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{dashboardData.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-green-200 opacity-60" />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-xl p-4 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Quote Requests</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{dashboardData.totalQuotes}</p>
              </div>
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-purple-200 opacity-60" />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gradient-to-br from-orange-600 to-orange-700' : 'bg-gradient-to-br from-orange-500 to-orange-600'} rounded-xl p-4 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-100 text-xs sm:text-sm font-medium">Contact Forms</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{dashboardData.totalContacts}</p>
              </div>
              <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-orange-200 opacity-60" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Trends Chart - Spans 2 columns */}
        <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Booking Trends
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Bookings over the last {trendPeriod} days
              </p>
            </div>
            <select
              value={trendPeriod}
              onChange={(e) => setTrendPeriod(Number(e.target.value))}
              className={`px-3 py-2 rounded-lg text-sm border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
            </select>
          </div>

          {bookingTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bookingTrends} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                  interval="preserveStartEnd"
                  label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' } }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                  allowDecimals={false}
                  label={{ value: 'Number of Bookings', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280', textAnchor: 'middle' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#f3f4f6' : '#111827',
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`flex items-center justify-center h-[250px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <p>No booking data for this period</p>
            </div>
          )}
        </div>

        {/* Pending Actions */}
        {pendingActions && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 sm:p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Pending Actions
              </h3>
            </div>

            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
                    <Clock className={`h-4 w-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unconfirmed Bookings</span>
                </div>
                <span className={`text-lg font-bold ${pendingActions.unconfirmedBookings > 0 ? (darkMode ? 'text-yellow-400' : 'text-yellow-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                  {pendingActions.unconfirmedBookings}
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                    <FileText className={`h-4 w-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pending Quotes</span>
                </div>
                <span className={`text-lg font-bold ${pendingActions.pendingQuotes > 0 ? (darkMode ? 'text-purple-400' : 'text-purple-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                  {pendingActions.pendingQuotes}
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-orange-900' : 'bg-orange-100'}`}>
                    <Mail className={`h-4 w-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unread Contacts</span>
                </div>
                <span className={`text-lg font-bold ${pendingActions.unreadContacts > 0 ? (darkMode ? 'text-orange-400' : 'text-orange-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                  {pendingActions.unreadContacts}
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-blue-900/50' : 'bg-blue-50'} border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}>
                    <Calendar className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Today's Bookings</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {pendingActions.todayBookings}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Distributions - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        {dashboardData?.statuses && dashboardData.statuses.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 sm:p-6`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Booking Status Distribution
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Breakdown by status ({dashboardData.totalBookings} total)
              </p>
            </div>

            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={dashboardData.statuses}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {dashboardData.statuses.map((entry: any, index: number) => {
                      const colors: Record<string, string> = {
                        pending: '#f59e0b',
                        confirmed: '#3b82f6',
                        completed: '#10b981',
                        cancelled: '#ef4444',
                        pending_review: '#f97316',
                        rescheduled: '#8b5cf6',
                        in_progress: '#6b7280',
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry._id] || COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: darkMode ? '#f3f4f6' : '#111827',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2">
                {dashboardData.statuses.map((item: any, index: number) => {
                  const colors: Record<string, string> = {
                    pending: 'bg-yellow-500',
                    confirmed: 'bg-blue-500',
                    completed: 'bg-green-500',
                    cancelled: 'bg-red-500',
                    pending_review: 'bg-orange-500',
                    rescheduled: 'bg-purple-500',
                    in_progress: 'bg-gray-500',
                  };
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[item._id] || 'bg-gray-500'}`} />
                        <span className={`text-sm capitalize ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item._id?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                      </div>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quotation Status Distribution */}
        {quoteData?.byStatus && quoteData.byStatus.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 sm:p-6`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Quotation Status Distribution
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Breakdown by status ({quoteData.total} total)
              </p>
            </div>

            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={quoteData.byStatus}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {quoteData.byStatus.map((entry: any, index: number) => {
                      const colors: Record<string, string> = {
                        pending: '#fbbf24',
                        sent: '#8b5cf6',
                        accepted: '#10b981',
                        approved: '#10b981',
                        rejected: '#ef4444',
                        expired: '#6b7280',
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry._id] || COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: darkMode ? '#f3f4f6' : '#111827',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2">
                {quoteData.byStatus.map((item: any, index: number) => {
                  const colors: Record<string, string> = {
                    pending: 'bg-yellow-500',
                    sent: 'bg-purple-500',
                    accepted: 'bg-green-500',
                    approved: 'bg-green-500',
                    rejected: 'bg-red-500',
                    expired: 'bg-gray-500',
                  };
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[item._id] || 'bg-gray-500'}`} />
                        <span className={`text-sm capitalize ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item._id}
                        </span>
                      </div>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Services - Centered */}
      {dashboardData?.products && dashboardData.products.length > 0 && (
        <div className="flex justify-center">
          <div className={`w-full lg:w-2/3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 sm:p-6`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Top Services
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Most requested calibration services
              </p>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboardData.products.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                  allowDecimals={false}
                  label={{ value: 'Number of Requests', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' } }}
                />
                <YAxis
                  type="category"
                  dataKey="_id"
                  width={130}
                  tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#f3f4f6' : '#111827',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Requests" radius={[0, 4, 4, 0]}>
                  {dashboardData.products.slice(0, 5).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      {conversionFunnel && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 sm:p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Target className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Conversion Funnel
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {conversionFunnel.funnel.map((stage: any, index: number) => (
              <div key={index} className="relative">
                <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stage.count}
                  </p>
                  <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stage.stage}
                  </p>
                </div>
                {index < conversionFunnel.funnel.length - 1 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-2 transform -translate-y-1/2">
                    <ArrowRight className={`h-4 w-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quote Acceptance</p>
              <p className={`text-xl font-bold ${conversionFunnel.quotes.rate > 50 ? 'text-green-500' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>
                {conversionFunnel.quotes.rate}%
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Booking Confirmation</p>
              <p className={`text-xl font-bold ${conversionFunnel.bookings.confirmationRate > 50 ? 'text-green-500' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>
                {conversionFunnel.bookings.confirmationRate}%
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Booking Completion</p>
              <p className={`text-xl font-bold ${conversionFunnel.bookings.completionRate > 50 ? 'text-green-500' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>
                {conversionFunnel.bookings.completionRate}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 sm:p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Recent Activity
            </h3>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={`${activity.type}-${activity.id}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getActivityIcon(activity.type)}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {activity.title}
                    </p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activity.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {getTimeAgo(activity.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
