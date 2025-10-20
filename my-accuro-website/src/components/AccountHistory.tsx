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
  Package,
  MapPin,
  Truck,
  DollarSign,
} from 'lucide-react';
import reviewService, { Review } from '../services/reviewService';
import quoteService, { Quote } from '../services/quoteService';
import activityLogService, { ActivityLog } from '../services/activityLogService';
import bookingService, { Booking } from '../services/bookingService';
import purchaseHistoryService, { PurchaseHistory } from '../services/purchaseHistoryService';
import { LoadingSpinner } from './LoadingSpinner';

type TabType = 'bookings' | 'purchases' | 'quotes' | 'reviews' | 'activity';

interface AccountHistoryProps {
  className?: string;
  userId?: string; // Optional userId for admin viewing other users
}

export function AccountHistory({ className = '', userId }: AccountHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, userId]);

  const loadTabData = async (tab: TabType) => {
    setLoading(true);
    setError('');

    try {
      switch (tab) {
        case 'bookings':
          const bookingsData = await bookingService.getMyBookings();
          setBookings(bookingsData.data || []);
          break;
        case 'purchases':
          const purchasesData = await purchaseHistoryService.getMyPurchases();
          setPurchases(purchasesData.data || []);
          break;
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
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to load ${tab} data`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'bookings' as TabType,
      label: 'My Bookings',
      icon: Calendar,
      count: bookings.length,
    },
    {
      id: 'purchases' as TabType,
      label: 'Purchase History',
      icon: ShoppingCart,
      count: purchases.length,
    },
    {
      id: 'quotes' as TabType,
      label: 'Quote Requests',
      icon: FileText,
      count: quotes.length,
    },
    {
      id: 'reviews' as TabType,
      label: 'My Reviews',
      icon: Star,
      count: reviews.length,
    },
    {
      id: 'activity' as TabType,
      label: 'Activity Log',
      icon: Activity,
      count: activityLogs.length,
    },
  ];

  const getBookingStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      pending: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      ),
      confirmed: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </span>
      ),
      completed: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      ),
      cancelled: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      ),
      rescheduled: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Clock className="h-3 w-3 mr-1" />
          Rescheduled
        </span>
      ),
    };
    return badges[status] || null;
  };

  const getQuoteStatusBadge = (status: string) => {
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

  const getOrderStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      processing: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </span>
      ),
      shipped: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Truck className="h-3 w-3 mr-1" />
          Shipped
        </span>
      ),
      delivered: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Delivered
        </span>
      ),
      cancelled: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      ),
      returned: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Returned
        </span>
      ),
    };
    return badges[status] || null;
  };

  const renderBookingsTab = () => {
    if (bookings.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't created any bookings yet
          </p>
          <a
            href="/booking"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Booking
          </a>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
              <div className="mb-2 md:mb-0">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {booking.company || 'Booking'}
                </h4>
                <p className="text-sm text-gray-600">
                  {booking.product}
                </p>
              </div>
              {getBookingStatusBadge(booking.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>
                  {new Date(booking.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{booking.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Package className="h-4 w-4 text-blue-600" />
                <span>Booking ID: {booking._id.slice(-8)}</span>
              </div>
            </div>

            {booking.message && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 flex items-start gap-1">
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{booking.message}</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPurchasesTab = () => {
    if (purchases.length === 0) {
      return (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Purchase History
          </h3>
          <p className="text-gray-600">
            Your purchase history will appear here once you make your first purchase
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {purchases.map((purchase) => (
          <div
            key={purchase._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
              <div className="mb-2 md:mb-0">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  Order #{purchase.orderNumber}
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(purchase.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1">
                {getOrderStatusBadge(purchase.orderStatus)}
                <span className="text-sm text-gray-600 capitalize">
                  Payment: {purchase.paymentStatus}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Items:</h5>
              <div className="space-y-2">
                {purchase.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-gray-600 text-xs">
                        {item.category} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-gray-600 text-xs">
                        ${item.unitPrice.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm text-gray-900">${purchase.subtotal.toFixed(2)}</span>
              </div>
              {purchase.tax > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="text-sm text-gray-900">${purchase.tax.toFixed(2)}</span>
                </div>
              )}
              {purchase.shippingCost > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Shipping:</span>
                  <span className="text-sm text-gray-900">${purchase.shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-base font-bold text-blue-600">
                  ${purchase.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {purchase.trackingNumber && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Tracking:</span>
                  <span className="font-mono">{purchase.trackingNumber}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
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
              {getQuoteStatusBadge(quote.status)}
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
        case 'quote':
          return FileText;
        case 'purchase':
          return ShoppingCart;
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
        case 'quote':
          return 'text-purple-600 bg-purple-50';
        case 'purchase':
          return 'text-green-600 bg-green-50';
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
            {activeTab === 'bookings' && renderBookingsTab()}
            {activeTab === 'purchases' && renderPurchasesTab()}
            {activeTab === 'reviews' && renderReviewsTab()}
            {activeTab === 'quotes' && renderQuotesTab()}
            {activeTab === 'activity' && renderActivityTab()}
          </>
        )}
      </div>
    </div>
  );
}
