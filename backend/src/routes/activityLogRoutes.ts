import express from 'express';
import {
  getAllActivityLogs,
  getMyActivityLogs,
  createActivityLog,
} from '../controllers/activityLogController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// User routes
router.get('/my', protect, getMyActivityLogs);
router.post('/', protect, createActivityLog);

// Admin only routes
router.get('/', protect, adminOnly, getAllActivityLogs);

export default router;
