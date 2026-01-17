import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Link,
  Unlink,
  AlertTriangle,
  CheckSquare,
  ArrowRight,
  Activity,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import googleCalendarService, {
  CalendarStatus,
  CalendarStats,
  SyncLog,
} from '../services/googleCalendarService';

interface GoogleCalendarSettingsProps {
  darkMode: boolean;
}

export function GoogleCalendarSettings({ darkMode }: GoogleCalendarSettingsProps): React.ReactElement {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await googleCalendarService.getStatus();
      setStatus(response.data);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch calendar status:', error);
      // Don't show toast for initial load
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await googleCalendarService.getSyncLogs(20);
      setSyncLogs(response.data);
    } catch (error: any) {
      console.error('Failed to fetch sync logs:', error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchLogs()]);
    setLoading(false);
  }, [fetchStatus, fetchLogs]);

  useEffect(() => {
    fetchAll();

    // Check URL params for OAuth callback result
    const urlParams = new URLSearchParams(window.location.search);
    const googleSuccess = urlParams.get('google_success');
    const googleError = urlParams.get('google_error');

    if (googleSuccess === 'true') {
      toast.success('Google Calendar connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (googleError) {
      toast.error(`Google Calendar connection failed: ${googleError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchAll]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await googleCalendarService.connect();
      if (response.success && response.data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar? This will stop syncing bookings.')) {
      return;
    }

    setDisconnecting(true);
    try {
      await googleCalendarService.disconnect();
      toast.success('Google Calendar disconnected');
      await fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const response = await googleCalendarService.syncAllBookings();
      toast.success(response.message);
      await fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync bookings');
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const response = await googleCalendarService.retryFailedSyncs();
      toast.success(response.message);
      await fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry syncs');
    } finally {
      setRetrying(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (logStatus: string) => {
    switch (logStatus) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'skipped':
        return <Badge className="bg-gray-100 text-gray-800">Skipped</Badge>;
      default:
        return <Badge>{logStatus}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'update':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading calendar settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card className={darkMode ? 'bg-navy-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!status?.isConfigured ? (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} border border-yellow-200`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    Configuration Required
                  </h4>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Google Calendar integration is not configured. Please add GOOGLE_CLIENT_ID and
                    GOOGLE_CLIENT_SECRET to your environment variables.
                  </p>
                </div>
              </div>
            </div>
          ) : status?.isConnected ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className={`font-medium ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                        Connected
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                        {status.settings?.calendarEmail}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {disconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Unlink className="h-4 w-4 mr-1" />
                    )}
                    Disconnect
                  </Button>
                </div>
              </div>

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4`}>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Synced</div>
                  <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : ''}`}>
                    {stats?.syncedBookings ?? 0}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending</div>
                  <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : ''}`}>
                    {stats?.pendingSyncs ?? 0}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Failed</div>
                  <div className={`text-2xl font-semibold text-red-500`}>
                    {stats?.failedSyncs ?? 0}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Sync</div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : ''}`}>
                    {formatDate(stats?.lastSyncAt ?? null)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSyncAll} disabled={syncing}>
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync All Bookings
                </Button>
                {(stats?.failedSyncs ?? 0) > 0 && (
                  <Button variant="outline" onClick={handleRetryFailed} disabled={retrying}>
                    {retrying ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Retry Failed ({stats?.failedSyncs})
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>
                      Not Connected
                    </h4>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Connect your Google Calendar to automatically sync bookings. When a booking is
                      created or updated, it will appear in your Google Calendar.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Logs Card */}
      {status?.isConnected && (
        <Card className={darkMode ? 'bg-navy-800 border-gray-700' : ''}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
              <Activity className="h-5 w-5" />
              Sync History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncLogs.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No sync logs yet. Sync some bookings to see the history.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead>
                    <tr className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Time
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Booking
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Action
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Direction
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Status
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {syncLogs.map((log) => (
                      <tr key={log._id} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-white' : ''}`}>
                          {log.bookingId ? (
                            <div>
                              <div className="font-medium">{log.bookingId.company}</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {log.bookingId.contactName}
                              </div>
                            </div>
                          ) : (
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>-</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm`}>
                          <div className="flex items-center gap-1">
                            {getActionIcon(log.action)}
                            <span className={`capitalize ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {log.action}
                            </span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm`}>
                          <div className="flex items-center gap-1">
                            {log.direction === 'booking_to_google' ? (
                              <>
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Accuro</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Google</span>
                              </>
                            ) : (
                              <>
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Google</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Accuro</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm`}>
                          {getStatusBadge(log.status)}
                        </td>
                        <td className={`px-4 py-3 text-sm max-w-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {log.error || log.details || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* How It Works Card */}
      <Card className={darkMode ? 'bg-navy-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
            <CheckSquare className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>Connect</h4>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Authorize Accuro to access your Google Calendar using OAuth2 secure authentication.
              </p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>Sync</h4>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Bookings are automatically synced to your Google Calendar when created or updated.
              </p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>Manage</h4>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                View and manage all your bookings directly in Google Calendar with color-coded status.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GoogleCalendarSettings;
