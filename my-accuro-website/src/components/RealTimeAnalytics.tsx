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
  BarChart3,
  Map,
} from 'lucide-react';
import activeSessionService, { ActiveSession, ActiveSessionsResponse } from '../services/activeSessionService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface RealTimeAnalyticsProps {
  startDate?: string;
  endDate?: string;
}

type TabType = 'overview' | 'sessions' | 'geography' | 'heatmap';

const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionsData, setSessionsData] = useState<ActiveSessionsResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
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
      setLastUpdate(new Date());
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
    if (device?.toLowerCase().includes('mobile')) return Smartphone;
    if (device?.toLowerCase().includes('tablet')) return Tablet;
    return Monitor;
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Prepare chart data
  const deviceData = sessionsData
    ? Object.entries(sessionsData.stats.deviceDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const browserData = sessionsData
    ? Object.entries(sessionsData.stats.browserDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const locationData = sessionsData
    ? Object.entries(sessionsData.stats.locationDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const pageActivity = sessionsData
    ? Object.entries(sessionsData.stats.pageDistribution).map(([page, count]) => ({
        page,
        count,
      }))
    : [];

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Real-Time Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">Live user sessions and interaction tracking</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchActiveSessions}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sessions', label: 'Active Sessions', icon: Users },
    { id: 'geography', label: 'Geography & Devices', icon: Map },
    { id: 'heatmap', label: 'Heatmap', icon: MousePointer },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-7 w-7 text-blue-600" />
              Real-Time Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">Monitor live user activity and interactions</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-refresh (10s)</span>
            </label>
            <button
              onClick={fetchActiveSessions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Now
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Active Users</p>
                    <p className="text-4xl font-bold mt-2">{sessionsData?.totalActive || 0}</p>
                    <p className="text-blue-100 text-xs mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {getTimeSince(lastUpdate.toISOString())}
                    </p>
                  </div>
                  <Users className="h-12 w-12 text-blue-200 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
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
                  <Eye className="h-12 w-12 text-green-200 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
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
                  <Globe className="h-12 w-12 text-purple-200 opacity-50" />
                </div>
              </div>
            </div>

            {/* Current Page Activity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Page Activity</h3>
              {pageActivity.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pageActivity.map((item) => (
                    <div
                      key={item.page}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-gray-600 truncate">{item.page}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{item.count}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            active {item.count === 1 ? 'user' : 'users'}
                          </p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No active sessions</p>
              )}
            </div>
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === 'sessions' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Active Sessions ({sessionsData?.sessions.length || 0})
            </h3>
            {sessionsData && sessionsData.sessions.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {sessionsData.sessions.slice(0, 20).map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device || '');
                  return (
                    <div
                      key={session._id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <DeviceIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {session.userName || 'Anonymous User'}
                          </p>
                          {session.userEmail && (
                            <p className="text-sm text-gray-600">{session.userEmail}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.city}, {session.country}
                            </span>
                            <span className="font-mono">
                              {session.browser || 'Unknown'} · {session.os || 'Unknown'} · {session.currentPage}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Active
                        </span>
                        <span className="text-xs text-gray-500">{getTimeSince(session.lastActivity)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">No active sessions</p>
            )}
          </div>
        )}

        {/* Geography & Devices Tab */}
        {activeTab === 'geography' && (
          <div className="space-y-8">
            {/* Device and Browser Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  Device Distribution
                </h3>
                {deviceData.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
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
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No data available</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Chrome className="h-5 w-5 text-blue-600" />
                  Browser Distribution
                </h3>
                {browserData.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={browserData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
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
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No data available</p>
                )}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Geographic Distribution
              </h3>
              {locationData.length > 0 ? (
                <div className="space-y-3">
                  {locationData.map(([location, count]) => (
                    <div key={location} className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{location}</span>
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${((count as number) / (sessionsData?.totalActive || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No geographic data available</p>
              )}
            </div>
          </div>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-blue-600" />
                Click Heatmap
              </h3>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Pages</option>
                {pageActivity.map((item) => (
                  <option key={item.page} value={item.page}>
                    {item.page}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              {selectedPage === 'all' ? (
                <div className="text-center py-12">
                  <MousePointer className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a page to view click heatmap</p>
                </div>
              ) : heatmapData && heatmapData.interactions && heatmapData.interactions.length > 0 ? (
                <div>
                  <div className="mb-4 text-sm text-gray-600">
                    Total clicks: {heatmapData.total}
                  </div>
                  <canvas
                    ref={heatmapCanvasRef}
                    width={1200}
                    height={800}
                    className="border border-gray-300 rounded-lg w-full"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <MousePointer className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No click data available for this page</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeAnalytics;
