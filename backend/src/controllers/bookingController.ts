import { Request, Response } from 'express';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/emailService';

// Booking limits configuration
const BOOKING_LIMITS = {
  MAX_BOOKINGS_PER_TIME_SLOT: 3, // Maximum bookings allowed for the same date/time slot
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

    const bookings = await Booking.find(query).sort({ date: 1, time: 1 });

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
    const booking = await Booking.findById(req.params.id);

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

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully! A confirmation email has been sent to your email address.',
    });
  } catch (error: any) {
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

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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
    const bookings = await Booking.find({ userId: req.user!._id }).sort({
      date: 1,
    });

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
    booking.date = new Date(newDate);
    booking.time = newTime;
    booking.status = 'rescheduled';
    booking.rescheduleReason = rescheduleReason || 'No reason provided';
    await booking.save();

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
