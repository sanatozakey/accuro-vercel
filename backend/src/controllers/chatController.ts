import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ChatConversation from '../models/ChatConversation';
import ChatMessage from '../models/ChatMessage';
import Booking from '../models/Booking';
import Quotation from '../models/Quotation';
import User from '../models/User';
import { socketService } from '../services/socketService';

/**
 * @desc    Get total unread message count across all active conversations (admin view)
 * @route   GET /api/chat/admin-unread-count
 * @access  Private (admin, superadmin)
 */
export const getAdminUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const result = await ChatConversation.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$unreadByAdmin' } } },
    ]);
    const unreadCount = result.length > 0 ? result[0].total : 0;
    return res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error: any) {
    console.error('Error in getAdminUnreadCount:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

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

    // Filter out conversations where the user has been deleted (userId is null after populate)
    const validConversations = conversations.filter(c => c.userId != null);

    return res.status(200).json({
      success: true,
      data: validConversations,
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
      // User is reading: mark admin/superadmin/bot messages as read
      await ChatMessage.updateMany(
        {
          conversationId,
          senderRole: { $in: ['admin', 'superadmin', 'bot'] },
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
 * @desc    Handle automated bot replies for quick actions
 * @route   POST /api/chat/conversations/:conversationId/auto-reply
 * @access  Private
 */
export const autoReply = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { action } = req.body;

    const validActions = [
      'check_booking',
      'check_quotation',
      'reschedule',
      'product_inquiry',
      'technical_support',
      'talk_to_agent',
    ];

    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
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

    // Users can only auto-reply in their own conversations
    const userRole = req.user!.role;
    if (userRole === 'user' && conversation.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation',
      });
    }

    // Prevent in closed conversations
    if (conversation.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send messages in a closed conversation',
      });
    }

    const userId = conversation.userId;
    let botMessage = '';

    switch (action) {
      case 'check_booking': {
        const bookings = await Booking.find({ userId })
          .sort({ date: -1 })
          .limit(5)
          .select('date time status company purpose product');

        if (bookings.length === 0) {
          botMessage =
            "You don't have any bookings yet. Would you like to schedule one? Visit our booking page at /booking.";
        } else {
          const bookingLines = bookings.map((b: any, i: number) => {
            const dateStr = new Date(b.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            return `${i + 1}. ${b.purpose || 'Booking'} - ${dateStr} at ${b.time}\n   Status: ${b.status} | Company: ${b.company || 'N/A'} | Product: ${b.product || 'N/A'}`;
          });
          botMessage = `Here are your recent bookings:\n\n${bookingLines.join('\n\n')}\n\nIf you need to make changes to any booking, please let us know or contact our admin team.`;
        }
        break;
      }

      case 'check_quotation': {
        const quotations = await Quotation.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('quotationNumber status totalAmount currency items createdAt');

        if (quotations.length === 0) {
          botMessage =
            "You don't have any quotation requests yet. You can request a quotation by browsing our products at /products and adding items to your quote.";
        } else {
          const quotationLines = quotations.map((q: any, i: number) => {
            const dateStr = new Date(q.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const itemCount = q.items ? q.items.length : 0;
            const amount =
              q.totalAmount != null ? ` | Amount: ${q.currency || 'PHP'} ${q.totalAmount.toLocaleString()}` : '';
            return `${i + 1}. ${q.quotationNumber} - Created ${dateStr}\n   Status: ${q.status} | Items: ${itemCount}${amount}`;
          });
          botMessage = `Here are your recent quotation requests:\n\n${quotationLines.join('\n\n')}\n\nFor any questions about your quotations, our admin team will be happy to assist.`;
        }
        break;
      }

      case 'reschedule':
        botMessage =
          'To reschedule a booking, please provide the following details:\n\n' +
          '1. The booking you want to reschedule (date and purpose)\n' +
          '2. Your preferred new date and time\n' +
          '3. Reason for rescheduling\n\n' +
          'An admin will review your request and confirm the new schedule. You can also manage your bookings directly from your dashboard at /bookings.';
        break;

      case 'product_inquiry':
        botMessage =
          'Thank you for your interest in our products! You can browse our full catalog at /products to explore Beamex calibration instruments and solutions.\n\n' +
          'If you have specific questions about a product, please share the product name or details here, and an admin will follow up with more information as soon as possible.';
        break;

      case 'technical_support':
        botMessage =
          'Your technical support request has been noted. Our team typically responds within a few hours during business hours.\n\n' +
          'In the meantime, please provide as much detail as possible about your issue:\n' +
          '- Product/equipment involved\n' +
          '- Description of the issue\n' +
          '- Any error messages or symptoms\n\n' +
          'An admin will review your request and respond as soon as available.';
        break;

      case 'talk_to_agent':
        botMessage =
          'Your request to speak with an agent has been noted. An admin will be notified and will respond as soon as they are available.\n\n' +
          'Our team is typically available during business hours (Mon-Fri, 9AM-6PM). If you have an urgent matter, please describe it here so we can prioritize accordingly.';
        break;

      default:
        botMessage = 'Thank you for your message. An admin will respond shortly.';
    }

    // Create the bot message
    const chatMessage = await ChatMessage.create({
      conversationId,
      senderId: userId,
      senderRole: 'bot',
      senderName: 'Accuro Assistant',
      message: botMessage,
    });

    // Update conversation metadata
    conversation.lastMessage = botMessage.substring(0, 200);
    conversation.lastMessageAt = new Date();
    // Bot messages are read by admin but unread by user (since user triggered it, mark as read for user too)
    // Actually, the user sees the bot reply immediately, so no need to increment unreadByUser
    // But admins should be notified there's activity
    conversation.unreadByAdmin += 1;
    await conversation.save();

    // Emit real-time events
    const emitData = {
      conversationId,
      message: chatMessage,
    };

    // Send to the user so their chat updates in real-time
    socketService.emitToUser(userId.toString(), 'chat:new_message', emitData);
    // Notify admins about the bot interaction
    socketService.emitToAdmins('chat:new_message', emitData);

    return res.status(201).json({
      success: true,
      data: chatMessage,
    });
  } catch (error: any) {
    console.error('Error in autoReply:', error);
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
        .select('_id date time status company product location purpose contactName contactEmail contactPhone additionalInfo')
        .sort({ date: -1 })
        .limit(5),
      Quotation.find({ userId })
        .select('_id quotationNumber status totalAmount currency items createdAt validUntil')
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
