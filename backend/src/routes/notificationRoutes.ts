import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAdminMessage,
} from '../controllers/notificationController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// User routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Admin routes
router.post('/admin-message', adminOnly, createAdminMessage);

export default router;
