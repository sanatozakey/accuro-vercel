import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader, Calendar, Clock } from 'lucide-react';
import bookingService from '../services/bookingService';
import userService from '../services/userService';
import quoteService from '../services/quoteService';
import contactService from '../services/contactService';
import activityLogService from '../services/activityLogService';
import analyticsService from '../services/analyticsService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType =
  | 'bookings'
  | 'users'
  | 'quotes'
  | 'contacts'
  | 'activityLogs'
  | 'productViews'
  | 'cartAnalytics'
  | 'searchAnalytics'
  | 'registrations'
  | 'dashboardSummary';

type DateRangePreset = 'today' | 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'lastYear' | 'custom';

interface ReportData {
  type: ReportType;
  title: string;
  dateRange: { start: string; end: string };
  data: any[];
  summary: {
    totalRecords: number;
    [key: string]: any;
  };
}

// Accuro logo as base64 (simplified version - you can replace with actual logo)
const ACCURO_LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMkQ3MkIyIj5BQ0NVUk88L3RleHQ+PC9zdmc+';

export function SimpleReportsTab() {
  const [reportType, setReportType] = useState<ReportType>('bookings');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  // Calculate date range based on preset
  const calculateDateRange = (preset: DateRangePreset): { start: string; end: string } => {
    const today = new Date();
    const end = today.toISOString().split('T')[0]; // Always set end date to today
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
        // Don't auto-calculate for custom
        return { start: startDate, end: endDate };
    }

    return { start, end };
  };

  // Update dates when preset changes
  useEffect(() => {
    if (datePreset !== 'custom') {
      const range = calculateDateRange(datePreset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, [datePreset]);

  // Initialize with default preset
  useEffect(() => {
    const range = calculateDateRange('last30days');
    setStartDate(range.start);
    setEndDate(range.end);
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
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
            pending: data.filter(b => b.status === 'pending').length,
            confirmed: data.filter(b => b.status === 'confirmed').length,
            completed: data.filter(b => b.status === 'completed').length,
            cancelled: data.filter(b => b.status === 'cancelled').length,
          };
          break;

        case 'users':
          const usersResponse = await userService.getAll();
          data = usersResponse.data;
          summary = {
            totalRecords: data.length,
            admins: data.filter(u => u.role === 'admin').length,
            users: data.filter(u => u.role === 'user').length,
          };
          break;

        case 'quotes':
          const quotesResponse = await quoteService.getAll();
          data = quotesResponse.data || [];
          summary = {
            totalRecords: data.length,
            pending: data.filter(q => q.status === 'pending').length,
            sent: data.filter(q => q.status === 'sent').length,
          };
          break;

        case 'contacts':
          const contactsResponse = await contactService.getAll();
          data = contactsResponse.data || [];
          summary = {
            totalRecords: data.length,
            pending: data.filter(c => c.status === 'pending').length,
            responded: data.filter(c => c.status === 'responded').length,
          };
          break;

        case 'activityLogs':
          const activityLogsResponse = await activityLogService.getAllActivityLogs({ limit: 1000 });
          data = activityLogsResponse.data || [];
          // Filter by date range
          data = data.filter(log => {
            const logDate = new Date(log.createdAt);
            return logDate >= new Date(startDate) && logDate <= new Date(endDate);
          });
          summary = {
            totalRecords: data.length,
            userActions: data.filter(l => l.resourceType === 'user').length,
            bookingActions: data.filter(l => l.resourceType === 'booking').length,
            reviewActions: data.filter(l => l.resourceType === 'review').length,
            authActions: data.filter(l => l.resourceType === 'auth').length,
            systemActions: data.filter(l => l.resourceType === 'system').length,
          };
          break;

        case 'productViews':
          const productViewsResponse = await analyticsService.getProductViewDetails({ startDate, endDate, limit: 1000 });
          data = productViewsResponse.data || [];
          summary = {
            totalRecords: data.length,
            totalViews: data.length,
            uniqueProducts: new Set(data.map(v => v.productId)).size,
          };
          break;

        case 'cartAnalytics':
          const cartResponse = await analyticsService.getCartDetails({ startDate, endDate, limit: 1000 });
          data = cartResponse.data || [];
          summary = {
            totalRecords: data.length,
            addedToCart: data.filter(c => c.eventType === 'add_to_cart').length,
            removedFromCart: data.filter(c => c.eventType === 'remove_from_cart').length,
          };
          break;

        case 'searchAnalytics':
          const searchResponse = await analyticsService.getSearchDetails({ startDate, endDate, limit: 1000 });
          data = searchResponse.data || [];
          summary = {
            totalRecords: data.length,
            totalSearches: data.length,
            uniqueSearchTerms: new Set(data.map(s => s.searchTerm)).size,
          };
          break;

        case 'registrations':
          const registrationsResponse = await analyticsService.getRegistrationDetails({ startDate, endDate, limit: 1000 });
          data = registrationsResponse.data || [];
          summary = {
            totalRecords: data.length,
            totalRegistrations: data.length,
          };
          break;

        case 'dashboardSummary':
          const dashboardResponse = await analyticsService.getDashboardAnalytics({ startDate, endDate });
          data = [dashboardResponse]; // Dashboard is a single summary object
          summary = {
            totalBookings: dashboardResponse.totalBookings || 0,
            totalUsers: dashboardResponse.totalUsers || 0,
            totalQuotes: dashboardResponse.totalQuotes || 0,
            totalContacts: dashboardResponse.totalContacts || 0,
          };
          break;
      }

      // Generate user-friendly title
      const titleMap: Record<ReportType, string> = {
        bookings: 'Bookings Report',
        users: 'Users Report',
        quotes: 'Quotes Report',
        contacts: 'Contacts Report',
        activityLogs: 'Activity Logs Report',
        productViews: 'Product Views Analytics Report',
        cartAnalytics: 'Cart Analytics Report',
        searchAnalytics: 'Search Analytics Report',
        registrations: 'Registration Analytics Report',
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
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add Accuro logo
    try {
      doc.addImage(ACCURO_LOGO_BASE64, 'SVG', 14, 10, 40, 16);
    } catch (e) {
      // Fallback if logo fails to load
      doc.setFontSize(16);
      doc.setTextColor(45, 114, 178);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCURO', 14, 20);
    }

    // Company info
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Instrumentation & Calibration Solutions', 14, 30);
    doc.text('www.accuro.com.ph | info@accuro.com.ph', 14, 34);

    // Report title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, pageWidth / 2, 45, { align: 'center' });

    // Report metadata
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      pageWidth / 2,
      52,
      { align: 'center' }
    );
    doc.text(
      `Report Period: ${new Date(reportData.dateRange.start).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })} - ${new Date(reportData.dateRange.end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}`,
      pageWidth / 2,
      58,
      { align: 'center' }
    );

    // Divider line
    doc.setDrawColor(45, 114, 178);
    doc.setLineWidth(0.5);
    doc.line(14, 63, pageWidth - 14, 63);

    // Summary section with professional styling
    doc.setFontSize(12);
    doc.setTextColor(45, 114, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, 72);

    // Summary cards
    doc.setFontSize(9);
    let yPos = 80;
    let xPos = 14;
    const cardWidth = (pageWidth - 28 - 15) / 4; // 4 columns with gaps
    const cardHeight = 20;

    const summaryEntries = Object.entries(reportData.summary);
    summaryEntries.forEach(([key, value], index) => {
      if (index > 0 && index % 4 === 0) {
        yPos += cardHeight + 5;
        xPos = 14;
      }

      // Card background
      doc.setFillColor(240, 247, 255);
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 2, 2, 'F');

      // Card content
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      doc.text(
        label.charAt(0).toUpperCase() + label.slice(1),
        xPos + cardWidth / 2,
        yPos + 7,
        { align: 'center' }
      );

      doc.setTextColor(45, 114, 178);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(
        value.toString(),
        xPos + cardWidth / 2,
        yPos + 15,
        { align: 'center' }
      );

      xPos += cardWidth + 5;
    });

    // Data table
    yPos = Math.max(yPos + cardHeight + 15, 110);

    doc.setFontSize(12);
    doc.setTextColor(45, 114, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Data', 14, yPos);

    yPos += 8;

    const tableData = reportData.data.map((item) => {
      switch (reportData.type) {
        case 'bookings':
          return [
            new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.company,
            item.contactName,
            item.product,
            item.status,
          ];
        case 'users':
          return [
            new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.name,
            item.email,
            item.role,
          ];
        case 'quotes':
          return [
            new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.userId?.name || 'N/A',
            item.userId?.email || 'N/A',
            item.status,
          ];
        case 'contacts':
          return [
            new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            `${item.firstName} ${item.lastName}`,
            item.email,
            item.subject,
            item.status,
          ];
        case 'activityLogs':
          return [
            new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.userName,
            item.action,
            item.resourceType,
            item.details || 'N/A',
          ];
        case 'productViews':
          return [
            new Date(item.timestamp || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.productName || item.productId || 'N/A',
            item.category || 'N/A',
            item.userName || 'Guest',
          ];
        case 'cartAnalytics':
          return [
            new Date(item.timestamp || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.eventType,
            item.productName || item.productId || 'N/A',
            item.userName || 'Guest',
          ];
        case 'searchAnalytics':
          return [
            new Date(item.timestamp || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.searchTerm || 'N/A',
            item.resultsCount?.toString() || '0',
            item.userName || 'Guest',
          ];
        case 'registrations':
          return [
            new Date(item.timestamp || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            item.userName || item.name || 'N/A',
            item.userEmail || item.email || 'N/A',
            item.role || 'user',
          ];
        case 'dashboardSummary':
          return [
            'Total Bookings',
            'Total Users',
            'Total Quotes',
            'Total Contacts',
            item.totalBookings?.toString() || '0',
            item.totalUsers?.toString() || '0',
            item.totalQuotes?.toString() || '0',
            item.totalContacts?.toString() || '0',
          ];
        default:
          return [];
      }
    });

    const tableHeaders =
      reportData.type === 'bookings'
        ? ['Date', 'Company', 'Contact', 'Product', 'Status']
        : reportData.type === 'users'
        ? ['Joined', 'Name', 'Email', 'Role']
        : reportData.type === 'quotes'
        ? ['Date', 'Name', 'Email', 'Status']
        : reportData.type === 'contacts'
        ? ['Date', 'Name', 'Email', 'Subject', 'Status']
        : reportData.type === 'activityLogs'
        ? ['Date', 'User', 'Action', 'Resource', 'Details']
        : reportData.type === 'productViews'
        ? ['Date', 'Product', 'Category', 'User']
        : reportData.type === 'cartAnalytics'
        ? ['Date', 'Event', 'Product', 'User']
        : reportData.type === 'searchAnalytics'
        ? ['Date', 'Search Term', 'Results', 'User']
        : reportData.type === 'registrations'
        ? ['Date', 'Name', 'Email', 'Role']
        : reportData.type === 'dashboardSummary'
        ? ['Metric', '', '', '', 'Value', '', '', '']
        : ['Data'];

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [45, 114, 178],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    // Professional footer with branding
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer line
      doc.setDrawColor(45, 114, 178);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

      // Footer text
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Accuro - Instrumentation & Calibration Solutions',
        14,
        pageHeight - 13
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 13,
        { align: 'right' }
      );

      // Confidentiality notice
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text(
        'This report is confidential and intended solely for the use of Accuro authorized personnel.',
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    doc.save(
      `Accuro-${reportData.type}-report-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      {/* Generate Report Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Generate Report</h2>
        </div>

        {/* Report Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <optgroup label="Core Reports">
              <option value="bookings">Bookings Report</option>
              <option value="users">Users Report</option>
              <option value="quotes">Quotes Report</option>
              <option value="contacts">Contacts Report</option>
            </optgroup>
            <optgroup label="Transaction & Activity Reports">
              <option value="activityLogs">Activity Logs Report</option>
              <option value="productViews">Product Views Report</option>
              <option value="cartAnalytics">Cart Analytics Report</option>
              <option value="searchAnalytics">Search Analytics Report</option>
              <option value="registrations">Registration Analytics Report</option>
            </optgroup>
            <optgroup label="Summary Reports">
              <option value="dashboardSummary">Dashboard Summary Report</option>
            </optgroup>
          </select>
        </div>

        {/* Date Range Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Clock className="inline-block h-4 w-4 mr-1" />
            Quick Date Range
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              onClick={() => setDatePreset('today')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                datePreset === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('last7days')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                datePreset === 'last7days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDatePreset('last30days')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                datePreset === 'last30days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDatePreset('last3months')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                datePreset === 'last3months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 3 Months
            </button>
            <button
              onClick={() => setDatePreset('last6months')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                datePreset === 'last6months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setDatePreset('lastYear')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                datePreset === 'lastYear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Year
            </button>
            <button
              onClick={() => setDatePreset('custom')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                datePreset === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              max={endDate || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline-block h-4 w-4 mr-1" />
              End Date (Auto: Today)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              End date automatically set to today. You can adjust if needed.
            </p>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Generate Report
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{reportData.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(reportData.dateRange.start).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} -{' '}
                {new Date(reportData.dateRange.end).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(reportData.summary).map(([key, value]) => (
              <div key={key} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {reportData.type === 'bookings' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </>
                  )}
                  {reportData.type === 'users' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    </>
                  )}
                  {reportData.type === 'quotes' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </>
                  )}
                  {reportData.type === 'contacts' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </>
                  )}
                  {reportData.type === 'activityLogs' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    </>
                  )}
                  {reportData.type === 'productViews' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    </>
                  )}
                  {reportData.type === 'cartAnalytics' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    </>
                  )}
                  {reportData.type === 'searchAnalytics' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Search Term</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Results</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    </>
                  )}
                  {reportData.type === 'registrations' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    </>
                  )}
                  {reportData.type === 'dashboardSummary' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.data.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {reportData.type === 'bookings' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.company}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.contactName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.product}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    {reportData.type === 'users' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{item.role}</td>
                      </>
                    )}
                    {reportData.type === 'quotes' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userId?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userId?.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{item.status}</td>
                      </>
                    )}
                    {reportData.type === 'contacts' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{item.status}</td>
                      </>
                    )}
                    {reportData.type === 'activityLogs' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.action}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {item.resourceType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.details || 'N/A'}</td>
                      </>
                    )}
                    {reportData.type === 'productViews' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.productName || item.productId || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userName || 'Guest'}</td>
                      </>
                    )}
                    {reportData.type === 'cartAnalytics' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.eventType === 'add_to_cart' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.eventType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.productName || item.productId || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userName || 'Guest'}</td>
                      </>
                    )}
                    {reportData.type === 'searchAnalytics' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.searchTerm || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.resultsCount || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userName || 'Guest'}</td>
                      </>
                    )}
                    {reportData.type === 'registrations' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userName || item.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userEmail || item.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{item.role || 'user'}</td>
                      </>
                    )}
                    {reportData.type === 'dashboardSummary' && (
                      <>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          <div className="space-y-2">
                            <div>Total Bookings</div>
                            <div>Total Users</div>
                            <div>Total Quotes</div>
                            <div>Total Contacts</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="space-y-2">
                            <div className="font-bold text-blue-600">{item.totalBookings || 0}</div>
                            <div className="font-bold text-green-600">{item.totalUsers || 0}</div>
                            <div className="font-bold text-purple-600">{item.totalQuotes || 0}</div>
                            <div className="font-bold text-orange-600">{item.totalContacts || 0}</div>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reportData.data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data found for the selected date range
            </div>
          )}
        </div>
      )}
    </div>
  );
}
