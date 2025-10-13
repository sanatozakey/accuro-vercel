import { Response } from 'express';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

// @desc    Get product analytics (Admin only)
// @route   GET /api/analytics/products
// @access  Private/Admin
export const getProductAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const productData = await Booking.aggregate([
      {
        $group: {
          _id: '$product',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: productData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get location analytics (Admin only)
// @route   GET /api/analytics/locations
// @access  Private/Admin
export const getLocationAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const locationData = await Booking.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: locationData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get overall analytics dashboard (Admin only)
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const [productData, locationData, statusData, totalBookings] = await Promise.all([
      Booking.aggregate([
        {
          $group: {
            _id: '$product',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        products: productData,
        locations: locationData,
        statuses: statusData,
        totalBookings,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
