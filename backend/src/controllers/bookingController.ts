import { Request, Response } from 'express';
import Booking from '../models/Booking';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/emailService';
import ActivityLog from '../models/ActivityLog';
import recommendationService from '../services/recommendationService';
import { NotificationService } from '../services/notificationService';
import googleCalendarService from '../services/googleCalendarService';

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
      .populate('quotationId', 'quotationNumber totalAmount status');

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
      .populate('quotationId', 'quotationNumber totalAmount status');

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

    if (booking.status !== 'pending' && booking.status !== 'rescheduled') {
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
