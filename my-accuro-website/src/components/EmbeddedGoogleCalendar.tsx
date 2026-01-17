import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, ExternalLink, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import googleCalendarService, { CalendarStatus } from '../services/googleCalendarService';

interface EmbeddedGoogleCalendarProps {
  darkMode: boolean;
}

export function EmbeddedGoogleCalendar({ darkMode }: EmbeddedGoogleCalendarProps): React.ReactElement {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await googleCalendarService.getStatus();
      setStatus(response.data);
      if (response.data.isConnected && response.data.settings?.calendarEmail) {
        setCalendarEmail(response.data.settings.calendarEmail);
      }
    } catch (error) {
      console.error('Failed to fetch calendar status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Build Google Calendar embed URL
  const getEmbedUrl = () => {
    if (!calendarEmail) return null;
    const encodedEmail = encodeURIComponent(calendarEmail);
    // Using Philippines timezone as default, can be made configurable
    return `https://calendar.google.com/calendar/embed?src=${encodedEmail}&ctz=Asia/Manila&mode=MONTH&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1`;
  };

  const openInGoogleCalendar = () => {
    window.open('https://calendar.google.com', '_blank');
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-96 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading Google Calendar...</span>
      </div>
    );
  }

  if (!status?.isConnected) {
    return (
      <div className={`flex flex-col items-center justify-center h-96 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <Calendar className={`h-16 w-16 mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Google Calendar Not Connected
        </h3>
        <p className={`text-center mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Connect your Google Calendar in the Settings tab to view your calendar here.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/admin/dashboard?tab=settings'}>
          Go to Settings
        </Button>
      </div>
    );
  }

  const embedUrl = getEmbedUrl();

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Calendar className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Google Calendar
          </span>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ({calendarEmail})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchStatus} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={openInGoogleCalendar}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Open in Google
          </Button>
        </div>
      </div>

      {/* Calendar Embed */}
      <div className="relative">
        {embedUrl ? (
          <>
            <iframe
              src={embedUrl}
              style={{ border: 0 }}
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              title="Google Calendar"
              className={darkMode ? 'invert hue-rotate-180' : ''}
            />
            {/* Note about public calendar */}
            <div className={`p-3 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <strong>Note:</strong> If the calendar appears empty, ensure your Google Calendar is set to public.
                  Go to Google Calendar → Settings → [Your Calendar] → Access permissions → Make available to public.
                  For security, only events marked as "Show details to everyone" will appear in the embed.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Unable to load calendar embed</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmbeddedGoogleCalendar;
