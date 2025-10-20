import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Star,
  MessageSquare,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import bookingService, { Booking } from '../services/bookingService';
import reviewService from '../services/reviewService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProductRecommendations } from '../components/ProductRecommendations';
import { AccountHistory } from '../components/AccountHistory';

export function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form states
  const [cancellationReason, setCancellationReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    rescheduleReason: '',
  });
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    isPublic: true,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings();
      setBookings(response.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = useCallback(() => {
    if (filterStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === filterStatus));
    }
  }, [bookings, filterStatus]);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      ),
      confirmed: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </span>
      ),
      completed: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      ),
      cancelled: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      ),
      rescheduled: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <RotateCcw className="h-3 w-3 mr-1" />
          Rescheduled
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || null;
  };

  const canCancelBooking = (booking: Booking) => {
    return booking.status !== 'cancelled' && booking.status !== 'completed';
  };

  const canRescheduleBooking = (booking: Booking) => {
    return booking.status !== 'cancelled' && booking.status !== 'completed';
  };

  const canReviewBooking = (booking: Booking) => {
    return booking.status === 'completed';
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancellationReason('');
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedBooking || !cancellationReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    try {
      setActionLoading(true);
      await bookingService.cancel(selectedBooking._id, cancellationReason);
      await fetchBookings();
      setCancelModalOpen(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setRescheduleData({
      newDate: new Date(booking.date).toISOString().split('T')[0],
      newTime: booking.time,
      rescheduleReason: '',
    });
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedBooking || !rescheduleData.newDate || !rescheduleData.newTime) {
      setError('Please provide new date and time');
      return;
    }

    if (!rescheduleData.rescheduleReason.trim()) {
      setError('Please provide a reason for rescheduling');
      return;
    }

    try {
      setActionLoading(true);
      await bookingService.reschedule(
        selectedBooking._id,
        rescheduleData.newDate,
        rescheduleData.newTime,
        rescheduleData.rescheduleReason
      );
      await fetchBookings();
      setRescheduleModalOpen(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reschedule booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewData({
      rating: 5,
      comment: '',
      isPublic: true,
    });
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedBooking || !reviewData.comment.trim()) {
      setError('Please provide a review comment');
      return;
    }

    try {
      setActionLoading(true);
      await reviewService.createReview({
        bookingId: selectedBooking._id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        isPublic: reviewData.isPublic,
      });
      await fetchBookings();
      setReviewModalOpen(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModals = () => {
    setCancelModalOpen(false);
    setRescheduleModalOpen(false);
    setReviewModalOpen(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your bookings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Account History Section */}
        <AccountHistory className="mb-8" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter((b) => b.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter((b) => b.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {bookings.filter((b) => b.status === 'cancelled').length}
                </p>
              </div>
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                className="block w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
            <button
              onClick={fetchBookings}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full md:w-auto justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all'
                ? 'Start by creating your first booking'
                : 'Try changing the filter to see other bookings'}
            </p>
            <a
              href="/booking"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
            >
              Create New Booking
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {booking.company}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Booking ID: {booking._id}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => handleCancelClick(booking)}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      )}
                      {canRescheduleBooking(booking) && (
                        <button
                          onClick={() => handleRescheduleClick(booking)}
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reschedule
                        </button>
                      )}
                      {canReviewBooking(booking) && (
                        <button
                          onClick={() => handleReviewClick(booking)}
                          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date</p>
                        <p className="text-sm text-gray-900">
                          {new Date(booking.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {booking.status === 'rescheduled' && booking.originalDate && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Originally: {new Date(booking.originalDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Time</p>
                        <p className="text-sm text-gray-900">{booking.time}</p>
                        {booking.status === 'rescheduled' && booking.originalTime && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Originally: {booking.originalTime}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-900">{booking.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Product</p>
                        <p className="text-sm text-gray-900">{booking.product}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 md:col-span-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Purpose</p>
                        <p className="text-sm text-gray-900">{booking.purpose}</p>
                      </div>
                    </div>

                    {booking.additionalInfo && (
                      <div className="flex items-start gap-3 md:col-span-2">
                        <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Additional Information
                          </p>
                          <p className="text-sm text-gray-900">{booking.additionalInfo}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer with timestamp */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel your booking for{' '}
              <span className="font-semibold">{selectedBooking.company}</span> on{' '}
              {new Date(selectedBooking.date).toLocaleDateString()}?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModals}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={actionLoading || !cancellationReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reschedule Booking</h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Reschedule your booking for{' '}
              <span className="font-semibold">{selectedBooking.company}</span>
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={rescheduleData.newDate}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, newDate: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time *
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={rescheduleData.newTime}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, newTime: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rescheduling *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  value={rescheduleData.rescheduleReason}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      rescheduleReason: e.target.value,
                    })
                  }
                  placeholder="Please provide a reason..."
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModals}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={
                  actionLoading ||
                  !rescheduleData.newDate ||
                  !rescheduleData.newTime ||
                  !rescheduleData.rescheduleReason.trim()
                }
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Leave a Review</h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share your experience with{' '}
              <span className="font-semibold">{selectedBooking.company}</span>
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewData.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {reviewData.rating} star{reviewData.rating !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={4}
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, comment: e.target.value })
                  }
                  placeholder="Tell us about your experience..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={reviewData.isPublic}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, isPublic: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make this review public (visible on testimonials page after admin
                  approval)
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModals}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={actionLoading || !reviewData.comment.trim()}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
