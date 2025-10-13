import { Response } from 'express';
import Review from '../models/Review';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

// @desc    Create review for completed booking
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, rating, comment, isPublic } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.userId?.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings',
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings',
      });
    }

    if (!booking.canReview) {
      return res.status(400).json({
        success: false,
        message: 'This booking is not eligible for review',
      });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: bookingId });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking',
      });
    }

    // Create review
    const review = await Review.create({
      user: req.user!._id,
      booking: bookingId,
      userName: req.user!.name,
      userEmail: req.user!.email,
      company: req.user!.company,
      rating,
      comment,
      isPublic: isPublic !== false, // Default to true
      isApproved: false, // Admin must approve
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It will be visible after admin approval.',
      data: review,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get public approved reviews
// @route   GET /api/reviews
// @access  Public
export const getPublicReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, limit = 20 } = req.query;

    const query: any = {
      isApproved: true,
      isPublic: true,
    };

    if (rating) {
      query.rating = Number(rating);
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('booking', 'product');

    const avgRating = await Review.aggregate([
      { $match: { isApproved: true, isPublic: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: avgRating[0]?.avgRating || 0,
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews/admin
// @access  Private/Admin
export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { isApproved, rating } = req.query;

    const query: any = {};

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    if (rating) {
      query.rating = Number(rating);
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('booking', 'product date status');

    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          approvedReviews: {
            $sum: { $cond: ['$isApproved', 1, 0] },
          },
          pendingReviews: {
            $sum: { $cond: ['$isApproved', 0, 1] },
          },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      stats: stats[0] || {},
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Approve/Reject review (Admin only)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: review,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete review (Admin only)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's own reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .populate('booking', 'product date status');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
