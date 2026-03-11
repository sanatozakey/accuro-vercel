import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductRecommendations } from '../components/ProductRecommendations';
import { AccountHistory } from '../components/AccountHistory';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ServiceQuotationProgress } from '../components/ServiceQuotationProgress';
import { Activity, TrendingUp, BarChart3, Package, FileText, Calendar, ArrowRight, CheckCircle, X } from 'lucide-react';
import activityService, { ActivityStats } from '../services/activityService';
import toast from 'react-hot-toast';

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return sessionStorage.getItem('dismissGettingStarted') !== 'true';
  });

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
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const dismissGettingStarted = () => {
    sessionStorage.setItem('dismissGettingStarted', 'true');
    setShowGettingStarted(false);
  };

  const isNewUser = stats?.bookings.total === 0 && stats?.quotations.total === 0;

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
        {/* Quick Actions */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/products"
              className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Browse Products</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Explore our calibration equipment</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200 mt-1" />
              </div>
            </Link>

            <Link
              to="/request-quote"
              className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-emerald-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Request a Quote</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get a custom quotation for your needs</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200 mt-1" />
              </div>
            </Link>

            <Link
              to="/booking"
              className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Book a Consultation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Schedule a meeting with our experts</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200 mt-1" />
              </div>
            </Link>
          </div>
        </section>

        {/* Getting Started Checklist - shown only for new users */}
        {!loadingStats && isNewUser && showGettingStarted && (
          <section className="mb-8">
            <div className="relative bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg shadow-md p-6 border border-blue-200 dark:border-blue-800">
              <button
                onClick={dismissGettingStarted}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Dismiss getting started"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome to Accuro! Here's how to get started:
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Complete these steps to make the most of our platform.</p>
              <div className="space-y-3">
                <Link to="/products" className="flex items-center gap-3 group">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Step 1: Browse our products
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </Link>
                <Link to="/products" className="flex items-center gap-3 group">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Step 2: Add items to your quote list
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </Link>
                <Link to="/request-quote" className="flex items-center gap-3 group">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Step 3: Submit a quotation request
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </Link>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-8">Or:</span>
                  <Link to="/booking" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
                    Book a consultation with our experts
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Service & Quotation Progress Tracking */}
        <ServiceQuotationProgress />

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
