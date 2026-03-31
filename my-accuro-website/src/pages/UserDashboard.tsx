import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductRecommendations } from '../components/ProductRecommendations';
import { AccountHistory } from '../components/AccountHistory';
import { Package, FileText, Calendar, ArrowRight, CheckCircle, X } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with inline stats */}
      <div className="bg-navy-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1">My Dashboard</h1>
              <p className="text-gray-300">
                Welcome back, <span className="font-semibold">{user?.name}</span>
              </p>
            </div>
            {/* Inline stats in header */}
            {!loadingStats && stats && !isNewUser && (
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.bookings.total}</p>
                  <p className="text-xs text-gray-400">Bookings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.bookings.completed}</p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.quotations.total}</p>
                  <p className="text-xs text-gray-400">Quotations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.quotations.approved}</p>
                  <p className="text-xs text-gray-400">Accepted</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Getting Started Checklist - shown only for new users */}
        {!loadingStats && isNewUser && showGettingStarted && (
          <section className="mb-6">
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
                    Step 3: Submit a quotation request and receive your custom quote
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </Link>
                <Link to="/my-quotations" className="flex items-center gap-3 group">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Step 4: Review, accept, or request a revised quotation
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </Link>
                <Link to="/booking" className="flex items-center gap-3 group">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Step 5: Book a consultation and get a technician dispatched
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions - compact row */}
        <section className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/products"
              className="group flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
            >
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Browse Products</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
            </Link>

            <Link
              to="/request-quote"
              className="group flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all duration-200"
            >
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Request a Quote</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
            </Link>

            <Link
              to="/booking"
              className="group flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200"
            >
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Book a Consultation</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
            </Link>
          </div>
        </section>

        {/* Account History - main content area with tabs */}
        <AccountHistory className="mb-8" />

        {/* Product Recommendations */}
        <ProductRecommendations limit={5} />
      </div>
    </div>
  );
}
