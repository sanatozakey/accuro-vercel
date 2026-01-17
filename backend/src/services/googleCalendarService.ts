import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import CalendarSettings, { ICalendarSettings } from '../models/CalendarSettings';
import CalendarSyncLog from '../models/CalendarSyncLog';
import Booking, { IBooking } from '../models/Booking';
import mongoose from 'mongoose';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-calendar/oauth/callback';
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// OAuth2 scopes needed
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Status to color mapping for Google Calendar events
const STATUS_COLORS: Record<string, string> = {
  pending: '5',     // Yellow
  confirmed: '10',  // Green
  completed: '9',   // Blue
  cancelled: '11',  // Red
  rescheduled: '6', // Orange
};

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Check if Google Calendar is configured
   */
  isConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }

  /**
   * Generate OAuth URL for user authorization
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiry: Date;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiry: new Date(tokens.expiry_date || Date.now() + 3600000),
    };
  }

  /**
   * Get authenticated OAuth2 client
   */
  private async getAuthenticatedClient(): Promise<OAuth2Client | null> {
    const settings = await CalendarSettings.findOne();
    if (!settings) {
      return null;
    }

    this.oauth2Client.setCredentials({
      access_token: settings.accessToken,
      refresh_token: settings.refreshToken,
      expiry_date: settings.tokenExpiry.getTime(),
    });

    // Check if token is expired and refresh if needed
    if (settings.tokenExpiry.getTime() < Date.now()) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();

        // Update stored tokens
        settings.accessToken = credentials.access_token!;
        settings.tokenExpiry = new Date(credentials.expiry_date || Date.now() + 3600000);
        await settings.save();

        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Failed to refresh Google token:', error);
        return null;
      }
    }

    return this.oauth2Client;
  }

  /**
   * Get calendar client
   */
  private async getCalendarClient(): Promise<calendar_v3.Calendar | null> {
    const authClient = await this.getAuthenticatedClient();
    if (!authClient) {
      return null;
    }
    return google.calendar({ version: 'v3', auth: authClient });
  }

  /**
   * Get calendar settings
   */
  async getSettings(): Promise<ICalendarSettings | null> {
    return await CalendarSettings.findOne().populate('connectedBy', 'name email');
  }

  /**
   * Save calendar settings after OAuth
   */
  async saveSettings(
    accessToken: string,
    refreshToken: string,
    tokenExpiry: Date,
    calendarEmail: string,
    connectedBy: mongoose.Types.ObjectId
  ): Promise<ICalendarSettings> {
    // Remove existing settings (only one calendar connection allowed)
    await CalendarSettings.deleteMany({});

    const settings = await CalendarSettings.create({
      accessToken,
      refreshToken,
      tokenExpiry,
      calendarId: GOOGLE_CALENDAR_ID,
      calendarEmail,
      syncEnabled: true,
      connectedBy,
      connectedAt: new Date(),
    });

    return settings;
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(): Promise<void> {
    const settings = await CalendarSettings.findOne();
    if (settings) {
      // Revoke tokens
      try {
        await this.oauth2Client.revokeToken(settings.accessToken);
      } catch (error) {
        console.error('Failed to revoke token:', error);
      }

      // Delete settings
      await CalendarSettings.deleteMany({});
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<{ email: string }> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return { email: data.email || '' };
  }

  /**
   * Convert booking to Google Calendar event
   */
  private bookingToEvent(booking: IBooking): calendar_v3.Schema$Event {
    // Parse the time string (e.g., "10:00 AM")
    const [time, period] = booking.time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;

    // Create start date/time
    const startDate = new Date(booking.date);
    startDate.setHours(hour24, minutes, 0, 0);

    // End time is 1 hour after start (default meeting duration)
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    return {
      summary: `Accuro Booking: ${booking.company}`,
      description: `
Contact: ${booking.contactName}
Email: ${booking.contactEmail}
Phone: ${booking.contactPhone}
Purpose: ${booking.purpose}
Product: ${booking.product}
Location: ${booking.location}
${booking.additionalInfo ? `Additional Info: ${booking.additionalInfo}` : ''}
Status: ${booking.status.toUpperCase()}
${booking.conclusion ? `Conclusion: ${booking.conclusion}` : ''}
---
Booking ID: ${booking._id}
      `.trim(),
      location: booking.location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Manila', // Adjust based on your timezone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      colorId: STATUS_COLORS[booking.status] || '5',
      extendedProperties: {
        private: {
          accuroBookingId: booking._id.toString(),
          accuroStatus: booking.status,
        },
      },
    };
  }

  /**
   * Sync a single booking to Google Calendar
   */
  async syncBookingToGoogle(bookingId: string): Promise<boolean> {
    const settings = await CalendarSettings.findOne();
    if (!settings || !settings.syncEnabled) {
      console.log('Google Calendar sync not enabled');
      return false;
    }

    const calendar = await this.getCalendarClient();
    if (!calendar) {
      console.error('Failed to get calendar client');
      return false;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return false;
    }

    const event = this.bookingToEvent(booking);

    try {
      let result;
      let action: 'create' | 'update' = 'create';

      if (booking.googleEventId) {
        // Update existing event
        action = 'update';
        result = await calendar.events.update({
          calendarId: settings.calendarId,
          eventId: booking.googleEventId,
          requestBody: event,
        });
      } else {
        // Create new event
        result = await calendar.events.insert({
          calendarId: settings.calendarId,
          requestBody: event,
        });
      }

      // Update booking with Google event ID and sync status
      booking.googleEventId = result.data.id!;
      booking.googleSyncStatus = 'synced';
      booking.lastGoogleSyncAt = new Date();
      booking.googleSyncError = undefined;
      await booking.save();

      // Log success
      await CalendarSyncLog.create({
        bookingId: booking._id,
        googleEventId: result.data.id,
        direction: 'booking_to_google',
        action,
        status: 'success',
        details: `Event ${action}d successfully`,
      });

      return true;
    } catch (error: any) {
      console.error('Failed to sync booking to Google:', error);

      // Update booking with error
      booking.googleSyncStatus = 'failed';
      booking.googleSyncError = error.message;
      await booking.save();

      // Log failure
      await CalendarSyncLog.create({
        bookingId: booking._id,
        direction: 'booking_to_google',
        action: booking.googleEventId ? 'update' : 'create',
        status: 'failed',
        error: error.message,
      });

      return false;
    }
  }

  /**
   * Delete Google Calendar event for a booking
   */
  async deleteGoogleEvent(bookingId: string): Promise<boolean> {
    const settings = await CalendarSettings.findOne();
    if (!settings || !settings.syncEnabled) {
      return false;
    }

    const calendar = await this.getCalendarClient();
    if (!calendar) {
      return false;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || !booking.googleEventId) {
      return false;
    }

    try {
      await calendar.events.delete({
        calendarId: settings.calendarId,
        eventId: booking.googleEventId,
      });

      // Update booking
      booking.googleEventId = undefined;
      booking.googleSyncStatus = 'not_synced';
      booking.lastGoogleSyncAt = new Date();
      await booking.save();

      // Log success
      await CalendarSyncLog.create({
        bookingId: booking._id,
        direction: 'booking_to_google',
        action: 'delete',
        status: 'success',
        details: 'Event deleted successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Failed to delete Google event:', error);

      // Log failure
      await CalendarSyncLog.create({
        bookingId: booking._id,
        googleEventId: booking.googleEventId,
        direction: 'booking_to_google',
        action: 'delete',
        status: 'failed',
        error: error.message,
      });

      return false;
    }
  }

  /**
   * Sync all unsynced bookings to Google Calendar
   */
  async syncAllBookings(): Promise<{ success: number; failed: number }> {
    const settings = await CalendarSettings.findOne();
    if (!settings || !settings.syncEnabled) {
      return { success: 0, failed: 0 };
    }

    // Find all bookings that need syncing (not cancelled, not synced)
    const bookings = await Booking.find({
      status: { $ne: 'cancelled' },
      $or: [
        { googleSyncStatus: 'not_synced' },
        { googleSyncStatus: 'failed' },
        { googleSyncStatus: 'pending' },
      ],
    });

    let success = 0;
    let failed = 0;

    for (const booking of bookings) {
      const synced = await this.syncBookingToGoogle(booking._id.toString());
      if (synced) {
        success++;
      } else {
        failed++;
      }
    }

    // Update last sync time
    settings.lastSyncAt = new Date();
    await settings.save();

    return { success, failed };
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(limit: number = 50): Promise<any[]> {
    return await CalendarSyncLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('bookingId', 'company contactName date time');
  }

  /**
   * Retry failed syncs
   */
  async retryFailedSyncs(): Promise<{ success: number; failed: number }> {
    const failedBookings = await Booking.find({
      googleSyncStatus: 'failed',
      status: { $ne: 'cancelled' },
    });

    let success = 0;
    let failed = 0;

    for (const booking of failedBookings) {
      const synced = await this.syncBookingToGoogle(booking._id.toString());
      if (synced) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Setup webhook for real-time sync from Google Calendar
   */
  async setupWebhook(webhookUrl: string): Promise<boolean> {
    const settings = await CalendarSettings.findOne();
    if (!settings) {
      return false;
    }

    const calendar = await this.getCalendarClient();
    if (!calendar) {
      return false;
    }

    try {
      // Create a unique channel ID
      const channelId = uuidv4();

      // Watch for changes - expires in 7 days (Google's max)
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 7);

      const response = await calendar.events.watch({
        calendarId: settings.calendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          expiration: expiration.getTime().toString(),
        },
      });

      // Save webhook details
      settings.webhookChannelId = channelId;
      settings.webhookResourceId = response.data.resourceId || undefined;
      settings.webhookExpiration = expiration;
      await settings.save();

      return true;
    } catch (error) {
      console.error('Failed to setup webhook:', error);
      return false;
    }
  }

  /**
   * Handle webhook notification from Google Calendar
   */
  async handleWebhookNotification(
    channelId: string,
    resourceId: string
  ): Promise<void> {
    const settings = await CalendarSettings.findOne();
    if (!settings || settings.webhookChannelId !== channelId) {
      console.error('Invalid webhook channel');
      return;
    }

    const calendar = await this.getCalendarClient();
    if (!calendar) {
      return;
    }

    try {
      // Get recently modified events
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const response = await calendar.events.list({
        calendarId: settings.calendarId,
        updatedMin: fiveMinutesAgo.toISOString(),
        singleEvents: true,
        orderBy: 'updated',
      });

      const events = response.data.items || [];

      for (const event of events) {
        // Check if this is an Accuro booking
        const accuroBookingId = event.extendedProperties?.private?.accuroBookingId;
        if (!accuroBookingId) continue;

        const booking = await Booking.findById(accuroBookingId);
        if (!booking) continue;

        // Handle event deletion
        if (event.status === 'cancelled') {
          booking.status = 'cancelled';
          booking.cancellationReason = 'Cancelled via Google Calendar';
          await booking.save();

          await CalendarSyncLog.create({
            bookingId: booking._id,
            googleEventId: event.id,
            direction: 'google_to_booking',
            action: 'delete',
            status: 'success',
            details: 'Booking cancelled from Google Calendar',
          });
          continue;
        }

        // Handle time/date changes
        if (event.start?.dateTime) {
          const newStartTime = new Date(event.start.dateTime);
          const dateChanged = booking.date.getTime() !== new Date(newStartTime.toDateString()).getTime();

          if (dateChanged) {
            // Store original if not already set
            if (!booking.originalDate) {
              booking.originalDate = booking.date;
              booking.originalTime = booking.time;
            }

            booking.date = newStartTime;

            // Format time
            let hours = newStartTime.getHours();
            const minutes = newStartTime.getMinutes().toString().padStart(2, '0');
            const period = hours >= 12 ? 'PM' : 'AM';
            if (hours > 12) hours -= 12;
            if (hours === 0) hours = 12;
            booking.time = `${hours}:${minutes} ${period}`;

            booking.status = 'rescheduled';
            booking.rescheduleReason = 'Rescheduled via Google Calendar';
            await booking.save();

            await CalendarSyncLog.create({
              bookingId: booking._id,
              googleEventId: event.id,
              direction: 'google_to_booking',
              action: 'update',
              status: 'success',
              details: 'Booking rescheduled from Google Calendar',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to handle webhook notification:', error);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalBookings: number;
    syncedBookings: number;
    failedSyncs: number;
    pendingSyncs: number;
    lastSyncAt: Date | null;
  }> {
    const settings = await CalendarSettings.findOne();

    const [totalBookings, syncedBookings, failedSyncs, pendingSyncs] = await Promise.all([
      Booking.countDocuments({ status: { $ne: 'cancelled' } }),
      Booking.countDocuments({ googleSyncStatus: 'synced' }),
      Booking.countDocuments({ googleSyncStatus: 'failed' }),
      Booking.countDocuments({ googleSyncStatus: { $in: ['pending', 'not_synced'] } }),
    ]);

    return {
      totalBookings,
      syncedBookings,
      failedSyncs,
      pendingSyncs,
      lastSyncAt: settings?.lastSyncAt || null,
    };
  }
}

export default new GoogleCalendarService();
