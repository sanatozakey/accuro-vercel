import express from 'express';
import {
  getRecommendations,
  recordInteraction,
  getAllInteractions,
  getRecommendationStats,
} from '../controllers/recommendationController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getRecommendations);
router.post('/interaction', protect, recordInteraction);

// Admin only routes
router.get('/interactions', protect, authorize('admin', 'superadmin'), getAllInteractions);
router.get('/stats', protect, authorize('admin', 'superadmin'), getRecommendationStats);

export default router;
