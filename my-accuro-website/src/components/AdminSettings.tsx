import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  Package,
  Settings,
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
  Save,
  Bell,
  Mail,
  Monitor,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { StockBadge } from './StockBadge';
import googleCalendarService, {
  CalendarStatus,
  CalendarStats,
  SyncLog,
} from '../services/googleCalendarService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface AdminSettingsProps {
  darkMode: boolean;
}

type SettingsTab = 'calendar' | 'inventory' | 'notifications';

interface StockSettingsData {
  stockDisplayMode: 'labels_only' | 'exact_quantities';
  defaultLowStockThreshold: number;
}

interface LowStockProduct {
  _id: string;
  name: string;
  category: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock';
  stockLabel: string;
}

export function AdminSettings({ darkMode }: AdminSettingsProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<SettingsTab>('calendar');

  // Calendar state
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Inventory state
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [savingInventory, setSavingInventory] = useState(false);
  const [stockSettings, setStockSettings] = useState<StockSettingsData>({
    stockDisplayMode: 'labels_only',
    defaultLowStockThreshold: 10,
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  // Notification preferences state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewBooking: true,
    emailBookingConfirmed: true,
    emailBookingCancelled: true,
    emailLowStock: true,
    emailDailyDigest: false,
    desktopNotifications: false,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Calendar functions
  const fetchCalendarStatus = useCallback(async () => {
    try {
      const response = await googleCalendarService.getStatus();
      setStatus(response.data);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch calendar status:', error);
    }
  }, []);

  const fetchCalendarLogs = useCallback(async () => {
    try {
      const response = await googleCalendarService.getSyncLogs(20);
      setSyncLogs(response.data);
    } catch (error: any) {
      console.error('Failed to fetch sync logs:', error);
    }
  }, []);

  const fetchCalendarAll = useCallback(async () => {
    setCalendarLoading(true);
    await Promise.all([fetchCalendarStatus(), fetchCalendarLogs()]);
    setCalendarLoading(false);
  }, [fetchCalendarStatus, fetchCalendarLogs]);

  // Inventory functions
  const fetchStockSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/settings/stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setStockSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stock settings:', error);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products/low-stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setLowStockProducts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
    }
  };

  const fetchInventoryAll = useCallback(async () => {
    setInventoryLoading(true);
    await Promise.all([fetchStockSettings(), fetchLowStockProducts()]);
    setInventoryLoading(false);
  }, []);

  useEffect(() => {
    fetchCalendarAll();

    // Check URL params for OAuth callback result
    const urlParams = new URLSearchParams(window.location.search);
    const googleSuccess = urlParams.get('google_success');
    const googleError = urlParams.get('google_error');

    if (googleSuccess === 'true') {
      toast.success('Google Calendar connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (googleError) {
      toast.error(`Google Calendar connection failed: ${googleError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchCalendarAll]);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventoryAll();
    }
  }, [activeTab, fetchInventoryAll]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await googleCalendarService.connect();
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }
    setDisconnecting(true);
    try {
      await googleCalendarService.disconnect();
      toast.success('Google Calendar disconnected');
      await fetchCalendarAll();
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
      await fetchCalendarAll();
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
      await fetchCalendarAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry syncs');
    } finally {
      setRetrying(false);
    }
  };

  const handleSaveInventory = async () => {
    try {
      setSavingInventory(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/settings/stock`,
        stockSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Inventory settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save inventory settings');
    } finally {
      setSavingInventory(false);
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

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className={`flex gap-2 p-1 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white'
              : darkMode
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Google Calendar
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white'
              : darkMode
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Package className="h-4 w-4" />
          Inventory
          {lowStockProducts.length > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 px-1.5">
              {lowStockProducts.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white'
              : darkMode
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifications
        </button>
      </div>

      {/* Google Calendar Tab */}
      {activeTab === 'calendar' && (
        <>
          {calendarLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading calendar settings...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connection Status Card */}
              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${textClass}`}>
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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className={`text-sm ${mutedClass}`}>Synced</div>
                          <div className={`text-2xl font-semibold ${textClass}`}>
                            {stats?.syncedBookings ?? 0}
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className={`text-sm ${mutedClass}`}>Pending</div>
                          <div className={`text-2xl font-semibold ${textClass}`}>
                            {stats?.pendingSyncs ?? 0}
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className={`text-sm ${mutedClass}`}>Failed</div>
                          <div className="text-2xl font-semibold text-red-500">
                            {stats?.failedSyncs ?? 0}
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className={`text-sm ${mutedClass}`}>Last Sync</div>
                          <div className={`text-sm font-medium ${textClass}`}>
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
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <h4 className={`font-medium ${textClass}`}>Not Connected</h4>
                            <p className={`text-sm mt-1 ${mutedClass}`}>
                              Connect your Google Calendar to automatically sync bookings.
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

              {/* Sync Logs */}
              {status?.isConnected && syncLogs.length > 0 && (
                <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                      <Activity className="h-5 w-5" />
                      Sync History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-64">
                      <table className={`min-w-full divide-y ${borderClass}`}>
                        <thead>
                          <tr className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                            <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${mutedClass}`}>Time</th>
                            <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${mutedClass}`}>Booking</th>
                            <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${mutedClass}`}>Action</th>
                            <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${mutedClass}`}>Status</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${borderClass}`}>
                          {syncLogs.slice(0, 10).map((log) => (
                            <tr key={log._id}>
                              <td className={`px-4 py-2 text-sm ${mutedClass}`}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className={`px-4 py-2 text-sm ${textClass}`}>
                                {log.bookingId?.company || '-'}
                              </td>
                              <td className={`px-4 py-2 text-sm capitalize ${mutedClass}`}>
                                {log.action}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {getStatusBadge(log.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          {inventoryLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading inventory settings...</span>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Display Settings */}
              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                    <Settings className="h-5 w-5" />
                    Display Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="displayMode" className={textClass}>Stock Display Mode</Label>
                    <p className={`text-sm mb-2 ${mutedClass}`}>
                      Choose how stock levels are shown to customers
                    </p>
                    <Select
                      value={stockSettings.stockDisplayMode}
                      onValueChange={(value) =>
                        setStockSettings({
                          ...stockSettings,
                          stockDisplayMode: value as 'labels_only' | 'exact_quantities',
                        })
                      }
                    >
                      <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labels_only">Labels Only (In Stock, Low Stock, Out of Stock)</SelectItem>
                        <SelectItem value="exact_quantities">Exact Quantities (5 available)</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm mb-3 ${mutedClass}`}>Preview:</p>
                      <div className="flex flex-wrap gap-3">
                        <StockBadge
                          status="in_stock"
                          label={stockSettings.stockDisplayMode === 'exact_quantities' ? '25 available' : undefined}
                        />
                        <StockBadge
                          status="low_stock"
                          label={stockSettings.stockDisplayMode === 'exact_quantities' ? 'Only 3 left' : undefined}
                        />
                        <StockBadge status="out_of_stock" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="threshold" className={textClass}>Default Low Stock Threshold</Label>
                    <p className={`text-sm mb-2 ${mutedClass}`}>
                      Products at or below this number are marked "Low Stock"
                    </p>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      value={stockSettings.defaultLowStockThreshold}
                      onChange={(e) =>
                        setStockSettings({
                          ...stockSettings,
                          defaultLowStockThreshold: parseInt(e.target.value) || 0,
                        })
                      }
                      className={darkMode ? 'bg-gray-700 border-gray-600' : ''}
                    />
                  </div>

                  <Button onClick={handleSaveInventory} disabled={savingInventory} className="w-full">
                    {savingInventory ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Low Stock Alerts */}
              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Low Stock Alerts
                    {lowStockProducts.length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {lowStockProducts.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockProducts.length === 0 ? (
                    <div className={`text-center py-8 ${mutedClass}`}>
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No products with low stock</p>
                      <p className="text-sm">All tracked products have sufficient inventory</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {lowStockProducts.map((product) => (
                        <div
                          key={product._id}
                          className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${textClass}`}>{product.name}</p>
                            <p className={`text-sm ${mutedClass}`}>{product.category}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-sm font-medium ${textClass}`}>
                                {product.stockQuantity} / {product.lowStockThreshold}
                              </p>
                              <p className={`text-xs ${mutedClass}`}>Stock / Threshold</p>
                            </div>
                            <StockBadge status={product.stockStatus} size="sm" showLabel={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => fetchInventoryAll()}
                    className="w-full mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Email Notifications */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${textClass}`}>New Booking</p>
                    <p className={`text-sm ${mutedClass}`}>Get notified when a new booking is created</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNewBooking}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNewBooking: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${textClass}`}>Booking Confirmed</p>
                    <p className={`text-sm ${mutedClass}`}>Get notified when a booking is confirmed</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailBookingConfirmed}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailBookingConfirmed: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${textClass}`}>Booking Cancelled</p>
                    <p className={`text-sm ${mutedClass}`}>Get notified when a booking is cancelled</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailBookingCancelled}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailBookingCancelled: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${textClass}`}>Low Stock Alert</p>
                    <p className={`text-sm ${mutedClass}`}>Get notified when products are running low</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailLowStock}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailLowStock: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${textClass}`}>Daily Digest</p>
                    <p className={`text-sm ${mutedClass}`}>Receive a daily summary of all activities</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailDailyDigest}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailDailyDigest: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Notifications */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                <Monitor className="h-5 w-5" />
                Desktop Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div>
                  <p className={`font-medium ${textClass}`}>Enable Desktop Notifications</p>
                  <p className={`text-sm ${mutedClass}`}>Show browser notifications for important events</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.desktopNotifications}
                  onChange={(e) => {
                    if (e.target.checked && 'Notification' in window) {
                      Notification.requestPermission().then((permission) => {
                        if (permission === 'granted') {
                          setNotificationSettings(prev => ({ ...prev, desktopNotifications: true }));
                          toast.success('Desktop notifications enabled');
                        } else {
                          toast.error('Please allow notifications in your browser settings');
                        }
                      });
                    } else {
                      setNotificationSettings(prev => ({ ...prev, desktopNotifications: false }));
                    }
                  }}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              {!('Notification' in window) && (
                <p className={`text-sm mt-2 ${mutedClass}`}>
                  Desktop notifications are not supported in this browser.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={() => {
              setSavingNotifications(true);
              // Save to localStorage for now (backend integration can be added later)
              localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
              setTimeout(() => {
                setSavingNotifications(false);
                toast.success('Notification preferences saved');
              }, 500);
            }}
            disabled={savingNotifications}
            className="w-full"
          >
            {savingNotifications ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Notification Preferences
          </Button>

          <p className={`text-sm text-center ${mutedClass}`}>
            Note: Email notifications require backend email service configuration.
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;
