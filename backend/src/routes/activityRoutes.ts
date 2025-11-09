import express from 'express';
import { getUserActivity, getActivityStats } from '../controllers/activityController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Protect all activity routes
router.use(protect);

// Get user activity timeline
router.get('/', getUserActivity);

// Get activity statistics
router.get('/stats', getActivityStats);

export default router;
