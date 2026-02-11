import express from 'express';
import { getRateLimitConfig } from '../controllers/rateLimitController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/config', getRateLimitConfig);

export default router;
