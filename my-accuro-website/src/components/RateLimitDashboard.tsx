import React, { useState, useEffect } from 'react';
import { Shield, Clock, Hash, Info, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface RateLimitDashboardProps {
  darkMode?: boolean;
}

interface RateLimitConfig {
  id: string;
  name: string;
  windowMs: number;
  max: number;
  description: string;
  windowMinutes: number;
  windowFormatted: string;
}

export function RateLimitDashboard({ darkMode = false }: RateLimitDashboardProps) {
  const [config, setConfig] = useState<RateLimitConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/rate-limits/config');
      if (response.data.success) {
        setConfig(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch rate limit configuration');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'login':
      case 'register':
      case 'passwordReset':
        return <Shield className="text-blue-500" size={20} />;
      case 'contactForm':
      case 'booking':
      case 'quoteRequest':
        return <Hash className="text-green-500" size={20} />;
      default:
        return <Clock className="text-purple-500" size={20} />;
    }
  };

  const getCategoryColor = (id: string) => {
    switch (id) {
      case 'login':
      case 'register':
      case 'passwordReset':
        return darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200';
      case 'contactForm':
      case 'booking':
      case 'quoteRequest':
        return darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200';
      default:
        return darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className={`animate-spin mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading rate limits...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
              <Shield className="text-orange-500" size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                API Rate Limits
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Security rate limiting configuration for all endpoints
              </p>
            </div>
          </div>
          <button
            onClick={fetchConfig}
            className={`p-2 rounded-lg transition ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
          darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'
        }`}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Rate Limits Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.map((limit) => (
          <div
            key={limit.id}
            className={`p-4 rounded-lg border ${getCategoryColor(limit.id)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {getCategoryIcon(limit.id)}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {limit.name}
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {limit.description}
                </p>
                <div className={`flex items-center gap-4 mt-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-center gap-1">
                    <Hash size={14} />
                    <span className="font-semibold">{limit.max}</span>
                    <span className="text-xs opacity-75">requests</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span className="font-semibold">{limit.windowFormatted}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className={`mx-6 mb-6 p-4 rounded-lg ${
        darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-start gap-3">
          <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className={`font-medium ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              How Rate Limiting Works
            </h4>
            <p className={`text-sm mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Rate limits help protect the API from abuse and ensure fair usage for all users.
              When a limit is exceeded, requests will receive a 429 (Too Many Requests) error.
              The limit resets after the specified time window passes.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Legend */}
      <div className={`px-6 pb-6`}>
        <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Categories
        </h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500" size={16} />
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Authentication
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Hash className="text-green-500" size={16} />
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              User Actions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-purple-500" size={16} />
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              General API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
