import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Eye, Clock, CheckCircle, XCircle, MapPin, Briefcase, RefreshCw, AlertTriangle, CreditCard, Upload, ShieldCheck, FileText, Package, Paperclip, X, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import bookingService, { Booking, getTechnicianLabel, getTechnicianRealName } from '../services/bookingService';
import transactionProofService, { TransactionProof } from '../services/transactionProofService';
import { BookingStatusTracker } from '../components/BookingStatusTracker';

export function CustomerBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Payment proof upload state
  const [transactionProof, setTransactionProof] = useState<TransactionProof | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingProof, setLoadingProof] = useState(false);

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

  // Fetch transaction proof when selecting a booking that needs it
  const fetchTransactionProof = async (bookingId: string) => {
    try {
      setLoadingProof(true);
      const res = await transactionProofService.getByBookingId(bookingId);
      setTransactionProof(res.data);
    } catch {
      setTransactionProof(null);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setUploadFiles([]);
    setCustomerNotes('');
    const paymentStatuses = ['awaiting_payment', 'payment_submitted', 'verified'];
    if (paymentStatuses.includes(booking.status)) {
      fetchTransactionProof(booking._id);
    } else {
      setTransactionProof(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPaymentProof = async () => {
    if (!transactionProof || uploadFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    try {
      setUploading(true);
      const isRevision = transactionProof.status === 'rejected';
      if (isRevision) {
        await transactionProofService.revise(transactionProof._id, uploadFiles, customerNotes);
      } else {
        await transactionProofService.submitPaymentProof(transactionProof._id, uploadFiles, customerNotes);
      }
      toast.success('Payment proof submitted successfully!');
      setUploadFiles([]);
      setCustomerNotes('');
      await fetchBookings();
      // Refresh the selected booking
      const updated = await bookingService.getById(selectedBooking!._id);
      setSelectedBooking(updated.data);
      fetchTransactionProof(selectedBooking!._id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit payment proof');
    } finally {
      setUploading(false);
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
      case 'awaiting_payment':
        return <CreditCard className="h-5 w-5 text-amber-600" />;
      case 'payment_submitted':
        return <Upload className="h-5 w-5 text-indigo-600" />;
      case 'verified':
        return <ShieldCheck className="h-5 w-5 text-emerald-600" />;
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
      awaiting_payment: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      payment_submitted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
    const labels: Record<string, string> = {
      pending_review: 'PENDING REVIEW',
      awaiting_payment: 'AWAITING PAYMENT',
      payment_submitted: 'PAYMENT SUBMITTED',
      verified: 'VERIFIED',
    };
    const label = labels[status] || status.toUpperCase();
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === statusFilter);

  const statuses = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'pending_review', 'awaiting_payment', 'payment_submitted', 'verified'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const quotation = selectedBooking?.quotationId && typeof selectedBooking.quotationId === 'object' ? selectedBooking.quotationId : null;

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
          {statuses.map((s) => {
            const count = s === 'all' ? bookings.length : bookings.filter((b) => b.status === s).length;
            if (s !== 'all' && count === 0) return null;
            const label = s === 'pending_review' ? 'Pending Review'
              : s === 'awaiting_payment' ? 'Awaiting Payment'
              : s === 'payment_submitted' ? 'Payment Submitted'
              : s === 'in_progress' ? 'In Progress'
              : s.charAt(0).toUpperCase() + s.slice(1);
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-full transition ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {label}
                <span className="ml-1 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {statusFilter === 'all' ? 'No bookings yet' : `No ${statusFilter.replace(/_/g, ' ')} bookings`}
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
                      {booking.quotationId && typeof booking.quotationId === 'object' && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <FileText className="h-4 w-4" />
                          Linked: {(booking.quotationId as any).quotationNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectBooking(booking)}
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
              {/* Order Tracker */}
              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Progress</h3>
                <BookingStatusTracker
                  bookingId={selectedBooking._id}
                  currentStatus={selectedBooking.status as any}
                  statusHistory={(selectedBooking as any).statusHistory || []}
                  createdAt={selectedBooking.createdAt}
                  hasQuotation={!!(selectedBooking.quotationId && typeof selectedBooking.quotationId === 'object')}
                />
              </div>

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

              {/* Technician Fee */}
              {(selectedBooking as any).technicianFee && (
                <div className={`border rounded-lg p-4 ${
                  (selectedBooking as any).technicianFee.status === 'paid'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : (selectedBooking as any).technicianFee.status === 'waived'
                    ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className={`h-5 w-5 ${
                        (selectedBooking as any).technicianFee.status === 'paid' ? 'text-green-600' :
                        (selectedBooking as any).technicianFee.status === 'waived' ? 'text-gray-500' :
                        'text-amber-600'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Technician Fee</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Service consultation fee</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        PHP {(selectedBooking as any).technicianFee.amount?.toFixed(2)}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        (selectedBooking as any).technicianFee.status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : (selectedBooking as any).technicianFee.status === 'waived'
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}>
                        {(selectedBooking as any).technicianFee.status === 'paid' ? 'Paid' :
                         (selectedBooking as any).technicianFee.status === 'waived' ? 'Waived' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  {(selectedBooking as any).technicianFee.status === 'pending' && selectedBooking.status === 'confirmed' && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Please pay the technician fee to proceed with the meeting.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Payment via QRPH or cash. Contact your assigned technician for payment details.
                      </p>
                    </div>
                  )}
                </div>
              )}

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

              {/* Linked Quotation */}
              {quotation && (
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200">Linked Quotation</h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200">
                      {quotation.quotationNumber}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {quotation.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm p-2 rounded bg-white dark:bg-gray-800/50">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{item.productName}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">x{item.quantity}</span>
                        </div>
                        {item.totalPrice && (
                          <span className="text-gray-700 dark:text-gray-300">
                            {quotation.currency} {item.totalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {quotation.totalAmount && (
                    <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-700 flex justify-between font-semibold text-sm">
                      <span className="text-purple-800 dark:text-purple-200">Total Amount</span>
                      <span className="text-purple-800 dark:text-purple-200">
                        {quotation.currency} {quotation.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Proof Section */}
              {(selectedBooking.status === 'awaiting_payment' || selectedBooking.status === 'payment_submitted' || selectedBooking.status === 'verified') && transactionProof && (
                <div className={`border rounded-lg p-4 ${
                  selectedBooking.status === 'verified'
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                    : selectedBooking.status === 'payment_submitted'
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                }`}>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    {selectedBooking.status === 'verified' ? (
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    ) : selectedBooking.status === 'payment_submitted' ? (
                      <Upload className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-amber-600" />
                    )}
                    <h3 className={`font-semibold ${
                      selectedBooking.status === 'verified' ? 'text-emerald-800 dark:text-emerald-200' :
                      selectedBooking.status === 'payment_submitted' ? 'text-indigo-800 dark:text-indigo-200' :
                      'text-amber-800 dark:text-amber-200'
                    }`}>
                      {selectedBooking.status === 'verified' ? 'Transaction Verified' :
                       selectedBooking.status === 'payment_submitted' ? 'Payment Under Review' :
                       'Upload Payment Proof'}
                    </h3>
                  </div>

                  {/* Transaction Items Summary */}
                  {transactionProof.items.length > 0 && (
                    <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Transaction Items</p>
                      {transactionProof.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-gray-700 dark:text-gray-300">{item.productName} x{item.quantity}</span>
                          {item.totalPrice ? (
                            <span className="text-gray-600 dark:text-gray-400">{transactionProof.currency} {item.totalPrice.toLocaleString()}</span>
                          ) : null}
                        </div>
                      ))}
                      <div className="border-t dark:border-gray-700 mt-2 pt-2 flex justify-between font-semibold text-sm">
                        <span>Total</span>
                        <span>{transactionProof.currency} {transactionProof.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Status-specific content */}
                  {selectedBooking.status === 'verified' && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Your payment has been verified and the transaction is complete. The equipment/services from your quotation have been processed for delivery.
                    </p>
                  )}

                  {selectedBooking.status === 'payment_submitted' && (
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Your payment proof has been submitted and is currently under review. You will be notified once it has been verified.
                    </p>
                  )}

                  {/* Rejection feedback */}
                  {transactionProof.status === 'rejected' && transactionProof.reviewFeedback && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{transactionProof.reviewFeedback}</p>
                    </div>
                  )}

                  {/* Upload Form — shown when awaiting_payment or rejected */}
                  {(selectedBooking.status === 'awaiting_payment' || transactionProof.status === 'rejected') && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {transactionProof.status === 'rejected'
                          ? 'Please upload a revised payment proof.'
                          : 'Please upload proof of payment (invoice, receipt, or bank transfer confirmation).'}
                      </p>

                      {/* File Upload */}
                      <div>
                        <label className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition">
                          <Paperclip className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Click to select files (max 5)
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        {uploadFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {uploadFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span className="text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700 ml-2">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Optional: Add a note about this payment..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmitPaymentProof}
                        disabled={uploading || uploadFiles.length === 0}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {uploading ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Submit Payment Proof
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Loading indicator for transaction proof */}
              {loadingProof && (selectedBooking.status === 'awaiting_payment' || selectedBooking.status === 'payment_submitted') && (
                <div className="flex items-center justify-center py-4">
                  <Loader className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-500">Loading payment details...</span>
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
