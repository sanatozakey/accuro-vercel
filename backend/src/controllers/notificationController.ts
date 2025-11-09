import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import { NotificationService } from '../services/notificationService';

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const query: any = { userId: req.user!._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNumber)
      .skip(skip);

    const total = await Notification.countDocuments(query);
    const unreadCount = await NotificationService.getUnreadCount(req.user!._id);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user!._id);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this notification',
      });
    }

    const updatedNotification = await NotificationService.markAsRead(notification._id);

    res.status(200).json({
      success: true,
      data: updatedNotification,
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.markAllAsRead(req.user!._id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification',
      });
    }

    await NotificationService.deleteNotification(notification._id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create admin message notification (Admin only)
// @route   POST /api/notifications/admin-message
// @access  Private/Admin
export const createAdminMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, message } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, title, and message',
      });
    }

    const notification = await NotificationService.notifyAdminMessage(
      userId,
      title,
      message
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('Create admin message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
