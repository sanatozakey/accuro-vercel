import express from 'express';
import {
  getMyHistory,
  getMyReviewHistory,
  getMyQuoteHistory,
  getMyBookingHistory,
  getMyActivityLogs,
  getUserHistory,
} from '../controllers/userHistoryController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// User routes - get their own history
router.route('/my-history').get(protect, getMyHistory);
router.route('/reviews').get(protect, getMyReviewHistory);
router.route('/quotes').get(protect, getMyQuoteHistory);
router.route('/bookings').get(protect, getMyBookingHistory);
router.route('/activity').get(protect, getMyActivityLogs);

// Admin routes - get any user's history
router.route('/:userId').get(protect, authorize('admin', 'superadmin'), getUserHistory);

export default router;
