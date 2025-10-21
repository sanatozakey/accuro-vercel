import express from 'express';
import {
  createOrUpdateSession,
  trackInteraction,
  getActiveSessions,
  getSessionHeatmap,
  getSessionDetails,
  cleanupInactiveSessions,
} from '../controllers/activeSessionController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// Public routes (for tracking)
router.post('/track', createOrUpdateSession);
router.post('/track/interaction', trackInteraction);

// Admin routes (for viewing analytics)
router.get('/active', protect, adminOnly, getActiveSessions);
router.get('/heatmap', protect, adminOnly, getSessionHeatmap);
router.get('/:sessionId', protect, adminOnly, getSessionDetails);
router.post('/cleanup', protect, adminOnly, cleanupInactiveSessions);

export default router;
