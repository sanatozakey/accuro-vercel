import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle, RefreshCw, Eye, User, X, Search } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

interface BulkEmailPanelProps {
  darkMode?: boolean;
}

type RecipientFilter = 'all' | 'verified' | 'unverified' | 'admins';
type EmailMode = 'individual' | 'bulk';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Users', description: 'Send to all registered users' },
  { value: 'verified', label: 'Verified Users', description: 'Only users with verified emails' },
  { value: 'unverified', label: 'Unverified Users', description: 'Only users without verified emails' },
  { value: 'admins', label: 'Admins Only', description: 'Only admin and superadmin users' },
];

interface EmailProgress {
  sent: number;
  failed: number;
  total: number;
  currentEmail?: string;
  error?: string;
}

interface UserSuggestion {
  _id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
}

export function BulkEmailPanel({ darkMode = false }: BulkEmailPanelProps) {
  const [mode, setMode] = useState<EmailMode>('individual');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('verified');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewSample, setPreviewSample] = useState<{ email: string; name: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState<EmailProgress | null>(null);
  const { socket } = useSocket();

  // Individual mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<UserSuggestion | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Listen for real-time bulk email progress
  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data: EmailProgress) => {
      setProgress(data);
    };

    const handleComplete = (data: EmailProgress) => {
      setProgress(null);
      if (data.error) {
        setError(`Email sending failed: ${data.error}`);
      } else if (data.failed > 0) {
        setSuccess(`Done! ${data.sent} of ${data.total} emails sent successfully. ${data.failed} failed.`);
      } else {
        setSuccess(`All ${data.sent} emails sent successfully!`);
      }
    };

    socket.on('bulk-email-progress', handleProgress);
    socket.on('bulk-email-complete', handleComplete);

    return () => {
      socket.off('bulk-email-progress', handleProgress);
      socket.off('bulk-email-complete', handleComplete);
    };
  }, [socket]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced user search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchQuery.trim() || searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await api.get('/email/search-users', {
          params: { q: searchQuery.trim() },
        });
        if (response.data.success) {
          setSuggestions(response.data.data);
          setShowSuggestions(response.data.data.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (mode === 'bulk') fetchPreview();
  }, [recipientFilter, mode]);

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

  const selectRecipient = (user: UserSuggestion) => {
    setSelectedRecipient(user);
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const clearRecipient = () => {
    setSelectedRecipient(null);
    setSearchQuery('');
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      setError('Please fill in both subject and content');
      return;
    }

    if (mode === 'individual' && !selectedRecipient) {
      setError('Please select a recipient');
      return;
    }

    if (mode === 'bulk' && previewCount === 0) {
      setError('No recipients match the selected filter');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'individual') {
        const response = await api.post('/email/individual', {
          subject,
          content,
          recipientEmail: selectedRecipient!.email,
          recipientName: selectedRecipient!.name,
        });

        if (response.data.success) {
          setSuccess(`Email sent successfully to ${selectedRecipient!.name} (${selectedRecipient!.email})`);
          setSubject('');
          setContent('');
          setSelectedRecipient(null);
        }
      } else {
        const response = await api.post('/email/bulk', {
          subject,
          content,
          recipientFilter,
        });

        if (response.data.success) {
          const { totalRecipients } = response.data.data;
          setProgress({ sent: 0, failed: 0, total: totalRecipients });
          setSubject('');
          setContent('');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const recipientCount = mode === 'individual' ? (selectedRecipient ? 1 : 0) : (previewCount || 0);
  const canSend = subject.trim() && content.trim() && recipientCount > 0 && !loading;

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
              Email
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Send emails to individual users or in bulk
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Mode Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => { setMode('individual'); setError(null); setSuccess(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
              mode === 'individual'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User size={16} />
            Individual
          </button>
          <button
            onClick={() => { setMode('bulk'); setError(null); setSuccess(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
              mode === 'bulk'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={16} />
            Bulk
          </button>
        </div>

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

        {/* Live Progress Tracker */}
        {progress && (
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="animate-spin text-blue-500" size={16} />
                <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Sending emails...
                </span>
              </div>
              <span className={`text-sm font-mono ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                {progress.sent + progress.failed} of {progress.total}
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-blue-100'}`}>
              <div
                className="h-2.5 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {progress.sent} sent
              </span>
              {progress.failed > 0 && (
                <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {progress.failed} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========== INDIVIDUAL MODE: Recipient Search ========== */}
        {mode === 'individual' && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Recipient
            </label>

            {selectedRecipient ? (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-700'
                  }`}>
                    {selectedRecipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedRecipient.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedRecipient.email}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedRecipient.role === 'superadmin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : selectedRecipient.role === 'admin'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {selectedRecipient.role}
                  </span>
                </div>
                <button
                  onClick={clearRecipient}
                  className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition`}
                >
                  <X size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
            ) : (
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder="Search by name or email..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {searchLoading && (
                    <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <div className={`absolute z-20 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                    {suggestions.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => selectRecipient(user)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                          darkMode
                            ? 'hover:bg-gray-600 border-b border-gray-600 last:border-b-0'
                            : 'hover:bg-blue-50 border-b border-gray-100 last:border-b-0'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {highlightMatch(user.name, searchQuery)}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                              user.role === 'superadmin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                : user.role === 'admin'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {highlightMatch(user.email, searchQuery)}
                          </p>
                        </div>
                        {user.isEmailVerified && (
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== BULK MODE: Recipient Filter ========== */}
        {mode === 'bulk' && (
          <>
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
          </>
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
          disabled={!canSend}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
            !canSend
              ? 'opacity-50 cursor-not-allowed bg-gray-500 text-white'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              {mode === 'individual'
                ? selectedRecipient
                  ? `Send to ${selectedRecipient.name}`
                  : 'Select a recipient'
                : `Send to ${previewCount || 0} recipients`
              }
            </>
          )}
        </button>

        {/* Warning */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            <strong>Warning:</strong> {mode === 'bulk' ? 'Bulk emails cannot be undone.' : 'Emails cannot be unsent.'} Please verify your content and recipient{mode === 'bulk' ? ' selection' : ''} before sending.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Highlights the matching portion of text */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
