import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Globe, Trash2, LogOut, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import authService, { Session } from '../services/authService';

interface SessionManagementProps {
  darkMode?: boolean;
}

export function SessionManagement({ darkMode = false }: SessionManagementProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.getSessions();
      if (response.success) {
        setSessions(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId);
      await authService.revokeSession(sessionId);
      setSessions(sessions.filter((s) => s._id !== sessionId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    await authService.logoutAll();
  };

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent) return { browser: 'Unknown', device: 'Unknown' };

    let browser = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // Detect device
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'Mobile';
    else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'Tablet';

    return { browser, device };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    // Less than 24 hours
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    // Otherwise show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'Mobile') return <Smartphone size={20} />;
    return <Monitor size={20} />;
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className={`animate-spin mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Shield className="text-blue-500" size={24} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Active Sessions
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your logged-in devices
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            className={`p-2 rounded-lg transition ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          {sessions.length > 1 && (
            <button
              onClick={() => setShowLogoutAllConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              <LogOut size={16} />
              Sign out all
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'
        }`}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Monitor className="mx-auto mb-2 opacity-50" size={32} />
            <p>No active sessions found</p>
          </div>
        ) : (
          sessions.map((session, index) => {
            const { browser, device } = parseUserAgent(session.userAgent);
            const isCurrentSession = index === 0; // First session is usually the current one

            return (
              <div
                key={session._id}
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  darkMode
                    ? isCurrentSession
                      ? 'bg-blue-900/20 border-blue-700'
                      : 'bg-gray-700/50 border-gray-600'
                    : isCurrentSession
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      darkMode ? 'bg-gray-600' : 'bg-white border border-gray-200'
                    }`}
                  >
                    {getDeviceIcon(device)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {browser} on {device}
                      </span>
                      {isCurrentSession && (
                        <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {session.ipAddress && (
                        <>
                          <Globe size={14} />
                          <span>{session.ipAddress}</span>
                          <span className="mx-1">-</span>
                        </>
                      )}
                      <span>Signed in {formatDate(session.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {!isCurrentSession && (
                  <button
                    onClick={() => revokeSession(session._id)}
                    disabled={revokingId === session._id}
                    className={`p-2 rounded-lg transition ${
                      darkMode
                        ? 'text-red-400 hover:bg-red-900/30'
                        : 'text-red-500 hover:bg-red-50'
                    } ${revokingId === session._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Revoke session"
                  >
                    {revokingId === session._id ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Security Note */}
      <div className={`mt-4 p-3 rounded-lg text-sm ${
        darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'
      }`}>
        <strong>Security tip:</strong> If you see any unfamiliar sessions, revoke them immediately and change your password.
      </div>

      {/* Logout All Confirmation Modal */}
      {showLogoutAllConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowLogoutAllConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                    <AlertTriangle className="text-red-500" size={24} />
                  </div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Sign out everywhere?
                  </h3>
                </div>
                <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  This will sign you out of all devices including this one. You'll need to sign in again.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutAllConfirm(false)}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogoutAll}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Sign out everywhere
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
