import { Response } from 'express';
import Booking from '../models/Booking';
import Analytics from '../models/Analytics';
import Quote from '../models/Quote';
import Contact from '../models/Contact';
import User from '../models/User';
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
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const bookingFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [productData, locationData, statusData, totalBookings, totalUsers, totalQuotes, totalContacts] = await Promise.all([
      Booking.aggregate([
        ...(Object.keys(bookingFilter).length > 0 ? [{ $match: bookingFilter }] : []),
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
        ...(Object.keys(bookingFilter).length > 0 ? [{ $match: bookingFilter }] : []),
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
        ...(Object.keys(bookingFilter).length > 0 ? [{ $match: bookingFilter }] : []),
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.countDocuments(bookingFilter),
      User.countDocuments(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      Quote.countDocuments(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      Contact.countDocuments(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
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
    const finalTotalUsers = isSampleData ? 45 : totalUsers;
    const finalTotalQuotes = isSampleData ? 23 : totalQuotes;
    const finalTotalContacts = isSampleData ? 38 : totalContacts;

    res.status(200).json({
      success: true,
      data: {
        products: finalProductData,
        locations: finalLocationData,
        statuses: finalStatusData,
        totalBookings: finalTotalBookings,
        totalUsers: finalTotalUsers,
        totalQuotes: finalTotalQuotes,
        totalContacts: finalTotalContacts,
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

// @desc    Get product views analytics
// @route   GET /api/analytics/product-views
// @access  Private/Admin
export const getProductViewsAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter: any = { eventType: 'product_view' };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }

    const productViews = await Analytics.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.status(200).json({
      success: true,
      data: productViews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get product view details (transactions)
// @route   GET /api/analytics/product-views/details
// @access  Private/Admin
export const getProductViewDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, startDate, endDate, page = '1', limit = '50' } = req.query;

    const matchFilter: any = { eventType: 'product_view' };
    if (productId) matchFilter.productId = productId;

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      matchFilter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [details, total] = await Promise.all([
      Analytics.find(matchFilter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Analytics.countDocuments(matchFilter),
    ]);

    res.status(200).json({
      success: true,
      data: details,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get cart analytics
// @route   GET /api/analytics/cart
// @access  Private/Admin
export const getCartAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter: any = { eventType: { $in: ['cart_add', 'cart_remove'] } };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }

    const cartData = await Analytics.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            productId: '$productId',
          },
          productName: { $first: '$productName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Separate adds and removes
    const additions = cartData.filter(item => item._id.eventType === 'cart_add');
    const removals = cartData.filter(item => item._id.eventType === 'cart_remove');

    res.status(200).json({
      success: true,
      data: {
        additions,
        removals,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get cart event details
// @route   GET /api/analytics/cart/details
// @access  Private/Admin
export const getCartDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { eventType, productId, startDate, endDate, page = '1', limit = '50' } = req.query;

    const matchFilter: any = {};
    if (eventType) {
      matchFilter.eventType = eventType;
    } else {
      matchFilter.eventType = { $in: ['cart_add', 'cart_remove'] };
    }

    if (productId) matchFilter.productId = productId;

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      matchFilter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [details, total] = await Promise.all([
      Analytics.find(matchFilter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Analytics.countDocuments(matchFilter),
    ]);

    res.status(200).json({
      success: true,
      data: details,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get quote request analytics
// @route   GET /api/analytics/quotes
// @access  Private/Admin
export const getQuoteAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [quotesByStatus, totalQuotes, recentQuotes] = await Promise.all([
      Quote.aggregate([
        ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Quote.countDocuments(matchFilter),
      Quote.find(matchFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: quotesByStatus,
        total: totalQuotes,
        recent: recentQuotes,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get quote details
// @route   GET /api/analytics/quotes/details
// @access  Private/Admin
export const getQuoteDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate, page = '1', limit = '50' } = req.query;

    const matchFilter: any = {};
    if (status) matchFilter.status = status;

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      matchFilter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [quotes, total] = await Promise.all([
      Quote.find(matchFilter)
        .populate('userId', 'name email company')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Quote.countDocuments(matchFilter),
    ]);

    res.status(200).json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get contact form analytics
// @route   GET /api/analytics/contacts
// @access  Private/Admin
export const getContactAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [contactsByStatus, totalContacts, recentContacts] = await Promise.all([
      Contact.aggregate([
        ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Contact.countDocuments(matchFilter),
      Contact.find(matchFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: contactsByStatus,
        total: totalContacts,
        recent: recentContacts,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get contact form details
// @route   GET /api/analytics/contacts/details
// @access  Private/Admin
export const getContactDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate, page = '1', limit = '50' } = req.query;

    const matchFilter: any = {};
    if (status) matchFilter.status = status;

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      matchFilter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.find(matchFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(matchFilter),
    ]);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user registration analytics
// @route   GET /api/analytics/registrations
// @access  Private/Admin
export const getRegistrationAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [usersByRole, totalUsers, recentUsers, userTrend] = await Promise.all([
      User.aggregate([
        ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments(matchFilter),
      User.find(matchFilter)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      User.aggregate([
        ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byRole: usersByRole,
        total: totalUsers,
        recent: recentUsers,
        trend: userTrend,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user registration details
// @route   GET /api/analytics/registrations/details
// @access  Private/Admin
export const getRegistrationDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { role, startDate, endDate, page = '1', limit = '50' } = req.query;

    const matchFilter: any = {};
    if (role) matchFilter.role = role;

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      matchFilter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(matchFilter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(matchFilter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get search analytics
// @route   GET /api/analytics/searches
// @access  Private/Admin
export const getSearchAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter: any = { eventType: 'search' };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }

    const searchTerms = await Analytics.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$searchTerm',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    res.status(200).json({
      success: true,
      data: searchTerms,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get search details
// @route   GET /api/analytics/searches/details
// @access  Private/Admin
export const getSearchDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { searchTerm, startDate, endDate, page = '1', limit = '50' } = req.query;

    const matchFilter: any = { eventType: 'search' };
    if (searchTerm) matchFilter.searchTerm = searchTerm;

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      matchFilter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [searches, total] = await Promise.all([
      Analytics.find(matchFilter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Analytics.countDocuments(matchFilter),
    ]);

    res.status(200).json({
      success: true,
      data: searches,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Track analytics event
// @route   POST /api/analytics/track
// @access  Public (but tracks user if authenticated)
export const trackEvent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      eventType,
      productId,
      productName,
      category,
      searchTerm,
      metadata,
    } = req.body;

    const analyticsData: any = {
      eventType,
      productId,
      productName,
      category,
      searchTerm,
      metadata,
    };

    // Add user info if authenticated
    if (req.user) {
      analyticsData.userId = req.user._id;
      analyticsData.userEmail = req.user.email;
      analyticsData.userName = req.user.name;
    }

    await Analytics.create(analyticsData);

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
