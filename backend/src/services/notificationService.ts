import Notification from '../models/Notification';
import mongoose from 'mongoose';

// Conditional socket import for serverless compatibility
let socketService: any = { emitToUser: () => {}, emitToAdmins: () => {} };
try {
  socketService = require('./socketService').socketService;
} catch (e) {
  console.log('Socket service not available in serverless environment');
}

interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId | string;
  type: 'booking' | 'quotation' | 'system' | 'admin_message';
  title: string;
  message: string;
  relatedId?: mongoose.Types.ObjectId | string;
  relatedType?: 'booking' | 'quotation' | 'order';
  actionUrl?: string;
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await Notification.create({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
        actionUrl: params.actionUrl,
        isRead: false,
      });

      // Emit socket event for real-time notification
      const userId = typeof params.userId === 'string' ? params.userId : params.userId.toString();
      socketService.emitToUser(userId, 'notification:new', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedId: notification.relatedId,
        relatedType: notification.relatedType,
        actionUrl: notification.actionUrl,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create booking status change notification
   */
  static async notifyBookingStatusChange(
    userId: mongoose.Types.ObjectId | string,
    bookingId: mongoose.Types.ObjectId | string,
    oldStatus: string,
    newStatus: string,
    bookingDetails: { company: string; date: string; time: string }
  ) {
    const statusMessages: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: 'Meeting Confirmed',
        message: `Your meeting with ${bookingDetails.company} on ${bookingDetails.date} at ${bookingDetails.time} has been confirmed by our team.`,
      },
      'in-progress': {
        title: 'Meeting In Progress',
        message: `Your meeting with ${bookingDetails.company} is currently in progress.`,
      },
      completed: {
        title: 'Meeting Completed',
        message: `Your meeting with ${bookingDetails.company} has been completed. We hope it was productive!`,
      },
      cancelled: {
        title: 'Meeting Cancelled',
        message: `Your meeting with ${bookingDetails.company} on ${bookingDetails.date} has been cancelled.`,
      },
    };

    const statusInfo = statusMessages[newStatus];
    if (!statusInfo) return;

    return this.createNotification({
      userId,
      type: 'booking',
      title: statusInfo.title,
      message: statusInfo.message,
      relatedId: bookingId,
      relatedType: 'booking',
      actionUrl: `/account?tab=bookings&bookingId=${bookingId}`,
    });
  }

  /**
   * Create quotation notification
   */
  static async notifyNewQuotation(
    userId: mongoose.Types.ObjectId | string,
    quotationId: mongoose.Types.ObjectId | string,
    quotationNumber: string,
    totalAmount: number
  ) {
    return this.createNotification({
      userId,
      type: 'quotation',
      title: 'New Quotation Received',
      message: `You have received a new quotation #${quotationNumber} for ₱${totalAmount.toLocaleString()}. Please review and respond.`,
      relatedId: quotationId,
      relatedType: 'quotation',
      actionUrl: '/quotations',
    });
  }

  /**
   * Create quotation status change notification
   */
  static async notifyQuotationStatusChange(
    userId: mongoose.Types.ObjectId | string,
    quotationId: mongoose.Types.ObjectId | string,
    quotationNumber: string,
    newStatus: string
  ) {
    const statusMessages: Record<string, { title: string; message: string }> = {
      approved: {
        title: 'Quotation Approved',
        message: `Your quotation request #${quotationNumber} has been approved! Check your quotation details to proceed with the order.`,
      },
      sent: {
        title: 'Quotation Sent',
        message: `Quotation #${quotationNumber} has been sent to you. Please review it at your convenience.`,
      },
      accepted: {
        title: 'Quotation Accepted',
        message: `Quotation #${quotationNumber} has been accepted. We will process your order shortly.`,
      },
      rejected: {
        title: 'Quotation Request Declined',
        message: `Unfortunately, your quotation request #${quotationNumber} could not be approved at this time. Please contact us for more information.`,
      },
      expired: {
        title: 'Quotation Expired',
        message: `Quotation #${quotationNumber} has expired. Please contact us for a new quote.`,
      },
    };

    const statusInfo = statusMessages[newStatus];
    if (!statusInfo) return;

    return this.createNotification({
      userId,
      type: 'quotation',
      title: statusInfo.title,
      message: statusInfo.message,
      relatedId: quotationId,
      relatedType: 'quotation',
      actionUrl: '/quotations',
    });
  }

  /**
   * Create admin message notification
   */
  static async notifyAdminMessage(
    userId: mongoose.Types.ObjectId | string,
    title: string,
    message: string
  ) {
    return this.createNotification({
      userId,
      type: 'admin_message',
      title,
      message,
      actionUrl: '/notifications',
    });
  }

  /**
   * Get user's unread notification count
   */
  static async getUnreadCount(userId: mongoose.Types.ObjectId | string) {
    return await Notification.countDocuments({
      userId,
      isRead: false,
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: mongoose.Types.ObjectId | string) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: mongoose.Types.ObjectId | string) {
    return await Notification.updateMany(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: mongoose.Types.ObjectId | string) {
    return await Notification.findByIdAndDelete(notificationId);
  }
}
