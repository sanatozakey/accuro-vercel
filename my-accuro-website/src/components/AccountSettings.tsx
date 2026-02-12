import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Send,
} from 'lucide-react';
import api from '../services/api';
import authService from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { TwoFactorSetup } from './TwoFactorSetup';

interface AccountSettingsProps {
  darkMode?: boolean;
}

export function AccountSettings({ darkMode = false }: AccountSettingsProps) {
  const { user, updateUser } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Email verification state
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.updatePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setVerificationLoading(true);
      setVerificationError(null);
      setVerificationSuccess(null);

      await api.post('/auth/resend-verification', { email: user?.email });
      setVerificationSuccess('Verification email sent! Please check your inbox.');
      setTimeout(() => setVerificationSuccess(null), 5000);
    } catch (err: any) {
      setVerificationError(err.response?.data?.message || 'Failed to send verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);

      // Request account deletion
      await api.post('/auth/delete-account-request', { password: deletePassword });

      // Show success and logout
      alert('Account deletion request submitted. You will receive an email with further instructions.');
      await authService.logout();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to submit deletion request');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Lock className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Change Password
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Update your password to keep your account secure
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          {passwordError && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
              <AlertTriangle size={18} />
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-600'}`}>
              <CheckCircle size={18} />
              {passwordSuccess}
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500`}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              New Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Confirm New Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
              passwordLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {passwordLoading ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              <>
                <Shield size={18} />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* Email Verification Section */}
      {user && !user.isEmailVerified && (
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                <Mail className="text-yellow-500" size={24} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Email Verification
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your email address is not verified
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {verificationError && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
                <AlertTriangle size={18} />
                {verificationError}
              </div>
            )}
            {verificationSuccess && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-600'}`}>
                <CheckCircle size={18} />
                {verificationSuccess}
              </div>
            )}

            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                A verification email was sent to <strong>{user.email}</strong>.
                Check your inbox and spam folder. If you didn't receive it, you can request a new one.
              </p>
            </div>

            <button
              onClick={handleResendVerification}
              disabled={verificationLoading}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                verificationLoading
                  ? 'opacity-50 cursor-not-allowed bg-gray-500'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {verificationLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Resend Verification Email
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Verified Badge */}
      {user && user.isEmailVerified && (
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <CheckCircle className="text-green-500" size={24} />
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Email Verified
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your email address ({user.email}) is verified
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Section */}
      <TwoFactorSetup darkMode={darkMode} />

      {/* Account Deletion Section */}
      <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-red-900/50' : 'bg-white border-red-200'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <Trash2 className="text-red-500" size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Account
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Permanently delete your account and all associated data
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
              <strong>Warning:</strong> This action is irreversible. All your data, including bookings,
              reviews, and account information will be permanently deleted.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <Trash2 size={18} />
            Request Account Deletion
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                    <AlertTriangle className="text-red-500" size={24} />
                  </div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Confirm Account Deletion
                  </h3>
                </div>

                {deleteError && (
                  <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
                    {deleteError}
                  </div>
                )}

                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Please enter your password to confirm account deletion. This action cannot be undone.
                </p>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={`w-full mb-4 px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-red-500`}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || !deletePassword}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      deleteLoading || !deletePassword
                        ? 'opacity-50 cursor-not-allowed bg-red-400'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {deleteLoading ? (
                      <RefreshCw className="animate-spin mx-auto" size={18} />
                    ) : (
                      'Delete My Account'
                    )}
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
