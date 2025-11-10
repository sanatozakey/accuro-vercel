import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProductRecommendations } from '../components/ProductRecommendations';
import { AccountHistory } from '../components/AccountHistory';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ServiceQuotationProgress } from '../components/ServiceQuotationProgress';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';
import activityService, { ActivityStats } from '../services/activityService';
import toast from 'react-hot-toast';

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await activityService.getActivityStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      // Don't show error toast, just fail silently
    } finally {
      setLoadingStats(false);
    }
  };

  const bookingCompletionRate = stats && stats.bookings.total > 0
    ? (stats.bookings.completed / stats.bookings.total) * 100
    : 0;

  const quotationApprovalRate = stats && stats.quotations.total > 0
    ? (stats.quotations.approved / stats.quotations.total) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-gray-300">
            Welcome back, <span className="font-semibold">{user?.name}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Product Recommendations */}
        <ProductRecommendations limit={5} />

        {/* Analytics Overview */}
        {!loadingStats && stats && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Analytics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Booking Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Booking Progress
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {bookingCompletionRate.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${bookingCompletionRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-blue-600">{stats.bookings.completed}</p>
                    <p className="text-gray-600 dark:text-gray-400">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-yellow-600">{stats.bookings.pending}</p>
                    <p className="text-gray-600 dark:text-gray-400">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 dark:text-white">{stats.bookings.total}</p>
                    <p className="text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
              </div>

              {/* Quotation Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Quotation Success
                  </h3>
                  <span className="text-2xl font-bold text-green-600">
                    {quotationApprovalRate.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${quotationApprovalRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-green-600">{stats.quotations.approved}</p>
                    <p className="text-gray-600 dark:text-gray-400">Approved</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-yellow-600">{stats.quotations.pending}</p>
                    <p className="text-gray-600 dark:text-gray-400">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 dark:text-white">{stats.quotations.total}</p>
                    <p className="text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Service & Quotation Progress Tracking */}
        <ServiceQuotationProgress />

        {/* Activity Timeline Section */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <ActivityTimeline />
          </div>
        </section>

        {/* Account History Section - Now includes all user data in tabs */}
        <AccountHistory className="mb-8" />
      </div>
    </div>
  );
}
