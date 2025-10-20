import React, { useState, useEffect } from 'react';
import {
  History,
  Star,
  ShoppingCart,
  FileText,
  Activity,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import reviewService, { Review } from '../services/reviewService';
import quoteService, { Quote } from '../services/quoteService';
import activityLogService, { ActivityLog } from '../services/activityLogService';
import { LoadingSpinner } from './LoadingSpinner';

type TabType = 'reviews' | 'purchases' | 'quotes' | 'activity';

interface AccountHistoryProps {
  className?: string;
}

export function AccountHistory({ className = '' }: AccountHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: TabType) => {
    setLoading(true);
    setError('');

    try {
      switch (tab) {
        case 'reviews':
          const reviewsData = await reviewService.getMyReviews();
          setReviews(reviewsData.data || []);
          break;
        case 'quotes':
          const quotesData = await quoteService.getMyQuotes();
          setQuotes(quotesData.data || []);
          break;
        case 'activity':
          const activityData = await activityLogService.getMyActivityLogs();
          setActivityLogs(activityData.data || []);
          break;
        case 'purchases':
          // Placeholder for future purchase history implementation
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to load ${tab} data`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'reviews' as TabType,
      label: 'Reviews I\'ve Left',
      icon: Star,
      count: reviews.length,
    },
    {
      id: 'purchases' as TabType,
      label: 'Purchase History',
      icon: ShoppingCart,
      count: 0, // Placeholder
    },
    {
      id: 'quotes' as TabType,
      label: 'Quote Requests',
      icon: FileText,
      count: quotes.length,
    },
    {
      id: 'activity' as TabType,
      label: 'Activity Log',
      icon: Activity,
      count: activityLogs.length,
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      pending: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      ),
      sent: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sent
        </span>
      ),
      accepted: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </span>
      ),
      rejected: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </span>
      ),
    };
    return badges[status] || null;
  };

  const renderReviewsTab = () => {
    if (reviews.length === 0) {
      return (
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">
            Complete a booking to leave your first review
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
              <div className="mb-2 md:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-700">
                    {review.rating} stars
                  </span>
                </div>
                {review.company && (
                  <p className="text-sm text-gray-600">
                    Company: <span className="font-medium">{review.company}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {review.isApproved ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Approval
                  </span>
                )}
                {review.isPublic && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Eye className="h-3 w-3 mr-1" />
                    Public
                  </span>
                )}
              </div>
            </div>

            <div className="mb-3">
              <p className="text-gray-700">{review.comment}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <span className="text-xs text-gray-500 capitalize">
                {review.reviewType} Review
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPurchasesTab = () => {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Purchase History Coming Soon
        </h3>
        <p className="text-gray-600">
          This feature will be available in a future update
        </p>
      </div>
    );
  };

  const renderQuotesTab = () => {
    if (quotes.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quote Requests</h3>
          <p className="text-gray-600 mb-4">
            You haven't requested any quotes yet
          </p>
          <a
            href="/quote"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Request a Quote
          </a>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {quotes.map((quote) => (
          <div
            key={quote._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
              <div className="mb-2 md:mb-0">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {quote.company}
                </h4>
                <p className="text-sm text-gray-600">
                  {quote.customerName} • {quote.customerEmail}
                </p>
              </div>
              {getStatusBadge(quote.status)}
            </div>

            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Items:</h5>
              <div className="space-y-2">
                {quote.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-gray-600 text-xs">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                      <p className="text-gray-600 text-xs">
                        ${item.estimatedPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {new Date(quote.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <p className="text-sm font-semibold text-gray-900">
                Total: ${quote.totalEstimatedPrice.toFixed(2)}
              </p>
            </div>

            {quote.message && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 flex items-start gap-1">
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{quote.message}</span>
                </p>
              </div>
            )}

            {quote.adminNotes && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{quote.adminNotes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderActivityTab = () => {
    if (activityLogs.length === 0) {
      return (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
          <p className="text-gray-600">
            Your account activity will appear here
          </p>
        </div>
      );
    }

    const getActivityIcon = (resourceType: string) => {
      switch (resourceType) {
        case 'booking':
          return Calendar;
        case 'review':
          return Star;
        case 'auth':
          return CheckCircle;
        default:
          return Activity;
      }
    };

    const getActivityColor = (resourceType: string) => {
      switch (resourceType) {
        case 'booking':
          return 'text-blue-600 bg-blue-50';
        case 'review':
          return 'text-yellow-600 bg-yellow-50';
        case 'auth':
          return 'text-green-600 bg-green-50';
        default:
          return 'text-gray-600 bg-gray-50';
      }
    };

    return (
      <div className="space-y-3">
        {activityLogs.map((log) => {
          const Icon = getActivityIcon(log.resourceType);
          const colorClass = getActivityColor(log.resourceType);

          return (
            <div
              key={log._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <span className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-100 rounded">
                      {log.resourceType}
                    </span>
                  </div>

                  {log.details && (
                    <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                  )}

                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {new Date(log.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-white" />
          <h2 className="text-xl font-bold text-white">Account History</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        ) : (
          <>
            {activeTab === 'reviews' && renderReviewsTab()}
            {activeTab === 'purchases' && renderPurchasesTab()}
            {activeTab === 'quotes' && renderQuotesTab()}
            {activeTab === 'activity' && renderActivityTab()}
          </>
        )}
      </div>
    </div>
  );
}
