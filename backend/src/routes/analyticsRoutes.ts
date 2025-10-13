import express from 'express';
import {
  getProductAnalytics,
  getLocationAnalytics,
  getDashboardAnalytics,
} from '../controllers/analyticsController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/products', getProductAnalytics);
router.get('/locations', getLocationAnalytics);
router.get('/dashboard', getDashboardAnalytics);

export default router;
