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

    // If no real data exists, return sample data for demonstration
    if (productData.length === 0) {
      const sampleData = [
        { _id: 'Beamex MC6', count: 12 },
        { _id: 'Beamex MC5', count: 8 },
        { _id: 'Temperature Calibrators', count: 15 },
        { _id: 'Pressure Calibrators', count: 10 },
        { _id: 'Electrical Calibrators', count: 6 },
      ];

      return res.status(200).json({
        success: true,
        data: sampleData,
        isSampleData: true, // Flag to indicate this is sample data
      });
    }

    res.status(200).json({
      success: true,
      data: productData,
      isSampleData: false,
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

    // If no real data exists, return sample data for demonstration
    if (locationData.length === 0) {
      const sampleData = [
        { _id: 'Manila', count: 18 },
        { _id: 'Quezon City', count: 14 },
        { _id: 'Makati', count: 11 },
        { _id: 'Pasig', count: 9 },
        { _id: 'Taguig', count: 7 },
        { _id: 'Cebu', count: 5 },
      ];

      return res.status(200).json({
        success: true,
        data: sampleData,
        isSampleData: true, // Flag to indicate this is sample data
      });
    }

    res.status(200).json({
      success: true,
      data: locationData,
      isSampleData: false,
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

    // If no real data exists, return sample data for demonstration
    const isSampleData = totalBookings === 0;

    const finalProductData = isSampleData
      ? [
          { _id: 'Beamex MC6', count: 12 },
          { _id: 'Beamex MC5', count: 8 },
          { _id: 'Temperature Calibrators', count: 15 },
          { _id: 'Pressure Calibrators', count: 10 },
          { _id: 'Electrical Calibrators', count: 6 },
        ]
      : productData;

    const finalLocationData = isSampleData
      ? [
          { _id: 'Manila', count: 18 },
          { _id: 'Quezon City', count: 14 },
          { _id: 'Makati', count: 11 },
          { _id: 'Pasig', count: 9 },
          { _id: 'Taguig', count: 7 },
          { _id: 'Cebu', count: 5 },
        ]
      : locationData;

    const finalStatusData = isSampleData
      ? [
          { _id: 'confirmed', count: 35 },
          { _id: 'pending', count: 15 },
          { _id: 'completed', count: 25 },
        ]
      : statusData;

    const finalTotalBookings = isSampleData ? 75 : totalBookings;

    res.status(200).json({
      success: true,
      data: {
        products: finalProductData,
        locations: finalLocationData,
        statuses: finalStatusData,
        totalBookings: finalTotalBookings,
      },
      isSampleData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
