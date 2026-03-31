import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  MapPin,
  Building,
  Package,
  User,
  Play,
  ClipboardList,
  Eye,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import bookingService, { Booking } from '../services/bookingService';
import toast from 'react-hot-toast';

export function TechnicianDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Date helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= today && d <= endOfWeek;
  };

  // Computed stats
  const todayAssignments = assignments.filter((a) => isToday(a.date));
  const upcomingThisWeek = assignments.filter(
    (a) => isThisWeek(a.date) && !isToday(a.date) && ['confirmed', 'in_progress'].includes(a.status)
  );
  const pendingCompletion = assignments.filter(
    (a) => a.status === 'confirmed' || a.status === 'in_progress'
  );
  const pendingReview = assignments.filter((a) => a.status === 'pending_review');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
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
    };
    const labels: Record<string, string> = {
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      pending_review: 'Pending Review',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTechnicianName = (booking: Booking) => {
    if (typeof booking.assignedTechnician === 'object' && booking.assignedTechnician) {
      return booking.assignedTechnician.name;
    }
    return '';
  };

  const profileIncomplete = !user?.firstName || !user?.lastName || !user?.phone;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-navy-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold">
              Welcome, {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name}
            </h1>
            <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">
              {(user as any)?.technicianNumber ? `Technician ${(user as any).technicianNumber}` : 'Technician'}
            </span>
          </div>
          <p className="text-gray-300">Manage your assignments and service reports</p>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {profileIncomplete && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Complete Your Profile</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Customers will see your name and details when you are assigned to their bookings.
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition"
            >
              Edit Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <section className="mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">{todayAssignments.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Today's Assignments</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{upcomingThisWeek.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming This Week</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-600">{pendingCompletion.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending Completion</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-600">{pendingReview.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending Review</p>
              </div>
            </div>
          )}
        </section>

        {/* Today's Assignments */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Assignments</h2>
            <button
              onClick={fetchAssignments}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : todayAssignments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center">
              <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No assignments for today</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Check your upcoming assignments for the week</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayAssignments.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{booking.contactName}</span>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5" />
                      <span>{booking.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTime(booking.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{booking.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5" />
                      <span>{booking.product}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleStartBooking(booking._id)}
                        disabled={actionLoading === booking._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === booking._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        Start Meeting
                      </button>
                    )}
                    {booking.status === 'in_progress' && (
                      <Link
                        to={`/technician/assignments?submit=${booking._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        Submit Report
                      </Link>
                    )}
                    <Link
                      to={`/technician/assignments?view=${booking._id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/technician/assignments"
              className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">View All Assignments</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your bookings and reports</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200 mt-1" />
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
