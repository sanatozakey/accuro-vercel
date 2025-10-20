import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Review from '../models/Review';
import PurchaseHistory from '../models/PurchaseHistory';
import Quote from '../models/Quote';
import Booking from '../models/Booking';
import ActivityLog from '../models/ActivityLog';

// @desc    Get comprehensive user history
// @route   GET /api/user-history/my-history
// @access  Private
export const getMyHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    // Fetch all user-related data in parallel
    const [reviews, purchases, quotes, bookings, activityLogs] = await Promise.all([
      Review.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('booking', 'product date status'),

      PurchaseHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('relatedQuote', 'customerName')
        .populate('relatedBooking', 'company date'),

      Quote.find({ userId })
        .sort({ createdAt: -1 }),

      Booking.find({ userId })
        .sort({ date: -1 }),

      ActivityLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(100), // Limit activity logs to last 100 entries
    ]);

    // Calculate summary statistics
    const totalPurchases = purchases.length;
    const totalSpent = purchases
      .filter(p => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const totalQuotes = quotes.length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPurchases,
          totalSpent,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          totalQuotes,
          totalBookings,
          completedBookings,
        },
        reviews: {
          count: reviews.length,
          data: reviews,
        },
        purchases: {
          count: purchases.length,
          data: purchases,
        },
        quotes: {
          count: quotes.length,
          data: quotes,
        },
        bookings: {
          count: bookings.length,
          data: bookings,
        },
        recentActivity: {
          count: activityLogs.length,
          data: activityLogs,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's review history
// @route   GET /api/user-history/reviews
// @access  Private
export const getMyReviewHistory = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .populate('booking', 'product date status');

    const stats = {
      totalReviews: reviews.length,
      approvedReviews: reviews.filter(r => r.isApproved).length,
      pendingReviews: reviews.filter(r => !r.isApproved).length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
    };

    res.status(200).json({
      success: true,
      stats,
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's quote history
// @route   GET /api/user-history/quotes
// @access  Private
export const getMyQuoteHistory = async (req: AuthRequest, res: Response) => {
  try {
    const quotes = await Quote.find({ userId: req.user!._id })
      .sort({ createdAt: -1 });

    const stats = {
      totalQuotes: quotes.length,
      pendingQuotes: quotes.filter(q => q.status === 'pending').length,
      sentQuotes: quotes.filter(q => q.status === 'sent').length,
      acceptedQuotes: quotes.filter(q => q.status === 'accepted').length,
      rejectedQuotes: quotes.filter(q => q.status === 'rejected').length,
      totalEstimatedValue: quotes.reduce((sum, q) => sum + q.totalEstimatedPrice, 0),
    };

    res.status(200).json({
      success: true,
      stats,
      data: quotes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's booking history
// @route   GET /api/user-history/bookings
// @access  Private
export const getMyBookingHistory = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.user!._id })
      .sort({ date: -1 });

    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      rescheduledBookings: bookings.filter(b => b.status === 'rescheduled').length,
    };

    res.status(200).json({
      success: true,
      stats,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's activity logs
// @route   GET /api/user-history/activity
// @access  Private
export const getMyActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, resourceType, action } = req.query;

    const query: any = { user: req.user!._id };

    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (action) {
      query.action = action;
    }

    const activityLogs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const stats = await ActivityLog.aggregate([
      { $match: { user: req.user!._id } },
      {
        $group: {
          _id: '$resourceType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: activityLogs.length,
      stats,
      data: activityLogs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get comprehensive user history by user ID (Admin only)
// @route   GET /api/user-history/:userId
// @access  Private/Admin
export const getUserHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch all user-related data in parallel
    const [reviews, purchases, quotes, bookings, activityLogs] = await Promise.all([
      Review.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('booking', 'product date status'),

      PurchaseHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('relatedQuote', 'customerName')
        .populate('relatedBooking', 'company date'),

      Quote.find({ userId })
        .sort({ createdAt: -1 }),

      Booking.find({ userId })
        .sort({ date: -1 }),

      ActivityLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(100),
    ]);

    // Calculate summary statistics
    const totalPurchases = purchases.length;
    const totalSpent = purchases
      .filter(p => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const totalQuotes = quotes.length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;

    res.status(200).json({
      success: true,
      data: {
        userId,
        summary: {
          totalPurchases,
          totalSpent,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          totalQuotes,
          totalBookings,
          completedBookings,
        },
        reviews: {
          count: reviews.length,
          data: reviews,
        },
        purchases: {
          count: purchases.length,
          data: purchases,
        },
        quotes: {
          count: quotes.length,
          data: quotes,
        },
        bookings: {
          count: bookings.length,
          data: bookings,
        },
        recentActivity: {
          count: activityLogs.length,
          data: activityLogs,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
