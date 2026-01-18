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

// @desc    Get booking trends over time
// @route   GET /api/analytics/booking-trends
// @access  Private/Admin
export const getBookingTrends = async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const daysBack = parseInt(period as string);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Format the data for charts
    const formattedTrends = bookingTrends.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      total: item.count,
      confirmed: item.confirmed,
      completed: item.completed,
      cancelled: item.cancelled,
    }));

    // Fill in missing days with zero values
    const filledTrends: any[] = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = formattedTrends.find((t) => t.date === dateStr);

      if (existing) {
        filledTrends.push(existing);
      } else {
        filledTrends.push({
          date: dateStr,
          total: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: filledTrends,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get pending actions summary
// @route   GET /api/analytics/pending-actions
// @access  Private/Admin
export const getPendingActions = async (req: AuthRequest, res: Response) => {
  try {
    const [
      pendingBookings,
      unconfirmedBookings,
      pendingQuotes,
      unreadContacts,
      todayBookings,
    ] = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: { $in: ['pending', 'rescheduled'] } }),
      Quote.countDocuments({ status: 'pending' }),
      Contact.countDocuments({ status: 'new' }),
      Booking.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { $in: ['pending', 'confirmed', 'rescheduled'] },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingBookings,
        unconfirmedBookings,
        pendingQuotes,
        unreadContacts,
        todayBookings,
        totalPending: pendingBookings + pendingQuotes + unreadContacts,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get recent activity across all resources
// @route   GET /api/analytics/recent-activity
// @access  Private/Admin
export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const [recentBookings, recentQuotes, recentContacts] = await Promise.all([
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .select('_id contactName company product date time status createdAt')
        .lean(),
      Quote.find()
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .populate('userId', 'name email')
        .select('_id status products createdAt userId')
        .lean(),
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .select('_id name email subject status createdAt')
        .lean(),
    ]);

    // Combine and sort all activities by date
    const activities: any[] = [
      ...recentBookings.map((b: any) => ({
        type: 'booking',
        id: b._id,
        title: `New booking from ${b.company}`,
        subtitle: `${b.contactName} - ${b.product}`,
        status: b.status,
        date: b.createdAt,
      })),
      ...recentQuotes.map((q: any) => ({
        type: 'quote',
        id: q._id,
        title: `Quote request`,
        subtitle: q.userId ? `${(q.userId as any).name} - ${q.products?.length || 0} products` : `${q.products?.length || 0} products`,
        status: q.status,
        date: q.createdAt,
      })),
      ...recentContacts.map((c: any) => ({
        type: 'contact',
        id: c._id,
        title: `Contact from ${c.name}`,
        subtitle: c.subject || c.email,
        status: c.status,
        date: c.createdAt,
      })),
    ];

    // Sort by date descending and take the most recent
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentActivities = activities.slice(0, limitNum);

    res.status(200).json({
      success: true,
      data: recentActivities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get conversion funnel data
// @route   GET /api/analytics/conversion-funnel
// @access  Private/Admin
export const getConversionFunnel = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
      totalQuotes,
      acceptedQuotes,
      totalBookings,
      confirmedBookings,
      completedBookings,
    ] = await Promise.all([
      Quote.countDocuments(matchFilter),
      Quote.countDocuments({ ...matchFilter, status: 'accepted' }),
      Booking.countDocuments(matchFilter),
      Booking.countDocuments({ ...matchFilter, status: 'confirmed' }),
      Booking.countDocuments({ ...matchFilter, status: 'completed' }),
    ]);

    // Calculate rates
    const quoteAcceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;
    const bookingConfirmationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    const bookingCompletionRate = confirmedBookings > 0 ? (completedBookings / confirmedBookings) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        quotes: {
          total: totalQuotes,
          accepted: acceptedQuotes,
          rate: Math.round(quoteAcceptanceRate * 10) / 10,
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          confirmationRate: Math.round(bookingConfirmationRate * 10) / 10,
          completionRate: Math.round(bookingCompletionRate * 10) / 10,
        },
        funnel: [
          { stage: 'Quotes Requested', count: totalQuotes },
          { stage: 'Quotes Accepted', count: acceptedQuotes },
          { stage: 'Bookings Created', count: totalBookings },
          { stage: 'Bookings Confirmed', count: confirmedBookings },
          { stage: 'Bookings Completed', count: completedBookings },
        ],
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
