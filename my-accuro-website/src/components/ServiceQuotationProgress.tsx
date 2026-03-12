import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Calendar, FileText, CheckCircle, Clock, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import bookingService, { Booking } from '../services/bookingService';
import quotationService, { Quotation } from '../services/quotationService';
import { Link } from 'react-router-dom';

export function ServiceQuotationProgress() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch independently so one failure doesn't block the other
      const [bookingsRes, quotationsRes] = await Promise.allSettled([
        bookingService.getMyBookings(),
        quotationService.getQuotations({ limit: 5 }),
      ]);

      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value.data.slice(0, 5));
      }
      if (quotationsRes.status === 'fulfilled') {
        setQuotations(quotationsRes.value.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', text: 'Completed', progress: 100 };
      case 'confirmed':
        return { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'Confirmed', progress: 66 };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'Pending', progress: 33 };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', text: 'Cancelled', progress: 0 };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'Unknown', progress: 0 };
    }
  };

  const getQuotationStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', text: 'Approved', progress: 100 };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'Pending Review', progress: 50 };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', text: 'Rejected', progress: 0 };
      default:
        return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'Submitted', progress: 25 };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bookings.length === 0 && quotations.length === 0) {
    return (
      <section className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Services or Quotations
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You haven't requested any services or quotations yet
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/booking"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Service
            </Link>
            <Link
              to="/request-quote"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <FileText className="h-4 w-4 mr-2" />
              Request Quote
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Service & Quotation Progress
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        {bookings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Recent Bookings
              </h3>
              <Link
                to="/my-bookings"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {bookings.map((booking) => {
                const status = getBookingStatus(booking.status);
                const StatusIcon = status.icon;

                return (
                  <div key={booking._id} className={`p-4 rounded-lg ${status.bg} border border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{booking.purpose}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold">{status.text}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${status.color.replace('text', 'bg')}`}
                        style={{ width: `${status.progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Quotations */}
        {quotations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Recent Quotations
              </h3>
              <Link
                to="/quotations"
                className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {quotations.map((quotation) => {
                const status = getQuotationStatus(quotation.status);
                const StatusIcon = status.icon;

                return (
                  <div key={quotation._id} className={`p-4 rounded-lg ${status.bg} border border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{quotation.quotationNumber}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {quotation.items.length} item{quotation.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold">{status.text}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${status.color.replace('text', 'bg')}`}
                        style={{ width: `${status.progress}%` }}
                      ></div>
                    </div>
                    {quotation.totalAmount && (
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {quotation.currency === 'USD' ? '$' : '₱'}{quotation.totalAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
