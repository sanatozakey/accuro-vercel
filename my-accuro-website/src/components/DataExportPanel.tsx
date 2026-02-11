import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Users, Calendar, MessageSquare, Star, Activity, Package, RefreshCw } from 'lucide-react';
import { toCSV, downloadCSV, downloadExcel, exportPresets, getExportFilename } from '../utils/exportUtils';
import userService from '../services/userService';
import bookingService from '../services/bookingService';
import reviewService from '../services/reviewService';
import activityLogService from '../services/activityLogService';
import quoteService from '../services/quoteService';

interface DataExportPanelProps {
  darkMode?: boolean;
}

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preset: any[];
  fetchData: () => Promise<any[]>;
}

export function DataExportPanel({ darkMode = false }: DataExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const exportOptions: ExportOption[] = [
    {
      id: 'users',
      name: 'Users',
      description: 'Export all registered users with their profile information',
      icon: <Users size={20} />,
      preset: exportPresets.users,
      fetchData: async () => {
        const response = await userService.getAll({ limit: 10000 });
        return response.data || [];
      },
    },
    {
      id: 'bookings',
      name: 'Bookings',
      description: 'Export all service bookings and appointments',
      icon: <Calendar size={20} />,
      preset: exportPresets.bookings,
      fetchData: async () => {
        const response = await bookingService.getAll({ limit: 10000 });
        return response.data || [];
      },
    },
    {
      id: 'quotes',
      name: 'Quotes',
      description: 'Export all quote requests and their details',
      icon: <Package size={20} />,
      preset: exportPresets.quotes,
      fetchData: async () => {
        const response = await quoteService.getAll({ limit: 10000 });
        return response.data || [];
      },
    },
    {
      id: 'reviews',
      name: 'Reviews',
      description: 'Export all customer reviews and ratings',
      icon: <Star size={20} />,
      preset: exportPresets.reviews,
      fetchData: async () => {
        const response = await reviewService.getAll({ limit: 10000 });
        return response.data || [];
      },
    },
    {
      id: 'activityLogs',
      name: 'Activity Logs',
      description: 'Export system activity and audit logs',
      icon: <Activity size={20} />,
      preset: exportPresets.activityLogs,
      fetchData: async () => {
        const response = await activityLogService.getAll({ limit: 10000 });
        return response.data || [];
      },
    },
  ];

  const handleExport = async (option: ExportOption, format: 'csv' | 'xlsx') => {
    try {
      setExporting(option.id);
      setError(null);
      setSuccess(null);

      const data = await option.fetchData();

      if (data.length === 0) {
        setError(`No ${option.name.toLowerCase()} data to export`);
        return;
      }

      const csv = toCSV(data, option.preset as any);
      const filename = getExportFilename(option.id, format);

      if (format === 'xlsx') {
        downloadExcel(csv, filename);
      } else {
        downloadCSV(csv, filename);
      }

      setSuccess(`Successfully exported ${data.length} ${option.name.toLowerCase()}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || `Failed to export ${option.name.toLowerCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
            <Download className="text-green-500" size={24} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Data Export
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Export your data as CSV or Excel files
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className={`mx-6 mt-4 p-3 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}
      {success && (
        <div className={`mx-6 mt-4 p-3 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-600'}`}>
          {success}
        </div>
      )}

      {/* Export Options */}
      <div className="p-6 space-y-4">
        {exportOptions.map((option) => (
          <div
            key={option.id}
            className={`p-4 rounded-lg border ${
              darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white border border-gray-200'}`}>
                  {option.icon}
                </div>
                <div>
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {option.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {option.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(option, 'csv')}
                  disabled={exporting === option.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    exporting === option.id
                      ? 'opacity-50 cursor-not-allowed'
                      : darkMode
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {exporting === option.id ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                  CSV
                </button>
                <button
                  onClick={() => handleExport(option, 'xlsx')}
                  disabled={exporting === option.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    exporting === option.id
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {exporting === option.id ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <FileSpreadsheet size={16} />
                  )}
                  Excel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className={`mx-6 mb-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          <strong>Note:</strong> Exports include all records. Large datasets may take a moment to download.
          CSV files can be opened in any spreadsheet application, including Microsoft Excel and Google Sheets.
        </p>
      </div>
    </div>
  );
}
