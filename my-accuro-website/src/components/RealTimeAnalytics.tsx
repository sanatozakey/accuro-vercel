import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Globe,
  Activity,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  RefreshCw,
  MapPin,
  MousePointer,
  Clock,
  Eye,
} from 'lucide-react';
import activeSessionService, { ActiveSession, ActiveSessionsResponse } from '../services/activeSessionService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface RealTimeAnalyticsProps {
  startDate?: string;
  endDate?: string;
}

const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionsData, setSessionsData] = useState<ActiveSessionsResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchActiveSessions();

    // Auto-refresh every 10 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchActiveSessions();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (selectedPage !== 'all') {
      fetchHeatmapData();
    }
  }, [selectedPage, startDate, endDate]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const data = await activeSessionService.getActiveSessions();
      setSessionsData(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch active sessions:', err);
      setError(err.response?.data?.message || 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmapData = async () => {
    try {
      const data = await activeSessionService.getSessionHeatmap(
        selectedPage === 'all' ? undefined : selectedPage,
        startDate,
        endDate
      );
      setHeatmapData(data);
      renderHeatmap(data);
    } catch (err: any) {
      console.error('Failed to fetch heatmap data:', err);
    }
  };

  const renderHeatmap = (data: any) => {
    if (!heatmapCanvasRef.current || !data || data.interactions.length === 0) return;

    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw heatmap points
    data.interactions.forEach((interaction: any) => {
      const gradient = ctx.createRadialGradient(
        interaction.x,
        interaction.y,
        0,
        interaction.x,
        interaction.y,
        50
      );

      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(interaction.x - 50, interaction.y - 50, 100, 100);
    });
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading && !sessionsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchActiveSessions}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const deviceData = sessionsData?.stats.deviceDistribution
    ? Object.entries(sessionsData.stats.deviceDistribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const browserData = sessionsData?.stats.browserDistribution
    ? Object.entries(sessionsData.stats.browserDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const locationData = sessionsData?.stats.locationDistribution
    ? Object.entries(sessionsData.stats.locationDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const uniquePages = sessionsData?.stats.pageDistribution
    ? ['all', ...Object.keys(sessionsData.stats.pageDistribution)]
    : ['all'];

  return (
    <div className="space-y-6">
      {/* Header with Auto-Refresh Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-7 w-7 text-blue-600" />
            Real-Time Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Live user sessions and interaction tracking
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">
              Auto-refresh (10s)
            </label>
          </div>
          <button
            onClick={fetchActiveSessions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Active Users Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Active Users</p>
              <p className="text-4xl font-bold mt-2">{sessionsData?.totalActive || 0}</p>
              <p className="text-blue-100 text-xs mt-2">
                <Clock className="inline h-3 w-3 mr-1" />
                Updated {formatTimeAgo(new Date().toISOString())}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Users className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Authenticated Users</p>
              <p className="text-4xl font-bold mt-2">{sessionsData?.authenticatedSessions || 0}</p>
              <p className="text-green-100 text-xs mt-2">
                {sessionsData?.totalActive
                  ? Math.round((sessionsData.authenticatedSessions / sessionsData.totalActive) * 100)
                  : 0}
                % of total
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Eye className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Anonymous Visitors</p>
              <p className="text-4xl font-bold mt-2">{sessionsData?.anonymousSessions || 0}</p>
              <p className="text-purple-100 text-xs mt-2">
                {sessionsData?.totalActive
                  ? Math.round((sessionsData.anonymousSessions / sessionsData.totalActive) * 100)
                  : 0}
                % of total
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Globe className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Device & Browser Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            Device Distribution
          </h3>
          {deviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No device data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Chrome className="h-5 w-5 text-blue-600" />
            Browser Distribution
          </h3>
          {browserData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={browserData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {browserData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No browser data available</p>
          )}
        </div>
      </div>

      {/* Active Sessions List & Location Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Active Sessions ({sessionsData?.sessions.length || 0})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
              sessionsData.sessions.slice(0, 20).map((session) => {
                const DeviceIcon = getDeviceIcon(session.device || '');
                return (
                  <div
                    key={session.sessionId}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DeviceIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.userName || (session.isAnonymous ? 'Anonymous User' : 'User')}
                        </p>
                        {session.userEmail && (
                          <p className="text-xs text-gray-500">{session.userEmail}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {session.city || 'Unknown'}, {session.country || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {session.browser} · {session.os} · {session.currentPage}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        Active
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(session.lastActivity)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-8">No active sessions</p>
            )}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Geographic Distribution
          </h3>
          <div className="space-y-2">
            {locationData.length > 0 ? (
              locationData.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">{location.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(location.value / (sessionsData?.totalActive || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">
                      {location.value}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No location data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Click Heatmap */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MousePointer className="h-5 w-5 text-blue-600" />
            Click Heatmap
          </h3>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {uniquePages.map((page) => (
              <option key={page} value={page}>
                {page === 'all' ? 'All Pages' : page}
              </option>
            ))}
          </select>
        </div>

        {heatmapData && heatmapData.interactions.length > 0 ? (
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
            <canvas
              ref={heatmapCanvasRef}
              width={1200}
              height={500}
              className="w-full h-full"
            />
            <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow">
              <p className="text-sm text-gray-600">
                Total Clicks: <span className="font-bold text-gray-900">{heatmapData.total}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <MousePointer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedPage === 'all'
                ? 'Select a page to view click heatmap'
                : 'No click data available for this page'}
            </p>
          </div>
        )}
      </div>

      {/* Page Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Page Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sessionsData?.stats.pageDistribution &&
          Object.entries(sessionsData.stats.pageDistribution).length > 0 ? (
            Object.entries(sessionsData.stats.pageDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([page, count]) => (
                <div key={page} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 truncate" title={page}>
                    {page}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{count}</p>
                  <p className="text-xs text-gray-500">active user{count !== 1 ? 's' : ''}</p>
                </div>
              ))
          ) : (
            <p className="text-gray-500 col-span-3 text-center py-8">No page activity data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;
