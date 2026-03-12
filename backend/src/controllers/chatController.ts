import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ChatConversation from '../models/ChatConversation';
import ChatMessage from '../models/ChatMessage';
import Booking from '../models/Booking';
import Quotation from '../models/Quotation';
import User from '../models/User';
import { socketService } from '../services/socketService';

/**
 * @desc    Get or create conversation for the current user
 * @route   POST /api/chat/conversation
 * @access  Private
 */
export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    // Look for an existing active conversation
    let conversation = await ChatConversation.findOne({
      userId,
      status: 'active',
    });

    if (!conversation) {
      conversation = await ChatConversation.create({
        userId,
        lastMessage: '',
        lastMessageAt: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('Error in getOrCreateConversation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get all conversations (admin view)
 * @route   GET /api/chat/conversations
 * @access  Private (admin, superadmin)
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await ChatConversation.find()
      .populate('userId', 'name email profileImage')
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error('Error in getConversations:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get messages for a conversation
 * @route   GET /api/chat/conversations/:conversationId/messages
 * @access  Private
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Verify the user has access to this conversation
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Users can only access their own conversations; admins can access any
    const userRole = req.user!.role;
    if (userRole === 'user' && conversation.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation',
      });
    }

    const total = await ChatMessage.countDocuments({ conversationId });

    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Send a message in a conversation
 * @route   POST /api/chat/conversations/:conversationId/messages
 * @access  Private
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Verify conversation exists
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Users can only send to their own conversations; admins can send to any
    const userRole = req.user!.role;
    if (userRole === 'user' && conversation.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation',
      });
    }

    // Prevent sending messages in closed conversations
    if (conversation.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send messages in a closed conversation',
      });
    }

    // Create the message
    const chatMessage = await ChatMessage.create({
      conversationId,
      senderId: req.user!._id,
      senderRole: req.user!.role,
      senderName: req.user!.name || 'Unknown',
      message: message.trim(),
    });

    // Update conversation metadata
    conversation.lastMessage = message.trim();
    conversation.lastMessageAt = new Date();

    if (userRole === 'user') {
      conversation.unreadByAdmin += 1;
    } else {
      conversation.unreadByUser += 1;
    }

    await conversation.save();

    // Emit real-time event
    const emitData = {
      conversationId,
      message: chatMessage,
    };

    if (userRole === 'user') {
      socketService.emitToAdmins('chat:new_message', emitData);
    } else {
      socketService.emitToUser(conversation.userId.toString(), 'chat:new_message', emitData);
    }

    return res.status(201).json({
      success: true,
      data: chatMessage,
    });
  } catch (error: any) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Mark all messages in a conversation as read for the current user's role
 * @route   PATCH /api/chat/conversations/:conversationId/read
 * @access  Private
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userRole = req.user!.role;

    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Users can only mark their own conversations
    if (userRole === 'user' && conversation.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation',
      });
    }

    const now = new Date();

    // Mark messages sent by the OTHER party as read
    if (userRole === 'user') {
      // User is reading: mark admin/superadmin messages as read
      await ChatMessage.updateMany(
        {
          conversationId,
          senderRole: { $in: ['admin', 'superadmin'] },
          isRead: false,
        },
        { isRead: true, readAt: now }
      );
      conversation.unreadByUser = 0;
    } else {
      // Admin is reading: mark user messages as read
      await ChatMessage.updateMany(
        {
          conversationId,
          senderRole: 'user',
          isRead: false,
        },
        { isRead: true, readAt: now }
      );
      conversation.unreadByAdmin = 0;
    }

    await conversation.save();

    // Notify the other party that messages were read
    const readEventData = {
      conversationId,
      readBy: req.user!._id,
      readByRole: userRole,
      readAt: now,
    };

    if (userRole === 'user') {
      socketService.emitToAdmins('chat:messages_read', readEventData);
    } else {
      socketService.emitToUser(conversation.userId.toString(), 'chat:messages_read', readEventData);
    }

    return res.status(200).json({
      success: true,
      data: { message: 'Messages marked as read' },
    });
  } catch (error: any) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get unread message count for current user
 * @route   GET /api/chat/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    let unreadCount = 0;

    if (userRole === 'user') {
      const conversation = await ChatConversation.findOne({
        userId: req.user!._id,
        status: 'active',
      });
      unreadCount = conversation ? conversation.unreadByUser : 0;
    } else {
      // Admin/superadmin: sum unreadByAdmin across all active conversations
      const result = await ChatConversation.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalUnread: { $sum: '$unreadByAdmin' } } },
      ]);
      unreadCount = result.length > 0 ? result[0].totalUnread : 0;
    }

    return res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error: any) {
    console.error('Error in getUnreadCount:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Close a conversation
 * @route   PATCH /api/chat/conversations/:conversationId/close
 * @access  Private (admin, superadmin)
 */
export const closeConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (conversation.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Conversation is already closed',
      });
    }

    conversation.status = 'closed';
    await conversation.save();

    // Notify the user that the conversation was closed
    socketService.emitToUser(conversation.userId.toString(), 'chat:conversation_closed', {
      conversationId,
    });

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('Error in closeConversation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get user context for a conversation (bookings, quotations, profile)
 * @route   GET /api/chat/conversations/:conversationId/context
 * @access  Private (admin, superadmin)
 */
export const getUserChatContext = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;

    // Find the conversation to get the userId
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const userId = conversation.userId;

    // Query user data in parallel
    const [userProfile, bookings, quotations] = await Promise.all([
      User.findById(userId).select('name email phone company createdAt'),
      Booking.find({ userId })
        .select('_id date time status company product location')
        .sort({ date: -1 })
        .limit(5),
      Quotation.find({ userId })
        .select('_id quotationNumber status totalAmount createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user: userProfile,
        bookings,
        quotations,
      },
    });
  } catch (error: any) {
    console.error('Error in getUserChatContext:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
