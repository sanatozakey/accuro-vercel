import { Request, Response } from 'express';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/emailService';

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
