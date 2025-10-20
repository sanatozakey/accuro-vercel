import React, { useState, useEffect } from 'react';
import { X, User, Calendar, ShoppingCart, FileText, Star, Activity, Loader } from 'lucide-react';
import userService from '../services/userService';
import { AccountHistory } from './AccountHistory';

interface UserHistoryModalProps {
  userId: string;
  userName: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserHistoryModal({
  userId,
  userName,
  userEmail,
  isOpen,
  onClose,
}: UserHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserHistory();
    }
  }, [isOpen, userId]);

  const fetchUserHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getUserHistory(userId);
      console.log('User history response:', response);
      setHistoryData(response.data);
    } catch (err: any) {
      console.error('Failed to load user history:', err);
      console.error('Error details:', err.response?.data);
      // Set error message to show to user
      setError(err.response?.data?.message || 'Failed to load user history. Please try again.');
      // Still set empty data so the UI doesn't break
      setHistoryData({
        summary: {
          totalBookings: 0,
          totalPurchases: 0,
          totalQuotes: 0,
          totalReviews: 0,
          totalSpent: 0,
          averageRating: 0,
        },
        activityLogs: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">{userName}'s Account History</h2>
                <p className="text-blue-100 text-sm">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Loading user history...</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            ) : historyData ? (
              <div className="p-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Bookings</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {historyData.summary?.totalBookings || 0}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Purchases</p>
                        <p className="text-2xl font-bold text-green-900">
                          {historyData.summary?.totalPurchases || 0}
                        </p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Quotes</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {historyData.summary?.totalQuotes || 0}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Reviews</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {historyData.summary?.totalReviews || 0}
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${(historyData.summary?.totalSpent || 0).toFixed(2)}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Average Rating */}
                {historyData.summary?.averageRating > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600">Average Review Rating</p>
                        <p className="text-xl font-bold text-gray-900">
                          {historyData.summary.averageRating.toFixed(1)} / 5.0
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account History Component - This will handle tabs */}
                <div className="mt-6">
                  {historyData.summary.totalBookings === 0 &&
                   historyData.summary.totalPurchases === 0 &&
                   historyData.summary.totalQuotes === 0 &&
                   historyData.summary.totalReviews === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                      <Activity className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                      <p className="text-lg font-medium text-blue-900 mb-2">No Activity Yet</p>
                      <p className="text-sm text-blue-700">
                        {userName} hasn't made any bookings, purchases, or quote requests yet.
                        Their activity will appear here once they start using the platform.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-4 italic">
                        Note: This view shows {userName}'s complete account history including bookings, purchases, quotes, reviews, and activity logs.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Admin View:</strong> The statistics above show {userName}'s complete history summary.
                          To view detailed records, you can access the user's individual booking, purchase, quote, and review records
                          from their respective management sections in the admin dashboard.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Activity Preview */}
                {historyData.activityLogs && historyData.activityLogs.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Recent Activity (Last 10)
                    </h3>
                    <div className="space-y-2">
                      {historyData.activityLogs.slice(0, 10).map((log: any) => (
                        <div
                          key={log._id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{log.action}</p>
                              {log.details && (
                                <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-200 rounded">
                              {log.resourceType}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-600">
                No history data available
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
