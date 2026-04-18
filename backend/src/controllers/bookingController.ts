import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import Booking from '../models/Booking';
import TransactionProof from '../models/TransactionProof';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/emailService';
import ActivityLog from '../models/ActivityLog';
import recommendationService from '../services/recommendationService';
import { NotificationService } from '../services/notificationService';
import googleCalendarService from '../services/googleCalendarService';
import { computeTechnicianFee } from '../utils/technicianFee';

// Conditional socket import for serverless compatibility
let socketService: any = { emitToUser: () => {}, emitToAdmins: () => {} };
try {
  socketService = require('../services/socketService').socketService;
} catch (e) {
  console.log('Socket service not available in serverless environment');
}

// Booking limits configuration
const BOOKING_LIMITS = {
  MAX_BOOKINGS_PER_TIME_SLOT: 1, // Maximum bookings allowed for the same date/time slot
  MAX_BOOKINGS_PER_DAY: 20, // Maximum total bookings allowed per day
};

// Pick the best human-readable name for a populated technician User.
// Prefers first+last, then "Technician N", then name, then a final fallback.
const resolveTechnicianDisplayName = (tech: any): string => {
  if (!tech) return 'Technician';
  const full = [tech.firstName, tech.lastName].filter(Boolean).join(' ').trim();
  if (full && full !== 'Technician') return full;
  if (tech.technicianNumber) return `Technician ${tech.technicianNumber}`;
  if (tech.name) return tech.name;
  return 'Technician';
};

/**
 * Helper function to check if a time slot is available
 * @param date - The date to check
 * @param time - The time slot to check
 * @param excludeBookingId - Optional booking ID to exclude (for reschedule)
 * @returns Object with availability info
 */
const checkSlotAvailability = async (
  date: Date,
  time: string,
  excludeBookingId?: string
) => {
  const query: any = {
    date: new Date(date),
    time: time,
    status: { $in: ['pending', 'confirmed', 'rescheduled'] },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  // Check bookings for specific time slot
  const timeSlotBookings = await Booking.countDocuments(query);

  // Check total bookings for the day
  const dayStartQuery: any = {
    date: new Date(date),
    status: { $in: ['pending', 'confirmed', 'rescheduled'] },
  };

  if (excludeBookingId) {
    dayStartQuery._id = { $ne: excludeBookingId };
  }

  const dayBookings = await Booking.countDocuments(dayStartQuery);

  return {
    isSlotAvailable: timeSlotBookings < BOOKING_LIMITS.MAX_BOOKINGS_PER_TIME_SLOT,
    isDayAvailable: dayBookings < BOOKING_LIMITS.MAX_BOOKINGS_PER_DAY,
    timeSlotCount: timeSlotBookings,
    dayCount: dayBookings,
    maxPerSlot: BOOKING_LIMITS.MAX_BOOKINGS_PER_TIME_SLOT,
    maxPerDay: BOOKING_LIMITS.MAX_BOOKINGS_PER_DAY,
  };
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
export const getBookings = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const bookings = await Booking.find(query)
      .sort({ date: 1, time: 1 })
      .populate('assignedTechnician', 'name firstName lastName email phone profilePicture technicianNumber specialization')
      .populate('quotationId', 'quotationNumber items totalAmount currency status');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('assignedTechnician', 'name firstName lastName email phone profilePicture technicianNumber specialization')
      .populate('quotationId', 'quotationNumber items totalAmount currency status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { date, time } = req.body;

    // Validate required fields
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required',
      });
    }

    // Check slot availability
    const availability = await checkSlotAvailability(date, time);

    if (!availability.isDayAvailable) {
      return res.status(400).json({
        success: false,
        message: `Maximum bookings reached for this day (${availability.dayCount}/${availability.maxPerDay}). Please select a different date.`,
      });
    }

    if (!availability.isSlotAvailable) {
      return res.status(400).json({
        success: false,
        message: `This time slot is fully booked (${availability.timeSlotCount}/${availability.maxPerSlot}). Please select a different time.`,
      });
    }

    // Add user to req.body if authenticated
    if (req.user) {
      req.body.userId = req.user._id;
    }

    // Compute technician fee from matrix (purpose + location + product), capped at ₱30
    const feeBreakdown = computeTechnicianFee(req.body.purpose, req.body.location, req.body.product);
    req.body.technicianFee = {
      amount: feeBreakdown.total,
      status: 'pending',
      breakdown: {
        purposeFee: feeBreakdown.purposeFee,
        locationFee: feeBreakdown.locationFee,
        productFee: feeBreakdown.productFee,
      },
    };

    const booking = await Booking.create(req.body);

    // Log activity
    if (req.user) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'BOOKING_CREATED',
          resourceType: 'booking',
          resourceId: booking._id.toString(),
          details: `Booking created for ${booking.company} on ${booking.date.toLocaleDateString()} at ${booking.time}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        // Record product interaction for recommendations
        await recommendationService.recordInteraction(
          req.user._id.toString(),
          booking.product,
          'booking',
          {
            bookingId: booking._id.toString(),
            context: `Booking for ${booking.purpose}`,
          }
        );
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    // Send in-app notification to user
    if (req.user) {
      try {
        await NotificationService.createNotification({
          userId: req.user._id.toString(),
          type: 'booking',
          title: 'Booking Request Submitted',
          message: `Your meeting request with ${booking.company} on ${booking.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${booking.time} has been submitted. We will confirm your booking shortly.`,
          relatedId: booking._id.toString(),
          relatedType: 'booking',
          actionUrl: `/account?tab=bookings&bookingId=${booking._id.toString()}`,
        });
      } catch (notificationError) {
        console.error('Failed to send in-app notification:', notificationError);
        // Continue even if notification fails
      }
    }

    // Send in-app notifications to all admins and superadmins
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'superadmin'] },
      }).select('_id').lean();

      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: (admin as any)._id.toString(),
          type: 'booking',
          title: 'New Booking Request',
          message: `New meeting request from ${booking.contactName} (${booking.company}) on ${booking.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${booking.time}.`,
          relatedId: booking._id.toString(),
          relatedType: 'booking',
          actionUrl: `/admin/bookings`,
        });

        // Emit real-time socket event to each admin
        socketService.emitToUser((admin as any)._id.toString(), 'notification', {
          type: 'booking',
          title: 'New Booking Request',
          message: `New meeting request from ${booking.contactName} (${booking.company})`,
        });
      }
    } catch (adminNotificationError) {
      console.error('Failed to send admin in-app notifications:', adminNotificationError);
    }

    // Send emails
    try {
      // Send confirmation email to customer
      await emailService.sendBookingConfirmation({
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        company: booking.company,
        date: booking.date.toString(),
        time: booking.time,
        purpose: booking.purpose,
        location: booking.location,
        product: booking.product,
        additionalInfo: booking.additionalInfo,
        bookingId: booking._id.toString(),
      });

      // Send notification to admin
      await emailService.sendBookingNotification({
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        company: booking.company,
        date: booking.date.toString(),
        time: booking.time,
        purpose: booking.purpose,
        location: booking.location,
        product: booking.product,
        additionalInfo: booking.additionalInfo,
      });
    } catch (emailError) {
      console.error('Failed to send booking emails:', emailError);
      // Continue even if email fails
    }

    // Sync booking to Google Calendar (if connected)
    try {
      await googleCalendarService.syncBookingToGoogle(booking._id.toString());
    } catch (calendarError) {
      console.error('Failed to sync booking to Google Calendar:', calendarError);
      // Continue even if calendar sync fails
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully! A confirmation email has been sent to your email address.',
    });
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error('=== BOOKING CREATION ERROR ===');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Request Body:', JSON.stringify(req.body, null, 2));

    // Check if it's a Mongoose validation error
    if (error.name === 'ValidationError') {
      console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));

      // Extract specific field errors
      const fieldErrors: Record<string, string> = {};
      for (const field in error.errors) {
        fieldErrors[field] = error.errors[field].message;
      }

      console.error('Field Errors:', JSON.stringify(fieldErrors, null, 2));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: fieldErrors,
      });
    }

    // Log full error object for other errors
    console.error('Full Error Object:', error);
    console.error('Error Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private/Admin
export const updateBooking = async (req: Request, res: Response) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const originalStatus = booking.status;
    const newStatus = req.body.status;

    // Track status change in history if status is being updated
    if (newStatus && newStatus !== originalStatus) {
      const req_with_user = req as AuthRequest;
      const statusHistoryEntry: any = {
        status: newStatus,
        changedAt: new Date(),
        note: req.body.statusNote || `Status changed from ${originalStatus} to ${newStatus}`,
      };

      if (req_with_user.user?._id) {
        statusHistoryEntry.changedBy = req_with_user.user._id;
      }

      // Push to statusHistory
      if (!booking.statusHistory) {
        booking.statusHistory = [];
      }
      booking.statusHistory.push(statusHistoryEntry);
      req.body.statusHistory = booking.statusHistory;
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Log activity (assume admin is making the update)
    const req_with_user = req as AuthRequest;
    if (req_with_user.user) {
      try {
        await ActivityLog.create({
          user: req_with_user.user._id,
          userName: req_with_user.user.name,
          userEmail: req_with_user.user.email,
          action: 'BOOKING_UPDATED',
          resourceType: 'booking',
          resourceId: booking!._id.toString(),
          details: `Booking updated for ${booking!.company}. Status: ${originalStatus} → ${booking!.status}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    // Send notification if status changed and user exists
    if (
      booking!.status !== originalStatus &&
      booking!.userId &&
      ['confirmed', 'in-progress', 'completed', 'cancelled'].includes(booking!.status)
    ) {
      try {
        await NotificationService.notifyBookingStatusChange(
          booking!.userId,
          booking!._id.toString(),
          originalStatus,
          booking!.status,
          {
            company: booking!.company,
            date: booking!.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            time: booking!.time,
          }
        );

        // Emit socket event for real-time booking status update
        socketService.emitToUser(booking!.userId.toString(), 'booking:statusUpdate', {
          bookingId: booking!._id,
          status: booking!.status,
          previousStatus: originalStatus,
          statusHistory: booking!.statusHistory,
          updatedAt: new Date(),
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    // Sync updated booking to Google Calendar
    try {
      await googleCalendarService.syncBookingToGoogle(booking!._id.toString());
    } catch (calendarError) {
      console.error('Failed to sync booking to Google Calendar:', calendarError);
      // Continue even if calendar sync fails
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    await booking.deleteOne();

    // Log activity (assume admin is deleting)
    const req_with_user = req as AuthRequest;
    if (req_with_user.user) {
      try {
        await ActivityLog.create({
          user: req_with_user.user._id,
          userName: req_with_user.user.name,
          userEmail: req_with_user.user.email,
          action: 'BOOKING_DELETED',
          resourceType: 'booking',
          resourceId: booking._id.toString(),
          details: `Booking deleted for ${booking.company} (${booking.date.toLocaleDateString()} at ${booking.time})`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.user!._id })
      .sort({ date: 1 })
      .populate('assignedTechnician', 'name firstName lastName email phone profilePicture technicianNumber specialization')
      .populate('quotationId', 'quotationNumber items totalAmount currency status');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user owns this booking or is admin
    const isOwner = booking.userId?.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking',
      });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason || 'No reason provided';
    await booking.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'BOOKING_CANCELLED',
        resourceType: 'booking',
        resourceId: booking._id.toString(),
        details: `Booking cancelled for ${booking.company} (${booking.date.toLocaleDateString()} at ${booking.time}). Reason: ${cancellationReason || 'Not provided'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    // Send notification if user exists
    if (booking.userId) {
      try {
        await NotificationService.notifyBookingStatusChange(
          booking.userId,
          booking._id.toString(),
          'pending',
          'cancelled',
          {
            company: booking.company,
            date: booking.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            time: booking.time,
          }
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Reschedule booking
// @route   PUT /api/bookings/:id/reschedule
// @access  Private
export const rescheduleBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { newDate, newTime, rescheduleReason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new date and time',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user owns this booking or is admin
    const isOwner = booking.userId?.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this booking',
      });
    }

    // Check if booking can be rescheduled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a cancelled booking',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a completed booking',
      });
    }

    // Check if new slot is available
    const availability = await checkSlotAvailability(
      newDate,
      newTime,
      booking._id.toString()
    );

    if (!availability.isDayAvailable) {
      return res.status(400).json({
        success: false,
        message: `Maximum bookings reached for this day (${availability.dayCount}/${availability.maxPerDay}). Please select a different date.`,
      });
    }

    if (!availability.isSlotAvailable) {
      return res.status(400).json({
        success: false,
        message: `This time slot is fully booked (${availability.timeSlotCount}/${availability.maxPerSlot}). Please select a different time.`,
      });
    }

    // Save original date and time if not already set
    if (!booking.originalDate) {
      booking.originalDate = booking.date;
      booking.originalTime = booking.time;
    }

    // Update booking
    const oldDate = booking.date;
    const oldTime = booking.time;
    booking.date = new Date(newDate);
    booking.time = newTime;
    booking.status = 'rescheduled';
    booking.rescheduleReason = rescheduleReason || 'No reason provided';
    await booking.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'BOOKING_RESCHEDULED',
        resourceType: 'booking',
        resourceId: booking._id.toString(),
        details: `Booking rescheduled for ${booking.company}. From: ${oldDate.toLocaleDateString()} ${oldTime} → To: ${booking.date.toLocaleDateString()} ${booking.time}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Mark booking as completed and enable reviews
// @route   PUT /api/bookings/:id/complete
// @access  Private/Admin
export const completeBooking = async (req: Request, res: Response) => {
  try {
    const { conclusion } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    booking.status = 'completed';
    booking.conclusion = conclusion;
    booking.canReview = true; // Enable reviews for this booking
    await booking.save();

    // Log activity
    const req_with_user = req as AuthRequest;
    if (req_with_user.user) {
      try {
        await ActivityLog.create({
          user: req_with_user.user._id,
          userName: req_with_user.user.name,
          userEmail: req_with_user.user.email,
          action: 'BOOKING_COMPLETED',
          resourceType: 'booking',
          resourceId: booking._id.toString(),
          details: `Booking marked as completed for ${booking.company} (${booking.date.toLocaleDateString()} at ${booking.time}). Review enabled.`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    // Send notification if user exists
    if (booking.userId) {
      try {
        await NotificationService.notifyBookingStatusChange(
          booking.userId,
          booking._id.toString(),
          'in-progress',
          'completed',
          {
            company: booking.company,
            date: booking.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            time: booking.time,
          }
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Booking marked as completed',
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Check slot availability
// @route   GET /api/bookings/check-availability
// @access  Public
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required',
      });
    }

    const availability = await checkSlotAvailability(
      new Date(date as string),
      time as string
    );

    res.status(200).json({
      success: true,
      data: {
        isAvailable: availability.isSlotAvailable && availability.isDayAvailable,
        isSlotAvailable: availability.isSlotAvailable,
        isDayAvailable: availability.isDayAvailable,
        timeSlotCount: availability.timeSlotCount,
        dayCount: availability.dayCount,
        maxPerSlot: availability.maxPerSlot,
        maxPerDay: availability.maxPerDay,
        slotsRemaining: availability.maxPerSlot - availability.timeSlotCount,
        dayBookingsRemaining: availability.maxPerDay - availability.dayCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Confirm booking and dispatch technician (superadmin only)
// @route   PUT /api/bookings/:id/confirm-dispatch
// @access  Private/SuperAdmin
export const confirmAndDispatch = async (req: AuthRequest, res: Response) => {
  try {
    const { assignedTechnician } = req.body;

    if (!assignedTechnician) {
      return res.status(400).json({
        success: false,
        message: 'Assigned technician is required to confirm a booking',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'pending' && booking.status !== 'rescheduled' && booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`,
      });
    }

    // Verify technician exists and has technician role
    const technician = await User.findById(assignedTechnician);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({
        success: false,
        message: 'Invalid technician. User must have the technician role.',
      });
    }

    // Check technician availability (warn if conflict)
    const conflictingBookings = await Booking.find({
      assignedTechnician,
      date: booking.date,
      time: booking.time,
      status: { $in: ['confirmed', 'in_progress'] },
      _id: { $ne: booking._id },
    });

    const hasConflict = conflictingBookings.length > 0;

    // Update booking
    const originalStatus = booking.status;
    booking.status = 'confirmed';
    booking.assignedTechnician = assignedTechnician;
    booking.assignedAt = new Date();
    booking.assignedBy = req.user!._id;

    // Add status history entry
    booking.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      changedBy: req.user!._id,
      note: `Confirmed and dispatched to technician: ${technician.name}`,
    });

    await booking.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'BOOKING_UPDATED',
        resourceType: 'booking',
        resourceId: booking._id.toString(),
        details: `Booking confirmed and dispatched to ${technician.name} for ${booking.company} (${booking.date.toLocaleDateString()} at ${booking.time})`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    // Notify the assigned technician
    try {
      await NotificationService.createNotification({
        userId: technician._id.toString(),
        type: 'booking',
        title: 'New Assignment',
        message: `You have been assigned to a booking with ${booking.company} on ${booking.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${booking.time}. Location: ${booking.location}`,
        relatedId: booking._id.toString(),
        relatedType: 'booking',
      });
    } catch (notificationError) {
      console.error('Failed to notify technician:', notificationError);
    }

    // Notify the customer
    if (booking.userId) {
      try {
        await NotificationService.notifyBookingStatusChange(
          booking.userId,
          booking._id.toString(),
          originalStatus,
          'confirmed',
          {
            company: booking.company,
            date: booking.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            time: booking.time,
          }
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
    }

    // Populate technician info for response
    await booking.populate('assignedTechnician', 'name firstName lastName email phone profilePicture technicianNumber specialization');

    res.status(200).json({
      success: true,
      message: hasConflict
        ? `Booking confirmed and dispatched to ${technician.name}. Warning: This technician has a conflicting booking at the same time.`
        : `Booking confirmed and dispatched to ${technician.name}`,
      data: booking,
      hasConflict,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Reassign technician to a booking (superadmin only)
// @route   PUT /api/bookings/:id/reassign
// @access  Private/SuperAdmin
export const reassignTechnician = async (req: AuthRequest, res: Response) => {
  try {
    const { assignedTechnician } = req.body;

    if (!assignedTechnician) {
      return res.status(400).json({
        success: false,
        message: 'New technician ID is required',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reassign technician for booking with status: ${booking.status}`,
      });
    }

    // Verify new technician
    const technician = await User.findById(assignedTechnician);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({
        success: false,
        message: 'Invalid technician. User must have the technician role.',
      });
    }

    const oldTechnicianId = booking.assignedTechnician;
    booking.assignedTechnician = assignedTechnician;
    booking.assignedAt = new Date();
    booking.assignedBy = req.user!._id;

    booking.statusHistory.push({
      status: booking.status,
      changedAt: new Date(),
      changedBy: req.user!._id,
      note: `Reassigned to technician: ${technician.name}`,
    });

    await booking.save();

    // Notify new technician
    try {
      await NotificationService.createNotification({
        userId: technician._id.toString(),
        type: 'booking',
        title: 'New Assignment',
        message: `You have been assigned to a booking with ${booking.company} on ${booking.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${booking.time}.`,
        relatedId: booking._id.toString(),
        relatedType: 'booking',
      });
    } catch (notificationError) {
      console.error('Failed to notify new technician:', notificationError);
    }

    // Notify old technician of removal
    if (oldTechnicianId) {
      try {
        await NotificationService.createNotification({
          userId: oldTechnicianId.toString(),
          type: 'booking',
          title: 'Assignment Removed',
          message: `Your assignment to the booking with ${booking.company} on ${booking.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} has been reassigned.`,
          relatedId: booking._id.toString(),
          relatedType: 'booking',
        });
      } catch (notificationError) {
        console.error('Failed to notify old technician:', notificationError);
      }
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'BOOKING_UPDATED',
        resourceType: 'booking',
        resourceId: booking._id.toString(),
        details: `Booking reassigned to technician: ${technician.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    await booking.populate('assignedTechnician', 'name firstName lastName email phone profilePicture technicianNumber specialization');

    res.status(200).json({
      success: true,
      message: `Booking reassigned to ${technician.name}`,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Mark booking as in-progress (technician starts the meeting)
// @route   PUT /api/bookings/:id/start
// @access  Private/Technician
export const startBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot start booking with status: ${booking.status}`,
      });
    }

    // Only the assigned technician or superadmin can start
    const isSuperAdmin = req.user!.role === 'superadmin';
    const isAssignedTech = booking.assignedTechnician?.toString() === req.user!._id.toString();

    if (!isSuperAdmin && !isAssignedTech) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned technician can start this booking',
      });
    }

    booking.status = 'in_progress';
    booking.statusHistory.push({
      status: 'in_progress',
      changedAt: new Date(),
      changedBy: req.user!._id,
      note: 'Technician started the meeting',
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking marked as in progress',
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get my technician assignments
// @route   GET /api/bookings/my-assignments
// @access  Private/Technician
export const getMyAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const technicianId = req.user!._id;

    const query: any = { assignedTechnician: technicianId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const bookings = await Booking.find(query)
      .sort({ date: 1, time: 1 })
      .populate('userId', 'name email phone')
      .populate('assignedTechnician', 'name firstName lastName email phone profilePicture technicianNumber specialization');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Check technician availability for a date/time
// @route   GET /api/bookings/technician-availability
// @access  Private/SuperAdmin
export const checkTechnicianAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required',
      });
    }

    // Get all technicians
    const technicians = await User.find({ role: 'technician', isDeleted: { $ne: true } })
      .select('name firstName lastName email phone profilePicture technicianNumber specialization');

    // Get all bookings for that date/time
    const busyBookings = await Booking.find({
      date: new Date(date as string),
      time: time as string,
      status: { $in: ['confirmed', 'in_progress'] },
      assignedTechnician: { $exists: true },
    }).select('assignedTechnician');

    const busyTechIds = busyBookings.map(b => b.assignedTechnician?.toString());

    const techniciansWithAvailability = technicians.map(tech => ({
      _id: tech._id,
      name: tech.name,
      firstName: tech.firstName,
      lastName: tech.lastName,
      email: tech.email,
      phone: tech.phone,
      profilePicture: tech.profilePicture,
      technicianNumber: tech.technicianNumber,
      specialization: tech.specialization,
      isAvailable: !busyTechIds.includes(tech._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data: techniciansWithAvailability,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update technician fee status (mark as paid or waived)
// @route   PUT /api/bookings/:id/fee-status
// @access  Admin/Superadmin
export const updateFeeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { feeStatus, revertReason } = req.body;
    if (!feeStatus || !['paid', 'waived', 'pending'].includes(feeStatus)) {
      return res.status(400).json({ success: false, message: 'feeStatus must be "paid", "waived", or "pending"' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.technicianFee) {
      return res.status(400).json({ success: false, message: 'No technician fee on this booking' });
    }

    const previousFeeStatus = booking.technicianFee.status;
    const wasAlreadyPaid = previousFeeStatus === 'paid';

    // Enforce: cannot mark paid without a customer-submitted receipt
    if (feeStatus === 'paid' && !wasAlreadyPaid && !booking.technicianFee.proofSubmittedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark paid — customer has not submitted a payment receipt yet',
      });
    }

    booking.technicianFee.status = feeStatus;
    if (feeStatus === 'paid') {
      booking.technicianFee.paidAt = new Date();
    }
    if (feeStatus === 'pending') {
      // Reverting: clear paidAt so a future Mark Paid records a fresh timestamp
      booking.technicianFee.paidAt = undefined;
    }

    // Advance booking status when fee clears and booking is waiting on payment.
    // Only do this on the transition into 'paid'/'waived' (not on repeated calls).
    // If booking has a pending TransactionProof (quotation items), advance to
    // 'payment_submitted' so the superadmin can still approve items + deduct inventory
    // via the Review Payment flow. Otherwise (no items to approve) go straight to
    // 'verified' since there is nothing left to do.
    // Look up an in-flight TransactionProof — we may need to advance the timeline
    // and/or lift the fee receipt into it so the Review Payment modal can approve.
    const pendingTxProof = (feeStatus === 'paid' || feeStatus === 'waived')
      ? await TransactionProof.findOne({
          bookingId: booking._id,
          status: { $in: ['pending_upload', 'pending_review', 'rejected'] },
        })
      : null;

    // Advance booking status when fee clears and booking is waiting on payment.
    // Only do this on the transition into 'paid'/'waived' (not on repeated calls).
    // If a pending TransactionProof exists (quotation items), advance to
    // 'payment_submitted' so the superadmin can still approve items + deduct
    // inventory via the Review Payment flow. Otherwise (no items to approve) go
    // straight to 'verified' since there is nothing left to do.
    if (
      !wasAlreadyPaid &&
      (feeStatus === 'paid' || feeStatus === 'waived') &&
      booking.status === 'awaiting_payment'
    ) {
      const nextStatus = pendingTxProof ? 'payment_submitted' : 'verified';
      booking.status = nextStatus;
      (booking as any).statusHistory.push({
        status: nextStatus,
        changedAt: new Date(),
        changedBy: req.user!._id,
        note:
          feeStatus === 'paid'
            ? pendingTxProof
              ? 'Technician fee payment confirmed — awaiting item approval'
              : 'Technician fee payment confirmed'
            : pendingTxProof
            ? 'Technician fee waived — awaiting item approval'
            : 'Technician fee waived',
      });
    }

    // Lift the technician-fee receipt into the TransactionProof so the Review
    // Payment modal shows an Approve & Deduct action. Without this the proof
    // would stay at pending_upload (there is no separate customer upload step)
    // and the modal hides its approve button. Idempotent: runs whenever fee is
    // paid/waived and the proof is still at pending_upload, so previously-stuck
    // bookings self-repair on the next Mark Paid / Waive call.
    if (
      pendingTxProof &&
      pendingTxProof.status === 'pending_upload' &&
      (feeStatus === 'paid' || feeStatus === 'waived')
    ) {
      if (feeStatus === 'paid' && booking.technicianFee.proofData) {
        const originalName = booking.technicianFee.proofFilename || 'fee-receipt.png';
        const ext = path.extname(originalName) || '.png';
        const uniqueFilename = `${uuidv4()}${ext}`;
        pendingTxProof.attachments = [
          {
            filename: uniqueFilename,
            originalName,
            mimeType: booking.technicianFee.proofMimeType || 'image/png',
            size: booking.technicianFee.proofData.length,
            path: `uploads/proofs/${uniqueFilename}`,
            fileData: booking.technicianFee.proofData,
            uploadedAt: booking.technicianFee.proofSubmittedAt || new Date(),
          } as any,
        ];
        pendingTxProof.customerNotes = 'Auto-linked from technician fee receipt';
      } else if (feeStatus === 'waived') {
        pendingTxProof.customerNotes = 'Technician fee waived — no receipt required';
      }
      pendingTxProof.status = 'pending_review';
      pendingTxProof.submittedBy = req.user!._id;
      pendingTxProof.submittedAt = new Date();
      await pendingTxProof.save();
    }

    // Revert: fee back to pending → booking back to awaiting_payment
    // Accept any post-payment state: 'payment_submitted' (new), 'verified' (terminal),
    // and 'completed' (legacy) for backward compat.
    if (
      feeStatus === 'pending' &&
      previousFeeStatus !== 'pending' &&
      ['payment_submitted', 'verified', 'completed'].includes(booking.status)
    ) {
      booking.status = 'awaiting_payment';
      (booking as any).statusHistory.push({
        status: 'awaiting_payment',
        changedAt: new Date(),
        changedBy: req.user!._id,
        note: revertReason
          ? `Reverted to awaiting payment: ${revertReason}`
          : 'Reverted to awaiting payment by admin',
      });

      // If the TransactionProof was auto-linked from the fee receipt, roll it
      // back to pending_upload so a fresh Mark Paid re-attaches the latest
      // receipt. Don't touch proofs that were customer-submitted directly.
      const linkedTxProof = await TransactionProof.findOne({
        bookingId: booking._id,
        status: 'pending_review',
        customerNotes: { $in: [
          'Auto-linked from technician fee receipt',
          'Technician fee waived — no receipt required',
        ] },
      });
      if (linkedTxProof) {
        linkedTxProof.status = 'pending_upload';
        linkedTxProof.attachments = [] as any;
        linkedTxProof.submittedAt = undefined as any;
        await linkedTxProof.save();
      }
    }

    await booking.save();

    // Email receipts only on transition into "paid" (first time)
    if (feeStatus === 'paid' && !wasAlreadyPaid) {
      try {
        const populatedBooking = await Booking.findById(booking._id).populate(
          'assignedTechnician',
          'name firstName lastName email technicianNumber'
        );
        const fee = populatedBooking?.technicianFee;
        if (populatedBooking && fee) {
          const breakdown = fee.breakdown ? {
            purposeFee: Number(fee.breakdown.purposeFee) || 0,
            locationFee: Number(fee.breakdown.locationFee) || 0,
            productFee: Number(fee.breakdown.productFee) || 0,
          } : undefined;
          const baseReceipt = {
            bookingId: populatedBooking._id.toString(),
            company: populatedBooking.company,
            date: populatedBooking.date.toString(),
            time: populatedBooking.time,
            purpose: populatedBooking.purpose,
            location: populatedBooking.location,
            product: populatedBooking.product,
            amount: fee.amount,
            breakdown,
            paidAt: fee.paidAt || new Date(),
          };
          // Customer receipt
          await emailService.sendTechnicianFeeReceipt({
            ...baseReceipt,
            recipient: 'customer',
            recipientEmail: populatedBooking.contactEmail,
            recipientName: populatedBooking.contactName,
          });
          console.info(
            `[fee-receipt] Customer receipt sent for booking ${booking._id} → ${populatedBooking.contactEmail}`
          );

          // Technician receipt (if assigned and has email)
          const tech: any = populatedBooking.assignedTechnician;
          if (!tech) {
            console.warn(
              `[fee-receipt] Technician receipt skipped for booking ${booking._id}: no assignedTechnician`
            );
          } else if (!tech.email) {
            console.warn(
              `[fee-receipt] Technician receipt skipped for booking ${booking._id}: technician ${tech._id} has no email`
            );
          } else {
            const technicianName = resolveTechnicianDisplayName(tech);
            await emailService.sendTechnicianFeeReceipt({
              ...baseReceipt,
              recipient: 'technician',
              recipientEmail: tech.email,
              recipientName: technicianName,
            });
            console.info(
              `[fee-receipt] Technician receipt sent for booking ${booking._id} → ${tech.email} (${technicianName})`
            );
          }
        }
      } catch (emailErr) {
        console.error(`[fee-receipt] Failed to send technician fee receipt emails for booking ${booking._id}:`, emailErr);
      }
    }

    // Strip proof binary from response
    const bookingObj = booking.toObject();
    if (bookingObj.technicianFee?.proofData) {
      delete bookingObj.technicianFee.proofData;
    }

    res.status(200).json({ success: true, data: bookingObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Resend the technician-fee receipt email to customer and/or technician
// @route   POST /api/bookings/:id/resend-fee-receipt
// @access  Admin/Superadmin
export const resendFeeReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const target: 'customer' | 'technician' | 'both' = req.body?.target || 'both';
    if (!['customer', 'technician', 'both'].includes(target)) {
      return res.status(400).json({ success: false, message: 'target must be customer, technician, or both' });
    }

    const booking = await Booking.findById(req.params.id).populate(
      'assignedTechnician',
      'name firstName lastName email technicianNumber'
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const fee = booking.technicianFee;
    if (!fee || fee.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend — booking fee is not in paid state',
      });
    }

    const breakdown = fee.breakdown
      ? {
          purposeFee: Number(fee.breakdown.purposeFee) || 0,
          locationFee: Number(fee.breakdown.locationFee) || 0,
          productFee: Number(fee.breakdown.productFee) || 0,
        }
      : undefined;

    const baseReceipt = {
      bookingId: booking._id.toString(),
      company: booking.company,
      date: booking.date.toString(),
      time: booking.time,
      purpose: booking.purpose,
      location: booking.location,
      product: booking.product,
      amount: fee.amount,
      breakdown,
      paidAt: fee.paidAt || new Date(),
    };

    const results: { customer?: string; technician?: string } = {};

    if (target === 'customer' || target === 'both') {
      try {
        await emailService.sendTechnicianFeeReceipt({
          ...baseReceipt,
          recipient: 'customer',
          recipientEmail: booking.contactEmail,
          recipientName: booking.contactName,
        });
        results.customer = `sent to ${booking.contactEmail}`;
        console.info(`[fee-receipt:resend] Customer receipt resent for booking ${booking._id} → ${booking.contactEmail}`);
      } catch (err: any) {
        results.customer = `failed: ${err.message || 'unknown error'}`;
        console.error(`[fee-receipt:resend] Customer resend failed for booking ${booking._id}:`, err);
      }
    }

    if (target === 'technician' || target === 'both') {
      const tech: any = booking.assignedTechnician;
      if (!tech) {
        results.technician = 'skipped: no technician assigned';
      } else if (!tech.email) {
        results.technician = 'skipped: technician has no email on file';
      } else {
        try {
          const technicianName = resolveTechnicianDisplayName(tech);
          await emailService.sendTechnicianFeeReceipt({
            ...baseReceipt,
            recipient: 'technician',
            recipientEmail: tech.email,
            recipientName: technicianName,
          });
          results.technician = `sent to ${tech.email} (${technicianName})`;
          console.info(`[fee-receipt:resend] Technician receipt resent for booking ${booking._id} → ${tech.email}`);
        } catch (err: any) {
          results.technician = `failed: ${err.message || 'unknown error'}`;
          console.error(`[fee-receipt:resend] Technician resend failed for booking ${booking._id}:`, err);
        }
      }
    }

    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'FEE_RECEIPT_RESENT',
        resourceType: 'booking',
        resourceId: booking._id.toString(),
        details: `Resent (${target}): ${JSON.stringify(results)}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logErr) {
      console.error('Failed to log fee receipt resend:', logErr);
    }

    res.status(200).json({ success: true, target, results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Customer submits technician fee payment proof (GCash receipt screenshot)
// @route   POST /api/bookings/:id/fee-proof
// @access  Private
export const submitFeeProof = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.technicianFee || booking.technicianFee.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending technician fee for this booking' });
    }

    const file = req.file as Express.Multer.File;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Receipt image is required' });
    }

    booking.technicianFee.proofFilename = file.originalname;
    booking.technicianFee.proofMimeType = file.mimetype;
    booking.technicianFee.proofData = file.buffer;
    booking.technicianFee.proofSubmittedAt = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: 'Payment proof submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Serve technician fee proof image
// @route   GET /api/bookings/:id/fee-proof
// @access  Public (direct browser access)
export const serveFeeProof = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id).select('technicianFee');
    if (!booking || !booking.technicianFee?.proofData) {
      return res.status(404).json({ success: false, message: 'Fee proof not found' });
    }

    res.set('Content-Type', booking.technicianFee.proofMimeType || 'image/png');
    res.set('Content-Disposition', `inline; filename="${booking.technicianFee.proofFilename || 'receipt.png'}"`);
    res.send(booking.technicianFee.proofData);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
