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
}

type CalendarTab = 'interactive' | 'google';

export function CalendarView({
  darkMode,
  calendarEvents,
  handleEventClick,
}: CalendarViewProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<CalendarTab>('interactive');

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
      {/* Tab Navigation */}
      <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('interactive')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
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
          Interactive Calendar
          <span className={`text-xs px-2 py-0.5 rounded-full ${
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
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
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
          Google Calendar
          <span className={`text-xs px-2 py-0.5 rounded-full ${
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
      <div className="p-4 sm:p-6">
        {activeTab === 'interactive' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Interactive Booking Calendar
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click on any booking to view details and take quick actions
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Pending</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Confirmed</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Rescheduled</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Cancelled</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Completed</span>
                </span>
              </div>
            </div>
            <div className={`fullcalendar-wrapper ${darkMode ? 'fc-dark' : ''}`}>
              <style>{`
                .fc-dark .fc-theme-standard td,
                .fc-dark .fc-theme-standard th,
                .fc-dark .fc-theme-standard .fc-scrollgrid {
                  border-color: #374151;
                }
                .fc-dark .fc-col-header-cell-cushion,
                .fc-dark .fc-daygrid-day-number {
                  color: #e5e7eb;
                }
                .fc-dark .fc-daygrid-day-top {
                  color: #e5e7eb;
                }
                .fc-dark .fc-toolbar-title {
                  color: #e5e7eb;
                }
                .fc-dark .fc-button-primary {
                  background-color: #3b82f6;
                  border-color: #3b82f6;
                }
                .fc-dark .fc-button-primary:hover {
                  background-color: #2563eb;
                  border-color: #2563eb;
                }
                .fc-dark .fc-button-primary:not(:disabled):active,
                .fc-dark .fc-button-primary:not(:disabled).fc-button-active {
                  background-color: #1d4ed8;
                  border-color: #1d4ed8;
                }
                .fc-dark .fc-daygrid-day.fc-day-today {
                  background-color: rgba(59, 130, 246, 0.15);
                }
                .fc-dark .fc-more-link {
                  color: #93c5fd;
                }
                .fc-event {
                  cursor: pointer !important;
                  border-radius: 4px;
                  padding: 2px 4px;
                  font-size: 0.85em;
                }
                .fc-event:hover {
                  opacity: 0.9;
                  transform: scale(1.02);
                  transition: all 0.15s ease;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                .fc-daygrid-event-dot {
                  display: none;
                }
                .fc-popover {
                  background: ${darkMode ? '#1f2937' : 'white'};
                  border-color: ${darkMode ? '#374151' : '#e5e7eb'};
                }
                .fc-popover-header {
                  background: ${darkMode ? '#374151' : '#f3f4f6'};
                  color: ${darkMode ? '#e5e7eb' : '#111827'};
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
                height="auto"
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short',
                }}
                dayMaxEvents={3}
                moreLinkClick="popover"
                nowIndicator={true}
                eventDisplay="block"
              />
            </div>
            <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <strong>Tip:</strong> Click on any event to open the booking details modal where you can:
                <span className="ml-1">Confirm, Reschedule, Cancel, or Mark as Complete.</span>
              </p>
            </div>
          </>
        )}

        {activeTab === 'google' && (
          <>
            <div className="mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Google Calendar View
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Synced with your Google Calendar. For actions, use the Interactive Calendar tab or the Bookings list.
              </p>
            </div>
            <EmbeddedGoogleCalendar darkMode={darkMode} />
          </>
        )}
      </div>
    </div>
  );
}

export default CalendarView;
