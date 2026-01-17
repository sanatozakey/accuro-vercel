import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import googleCalendarService from '../services/googleCalendarService';

/**
 * @desc    Check if Google Calendar is configured
 * @route   GET /api/google-calendar/status
 * @access  Private/Admin
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const isConfigured = googleCalendarService.isConfigured();
    const settings = await googleCalendarService.getSettings();
    const stats = settings ? await googleCalendarService.getSyncStats() : null;

    res.status(200).json({
      success: true,
      data: {
        isConfigured,
        isConnected: !!settings,
        settings: settings
          ? {
              calendarEmail: settings.calendarEmail,
              syncEnabled: settings.syncEnabled,
              lastSyncAt: settings.lastSyncAt,
              connectedAt: settings.connectedAt,
            }
          : null,
        stats,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get OAuth URL for Google Calendar authorization
 * @route   GET /api/google-calendar/auth-url
 * @access  Private/Admin
 */
export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    if (!googleCalendarService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables.',
      });
    }

    const authUrl = googleCalendarService.getAuthUrl();

    res.status(200).json({
      success: true,
      data: { authUrl },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Handle OAuth callback from Google
 * @route   GET /api/google-calendar/oauth/callback
 * @access  Public (but requires valid OAuth state)
 */
export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/admin/dashboard?tab=settings&google_error=${encodeURIComponent(error as string)}`);
    }

    if (!code || typeof code !== 'string') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/admin/dashboard?tab=settings&google_error=no_code`);
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code);

    // Get user info to get email
    const userInfo = await googleCalendarService.getUserInfo(tokens.accessToken);

    // Get the requesting user from session/token
    // For now, we'll need to use a temporary approach since this is a redirect
    // The user ID should be passed via state parameter in production
    const req_auth = req as AuthRequest;
    const connectedBy = req_auth.user?._id || req.query.state;

    if (!connectedBy) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/admin/dashboard?tab=settings&google_error=no_user`);
    }

    // Save settings
    await googleCalendarService.saveSettings(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiry,
      userInfo.email,
      connectedBy as any
    );

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/admin/dashboard?tab=settings&google_success=true`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/admin/dashboard?tab=settings&google_error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * @desc    Connect Google Calendar (get auth URL with state)
 * @route   POST /api/google-calendar/connect
 * @access  Private/Admin
 */
export const connectCalendar = async (req: AuthRequest, res: Response) => {
  try {
    if (!googleCalendarService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar is not configured. Please add credentials to environment variables.',
      });
    }

    // Generate auth URL with user ID as state
    const authUrl = googleCalendarService.getAuthUrl() + `&state=${req.user?._id}`;

    res.status(200).json({
      success: true,
      data: { authUrl },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Disconnect Google Calendar
 * @route   POST /api/google-calendar/disconnect
 * @access  Private/Admin
 */
export const disconnectCalendar = async (req: AuthRequest, res: Response) => {
  try {
    await googleCalendarService.disconnect();

    res.status(200).json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Sync a single booking to Google Calendar
 * @route   POST /api/google-calendar/sync/:bookingId
 * @access  Private/Admin
 */
export const syncBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    const success = await googleCalendarService.syncBookingToGoogle(bookingId);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Booking synced to Google Calendar',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to sync booking',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Sync all bookings to Google Calendar
 * @route   POST /api/google-calendar/sync-all
 * @access  Private/Admin
 */
export const syncAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const result = await googleCalendarService.syncAllBookings();

    res.status(200).json({
      success: true,
      message: `Synced ${result.success} bookings, ${result.failed} failed`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Retry failed syncs
 * @route   POST /api/google-calendar/retry-failed
 * @access  Private/Admin
 */
export const retryFailedSyncs = async (req: AuthRequest, res: Response) => {
  try {
    const result = await googleCalendarService.retryFailedSyncs();

    res.status(200).json({
      success: true,
      message: `Retried ${result.success + result.failed} syncs, ${result.success} succeeded`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get sync logs
 * @route   GET /api/google-calendar/logs
 * @access  Private/Admin
 */
export const getSyncLogs = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await googleCalendarService.getSyncLogs(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get sync statistics
 * @route   GET /api/google-calendar/stats
 * @access  Private/Admin
 */
export const getSyncStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await googleCalendarService.getSyncStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Handle webhook notification from Google Calendar
 * @route   POST /api/google-calendar/webhook
 * @access  Public (Google sends notifications here)
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const channelId = req.headers['x-goog-channel-id'] as string;
    const resourceId = req.headers['x-goog-resource-id'] as string;
    const resourceState = req.headers['x-goog-resource-state'] as string;

    // Respond immediately to Google
    res.status(200).send('OK');

    // Process notification asynchronously
    if (resourceState === 'sync') {
      // Initial sync notification, ignore
      return;
    }

    if (channelId && resourceId) {
      await googleCalendarService.handleWebhookNotification(channelId, resourceId);
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Google from retrying
    res.status(200).send('OK');
  }
};

/**
 * @desc    Setup webhook for real-time sync
 * @route   POST /api/google-calendar/setup-webhook
 * @access  Private/Admin
 */
export const setupWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const webhookUrl = `${baseUrl}/api/google-calendar/webhook`;

    const success = await googleCalendarService.setupWebhook(webhookUrl);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Webhook setup successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to setup webhook. Make sure you have a public URL configured.',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
