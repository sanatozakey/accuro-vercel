import { Request, Response } from 'express';
import PurchaseHistory from '../models/PurchaseHistory';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all purchase history (Admin only)
// @route   GET /api/purchases
// @access  Private/Admin
export const getAllPurchases = async (req: Request, res: Response) => {
  try {
    const { orderStatus, paymentStatus, startDate, endDate } = req.query;

    let query: any = {};

    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const purchases = await PurchaseHistory.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('relatedQuote', 'customerName totalEstimatedPrice')
      .populate('relatedBooking', 'company date');

    const stats = await PurchaseHistory.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          completedPurchases: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] },
          },
          pendingPurchases: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: purchases.length,
      stats: stats[0] || {},
      data: purchases,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
export const getPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const purchase = await PurchaseHistory.findById(req.params.id)
      .populate('user', 'name email')
      .populate('relatedQuote', 'customerName items totalEstimatedPrice')
      .populate('relatedBooking', 'company date product');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    // Check if user owns this purchase or is admin
    const isOwner = purchase.user._id.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this purchase',
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Private
export const createPurchase = async (req: AuthRequest, res: Response) => {
  try {
    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const purchaseData = {
      ...req.body,
      user: req.user!._id,
      userName: req.user!.name,
      userEmail: req.user!.email,
      orderNumber,
    };

    const purchase = await PurchaseHistory.create(purchaseData);

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'PURCHASE_CREATED',
        resourceType: 'purchase',
        resourceId: purchase._id.toString(),
        details: `Purchase created - Order #${orderNumber}, Total: $${purchase.totalAmount}, Items: ${purchase.items.length}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: purchase,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update purchase (Admin only)
// @route   PUT /api/purchases/:id
// @access  Private/Admin
export const updatePurchase = async (req: AuthRequest, res: Response) => {
  try {
    let purchase = await PurchaseHistory.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    const originalOrderStatus = purchase.orderStatus;
    const originalPaymentStatus = purchase.paymentStatus;

    purchase = await PurchaseHistory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'PURCHASE_UPDATED',
        resourceType: 'purchase',
        resourceId: purchase!._id.toString(),
        details: `Purchase updated - Order #${purchase!.orderNumber}. Order Status: ${originalOrderStatus} → ${purchase!.orderStatus}, Payment Status: ${originalPaymentStatus} → ${purchase!.paymentStatus}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's purchase history
// @route   GET /api/purchases/my-purchases
// @access  Private
export const getMyPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const purchases = await PurchaseHistory.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .populate('relatedQuote', 'customerName totalEstimatedPrice')
      .populate('relatedBooking', 'company date product');

    const totalSpent = await PurchaseHistory.aggregate([
      { $match: { user: req.user!._id, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.status(200).json({
      success: true,
      count: purchases.length,
      totalSpent: totalSpent[0]?.total || 0,
      data: purchases,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Cancel purchase
// @route   PUT /api/purchases/:id/cancel
// @access  Private
export const cancelPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const purchase = await PurchaseHistory.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    // Check if user owns this purchase or is admin
    const isOwner = purchase.user.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this purchase',
      });
    }

    // Check if purchase can be cancelled
    if (purchase.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a delivered order',
      });
    }

    if (purchase.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    purchase.orderStatus = 'cancelled';
    await purchase.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'PURCHASE_CANCELLED',
        resourceType: 'purchase',
        resourceId: purchase._id.toString(),
        details: `Purchase cancelled - Order #${purchase.orderNumber}, Total: $${purchase.totalAmount}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Purchase cancelled successfully',
      data: purchase,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
