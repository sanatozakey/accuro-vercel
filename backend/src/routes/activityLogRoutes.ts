import express from 'express';
import {
  getAllActivityLogs,
  createActivityLog,
} from '../controllers/activityLogController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// Admin only routes
router.get('/', protect, adminOnly, getAllActivityLogs);
router.post('/', protect, createActivityLog);

export default router;
