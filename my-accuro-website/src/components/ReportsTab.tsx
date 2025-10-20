import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  ShoppingCart,
  BarChart3,
  Mail,
} from 'lucide-react';
import reportService from '../services/reportService';
import { LoadingSpinner } from './LoadingSpinner';

interface ReportsTabProps {
  className?: string;
}

interface Report {
  _id: string;
  reportType: string;
  title: string;
  generatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRecords: number;
    keyMetrics: Record<string, any>;
  };
  createdAt: string;
}

export function ReportsTab({ className = '' }: ReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  // Form state for report generation
  const [reportType, setReportType] = useState<string>('user_activity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);

    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getAllReports();
      setReports(response.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    try {
      setGenerating(reportType);
      setError('');

      let response;
      const params = { startDate, endDate, ...filters };

      switch (reportType) {
        case 'user_activity':
          response = await reportService.generateUserActivityReport(params);
          break;
        case 'sales_booking':
          response = await reportService.generateSalesBookingReport(params);
          break;
        case 'product_performance':
          response = await reportService.generateProductPerformanceReport(params);
          break;
        case 'quote_request':
          response = await reportService.generateQuoteRequestReport(params);
          break;
        case 'contact_form':
          response = await reportService.generateContactFormReport(params);
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Refresh reports list
      await fetchReports();

      alert('Report generated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const downloadPDF = async (reportId: string) => {
    try {
      await reportService.downloadReportPDF(reportId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportService.deleteReport(reportId);
      await fetchReports();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'user_activity':
        return Users;
      case 'sales_booking':
        return ShoppingCart;
      case 'product_performance':
        return BarChart3;
      case 'quote_request':
        return FileText;
      case 'contact_form':
        return Mail;
      default:
        return FileText;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'user_activity':
        return 'text-blue-600 bg-blue-50';
      case 'sales_booking':
        return 'text-green-600 bg-green-50';
      case 'product_performance':
        return 'text-purple-600 bg-purple-50';
      case 'quote_request':
        return 'text-orange-600 bg-orange-50';
      case 'contact_form':
        return 'text-pink-600 bg-pink-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatReportType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Generate New Report */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Generate New Report</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user_activity">User Activity</option>
              <option value="sales_booking">Sales & Bookings</option>
              <option value="product_performance">Product Performance</option>
              <option value="quote_request">Quote Requests</option>
              <option value="contact_form">Contact Forms</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={generateReport}
            disabled={!!generating}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </button>

          <button
            onClick={fetchReports}
            className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh List
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Reports List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Generated Reports</h2>
          </div>
          <span className="text-sm text-gray-600">{reports.length} total</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading reports..." />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600">
              Generate your first report using the form above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const Icon = getReportIcon(report.reportType);
              const colorClass = getReportColor(report.reportType);

              return (
                <div
                  key={report._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="capitalize">{formatReportType(report.reportType)}</span>
                          <span>•</span>
                          <span>{report.summary.totalRecords} records</span>
                          <span>•</span>
                          <span>
                            {new Date(report.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(report.dateRange.startDate).toLocaleDateString()} -{' '}
                            {new Date(report.dateRange.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadPDF(report._id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </button>
                      <button
                        onClick={() => deleteReport(report._id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Key Metrics Preview */}
                  {report.summary.keyMetrics && Object.keys(report.summary.keyMetrics).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Key Metrics:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(report.summary.keyMetrics)
                          .filter(([_, value]) => typeof value === 'number' || typeof value === 'string')
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="ml-1 font-medium text-gray-900">{value}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
