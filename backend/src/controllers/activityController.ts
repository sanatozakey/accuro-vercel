import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Booking from '../models/Booking';
import Quotation from '../models/Quotation';
import Notification from '../models/Notification';

export interface ActivityEvent {
  id: string;
  type: 'booking' | 'quotation' | 'notification';
  title: string;
  description: string;
  status?: string;
  date: Date;
  metadata?: any;
}

// Get user activity timeline
export const getUserActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Fetch bookings
    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch quotations
    const quotations = await Quotation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch notifications
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Transform to activity events
    const activities: ActivityEvent[] = [];

    // Add bookings
    bookings.forEach((booking) => {
      activities.push({
        id: booking._id.toString(),
        type: 'booking',
        title: 'Booking Created',
        description: `Booking for ${booking.purpose} scheduled`,
        status: booking.status,
        date: booking.createdAt,
        metadata: {
          service: booking.purpose,
          date: booking.date,
          location: booking.location,
        },
      });

      if (booking.status === 'confirmed' && booking.updatedAt) {
        activities.push({
          id: `${booking._id}-confirmed`,
          type: 'booking',
          title: 'Booking Confirmed',
          description: `Your ${booking.purpose} booking was confirmed`,
          status: booking.status,
          date: booking.updatedAt,
          metadata: {
            service: booking.purpose,
            date: booking.date,
          },
        });
      }

      if (booking.status === 'completed' && booking.updatedAt) {
        activities.push({
          id: `${booking._id}-completed`,
          type: 'booking',
          title: 'Booking Completed',
          description: `${booking.purpose} service completed`,
          status: booking.status,
          date: booking.updatedAt,
          metadata: {
            service: booking.purpose,
          },
        });
      }
    });

    // Add quotations
    quotations.forEach((quotation) => {
      activities.push({
        id: quotation._id.toString(),
        type: 'quotation',
        title: 'Quotation Requested',
        description: `Quotation request ${quotation.quotationNumber} submitted`,
        status: quotation.status,
        date: quotation.createdAt,
        metadata: {
          quotationNumber: quotation.quotationNumber,
          items: quotation.items.length,
        },
      });

      if (quotation.status === 'accepted' && quotation.acceptedAt) {
        activities.push({
          id: `${quotation._id}-accepted`,
          type: 'quotation',
          title: 'Quotation Accepted',
          description: `Quotation ${quotation.quotationNumber} was accepted by customer`,
          status: quotation.status,
          date: quotation.acceptedAt,
          metadata: {
            quotationNumber: quotation.quotationNumber,
            totalAmount: quotation.totalAmount,
            currency: quotation.currency,
          },
        });
      }

      if (quotation.status === 'rejected' && quotation.rejectedAt) {
        activities.push({
          id: `${quotation._id}-rejected`,
          type: 'quotation',
          title: 'Quotation Declined',
          description: `Quotation ${quotation.quotationNumber} was declined`,
          status: quotation.status,
          date: quotation.rejectedAt,
          metadata: {
            quotationNumber: quotation.quotationNumber,
          },
        });
      }
    });

    // Add important notifications
    notifications.forEach((notification) => {
      if (notification.isRead === false) {
        activities.push({
          id: notification._id.toString(),
          type: 'notification',
          title: notification.title,
          description: notification.message,
          date: notification.createdAt,
          metadata: {
            type: notification.type,
            isRead: notification.isRead,
          },
        });
      }
    });

    // Sort by date (most recent first) and paginate
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    const paginatedActivities = activities.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: paginatedActivities,
      pagination: {
        limit,
        offset,
        total: activities.length,
        hasMore: offset + limit < activities.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activity',
    });
  }
};

// Get activity statistics
export const getActivityStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const [
      totalBookings,
      completedBookings,
      pendingBookings,
      totalQuotations,
      approvedQuotations,
      pendingQuotations,
      unreadNotifications,
    ] = await Promise.all([
      Booking.countDocuments({ userId }),
      Booking.countDocuments({ userId, status: 'completed' }),
      Booking.countDocuments({ userId, status: 'pending' }),
      Quotation.countDocuments({ userId }),
      Quotation.countDocuments({ userId, status: 'approved' }),
      Quotation.countDocuments({ userId, status: 'pending' }),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
        },
        quotations: {
          total: totalQuotations,
          approved: approvedQuotations,
          pending: pendingQuotations,
        },
        notifications: {
          unread: unreadNotifications,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics',
    });
  }
};
