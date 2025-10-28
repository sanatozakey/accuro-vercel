import React, { useState, useEffect } from 'react';
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
  Clock,
  Eye,
  BarChart3,
  Map,
} from 'lucide-react';
import activeSessionService, { ActiveSessionsResponse } from '../services/activeSessionService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface RealTimeAnalyticsProps {
  startDate?: string;
  endDate?: string;
  darkMode?: boolean;
}

type TabType = 'overview' | 'sessions' | 'geography' | 'geomap';

const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ startDate, endDate, darkMode = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionsData, setSessionsData] = useState<ActiveSessionsResponse | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
        .slice(0, 10)
    : [];

  const pageActivity = sessionsData
    ? Object.entries(sessionsData.stats.pageDistribution).map(([page, count]) => ({
        page,
        count,
      }))
    : [];

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center gap-2`}>
              <Activity className="h-6 w-6 text-blue-600" />
              Real-Time Analytics
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Live user sessions and interaction tracking</p>
          </div>
        </div>
        <div className={`${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4 text-center`}>
          <p className={darkMode ? 'text-red-300' : 'text-red-600'}>{error}</p>
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
    { id: 'geomap', label: 'Geographic Map', icon: MapPin },
  ];

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-3 sm:p-6`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center gap-2`}>
              <Activity className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600" />
              Real-Time Analytics
            </h2>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Monitor live user activity</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <label className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="hidden sm:inline">Auto-refresh (10s)</span>
              <span className="sm:hidden">Auto (10s)</span>
            </label>
            <button
              onClick={fetchActiveSessions}
              disabled={loading}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Now</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:flex gap-2 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? darkMode
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-blue-100 text-blue-700'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-3 sm:p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Active Users</p>
                    <p className="text-3xl sm:text-4xl font-bold mt-2">{sessionsData?.totalActive || 0}</p>
                    <p className="text-blue-100 text-xs mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {getTimeSince(lastUpdate.toISOString())}
                    </p>
                  </div>
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-blue-200 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm font-medium">Authenticated Users</p>
                    <p className="text-3xl sm:text-4xl font-bold mt-2">{sessionsData?.authenticatedSessions || 0}</p>
                    <p className="text-green-100 text-xs mt-2">
                      {sessionsData?.totalActive
                        ? Math.round((sessionsData.authenticatedSessions / sessionsData.totalActive) * 100)
                        : 0}
                      % of total
                    </p>
                  </div>
                  <Eye className="h-10 w-10 sm:h-12 sm:w-12 text-green-200 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg sm:col-span-2 lg:col-span-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-purple-100 text-xs sm:text-sm font-medium">Anonymous Visitors</p>
                    <p className="text-3xl sm:text-4xl font-bold mt-2">{sessionsData?.anonymousSessions || 0}</p>
                    <p className="text-purple-100 text-xs mt-2">
                      {sessionsData?.totalActive
                        ? Math.round((sessionsData.anonymousSessions / sessionsData.totalActive) * 100)
                        : 0}
                      % of total
                    </p>
                  </div>
                  <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-purple-200 opacity-50" />
                </div>
              </div>
            </div>

            {/* Current Page Activity */}
            <div>
              <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-3 sm:mb-4`}>Current Page Activity</h3>
              {pageActivity.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {pageActivity.map((item) => (
                    <div
                      key={item.page}
                      className={`${darkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-300'} rounded-lg p-3 sm:p-4 border transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600'} truncate`}>{item.page}</p>
                          <p className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mt-1`}>{item.count}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                            active {item.count === 1 ? 'user' : 'users'}
                          </p>
                        </div>
                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8 text-sm`}>No active sessions</p>
              )}
            </div>
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === 'sessions' && (
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
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
                      className={`flex items-start justify-between p-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} rounded-lg transition-colors border`}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <DeviceIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {session.userName || 'Anonymous User'}
                          </p>
                          {session.userEmail && (
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{session.userEmail}</p>
                          )}
                          <div className={`flex items-center gap-4 mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'} gap-1`}>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Active
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getTimeSince(session.lastActivity)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-12`}>No active sessions</p>
            )}
          </div>
        )}

        {/* Geography & Devices Tab */}
        {activeTab === 'geography' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Device and Browser Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 sm:p-6 border`}>
                <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-3 sm:mb-4 flex items-center gap-2`}>
                  <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Device Distribution
                </h3>
                {deviceData.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={window.innerWidth >= 640 ? ({ name, percent }) => ({ value: `${name} ${(percent * 100).toFixed(0)}%`, fill: darkMode ? '#e5e7eb' : '#111827' }) : false}
                          outerRadius={window.innerWidth < 640 ? 80 : 100}
                          dataKey="value"
                        >
                          {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                        <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px', color: darkMode ? '#e5e7eb' : '#111827' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8 text-sm`}>No data available</p>
                )}
              </div>

              <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 sm:p-6 border`}>
                <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-3 sm:mb-4 flex items-center gap-2`}>
                  <Chrome className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Browser Distribution
                </h3>
                {browserData.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                      <PieChart>
                        <Pie
                          data={browserData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={window.innerWidth >= 640 ? ({ name, percent }) => ({ value: `${name} ${(percent * 100).toFixed(0)}%`, fill: darkMode ? '#e5e7eb' : '#111827' }) : false}
                          outerRadius={window.innerWidth < 640 ? 80 : 100}
                          dataKey="value"
                        >
                          {browserData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                        <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px', color: darkMode ? '#e5e7eb' : '#111827' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8 text-sm`}>No data available</p>
                )}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 sm:p-6 border`}>
              <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Geographic Distribution
              </h3>
              {locationData.length > 0 ? (
                <div className="space-y-3">
                  {locationData.map(([location, count]) => (
                    <div key={location} className="flex items-center gap-3">
                      <MapPin className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'} flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{location}</span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{count}</span>
                        </div>
                        <div className={`w-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
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
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8`}>No geographic data available</p>
              )}
            </div>
          </div>
        )}

        {/* Geographic Map Tab */}
        {activeTab === 'geomap' && (
          <div>
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center gap-2`}>
                <MapPin className="h-5 w-5 text-blue-600" />
                User Location Map
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Geographic distribution of active users across the Philippines
              </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border overflow-hidden`}>
              {sessionsData && sessionsData.sessions.length > 0 ? (
                <div style={{ height: '600px', width: '100%' }}>
                  <MapContainer
                    center={[12.8797, 121.7740]}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {sessionsData.sessions
                      .filter((session) => session.latitude && session.longitude)
                      .map((session, index) => (
                        <CircleMarker
                          key={session._id || index}
                          center={[session.latitude!, session.longitude!]}
                          radius={8}
                          fillColor="#3b82f6"
                          fillOpacity={0.7}
                          color="#1e40af"
                          weight={2}
                        >
                          <Popup>
                            <div className="p-2">
                              <p className="font-semibold text-gray-900">
                                {session.userName || 'Anonymous User'}
                              </p>
                              {session.userEmail && (
                                <p className="text-sm text-gray-600">{session.userEmail}</p>
                              )}
                              <div className="mt-2 text-xs text-gray-500 space-y-1">
                                <p>
                                  <MapPin className="inline h-3 w-3 mr-1" />
                                  {session.city}, {session.region}, {session.country}
                                </p>
                                <p>
                                  <Monitor className="inline h-3 w-3 mr-1" />
                                  {session.device || 'Unknown'}
                                </p>
                                <p>
                                  <Chrome className="inline h-3 w-3 mr-1" />
                                  {session.browser || 'Unknown'} on {session.os || 'Unknown'}
                                </p>
                                <p>
                                  <Activity className="inline h-3 w-3 mr-1" />
                                  {session.currentPage}
                                </p>
                                <p className="text-green-600 font-medium">
                                  Active {getTimeSince(session.lastActivity)}
                                </p>
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className={`h-16 w-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No active sessions with location data</p>
                </div>
              )}
            </div>

            {/* Location Summary */}
            {sessionsData && sessionsData.sessions.length > 0 && (
              <div className={`mt-6 ${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-lg p-4 border`}>
                <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Showing{' '}
                  {sessionsData.sessions.filter((s) => s.latitude && s.longitude).length} of{' '}
                  {sessionsData.sessions.length} active sessions with location data
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeAnalytics;
