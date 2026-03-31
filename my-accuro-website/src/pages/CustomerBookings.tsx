import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Eye, Clock, CheckCircle, XCircle, MapPin, Briefcase, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import bookingService, { Booking, getTechnicianLabel, getTechnicianRealName } from '../services/bookingService';

export function CustomerBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings();
      setBookings(response.data);
    } catch (error: any) {
      toast.error('Failed to load bookings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'rescheduled':
        return <RefreshCw className="h-5 w-5 text-orange-600" />;
      case 'pending_review':
        return <AlertTriangle className="h-5 w-5 text-purple-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      rescheduled: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      pending_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    const label = status === 'pending_review' ? 'PENDING REVIEW' : status.toUpperCase();
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === statusFilter);

  const statuses = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'pending_review'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Bookings
            </h1>
          </div>
          <Link
            to="/booking"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Book New Service
          </Link>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-full transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'pending_review' ? 'Pending Review' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({bookings.filter((b) => b.status === s).length})
                </span>
              )}
              {s === 'all' && (
                <span className="ml-1 text-xs opacity-70">({bookings.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {statusFilter === 'all' ? 'No bookings yet' : `No ${statusFilter === 'pending_review' ? 'pending review' : statusFilter} bookings`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {statusFilter === 'all'
                ? 'Schedule a service booking to get started'
                : 'Try selecting a different status filter'}
            </p>
            {statusFilter === 'all' && (
              <Link
                to="/booking"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Book a Service
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(booking.status)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.purpose}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(booking.date)} at {booking.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {booking.company}
                      </div>
                      {booking.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {booking.location}
                        </div>
                      )}
                      {booking.product && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Product: {booking.product}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 justify-center"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Booking Details
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status & Purpose */}
              <div className="border-b dark:border-gray-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Purpose</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedBooking.purpose}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Booked On</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.createdAt)}
                  </span>
                </div>
              </div>

              {/* Schedule */}
              <div className="border-b dark:border-gray-700 pb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.time}</p>
                  </div>
                </div>
                {selectedBooking.status === 'rescheduled' && selectedBooking.originalDate && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Originally scheduled: {formatDate(selectedBooking.originalDate)}
                      {selectedBooking.originalTime && ` at ${selectedBooking.originalTime}`}
                    </p>
                    {selectedBooking.rescheduleReason && (
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Reason: {selectedBooking.rescheduleReason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Contact & Location */}
              <div className="border-b dark:border-gray-700 pb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Company</span>
                    <span className="text-gray-900 dark:text-white">{selectedBooking.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contact</span>
                    <span className="text-gray-900 dark:text-white">{selectedBooking.contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email</span>
                    <span className="text-gray-900 dark:text-white">{selectedBooking.contactEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone</span>
                    <span className="text-gray-900 dark:text-white">{selectedBooking.contactPhone}</span>
                  </div>
                  {selectedBooking.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location</span>
                      <span className="text-gray-900 dark:text-white">{selectedBooking.location}</span>
                    </div>
                  )}
                  {selectedBooking.product && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Product</span>
                      <span className="text-gray-900 dark:text-white">{selectedBooking.product}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Technician */}
              {selectedBooking.assignedTechnician && typeof selectedBooking.assignedTechnician === 'object' && (
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Assigned Technician</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-sm">
                      {selectedBooking.assignedTechnician.technicianNumber
                        ? `T${selectedBooking.assignedTechnician.technicianNumber}`
                        : selectedBooking.assignedTechnician.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getTechnicianLabel(selectedBooking.assignedTechnician)}
                      </p>
                      {getTechnicianRealName(selectedBooking.assignedTechnician) && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {getTechnicianRealName(selectedBooking.assignedTechnician)}
                        </p>
                      )}
                      {selectedBooking.assignedTechnician.specialization && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedBooking.assignedTechnician.specialization}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedBooking.assignedTechnician.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {selectedBooking.additionalInfo && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.additionalInfo}</p>
                </div>
              )}

              {/* Conclusion (for completed bookings) */}
              {selectedBooking.conclusion && (
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Service Conclusion
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.conclusion}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerBookings;
