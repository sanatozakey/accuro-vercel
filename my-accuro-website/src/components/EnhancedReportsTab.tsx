import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Loader,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  CalendarDays,
  MessageSquare,
  FileQuestion,
  Activity,
  BarChart3,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import bookingService from '../services/bookingService';
import userService from '../services/userService';
import quoteService from '../services/quoteService';
import activityLogService from '../services/activityLogService';
import analyticsService from '../services/analyticsService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EnhancedReportsTabProps {
  darkMode?: boolean;
}

type ReportType =
  | 'bookings'
  | 'users'
  | 'quotes'
  | 'contacts'
  | 'activityLogs'
  | 'dashboardSummary';

type DateRangePreset = 'today' | 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'lastYear' | 'custom';

interface KPIData {
  totalBookings: number;
  totalUsers: number;
  totalQuotes: number;
  totalContacts: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingQuotes: number;
  unreadContacts: number;
  bookingsTrend: number;
  usersTrend: number;
}

interface TrendData {
  date: string;
  bookings: number;
  quotes: number;
  contacts: number;
}


const ACCURO_LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMkQ3MkIyIj5BQ0NVUk88L3RleHQ+PC9zdmc+';

export function EnhancedReportsTab({ darkMode = false }: EnhancedReportsTabProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'generate'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Report generation state
  const [reportType, setReportType] = useState<ReportType>('bookings');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const cardBgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError('');

      // Fetch all data in parallel
      const [bookingsRes, usersRes, activityRes, dashboardRes, pendingRes] = await Promise.all([
        bookingService.getAll(),
        userService.getAll(),
        activityLogService.getAllActivityLogs({ limit: 10 }).catch(() => ({ data: [] })),
        analyticsService.getDashboardAnalytics().catch(() => ({ data: { totalQuotes: 0, totalContacts: 0 } })),
        analyticsService.getPendingActions().catch(() => ({ data: { pendingQuotes: 0, unreadContacts: 0 } })),
      ]);

      const bookings = bookingsRes.data || [];
      const users = usersRes.data || [];
      const activity = activityRes.data || [];
      const dashboardData = dashboardRes?.data || { totalQuotes: 0, totalContacts: 0 };
      const pendingData = pendingRes?.data || { pendingQuotes: 0, unreadContacts: 0 };

      // Calculate KPIs
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentBookings = bookings.filter((b: any) => new Date(b.createdAt) >= thirtyDaysAgo);
      const previousBookings = bookings.filter(
        (b: any) => new Date(b.createdAt) >= sixtyDaysAgo && new Date(b.createdAt) < thirtyDaysAgo
      );

      const recentUsers = users.filter((u: any) => new Date(u.createdAt) >= thirtyDaysAgo);
      const previousUsers = users.filter(
        (u: any) => new Date(u.createdAt) >= sixtyDaysAgo && new Date(u.createdAt) < thirtyDaysAgo
      );

      const bookingsTrend = previousBookings.length > 0
        ? ((recentBookings.length - previousBookings.length) / previousBookings.length) * 100
        : recentBookings.length > 0 ? 100 : 0;

      const usersTrend = previousUsers.length > 0
        ? ((recentUsers.length - previousUsers.length) / previousUsers.length) * 100
        : recentUsers.length > 0 ? 100 : 0;

      setKpiData({
        totalBookings: bookings.length,
        totalUsers: users.length,
        totalQuotes: dashboardData.totalQuotes || 0,
        totalContacts: dashboardData.totalContacts || 0,
        pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
        confirmedBookings: bookings.filter((b: any) => b.status === 'confirmed').length,
        completedBookings: bookings.filter((b: any) => b.status === 'completed' || b.isCompleted).length,
        cancelledBookings: bookings.filter((b: any) => b.status === 'cancelled').length,
        pendingQuotes: pendingData.pendingQuotes || 0,
        unreadContacts: pendingData.unreadContacts || 0,
        bookingsTrend,
        usersTrend,
      });

      // Generate trend data for last 7 days (bookings only since we don't have quote/contact arrays)
      const trends: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayStart = new Date(dateStr);
        const dayEnd = new Date(dateStr);
        dayEnd.setDate(dayEnd.getDate() + 1);

        trends.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          bookings: bookings.filter((b: any) => {
            const d = new Date(b.createdAt);
            return d >= dayStart && d < dayEnd;
          }).length,
          quotes: 0,
          contacts: 0,
        });
      }
      setTrendData(trends);

      setRecentActivity(activity.slice(0, 5));
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setFetchError(err.response?.data?.message || 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Date range calculation
  const calculateDateRange = (preset: DateRangePreset): { start: string; end: string } => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = '';

    switch (preset) {
      case 'today':
        start = end;
        break;
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        start = last7.toISOString().split('T')[0];
        break;
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        start = last30.toISOString().split('T')[0];
        break;
      case 'last3months':
        const last3m = new Date(today);
        last3m.setMonth(today.getMonth() - 3);
        start = last3m.toISOString().split('T')[0];
        break;
      case 'last6months':
        const last6m = new Date(today);
        last6m.setMonth(today.getMonth() - 6);
        start = last6m.toISOString().split('T')[0];
        break;
      case 'lastYear':
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);
        start = lastYear.toISOString().split('T')[0];
        break;
      case 'custom':
        return { start: startDate, end: endDate };
    }

    return { start, end };
  };

  useEffect(() => {
    if (datePreset !== 'custom') {
      const range = calculateDateRange(datePreset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, [datePreset]);

  useEffect(() => {
    const range = calculateDateRange('last30days');
    setStartDate(range.start);
    setEndDate(range.end);
  }, []);

  // Generate report
  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      let data: any[] = [];
      let summary: any = { totalRecords: 0 };

      switch (reportType) {
        case 'bookings':
          const bookingsResponse = await bookingService.getAll({ startDate, endDate });
          data = bookingsResponse.data;
          summary = {
            totalRecords: data.length,
            pending: data.filter((b: any) => b.status === 'pending').length,
            confirmed: data.filter((b: any) => b.status === 'confirmed').length,
            completed: data.filter((b: any) => b.status === 'completed').length,
            cancelled: data.filter((b: any) => b.status === 'cancelled').length,
          };
          break;

        case 'users':
          const usersResponse = await userService.getAll();
          data = usersResponse.data;
          summary = {
            totalRecords: data.length,
            admins: data.filter((u: any) => u.role === 'admin' || u.role === 'superadmin').length,
            users: data.filter((u: any) => u.role === 'user').length,
          };
          break;

        case 'quotes':
          const quotesResponse = await quoteService.getAll();
          data = quotesResponse.data || [];
          summary = {
            totalRecords: data.length,
            pending: data.filter((q: any) => q.status === 'pending').length,
            sent: data.filter((q: any) => q.status === 'sent').length,
          };
          break;

        case 'contacts':
          // Contact list endpoint not available - use analytics data instead
          const contactAnalytics = await analyticsService.getContactAnalytics({ startDate, endDate }).catch(() => null);
          data = [];
          summary = {
            totalRecords: contactAnalytics?.totalContacts || 0,
            note: 'Detailed contact list not available',
          };
          break;

        case 'activityLogs':
          const activityLogsResponse = await activityLogService.getAllActivityLogs({ limit: 1000 });
          data = activityLogsResponse.data || [];
          data = data.filter((log: any) => {
            const logDate = new Date(log.createdAt);
            return logDate >= new Date(startDate) && logDate <= new Date(endDate);
          });
          summary = {
            totalRecords: data.length,
            userActions: data.filter((l: any) => l.resourceType === 'user').length,
            bookingActions: data.filter((l: any) => l.resourceType === 'booking').length,
            reviewActions: data.filter((l: any) => l.resourceType === 'review').length,
          };
          break;

        case 'dashboardSummary':
          const dashboardResponse = await analyticsService.getDashboardAnalytics({ startDate, endDate });
          const dashSummary = dashboardResponse?.data || dashboardResponse || {};
          data = [dashSummary];
          summary = {
            totalBookings: dashSummary.totalBookings || 0,
            totalUsers: dashSummary.totalUsers || 0,
            totalQuotes: dashSummary.totalQuotes || 0,
            totalContacts: dashSummary.totalContacts || 0,
          };
          break;
      }

      const titleMap: Record<ReportType, string> = {
        bookings: 'Bookings Report',
        users: 'Users Report',
        quotes: 'Quotes Report',
        contacts: 'Contacts Report',
        activityLogs: 'Activity Logs Report',
        dashboardSummary: 'Dashboard Summary Report',
      };

      setPreviewPage(1);
      setReportData({
        type: reportType,
        title: titleMap[reportType],
        dateRange: { start: startDate, end: endDate },
        data,
        summary,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // Report preview pagination
  const PREVIEW_PER_PAGE = 20;
  const [previewPage, setPreviewPage] = useState(1);

  const getTableConfig = (data: any) => {
    if (!data) return { headers: [] as string[], getRow: (_item: any) => [] as string[] };
    switch (data.type) {
      case 'bookings':
        return {
          headers: ['#', 'Date', 'Company', 'Contact', 'Product', 'Status'],
          getRow: (item: any, i: number) => [String(i + 1), new Date(item.date).toLocaleDateString(), item.company, item.contactName, item.product, item.status],
        };
      case 'users':
        return {
          headers: ['#', 'Date Joined', 'Name', 'Email', 'Role'],
          getRow: (item: any, i: number) => [String(i + 1), new Date(item.createdAt).toLocaleDateString(), item.name, item.email, item.role],
        };
      case 'quotes':
        return {
          headers: ['#', 'Date', 'Name', 'Email', 'Status'],
          getRow: (item: any, i: number) => [String(i + 1), new Date(item.createdAt).toLocaleDateString(), item.userId?.name || 'N/A', item.userId?.email || 'N/A', item.status],
        };
      case 'contacts':
        return {
          headers: ['#', 'Date', 'Name', 'Email', 'Subject', 'Status'],
          getRow: (item: any, i: number) => [String(i + 1), new Date(item.createdAt).toLocaleDateString(), `${item.firstName} ${item.lastName}`, item.email, item.subject, item.status],
        };
      case 'activityLogs':
        return {
          headers: ['#', 'Date', 'User', 'Action', 'Resource', 'Details'],
          getRow: (item: any, i: number) => [String(i + 1), new Date(item.createdAt).toLocaleDateString(), item.userName, item.action, item.resourceType, item.details || 'N/A'],
        };
      default:
        return { headers: ['#'], getRow: (_item: any, _i: number) => [''] };
    }
  };

  // Download PDF
  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    try {
      doc.addImage(ACCURO_LOGO_BASE64, 'SVG', 14, 10, 40, 16);
    } catch (e) {
      doc.setFontSize(16);
      doc.setTextColor(45, 114, 178);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCURO', 14, 20);
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Instrumentation & Calibration Solutions', 14, 30);

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, pageWidth / 2, 45, { align: 'center' });

    // Metadata
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      pageWidth / 2,
      52,
      { align: 'center' }
    );
    doc.text(
      `Period: ${new Date(reportData.dateRange.start).toLocaleDateString()} - ${new Date(reportData.dateRange.end).toLocaleDateString()}`,
      pageWidth / 2,
      58,
      { align: 'center' }
    );

    // Divider
    doc.setDrawColor(45, 114, 178);
    doc.setLineWidth(0.5);
    doc.line(14, 63, pageWidth - 14, 63);

    // Record count
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Records: ${reportData.data.length}`, 14, 72);

    let yPos = 80;

    // Data table
    const tableConfig = getTableConfig(reportData);

    autoTable(doc, {
      head: [tableConfig.headers],
      body: reportData.data.map((item: any, i: number) => tableConfig.getRow(item, i)),
      startY: yPos,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [45, 114, 178], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(45, 114, 178);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Accuro - Instrumentation & Calibration Solutions', 14, pageHeight - 13);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 13, { align: 'right' });
    }

    doc.save(`Accuro-${reportData.type}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className={`${bgClass} rounded-lg shadow-md p-8`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className={textClass}>Loading reports dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className={`${bgClass} rounded-lg shadow-md p-2`}>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'bg-blue-600' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics Overview
          </Button>
          <Button
            variant={activeTab === 'generate' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('generate')}
            className={activeTab === 'generate' ? 'bg-blue-600' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Reports
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {fetchError && (
            <Card className={`${bgClass} border border-red-300 dark:border-red-700`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Failed to load analytics</p>
                    <p className="text-sm">{fetchError}</p>
                  </div>
                  <Button variant="outline" onClick={handleRefresh} className="ml-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!fetchError && !kpiData && (
            <Card className={`${bgClass} border ${borderClass}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <AlertCircle className={`h-6 w-6 ${mutedClass}`} />
                  <p className={mutedClass}>No analytics data available. Click refresh to try again.</p>
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {kpiData && (
          <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${bgClass} border ${borderClass}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${mutedClass}`}>Total Bookings</p>
                    <p className={`text-2xl font-bold ${textClass}`}>{kpiData.totalBookings}</p>
                    <div className="flex items-center mt-1">
                      {kpiData.bookingsTrend >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs ${kpiData.bookingsTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(kpiData.bookingsTrend).toFixed(1)}% vs last month
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${bgClass} border ${borderClass}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${mutedClass}`}>Total Users</p>
                    <p className={`text-2xl font-bold ${textClass}`}>{kpiData.totalUsers}</p>
                    <div className="flex items-center mt-1">
                      {kpiData.usersTrend >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs ${kpiData.usersTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(kpiData.usersTrend).toFixed(1)}% vs last month
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${bgClass} border ${borderClass}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${mutedClass}`}>Quote Requests</p>
                    <p className={`text-2xl font-bold ${textClass}`}>{kpiData.totalQuotes}</p>
                    <p className={`text-xs ${mutedClass} mt-1`}>{kpiData.pendingQuotes} pending</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <FileQuestion className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${bgClass} border ${borderClass}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${mutedClass}`}>Contact Messages</p>
                    <p className={`text-2xl font-bold ${textClass}`}>{kpiData.totalContacts}</p>
                    <p className={`text-xs ${mutedClass} mt-1`}>{kpiData.unreadContacts} unread</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart - Bar chart for discrete daily counts */}
            <Card className={`${bgClass} border ${borderClass}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${textClass}`}>7-Day Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#6B7280' }}
                        label={{ value: 'Day', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' } }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#6B7280' }}
                        allowDecimals={false}
                        label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280', textAnchor: 'middle' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="quotes" fill="#8B5CF6" name="Quotes" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="contacts" fill="#F59E0B" name="Contacts" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Pending Actions */}
          <Card className={`${bgClass} border ${borderClass}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${textClass}`}>Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${borderClass} ${kpiData.pendingBookings > 0 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`h-5 w-5 ${kpiData.pendingBookings > 0 ? 'text-yellow-500' : mutedClass}`} />
                    <div>
                      <p className={`font-medium ${textClass}`}>{kpiData.pendingBookings} Pending Bookings</p>
                      <p className={`text-sm ${mutedClass}`}>Awaiting confirmation</p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${borderClass} ${kpiData.pendingQuotes > 0 ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <FileQuestion className={`h-5 w-5 ${kpiData.pendingQuotes > 0 ? 'text-purple-500' : mutedClass}`} />
                    <div>
                      <p className={`font-medium ${textClass}`}>{kpiData.pendingQuotes} Pending Quotes</p>
                      <p className={`text-sm ${mutedClass}`}>Need response</p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${borderClass} ${kpiData.unreadContacts > 0 ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <MessageSquare className={`h-5 w-5 ${kpiData.unreadContacts > 0 ? 'text-orange-500' : mutedClass}`} />
                    <div>
                      <p className={`font-medium ${textClass}`}>{kpiData.unreadContacts} Unread Messages</p>
                      <p className={`text-sm ${mutedClass}`}>Require attention</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card className={`${bgClass} border ${borderClass}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${textClass}`}>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${cardBgClass}`}>
                      <Activity className={`h-4 w-4 ${mutedClass}`} />
                      <div className="flex-1">
                        <p className={`text-sm ${textClass}`}>
                          <span className="font-medium">{activity.userName}</span> {activity.action}
                        </p>
                        <p className={`text-xs ${mutedClass}`}>
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {activity.resourceType}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </>
      )}

      {activeTab === 'generate' && (
        <>
          {/* Report Generator */}
          <Card className={`${bgClass} border ${borderClass}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                <FileText className="h-5 w-5 text-blue-600" />
                Generate Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-2`}>Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className={`w-full px-3 py-2 border ${borderClass} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'} rounded-md focus:ring-2 focus:ring-blue-500`}
                >
                  <optgroup label="Core Reports">
                    <option value="bookings">Bookings Report</option>
                    <option value="users">Users Report</option>
                    <option value="quotes">Quotes Report</option>
                    <option value="contacts">Contacts Report</option>
                  </optgroup>
                  <optgroup label="Activity Reports">
                    <option value="activityLogs">Activity Logs Report</option>
                  </optgroup>
                  <optgroup label="Summary Reports">
                    <option value="dashboardSummary">Dashboard Summary Report</option>
                  </optgroup>
                </select>
              </div>

              {/* Date Presets */}
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-2`}>
                  <Clock className="inline-block h-4 w-4 mr-1" />
                  Quick Date Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'today', label: 'Today' },
                    { value: 'last7days', label: '7 Days' },
                    { value: 'last30days', label: '30 Days' },
                    { value: 'last3months', label: '3 Months' },
                    { value: 'last6months', label: '6 Months' },
                    { value: 'lastYear', label: '1 Year' },
                    { value: 'custom', label: 'Custom' },
                  ].map((preset) => (
                    <Button
                      key={preset.value}
                      variant={datePreset === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDatePreset(preset.value as DateRangePreset)}
                      className={datePreset === preset.value ? 'bg-blue-600' : ''}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-2`}>
                    <Calendar className="inline-block h-4 w-4 mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className={`w-full px-3 py-2 border ${borderClass} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'} rounded-md focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-2`}>
                    <Calendar className="inline-block h-4 w-4 mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className={`w-full px-3 py-2 border ${borderClass} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'} rounded-md focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <Button onClick={generateReport} disabled={generating} className="bg-blue-600 hover:bg-blue-700">
                {generating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Preview - styled like a formal report document */}
          {reportData && (() => {
            const config = getTableConfig(reportData);
            const totalPages = Math.ceil(reportData.data.length / PREVIEW_PER_PAGE);
            const paginatedData = reportData.data.slice(
              (previewPage - 1) * PREVIEW_PER_PAGE,
              previewPage * PREVIEW_PER_PAGE
            );
            const startIndex = (previewPage - 1) * PREVIEW_PER_PAGE;

            return (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${borderClass} overflow-hidden`}>
                {/* Report Header */}
                <div className={`${darkMode ? 'bg-gray-900' : 'bg-slate-50'} px-8 py-6 border-b ${borderClass}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase">Accuro</p>
                      <p className={`text-xs ${mutedClass}`}>Instrumentation & Calibration Solutions</p>
                    </div>
                    <Button onClick={downloadPDF} variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                  <div className="mt-6">
                    <h2 className={`text-2xl font-bold ${textClass}`}>{reportData.title}</h2>
                    <div className={`flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm ${mutedClass}`}>
                      <span>Period: {new Date(reportData.dateRange.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &ndash; {new Date(reportData.dateRange.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span>Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>Total Records: <strong className={textClass}>{reportData.data.length}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="px-8 py-6">
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      <thead>
                        <tr>
                          {config.headers.map(h => (
                            <th key={h} className={`px-4 py-3 text-left text-xs font-semibold ${mutedClass} uppercase tracking-wider ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {paginatedData.map((item: any, idx: number) => {
                          const rowIndex = startIndex + idx;
                          const cells = config.getRow(item, rowIndex);
                          return (
                            <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? '' : (darkMode ? 'bg-gray-750' : 'bg-slate-50/50')} hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50/30'} transition-colors`}>
                              {cells.map((cell, ci) => {
                                const isStatus = config.headers[ci] === 'Status';
                                const isNum = config.headers[ci] === '#';
                                return (
                                  <td key={ci} className={`px-4 py-3 text-sm ${isNum ? mutedClass : textClass} ${isNum ? 'w-12' : ''}`}>
                                    {isStatus ? (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                        cell === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                        cell === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                        cell === 'pending' || cell === 'pending_review' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                        cell === 'cancelled' || cell === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                        cell === 'approved' || cell === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                      }`}>
                                        {cell.replace(/_/g, ' ')}
                                      </span>
                                    ) : cell}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between mt-6 pt-4 border-t ${borderClass}`}>
                      <p className={`text-sm ${mutedClass}`}>
                        Showing {startIndex + 1}&ndash;{Math.min(startIndex + PREVIEW_PER_PAGE, reportData.data.length)} of {reportData.data.length} records
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={previewPage <= 1}
                          onClick={() => setPreviewPage(p => p - 1)}
                        >
                          Previous
                        </Button>
                        <span className={`text-sm ${mutedClass}`}>Page {previewPage} of {totalPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={previewPage >= totalPages}
                          onClick={() => setPreviewPage(p => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Footer */}
                <div className={`px-8 py-4 border-t ${borderClass} ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
                  <p className={`text-xs ${mutedClass} text-center`}>
                    Accuro &mdash; Instrumentation & Calibration Solutions &bull; Confidential Report
                  </p>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

export default EnhancedReportsTab;
