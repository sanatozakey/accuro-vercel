import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  ThumbsDown,
  X,
  User,
  Phone,
  Mail,
  Building,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import reviewService, { Review } from '../services/reviewService';
import quotationService, { Quotation } from '../services/quotationService';
import activityLogService, { ActivityLog } from '../services/activityLogService';
import bookingService, { Booking } from '../services/bookingService';
import { LoadingSpinner } from './LoadingSpinner';

type TabType = 'bookings' | 'quotes' | 'reviews' | 'activity';

interface AccountHistoryProps {
  className?: string;
  userId?: string; // Optional userId for admin viewing other users
}

export function AccountHistory({ className = '', userId }: AccountHistoryProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Pagination
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Booking details modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Quotation details modal state
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Handle URL parameters for tab and bookingId
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['bookings', 'quotes', 'reviews', 'activity'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle bookingId URL parameter to auto-open modal
  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (bookingId && bookings.length > 0) {
      const booking = bookings.find(b => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setIsDetailModalOpen(true);
        // Clear bookingId from URL after opening modal
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('bookingId');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [bookings, searchParams, setSearchParams]);

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
        case 'reviews':
          const reviewsData = await reviewService.getMyReviews();
          setReviews(reviewsData.data || []);
          break;
        case 'quotes':
          const quotationsData = await quotationService.getQuotations({});
          setQuotations(quotationsData.data || []);
          break;
        case 'activity':
          const activityData = await activityLogService.getMyActivityLogs();
          setActivityLogs(activityData.data || []);
          break;
      }
    } catch (err: any) {
      // Instead of showing error, just set empty data arrays
      // The render methods will show friendly "no data" messages
      switch (tab) {
        case 'bookings':
          setBookings([]);
          break;
        case 'reviews':
          setReviews([]);
          break;
        case 'quotes':
          setQuotations([]);
          break;
        case 'activity':
          setActivityLogs([]);
          break;
      }
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
      id: 'quotes' as TabType,
      label: 'Quote Requests',
      icon: FileText,
      count: quotations.length,
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

    const paginatedBookings = paginate(bookings);

    return (
      <div>
        <div className="space-y-4">
          {paginatedBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                <div className="mb-2 md:mb-0">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
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

              {/* View Details Button */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setIsDetailModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
        {renderPagination(bookings.length)}
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

    const paginatedReviews = paginate(reviews);

    return (
      <div>
        <div className="space-y-4">
          {paginatedReviews.map((review) => (
          <div
            key={review._id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
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
        {renderPagination(reviews.length)}
      </div>
    );
  };

  const getQuotationStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      pending: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          PENDING
        </span>
      ),
      quoted: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FileText className="h-3 w-3 mr-1" />
          QUOTED
        </span>
      ),
      accepted: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          ACCEPTED
        </span>
      ),
      declined: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <XCircle className="h-3 w-3 mr-1" />
          DECLINED
        </span>
      ),
      rejected: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          REJECTED
        </span>
      ),
      expired: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          EXPIRED
        </span>
      ),
    };
    return badges[status] || null;
  };

  const getQuotationStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your quotation is being reviewed by our team...';
      case 'quoted':
        return 'A quote has been provided for your review';
      case 'accepted':
        return 'You have accepted this quotation';
      case 'declined':
        return 'You have declined this quotation';
      case 'rejected':
        return 'This quotation has been rejected';
      case 'expired':
        return 'This quotation has expired';
      default:
        return '';
    }
  };

  const handleAcceptQuotation = async (id: string) => {
    try {
      setActionLoading(true);
      const response = await quotationService.acceptQuotation(id);
      toast.success('Quotation accepted successfully!');
      // Update modal immediately from response
      if (response.data) {
        setSelectedQuotation(response.data);
      }
      // Refresh quotations list
      const quotationsData = await quotationService.getQuotations({});
      setQuotations(quotationsData.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to accept quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineQuotation = async () => {
    if (!selectedQuotation) return;
    try {
      setActionLoading(true);
      const response = await quotationService.declineQuotation(selectedQuotation._id, declineReason || undefined);
      toast.success('Quotation declined.');
      setShowDeclineModal(false);
      setDeclineReason('');
      // Update modal immediately from response
      if (response.data) {
        setSelectedQuotation(response.data);
      }
      // Refresh quotations list
      const quotationsData = await quotationService.getQuotations({});
      setQuotations(quotationsData.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to decline quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const renderQuotesTab = () => {
    if (quotations.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quote Requests</h3>
          <p className="text-gray-600 mb-4">
            You haven't requested any quotes yet
          </p>
          <a
            href="/products"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Browse Products
          </a>
        </div>
      );
    }

    const paginatedQuotations = paginate(quotations);

    return (
      <div>
        <div className="space-y-4">
          {paginatedQuotations.map((quotation) => (
            <div
              key={quotation._id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                <div className="flex items-center gap-3 mb-2 md:mb-0">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {quotation.quotationNumber}
                    </h4>
                  </div>
                  {getQuotationStatusBadge(quotation.status)}
                </div>
                <button
                  onClick={() => {
                    setSelectedQuotation(quotation);
                    setIsQuotationModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>

              <div className="ml-8">
                <p className="text-sm text-gray-500 italic mb-2">
                  {getQuotationStatusMessage(quotation.status)}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Requested: {new Date(quotation.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {quotation.items.length} item(s) requested
                </p>
                {quotation.totalAmount != null && (
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Total: {quotation.currency === 'PHP' ? '\u20B1' : '$'}{quotation.totalAmount.toLocaleString()}
                  </p>
                )}
                {quotation.validUntil && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Valid until: {new Date(quotation.validUntil).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {renderPagination(quotations.length)}
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

    const paginatedLogs = paginate(activityLogs);

    return (
      <div>
        <div className="space-y-3">
          {paginatedLogs.map((log) => {
          const Icon = getActivityIcon(log.resourceType);
          const colorClass = getActivityColor(log.resourceType);

          return (
            <div
              key={log._id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
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
        {renderPagination(activityLogs.length)}
      </div>
    );
  };

  // Pagination helper
  const paginate = <T,>(items: T[]): T[] => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (totalItems: number): number => {
    return Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = getTotalPages(totalItems);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
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
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
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
            {activeTab === 'reviews' && renderReviewsTab()}
            {activeTab === 'quotes' && renderQuotesTab()}
            {activeTab === 'activity' && renderActivityTab()}
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-white" />
                  <h3 className="text-xl font-bold text-white">Booking Details</h3>
                </div>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedBooking(null);
                  }}
                  className="text-white hover:text-gray-200 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Booking ID</p>
                  <p className="font-mono text-sm text-gray-700">{selectedBooking._id}</p>
                </div>
                {getBookingStatusBadge(selectedBooking.status)}
              </div>

              {/* Company & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    Company Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Company Name</p>
                      <p className="font-medium text-gray-900">{selectedBooking.company}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Contact Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedBooking.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedBooking.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedBooking.contactPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Meeting Details
                </h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedBooking.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                        <p className="font-medium text-gray-900">{selectedBooking.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="font-medium text-gray-900">{selectedBooking.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Product/Service</p>
                        <p className="font-medium text-gray-900">{selectedBooking.product}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Purpose
                </h4>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{selectedBooking.purpose}</p>
              </div>

              {/* Additional Info */}
              {selectedBooking.additionalInfo && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Additional Information
                  </h4>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedBooking.additionalInfo}
                  </p>
                </div>
              )}

              {/* Conclusion (if completed) */}
              {selectedBooking.conclusion && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Meeting Conclusion
                  </h4>
                  <p className="text-gray-700 bg-green-50 rounded-lg p-4">
                    {selectedBooking.conclusion}
                  </p>
                </div>
              )}

              {/* Cancellation Reason (if cancelled) */}
              {selectedBooking.status === 'cancelled' && selectedBooking.cancellationReason && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Cancellation Reason
                  </h4>
                  <p className="text-gray-700 bg-red-50 rounded-lg p-4">
                    {selectedBooking.cancellationReason}
                  </p>
                </div>
              )}

              {/* Created At */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created on {new Date(selectedBooking.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedBooking(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Details Modal */}
      {isQuotationModalOpen && selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-white" />
                  <h3 className="text-xl font-bold text-white">Quotation Details</h3>
                </div>
                <button
                  onClick={() => {
                    setIsQuotationModalOpen(false);
                    setSelectedQuotation(null);
                  }}
                  className="text-white hover:text-gray-200 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Quotation Number & Status */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quotation Number</p>
                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{selectedQuotation.quotationNumber}</p>
                </div>
                {getQuotationStatusBadge(selectedQuotation.status)}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    Company
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{selectedQuotation.company}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Contact
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedQuotation.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedQuotation.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedQuotation.customerPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-blue-600" />
                  Requested Items
                </h4>
                <div className="space-y-2">
                  {selectedQuotation.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        {item.specifications && (
                          <p className="text-xs text-gray-500 mt-1">{item.specifications}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                        {item.unitPrice != null && (
                          <p className="text-xs text-gray-500">
                            {selectedQuotation.currency === 'PHP' ? '\u20B1' : '$'}{item.unitPrice.toFixed(2)} each
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing (if quoted) */}
              {selectedQuotation.totalAmount != null && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-blue-600">
                      {selectedQuotation.currency === 'PHP' ? '\u20B1' : '$'}{selectedQuotation.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  {selectedQuotation.validUntil && (
                    <p className="text-sm text-gray-600 mt-2">
                      Valid until: {new Date(selectedQuotation.validUntil).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  {selectedQuotation.paymentTerms && (
                    <p className="text-sm text-gray-600 mt-1">Payment Terms: {selectedQuotation.paymentTerms}</p>
                  )}
                  {selectedQuotation.deliveryTerms && (
                    <p className="text-sm text-gray-600 mt-1">Delivery Terms: {selectedQuotation.deliveryTerms}</p>
                  )}
                </div>
              )}

              {/* Additional Requirements */}
              {selectedQuotation.additionalRequirements && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Additional Requirements
                  </h4>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedQuotation.additionalRequirements}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedQuotation.adminNotes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Admin Notes
                  </h4>
                  <p className="text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {selectedQuotation.adminNotes}
                  </p>
                </div>
              )}

              {/* Decline Reason */}
              {selectedQuotation.declineReason && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Decline Reason
                  </h4>
                  <p className="text-gray-700 bg-red-50 rounded-lg p-4">
                    {selectedQuotation.declineReason}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="pt-4 border-t border-gray-200 space-y-1">
                <p className="text-xs text-gray-500">
                  Requested on {new Date(selectedQuotation.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {selectedQuotation.quotedAt && (
                  <p className="text-xs text-gray-500">
                    Quoted on {new Date(selectedQuotation.quotedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {selectedQuotation.acceptedAt && (
                  <p className="text-xs text-green-600">
                    Accepted on {new Date(selectedQuotation.acceptedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-between">
              <div>
                {selectedQuotation.status === 'quoted' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAcceptQuotation(selectedQuotation._id)}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {actionLoading ? 'Processing...' : 'Accept Quote'}
                    </button>
                    <button
                      onClick={() => setShowDeclineModal(true)}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setIsQuotationModalOpen(false);
                  setSelectedQuotation(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ThumbsDown className="h-5 w-5 text-orange-600" />
                Decline Quotation
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for declining this quotation (optional). The admin may send a revised quote.
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining (optional)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
                rows={4}
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineQuotation}
                disabled={actionLoading}
                className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
