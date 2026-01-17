import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import {
  getStatus,
  getAuthUrl,
  handleOAuthCallback,
  connectCalendar,
  disconnectCalendar,
  syncBooking,
  syncAllBookings,
  retryFailedSyncs,
  getSyncLogs,
  getSyncStats,
  handleWebhook,
  setupWebhook,
} from '../controllers/googleCalendarController';

const router = express.Router();

// Public routes (for OAuth callback and webhook)
router.get('/oauth/callback', handleOAuthCallback);
router.post('/webhook', handleWebhook);

// Protected admin routes
router.get('/status', protect, adminOnly, getStatus);
router.get('/auth-url', protect, adminOnly, getAuthUrl);
router.post('/connect', protect, adminOnly, connectCalendar);
router.post('/disconnect', protect, adminOnly, disconnectCalendar);
router.post('/sync/:bookingId', protect, adminOnly, syncBooking);
router.post('/sync-all', protect, adminOnly, syncAllBookings);
router.post('/retry-failed', protect, adminOnly, retryFailedSyncs);
router.get('/logs', protect, adminOnly, getSyncLogs);
router.get('/stats', protect, adminOnly, getSyncStats);
router.post('/setup-webhook', protect, adminOnly, setupWebhook);

export default router;
