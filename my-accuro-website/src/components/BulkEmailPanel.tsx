import React, { useState, useEffect } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import api from '../services/api';

interface BulkEmailPanelProps {
  darkMode?: boolean;
}

type RecipientFilter = 'all' | 'verified' | 'unverified' | 'admins';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Users', description: 'Send to all registered users' },
  { value: 'verified', label: 'Verified Users', description: 'Only users with verified emails' },
  { value: 'unverified', label: 'Unverified Users', description: 'Only users without verified emails' },
  { value: 'admins', label: 'Admins Only', description: 'Only admin and superadmin users' },
];

export function BulkEmailPanel({ darkMode = false }: BulkEmailPanelProps) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('verified');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewSample, setPreviewSample] = useState<{ email: string; name: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [recipientFilter]);

  const fetchPreview = async () => {
    try {
      const response = await api.get('/email/preview-recipients', {
        params: { filter: recipientFilter },
      });
      if (response.data.success) {
        setPreviewCount(response.data.data.count);
        setPreviewSample(response.data.data.sample);
      }
    } catch (err) {
      setPreviewCount(null);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      setError('Please fill in both subject and content');
      return;
    }

    if (previewCount === 0) {
      setError('No recipients match the selected filter');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/email/bulk', {
        subject,
        content,
        recipientFilter,
      });

      if (response.data.success) {
        const { sent, failed } = response.data.data;
        setSuccess(`Successfully sent ${sent} emails. ${failed > 0 ? `${failed} failed.` : ''}`);
        setSubject('');
        setContent('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
            <Mail className="text-purple-500" size={24} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Bulk Email
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Send emails to multiple users at once
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-600'}`}>
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {/* Recipient Filter */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Recipients
          </label>
          <div className="grid grid-cols-2 gap-3">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRecipientFilter(option.value as RecipientFilter)}
                className={`p-3 rounded-lg border text-left transition ${
                  recipientFilter === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : darkMode
                    ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {option.label}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Recipients */}
        {previewCount !== null && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {previewCount} recipients
                </span>
              </div>
              {previewSample.length > 0 && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  <Eye size={16} />
                  {showPreview ? 'Hide' : 'Show'} sample
                </button>
              )}
            </div>
            {showPreview && previewSample.length > 0 && (
              <div className={`mt-2 space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {previewSample.map((user, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{user.name}</span>
                    <span className="text-xs opacity-75">{user.email}</span>
                  </div>
                ))}
                {previewCount > 5 && (
                  <div className="text-xs opacity-50">... and {previewCount - 5} more</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Subject */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
            className={`w-full px-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Content */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Email Content
          </label>
          <div className={`mb-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Use {'{{name}}'} to personalize with recipient's name. HTML is supported.
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder={`Hello {{name}},\n\nYour email content here...\n\nBest regards,\nThe Accuro Team`}
            className={`w-full px-4 py-3 rounded-lg border font-mono text-sm ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading || !subject.trim() || !content.trim() || previewCount === 0}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
            loading || !subject.trim() || !content.trim() || previewCount === 0
              ? 'opacity-50 cursor-not-allowed bg-gray-500'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              Sending emails...
            </>
          ) : (
            <>
              <Send size={18} />
              Send to {previewCount || 0} recipients
            </>
          )}
        </button>

        {/* Warning */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            <strong>Warning:</strong> Bulk emails cannot be undone. Please verify your content and recipient selection before sending.
          </p>
        </div>
      </div>
    </div>
  );
}
