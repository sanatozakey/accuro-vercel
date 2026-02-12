import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Smartphone,
  Key,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

interface TwoFactorSetupProps {
  darkMode?: boolean;
}

export function TwoFactorSetup({ darkMode = false }: TwoFactorSetupProps) {
  const [status, setStatus] = useState<{ enabled: boolean; backupCodesRemaining: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup state
  const [setupStep, setSetupStep] = useState<'idle' | 'setup' | 'verify' | 'backup'>('idle');
  const [secret, setSecret] = useState<string | null>(null);
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Regenerate backup codes state
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [regenerateLoading, setRegenerateLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/2fa/status');
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/2fa/setup');
      if (response.data.success) {
        setSecret(response.data.data.secret);
        setOtpAuthUri(response.data.data.otpAuthUri);
        setSetupStep('setup');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/2fa/verify', { token: verificationCode });
      if (response.data.success) {
        setBackupCodes(response.data.data.backupCodes);
        setSetupStep('backup');
        setStatus({ enabled: true, backupCodesRemaining: 10 });
        setSuccess('Two-factor authentication enabled successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      setDisableLoading(true);
      setError(null);
      const response = await api.post('/auth/2fa/disable', {
        password: disablePassword,
        token: disableCode || undefined,
      });
      if (response.data.success) {
        setStatus({ enabled: false, backupCodesRemaining: 0 });
        setShowDisableModal(false);
        setDisablePassword('');
        setDisableCode('');
        setSuccess('Two-factor authentication disabled');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRegenerateBackup = async () => {
    try {
      setRegenerateLoading(true);
      setError(null);
      const response = await api.post('/auth/2fa/regenerate-backup', {
        password: regeneratePassword,
      });
      if (response.data.success) {
        setBackupCodes(response.data.data.backupCodes);
        setSetupStep('backup');
        setShowRegenerateModal(false);
        setRegeneratePassword('');
        fetchStatus();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate backup codes');
    } finally {
      setRegenerateLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading && !status) {
    return (
      <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin mr-2" size={20} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
            <Shield className="text-green-500" size={24} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Two-Factor Authentication
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add an extra layer of security to your account
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Alerts */}
        {error && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
            <AlertTriangle size={18} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-600'}`}>
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {/* Status Display */}
        {status && setupStep === 'idle' && (
          <div className={`p-4 rounded-lg mb-4 ${
            status.enabled
              ? darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
              : darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {status.enabled ? 'Enabled' : 'Not enabled'}
                </span>
              </div>
              {status.enabled && (
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {status.backupCodesRemaining} backup codes remaining
                </span>
              )}
            </div>
          </div>
        )}

        {/* Setup Flow */}
        {setupStep === 'idle' && !status?.enabled && (
          <div>
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
            </p>
            <button
              onClick={handleSetup}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Smartphone size={18} />
              Enable Two-Factor Authentication
            </button>
          </div>
        )}

        {setupStep === 'setup' && secret && (
          <div className="space-y-4">
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Step 1: Scan QR Code
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            {/* QR Code */}
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {otpAuthUri && (
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white rounded-lg">
                    <QRCodeSVG value={otpAuthUri} size={180} />
                  </div>
                </div>
              )}
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Or enter this secret key manually:
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className={`font-mono text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {secret}
                </code>
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <h3 className={`font-medium mt-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Step 2: Verify Code
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter the 6-digit code from your authenticator app
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className={`flex-1 px-4 py-2 text-center text-2xl font-mono tracking-widest rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || loading}
                className={`px-4 py-2 rounded-lg font-medium ${
                  verificationCode.length !== 6 || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Verify'}
              </button>
            </div>

            <button
              onClick={() => setSetupStep('idle')}
              className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Cancel
            </button>
          </div>
        )}

        {setupStep === 'backup' && backupCodes.length > 0 && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    Save Your Backup Codes
                  </h4>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Store these codes in a safe place. You can use them to access your account if you lose your phone.
                    Each code can only be used once.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg font-mono text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Copy size={18} />
              Copy All Codes
            </button>

            <button
              onClick={() => {
                setSetupStep('idle');
                setBackupCodes([]);
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Done
            </button>
          </div>
        )}

        {/* Actions when enabled */}
        {status?.enabled && setupStep === 'idle' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowRegenerateModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Key size={18} />
              New Backup Codes
            </button>
            <button
              onClick={() => setShowDisableModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X size={18} />
              Disable 2FA
            </button>
          </div>
        )}
      </div>

      {/* Disable Modal */}
      {showDisableModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDisableModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Disable Two-Factor Authentication
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      2FA Code (optional)
                    </label>
                    <input
                      type="text"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDisableModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable}
                    disabled={!disablePassword || disableLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {disableLoading ? 'Disabling...' : 'Disable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowRegenerateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Generate New Backup Codes
                </h3>
                <p className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This will invalidate your existing backup codes and generate new ones.
                </p>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={regeneratePassword}
                    onChange={(e) => setRegeneratePassword(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRegenerateModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerateBackup}
                    disabled={!regeneratePassword || regenerateLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {regenerateLoading ? 'Generating...' : 'Generate'}
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
