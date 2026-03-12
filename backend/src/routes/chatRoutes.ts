import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  closeConversation,
  getUserChatContext,
} from '../controllers/chatController';

const router = Router();

// All routes require authentication
router.use(protect);

// User: get or create their conversation
router.post('/conversation', getOrCreateConversation);

// Admin only: get all conversations
router.get('/conversations', authorize('admin', 'superadmin'), getConversations);

// Any authenticated user: get unread count
router.get('/unread-count', getUnreadCount);

// Any authenticated user: get messages for a conversation (access checked in controller)
router.get('/conversations/:conversationId/messages', getMessages);

// Any authenticated user: send a message (access checked in controller)
router.post('/conversations/:conversationId/messages', sendMessage);

// Any authenticated user: mark messages as read (access checked in controller)
router.patch('/conversations/:conversationId/read', markAsRead);

// Admin only: get user context for a conversation (bookings, quotations, profile)
router.get('/conversations/:conversationId/context', authorize('admin', 'superadmin'), getUserChatContext);

// Admin only: close a conversation
router.patch('/conversations/:conversationId/close', authorize('admin', 'superadmin'), closeConversation);

export default router;
