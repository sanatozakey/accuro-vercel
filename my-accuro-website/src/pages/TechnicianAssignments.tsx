import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Building,
  Package,
  User,
  Play,
  ClipboardList,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import bookingService, { Booking } from '../services/bookingService';
import completionProofService, { CompletionProof } from '../services/completionProofService';
import { CompletionProofModal } from '../components/CompletionProofModal';
import toast from 'react-hot-toast';

type FilterTab = 'all' | 'today' | 'upcoming' | 'pending_completion' | 'pending_review' | 'completed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending_completion', label: 'Pending Completion' },
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export function TechnicianAssignments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assignments, setAssignments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('today');

  // Completion proof modal state
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofModalBooking, setProofModalBooking] = useState<Booking | null>(null);
  const [proofModalMode, setProofModalMode] = useState<'create' | 'revise'>('create');
  const [existingProof, setExistingProof] = useState<CompletionProof | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState<string>('');

  // Rejected proof data per booking
  const [rejectedProofs, setRejectedProofs] = useState<Record<string, CompletionProof>>({});
  const [loadingProofs, setLoadingProofs] = useState<Record<string, boolean>>({});

  // Expanded booking details
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyAssignments();
      setAssignments(response.data || []);
    } catch (error: any) {
      console.error('Failed to load assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Check for rejected proofs on relevant bookings
  useEffect(() => {
    const checkRejectedProofs = async () => {
      const confirmedBookings = assignments.filter(
        (a) => a.status === 'confirmed' || a.status === 'in_progress'
      );
      for (const booking of confirmedBookings) {
        if (!rejectedProofs[booking._id] && !loadingProofs[booking._id]) {
          try {
            setLoadingProofs((prev) => ({ ...prev, [booking._id]: true }));
            const response = await completionProofService.getByBookingId(booking._id);
            if (response.data && response.data.status === 'rejected') {
              setRejectedProofs((prev) => ({ ...prev, [booking._id]: response.data }));
            }
          } catch {
            // No proof exists - that's fine
          } finally {
            setLoadingProofs((prev) => ({ ...prev, [booking._id]: false }));
          }
        }
      }
    };
    if (assignments.length > 0) {
      checkRejectedProofs();
    }
  }, [assignments]);

  // Handle URL params for submit/view actions
  useEffect(() => {
    const submitId = searchParams.get('submit');
    if (submitId && assignments.length > 0) {
      const booking = assignments.find((a) => a._id === submitId);
      if (booking && booking.status === 'in_progress') {
        openProofModal(booking, 'create');
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, assignments, setSearchParams]);

  const handleStartBooking = async (id: string) => {
    try {
      setActionLoading(id);
      await bookingService.startBooking(id);
      toast.success('Meeting started successfully');
      fetchAssignments();
    } catch (error: any) {
      console.error('Failed to start booking:', error);
      toast.error(error.response?.data?.message || 'Failed to start meeting');
    } finally {
      setActionLoading(null);
    }
  };

  const openProofModal = (booking: Booking, mode: 'create' | 'revise', proof?: CompletionProof) => {
    setProofModalBooking(booking);
    setProofModalMode(mode);
    if (mode === 'revise' && proof) {
      setExistingProof(proof);
      setRejectionFeedback(proof.reviewFeedback || '');
    } else {
      setExistingProof(null);
      setRejectionFeedback('');
    }
    setProofModalOpen(true);
  };

  const handleProofComplete = () => {
    setProofModalOpen(false);
    setProofModalBooking(null);
    setExistingProof(null);
    setRejectionFeedback('');
    fetchAssignments();
    toast.success(proofModalMode === 'revise' ? 'Report revised and resubmitted' : 'Completion report submitted');
  };

  // Date helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const isUpcoming = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d > today;
  };

  // Filter logic
  const filteredAssignments = assignments.filter((a) => {
    switch (activeTab) {
      case 'today':
        return isToday(a.date);
      case 'upcoming':
        return isUpcoming(a.date) && ['confirmed', 'in_progress'].includes(a.status);
      case 'pending_completion':
        return a.status === 'confirmed' || a.status === 'in_progress';
      case 'pending_review':
        return a.status === 'pending_review';
      case 'completed':
        return a.status === 'completed';
      case 'all':
      default:
        return true;
    }
  });

  // Sort by date (soonest first)
  const sortedAssignments = [...filteredAssignments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      pending_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      pending_review: 'Pending Review',
      completed: 'Completed',
      cancelled: 'Cancelled',
      pending: 'Pending',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const emptyMessages: Record<FilterTab, { title: string; subtitle: string }> = {
    today: { title: 'No assignments for today', subtitle: 'Check your upcoming assignments' },
    upcoming: { title: 'No upcoming assignments', subtitle: 'You have no scheduled assignments this week' },
    pending_completion: { title: 'No pending assignments', subtitle: 'All your assignments are up to date' },
    pending_review: { title: 'No reports pending review', subtitle: 'All submitted reports have been reviewed' },
    completed: { title: 'No completed assignments', subtitle: 'Completed assignments will appear here' },
    all: { title: 'No assignments found', subtitle: 'You have not been assigned any bookings yet' },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-navy-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1">My Assignments</h1>
              <p className="text-gray-300">Manage your bookings and service reports</p>
            </div>
            <button
              onClick={fetchAssignments}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
                {tab.key === 'pending_completion' && assignments.filter((a) => a.status === 'confirmed' || a.status === 'in_progress').length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                    {assignments.filter((a) => a.status === 'confirmed' || a.status === 'in_progress').length}
                  </span>
                )}
                {tab.key === 'pending_review' && assignments.filter((a) => a.status === 'pending_review').length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                    {assignments.filter((a) => a.status === 'pending_review').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedAssignments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 border border-gray-200 dark:border-gray-700 text-center">
            <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{emptyMessages[activeTab].title}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{emptyMessages[activeTab].subtitle}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAssignments.map((booking) => {
              const rejected = rejectedProofs[booking._id];
              const isExpanded = expandedBooking === booking._id;

              return (
                <div
                  key={booking._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{booking.contactName}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(booking.date)} at {formatTime(booking.time)}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedBooking(isExpanded ? null : booking._id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Key Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{booking.company}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{booking.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{booking.product}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{user?.name} (You)</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Purpose: </span>
                            {booking.purpose}
                          </div>
                        </div>
                        {booking.additionalInfo && (
                          <div className="flex items-start gap-2">
                            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Additional Info: </span>
                              {booking.additionalInfo}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rejected Proof Warning */}
                    {rejected && (booking.status === 'confirmed' || booking.status === 'in_progress') && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">Report Rejected</p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{rejected.reviewFeedback}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleStartBooking(booking._id)}
                          disabled={actionLoading === booking._id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === booking._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Start Meeting
                        </button>
                      )}

                      {booking.status === 'in_progress' && (
                        <button
                          onClick={() => openProofModal(booking, 'create')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <ClipboardList className="h-4 w-4" />
                          Submit Completion Report
                        </button>
                      )}

                      {booking.status === 'pending_review' && (
                        <span className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-lg border border-purple-200 dark:border-purple-800">
                          <Clock className="h-4 w-4" />
                          Awaiting Review
                        </span>
                      )}

                      {booking.status === 'completed' && (
                        <span className="flex items-center gap-1.5 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </span>
                      )}

                      {/* Revise button for rejected proofs */}
                      {rejected && (booking.status === 'confirmed' || booking.status === 'in_progress') && (
                        <button
                          onClick={() => openProofModal(booking, 'revise', rejected)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Revise Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Proof Modal */}
      {proofModalBooking && (
        <CompletionProofModal
          isOpen={proofModalOpen}
          onClose={() => {
            setProofModalOpen(false);
            setProofModalBooking(null);
            setExistingProof(null);
            setRejectionFeedback('');
          }}
          onComplete={handleProofComplete}
          booking={{
            _id: proofModalBooking._id,
            company: proofModalBooking.company,
            contactName: proofModalBooking.contactName,
            date: proofModalBooking.date,
            time: proofModalBooking.time,
            purpose: proofModalBooking.purpose,
            product: proofModalBooking.product,
          }}
          mode={proofModalMode}
          existingProof={existingProof || undefined}
          rejectionFeedback={rejectionFeedback || undefined}
        />
      )}
    </div>
  );
}
