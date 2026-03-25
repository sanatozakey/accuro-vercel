import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Zap } from 'lucide-react';
import { EmbeddedGoogleCalendar } from './EmbeddedGoogleCalendar';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    booking: any;
  };
}

interface CalendarViewProps {
  darkMode: boolean;
  calendarEvents: CalendarEvent[];
  handleEventClick: (info: any) => void;
  readBookingIds?: Set<string>;
}

type CalendarTab = 'interactive' | 'google';

export function CalendarView({
  darkMode,
  calendarEvents,
  handleEventClick,
  readBookingIds = new Set(),
}: CalendarViewProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<CalendarTab>('interactive');

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
      {/* Tab Navigation */}
      <div className={`flex flex-wrap border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('interactive')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-colors ${
            activeTab === 'interactive'
              ? darkMode
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : darkMode
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Interactive</span>
          <span className="sm:hidden">Interactive</span>
          <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'interactive'
              ? 'bg-blue-100 text-blue-700'
              : darkMode
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-100 text-gray-500'
          }`}>
            Click to act
          </span>
        </button>
        <button
          onClick={() => setActiveTab('google')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-colors ${
            activeTab === 'google'
              ? darkMode
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : darkMode
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Google</span>
          <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'google'
              ? 'bg-green-100 text-green-700'
              : darkMode
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-100 text-gray-500'
          }`}>
            Synced
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3 sm:p-4 md:p-6">
        {activeTab === 'interactive' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Interactive Booking Calendar
                </h2>
                <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click on any booking to view details and take quick actions
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Pending</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Confirmed</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Rescheduled</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Cancelled</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Completed</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Overdue</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white border-2 border-gray-400 animate-pulse"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Unread</span>
                </span>
              </div>
            </div>
            <div className={`fullcalendar-wrapper ${darkMode ? 'fc-dark' : 'fc-light'}`}>
              <style>{`
                /* Responsive calendar container */
                .fullcalendar-wrapper {
                  max-height: calc(100vh - 280px);
                  min-height: 400px;
                  overflow: auto;
                }

                @media (max-width: 640px) {
                  .fullcalendar-wrapper {
                    max-height: calc(100vh - 320px);
                    min-height: 350px;
                  }
                  .fc .fc-toolbar {
                    flex-direction: column;
                    gap: 8px;
                  }
                  .fc .fc-toolbar-chunk {
                    display: flex;
                    justify-content: center;
                  }
                  .fc .fc-toolbar-title {
                    font-size: 1.1em !important;
                  }
                  .fc .fc-button {
                    padding: 4px 8px !important;
                    font-size: 0.8em !important;
                  }
                  .fc .fc-daygrid-day-number {
                    font-size: 0.85em !important;
                    padding: 2px 4px !important;
                  }
                  .fc .fc-col-header-cell-cushion {
                    font-size: 0.75em !important;
                    padding: 4px 2px !important;
                  }
                  .fc-event {
                    font-size: 0.7em !important;
                    padding: 1px 2px !important;
                  }
                }

                /* Light mode styles */
                .fc-light .fc-theme-standard td,
                .fc-light .fc-theme-standard th,
                .fc-light .fc-theme-standard .fc-scrollgrid {
                  border-color: #e5e7eb;
                }

                /* Dark mode styles - comprehensive override */
                .fc-dark .fc-theme-standard td,
                .fc-dark .fc-theme-standard th,
                .fc-dark .fc-theme-standard .fc-scrollgrid {
                  border-color: #4b5563 !important;
                }

                /* Day numbers - CRITICAL for dark mode visibility */
                .fc-dark .fc-daygrid-day-number {
                  color: #f3f4f6 !important;
                  font-weight: 500;
                }

                .fc-dark .fc-daygrid-day-top {
                  color: #f3f4f6 !important;
                }

                /* Column headers (Sun, Mon, etc) */
                .fc-dark .fc-col-header-cell-cushion {
                  color: #e5e7eb !important;
                  font-weight: 600;
                }

                /* Month/Year title */
                .fc-dark .fc-toolbar-title {
                  color: #f9fafb !important;
                }

                /* Navigation buttons */
                .fc-dark .fc-button-primary {
                  background-color: #3b82f6 !important;
                  border-color: #3b82f6 !important;
                  color: white !important;
                }
                .fc-dark .fc-button-primary:hover {
                  background-color: #2563eb !important;
                  border-color: #2563eb !important;
                }
                .fc-dark .fc-button-primary:not(:disabled):active,
                .fc-dark .fc-button-primary:not(:disabled).fc-button-active {
                  background-color: #1d4ed8 !important;
                  border-color: #1d4ed8 !important;
                }
                .fc-dark .fc-button-primary:disabled {
                  background-color: #4b5563 !important;
                  border-color: #4b5563 !important;
                }

                /* Today highlight */
                .fc-dark .fc-daygrid-day.fc-day-today {
                  background-color: rgba(59, 130, 246, 0.2) !important;
                }
                .fc-dark .fc-day-today .fc-daygrid-day-number {
                  color: #60a5fa !important;
                  font-weight: 700;
                }

                /* Day cells background */
                .fc-dark .fc-daygrid-day {
                  background-color: #1f2937;
                }
                .fc-dark .fc-day-other {
                  background-color: #111827 !important;
                }
                .fc-dark .fc-day-other .fc-daygrid-day-number {
                  color: #6b7280 !important;
                }

                /* More link (+2 more) */
                .fc-dark .fc-more-link {
                  color: #93c5fd !important;
                  font-weight: 500;
                }

                /* Week/Day view time slots */
                .fc-dark .fc-timegrid-slot-label {
                  color: #d1d5db !important;
                }
                .fc-dark .fc-timegrid-axis-cushion {
                  color: #d1d5db !important;
                }

                /* Popover (when clicking +more) */
                .fc-dark .fc-popover {
                  background: #1f2937 !important;
                  border-color: #4b5563 !important;
                }
                .fc-dark .fc-popover-header {
                  background: #374151 !important;
                  color: #f3f4f6 !important;
                }
                .fc-dark .fc-popover-body {
                  background: #1f2937 !important;
                }

                /* Event styling */
                .fc-event {
                  cursor: pointer !important;
                  border-radius: 4px;
                  padding: 2px 4px;
                  font-size: 0.8em;
                  border: none !important;
                }
                .fc-event:hover {
                  opacity: 0.9;
                  transform: scale(1.02);
                  transition: all 0.15s ease;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                .fc-daygrid-event-dot {
                  display: none;
                }

                /* Week number if shown */
                .fc-dark .fc-daygrid-week-number {
                  color: #9ca3af !important;
                }
              `}</style>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                eventContent={(arg) => {
                  const bookingId = arg.event.id;
                  const isUnread = bookingId && !readBookingIds.has(bookingId);
                  return (
                    <div className="flex items-center gap-1 w-full overflow-hidden px-1">
                      {isUnread && (
                        <span className="w-2 h-2 min-w-[0.5rem] rounded-full bg-white animate-pulse" />
                      )}
                      <span className="truncate text-xs">
                        {arg.timeText && <span className="font-semibold">{arg.timeText} </span>}
                        {arg.event.title}
                      </span>
                    </div>
                  );
                }}
                height="auto"
                contentHeight="auto"
                aspectRatio={1.5}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short',
                }}
                dayMaxEvents={2}
                moreLinkClick="popover"
                nowIndicator={true}
                eventDisplay="block"
                fixedWeekCount={false}
              />
            </div>
            <div className={`mt-3 p-2 sm:p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <strong>Tip:</strong> Click on any event to open the booking details modal where you can:
                <span className="ml-1">Confirm, Reschedule, Cancel, or Mark as Complete.</span>
              </p>
            </div>
          </>
        )}

        {activeTab === 'google' && (
          <>
            <div className="mb-3 sm:mb-4">
              <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Google Calendar View
              </h2>
              <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Synced with your Google Calendar. For actions, use the Interactive Calendar tab or the Bookings list.
              </p>
            </div>
            <div className="google-calendar-responsive" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '400px' }}>
              <EmbeddedGoogleCalendar darkMode={darkMode} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CalendarView;
