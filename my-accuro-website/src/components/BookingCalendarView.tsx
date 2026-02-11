import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Building,
  Phone,
  RefreshCw,
} from 'lucide-react';
import bookingService from '../services/bookingService';

interface BookingCalendarViewProps {
  darkMode?: boolean;
  onBookingClick?: (booking: any) => void;
}

interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  product: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-200',
    dot: 'bg-yellow-500',
  },
  confirmed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-200',
    dot: 'bg-green-500',
  },
  completed: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-200',
    dot: 'bg-blue-500',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-200',
    dot: 'bg-red-500',
  },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function BookingCalendarView({ darkMode = false, onBookingClick }: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [currentDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await bookingService.getAll({
        limit: 1000,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      });

      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: Date | null; bookings: Booking[] }[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push({ date: null, bookings: [] });
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.preferredDate).toISOString().split('T')[0];
        return bookingDate === dateStr;
      });
      days.push({ date, bookings: dayBookings });
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const days = getDaysInMonth();
  const selectedBookings = selectedDate
    ? bookings.filter((b) => new Date(b.preferredDate).toISOString().split('T')[0] === selectedDate)
    : [];

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Calendar className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {bookings.length} bookings this month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              className={`p-2 rounded-lg transition ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextMonth}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={`mx-4 mt-4 p-3 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      <div className="flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => (
              <div
                key={idx}
                onClick={() => day.date && setSelectedDate(day.date.toISOString().split('T')[0])}
                className={`min-h-[80px] p-1 rounded-lg border cursor-pointer transition ${
                  !day.date
                    ? 'bg-transparent border-transparent'
                    : selectedDate === day.date.toISOString().split('T')[0]
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : darkMode
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day.date && (
                  <>
                    <div
                      className={`text-sm font-medium ${
                        isToday(day.date)
                          ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto'
                          : darkMode
                          ? 'text-gray-200'
                          : 'text-gray-700'
                      }`}
                    >
                      {day.date.getDate()}
                    </div>
                    <div className="mt-1 space-y-1">
                      {day.bookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking._id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            STATUS_COLORS[booking.status]?.bg || 'bg-gray-100'
                          } ${STATUS_COLORS[booking.status]?.text || 'text-gray-800'}`}
                        >
                          {booking.preferredTime?.split(' - ')[0]} {booking.name.split(' ')[0]}
                        </div>
                      ))}
                      {day.bookings.length > 2 && (
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          +{day.bookings.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className={`w-80 border-l p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatDate(selectedDate)}
            </h3>

            {selectedBookings.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar className="mx-auto mb-2 opacity-50" size={32} />
                <p>No bookings on this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedBookings.map((booking) => (
                  <div
                    key={booking._id}
                    onClick={() => onBookingClick?.(booking)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      darkMode
                        ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[booking.status]?.dot}`} />
                        <span className={`text-xs uppercase font-medium ${STATUS_COLORS[booking.status]?.text}`}>
                          {booking.status}
                        </span>
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {booking.product}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <User size={14} />
                        <span className="text-sm font-medium">{booking.name}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Clock size={14} />
                        <span className="text-xs">{booking.preferredTime}</span>
                      </div>
                      {booking.company && (
                        <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Building size={14} />
                          <span className="text-xs">{booking.company}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Phone size={14} />
                        <span className="text-xs">{booking.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-6 justify-center">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
              <span className={`text-xs capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
