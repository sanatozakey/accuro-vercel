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
  PieChart as PieChartIcon,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import bookingService from '../services/bookingService';
import userService from '../services/userService';
import quoteService from '../services/quoteService';
import contactService from '../services/contactService';
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const ACCURO_LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMkQ3MkIyIj5BQ0NVUk88L3RleHQ+PC9zdmc+';

export function EnhancedReportsTab({ darkMode = false }: EnhancedReportsTabProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'generate'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [bookingStatusData, setBookingStatusData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Report generation state
  const [reportType, setReportType] = useState<ReportType>('bookings');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState('');

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const cardBgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [bookingsRes, usersRes, quotesRes, contactsRes, activityRes] = await Promise.all([
        bookingService.getAll(),
        userService.getAll(),
        quoteService.getAll().catch(() => ({ data: [] })),
        contactService.getAll().catch(() => ({ data: [] })),
        activityLogService.getAllActivityLogs({ limit: 10 }).catch(() => ({ data: [] })),
      ]);

      const bookings = bookingsRes.data || [];
      const users = usersRes.data || [];
      const quotes = quotesRes.data || [];
      const contacts = contactsRes.data || [];
      const activity = activityRes.data || [];

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
        totalQuotes: quotes.length,
        totalContacts: contacts.length,
        pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
        confirmedBookings: bookings.filter((b: any) => b.status === 'confirmed').length,
        completedBookings: bookings.filter((b: any) => b.status === 'completed' || b.isCompleted).length,
        cancelledBookings: bookings.filter((b: any) => b.status === 'cancelled').length,
        pendingQuotes: quotes.filter((q: any) => q.status === 'pending').length,
        unreadContacts: contacts.filter((c: any) => c.status === 'pending' || !c.isRead).length,
        bookingsTrend,
        usersTrend,
      });

      // Booking status distribution
      setBookingStatusData([
        { name: 'Pending', value: bookings.filter((b: any) => b.status === 'pending').length, color: '#F59E0B' },
        { name: 'Confirmed', value: bookings.filter((b: any) => b.status === 'confirmed').length, color: '#3B82F6' },
        { name: 'Completed', value: bookings.filter((b: any) => b.status === 'completed' || b.isCompleted).length, color: '#10B981' },
        { name: 'Cancelled', value: bookings.filter((b: any) => b.status === 'cancelled').length, color: '#EF4444' },
      ]);

      // Generate trend data for last 7 days
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
          quotes: quotes.filter((q: any) => {
            const d = new Date(q.createdAt);
            return d >= dayStart && d < dayEnd;
          }).length,
          contacts: contacts.filter((c: any) => {
            const d = new Date(c.createdAt);
            return d >= dayStart && d < dayEnd;
          }).length,
        });
      }
      setTrendData(trends);

      setRecentActivity(activity.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
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
            admins: data.filter((u: any) => u.role === 'admin').length,
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
          const contactsResponse = await contactService.getAll();
          data = contactsResponse.data || [];
          summary = {
            totalRecords: data.length,
            pending: data.filter((c: any) => c.status === 'pending').length,
            responded: data.filter((c: any) => c.status === 'responded').length,
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
          data = [dashboardResponse];
          summary = {
            totalBookings: dashboardResponse.totalBookings || 0,
            totalUsers: dashboardResponse.totalUsers || 0,
            totalQuotes: dashboardResponse.totalQuotes || 0,
            totalContacts: dashboardResponse.totalContacts || 0,
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

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(45, 114, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, 72);

    let yPos = 80;
    const summaryEntries = Object.entries(reportData.summary);
    const cardWidth = (pageWidth - 28 - 15) / 4;
    const cardHeight = 20;
    let xPos = 14;

    summaryEntries.forEach(([key, value], index) => {
      if (index > 0 && index % 4 === 0) {
        yPos += cardHeight + 5;
        xPos = 14;
      }

      doc.setFillColor(240, 247, 255);
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 2, 2, 'F');

      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      doc.text(label.charAt(0).toUpperCase() + label.slice(1), xPos + cardWidth / 2, yPos + 7, { align: 'center' });

      doc.setTextColor(45, 114, 178);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(String(value), xPos + cardWidth / 2, yPos + 15, { align: 'center' });

      xPos += cardWidth + 5;
    });

    // Data table
    yPos = Math.max(yPos + cardHeight + 15, 110);
    doc.setFontSize(12);
    doc.setTextColor(45, 114, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Data', 14, yPos);
    yPos += 8;

    const getTableData = () => {
      switch (reportData.type) {
        case 'bookings':
          return {
            headers: ['Date', 'Company', 'Contact', 'Product', 'Status'],
            body: reportData.data.map((item: any) => [
              new Date(item.date).toLocaleDateString(),
              item.company,
              item.contactName,
              item.product,
              item.status,
            ]),
          };
        case 'users':
          return {
            headers: ['Joined', 'Name', 'Email', 'Role'],
            body: reportData.data.map((item: any) => [
              new Date(item.createdAt).toLocaleDateString(),
              item.name,
              item.email,
              item.role,
            ]),
          };
        case 'quotes':
          return {
            headers: ['Date', 'Name', 'Email', 'Status'],
            body: reportData.data.map((item: any) => [
              new Date(item.createdAt).toLocaleDateString(),
              item.userId?.name || 'N/A',
              item.userId?.email || 'N/A',
              item.status,
            ]),
          };
        case 'contacts':
          return {
            headers: ['Date', 'Name', 'Email', 'Subject', 'Status'],
            body: reportData.data.map((item: any) => [
              new Date(item.createdAt).toLocaleDateString(),
              `${item.firstName} ${item.lastName}`,
              item.email,
              item.subject,
              item.status,
            ]),
          };
        case 'activityLogs':
          return {
            headers: ['Date', 'User', 'Action', 'Resource', 'Details'],
            body: reportData.data.map((item: any) => [
              new Date(item.createdAt).toLocaleDateString(),
              item.userName,
              item.action,
              item.resourceType,
              item.details || 'N/A',
            ]),
          };
        default:
          return { headers: ['Metric', 'Value'], body: [] };
      }
    };

    const tableConfig = getTableData();

    autoTable(doc, {
      head: [tableConfig.headers],
      body: tableConfig.body,
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

      {activeTab === 'overview' && kpiData && (
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
            {/* Trend Chart */}
            <Card className={`${bgClass} border ${borderClass}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${textClass}`}>7-Day Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
                      <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="quotes" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="contacts" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Booking Status Pie Chart */}
            <Card className={`${bgClass} border ${borderClass}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${textClass}`}>Booking Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
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
                      <Badge variant="secondary" className="text-xs">
                        {activity.resourceType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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

          {/* Report Preview */}
          {reportData && (
            <Card className={`${bgClass} border ${borderClass}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={textClass}>{reportData.title}</CardTitle>
                    <p className={`text-sm ${mutedClass}`}>
                      {new Date(reportData.dateRange.start).toLocaleDateString()} - {new Date(reportData.dateRange.end).toLocaleDateString()}
                    </p>
                  </div>
                  <Button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className={`p-4 rounded-lg ${cardBgClass} border ${borderClass}`}>
                      <p className={`text-sm ${mutedClass} capitalize`}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className={`text-2xl font-bold ${textClass}`}>{String(value)}</p>
                    </div>
                  ))}
                </div>

                {/* Data Preview */}
                <div className="overflow-x-auto max-h-96">
                  <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={cardBgClass}>
                      <tr>
                        {reportData.type === 'bookings' && ['Date', 'Company', 'Contact', 'Product', 'Status'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-medium ${mutedClass} uppercase`}>{h}</th>
                        ))}
                        {reportData.type === 'users' && ['Joined', 'Name', 'Email', 'Role'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-medium ${mutedClass} uppercase`}>{h}</th>
                        ))}
                        {reportData.type === 'quotes' && ['Date', 'Name', 'Email', 'Status'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-medium ${mutedClass} uppercase`}>{h}</th>
                        ))}
                        {reportData.type === 'contacts' && ['Date', 'Name', 'Email', 'Subject', 'Status'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-medium ${mutedClass} uppercase`}>{h}</th>
                        ))}
                        {reportData.type === 'activityLogs' && ['Date', 'User', 'Action', 'Resource'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-medium ${mutedClass} uppercase`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {reportData.data.slice(0, 10).map((item: any, index: number) => (
                        <tr key={index}>
                          {reportData.type === 'bookings' && (
                            <>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{new Date(item.date).toLocaleDateString()}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.company}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.contactName}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.product}</td>
                              <td className="px-4 py-3">
                                <Badge className={
                                  item.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {item.status}
                                </Badge>
                              </td>
                            </>
                          )}
                          {reportData.type === 'users' && (
                            <>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{new Date(item.createdAt).toLocaleDateString()}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.name}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.email}</td>
                              <td className={`px-4 py-3 text-sm ${textClass} capitalize`}>{item.role}</td>
                            </>
                          )}
                          {reportData.type === 'quotes' && (
                            <>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{new Date(item.createdAt).toLocaleDateString()}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.userId?.name || 'N/A'}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.userId?.email || 'N/A'}</td>
                              <td className={`px-4 py-3 text-sm ${textClass} capitalize`}>{item.status}</td>
                            </>
                          )}
                          {reportData.type === 'contacts' && (
                            <>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{new Date(item.createdAt).toLocaleDateString()}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.firstName} {item.lastName}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.email}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.subject}</td>
                              <td className={`px-4 py-3 text-sm ${textClass} capitalize`}>{item.status}</td>
                            </>
                          )}
                          {reportData.type === 'activityLogs' && (
                            <>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{new Date(item.createdAt).toLocaleDateString()}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.userName}</td>
                              <td className={`px-4 py-3 text-sm ${textClass}`}>{item.action}</td>
                              <td className="px-4 py-3">
                                <Badge variant="secondary">{item.resourceType}</Badge>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.data.length > 10 && (
                    <p className={`text-center py-4 ${mutedClass}`}>
                      Showing 10 of {reportData.data.length} records. Download PDF for full report.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default EnhancedReportsTab;
