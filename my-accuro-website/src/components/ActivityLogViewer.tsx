import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  FileText,
  ShoppingCart,
  Star,
  Settings,
  RefreshCw,
  Download,
} from 'lucide-react';
import activityLogService, { ActivityLog } from '../services/activityLogService';

interface ActivityLogViewerProps {
  darkMode?: boolean;
  userId?: string; // Optional: filter by user
  limit?: number;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  LOGIN: <LogIn size={16} />,
  LOGOUT: <LogOut size={16} />,
  LOGOUT_ALL: <LogOut size={16} />,
  SESSION_REVOKED: <LogOut size={16} />,
  USER_REGISTERED: <Plus size={16} />,
  USER_CREATED: <Plus size={16} />,
  USER_UPDATED: <Edit size={16} />,
  PROFILE_UPDATED: <Edit size={16} />,
  USER_DELETED: <Trash2 size={16} />,
  PASSWORD_CHANGED: <Settings size={16} />,
  PASSWORD_RESET: <Settings size={16} />,
  EMAIL_VERIFIED: <User size={16} />,
  BOOKING_CREATED: <Calendar size={16} />,
  BOOKING_UPDATED: <Edit size={16} />,
  BOOKING_CANCELLED: <Trash2 size={16} />,
  REVIEW_CREATED: <Star size={16} />,
  REVIEW_UPDATED: <Edit size={16} />,
  REVIEW_DELETED: <Trash2 size={16} />,
  QUOTE_CREATED: <FileText size={16} />,
  QUOTE_UPDATED: <Edit size={16} />,
  PURCHASE_CREATED: <ShoppingCart size={16} />,
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  LOGOUT: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  LOGOUT_ALL: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  SESSION_REVOKED: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  USER_REGISTERED: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  USER_CREATED: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  USER_UPDATED: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  PROFILE_UPDATED: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  USER_DELETED: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  PASSWORD_CHANGED: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  PASSWORD_RESET: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  EMAIL_VERIFIED: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  BOOKING_CREATED: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  BOOKING_UPDATED: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  BOOKING_CANCELLED: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  REVIEW_CREATED: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  REVIEW_UPDATED: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  REVIEW_DELETED: 'text-red-500 bg-red-100 dark:bg-red-900/30',
};

const RESOURCE_TYPES = ['all', 'auth', 'user', 'booking', 'review', 'quote', 'purchase', 'system'];

export function ActivityLogViewer({ darkMode = false, userId, limit = 50 }: ActivityLogViewerProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit };
      if (resourceTypeFilter !== 'all') params.resourceType = resourceTypeFilter;
      if (userId) params.userId = userId;

      const response = await activityLogService.getAll(params);
      if (response.success) {
        setLogs(response.data);
        setTotalPages(response.pagination?.totalPages || Math.ceil((response as any).total / limit) || 1);
        setTotalItems(response.pagination?.totalItems || (response as any).total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, resourceTypeFilter, userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.userName?.toLowerCase().includes(search) ||
      log.userEmail?.toLowerCase().includes(search) ||
      log.action?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search)
    );
  });

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Email', 'Action', 'Resource Type', 'Details', 'IP Address'];
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.userName,
      log.userEmail,
      log.action,
      log.resourceType,
      log.details || '',
      log.ipAddress || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
              <Activity className="text-purple-500" size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Activity Log
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalItems} total entries
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={exportToCSV}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Export CSV"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition ${
                showFilters
                  ? 'bg-blue-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              size={18}
            />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          {showFilters && (
            <select
              value={resourceTypeFilter}
              onChange={(e) => {
                setResourceTypeFilter(e.target.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500`}
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className={`animate-spin mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading activity logs...</span>
          </div>
        ) : error ? (
          <div className={`py-12 text-center ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
            <p>{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-2 text-blue-500 hover:text-blue-600 underline"
            >
              Try again
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={`py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Activity className="mx-auto mb-2 opacity-50" size={32} />
            <p>No activity logs found</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log._id}
              className={`p-4 hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    ACTION_COLORS[log.action] || 'text-gray-500 bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {ACTION_ICONS[log.action] || <Activity size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {log.userName}
                    </span>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {formatAction(log.action)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {log.resourceType}
                    </span>
                  </div>
                  {log.details && (
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {log.details}
                    </p>
                  )}
                  <div className={`flex items-center gap-4 mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>{formatDate(log.createdAt)}</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    <span className="truncate max-w-[200px]">{log.userEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className={`p-4 border-t flex items-center justify-between ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`p-2 rounded-lg transition ${
                page === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-lg transition ${
                page === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
