import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Quotation from '../models/Quotation';
import { NotificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

// Create new quotation (customer)
export const createQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      company,
      items,
      additionalRequirements,
      currency,
    } = req.body;

    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'At least one product item is required' });
      return;
    }

    const quotation = await Quotation.create({
      userId,
      customerName,
      customerEmail,
      customerPhone,
      company,
      items,
      additionalRequirements,
      currency: currency || 'PHP',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Quotation request submitted successfully',
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create quotation',
    });
  }
};

// Get all quotations (admin: all, customer: own only)
export const getQuotations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const query: any = isAdmin ? {} : { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      Quotation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quotations',
    });
  }
};

// Get single quotation by ID
export const getQuotationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const quotation = await Quotation.findById(id).populate('userId', 'name email');

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    // Check authorization: admin can see all, users can only see their own
    if (!isAdmin && quotation.userId.toString() !== userId?.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to view this quotation' });
      return;
    }

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quotation',
    });
  }
};

// Update quotation (admin only)
export const updateQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const quotation = await Quotation.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update quotation',
    });
  }
};

// Approve quotation (admin only)
export const approveQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const {
      totalAmount,
      validUntil,
      paymentTerms,
      deliveryTerms,
      adminNotes,
      termsAndConditions,
      currency,
    } = req.body;

    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    if (quotation.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Cannot approve quotation with status: ${quotation.status}`,
      });
      return;
    }

    quotation.status = 'approved';
    quotation.totalAmount = totalAmount;
    quotation.validUntil = validUntil;
    quotation.paymentTerms = paymentTerms;
    quotation.deliveryTerms = deliveryTerms;
    quotation.adminNotes = adminNotes;
    quotation.termsAndConditions = termsAndConditions;
    quotation.currency = currency || quotation.currency;
    quotation.approvedAt = new Date();

    await quotation.save();

    // Send notification to customer
    try {
      await NotificationService.notifyQuotationStatusChange(
        quotation.userId,
        quotation._id as mongoose.Types.ObjectId,
        quotation.quotationNumber,
        'approved'
      );
    } catch (notificationError) {
      console.error('Failed to send quotation notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: 'Quotation approved successfully',
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error approving quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve quotation',
    });
  }
};

// Reject quotation (admin only)
export const rejectQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { adminNotes } = req.body;

    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    if (quotation.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Cannot reject quotation with status: ${quotation.status}`,
      });
      return;
    }

    quotation.status = 'rejected';
    quotation.adminNotes = adminNotes;
    quotation.rejectedAt = new Date();

    await quotation.save();

    // Send notification to customer
    try {
      await NotificationService.notifyQuotationStatusChange(
        quotation.userId,
        quotation._id as mongoose.Types.ObjectId,
        quotation.quotationNumber,
        'rejected'
      );
    } catch (notificationError) {
      console.error('Failed to send quotation notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: 'Quotation rejected',
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error rejecting quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject quotation',
    });
  }
};

// Delete quotation (admin only)
export const deleteQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const quotation = await Quotation.findByIdAndDelete(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete quotation',
    });
  }
};

// Get quotation statistics (admin only)
export const getQuotationStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const [pending, approved, rejected, expired] = await Promise.all([
      Quotation.countDocuments({ status: 'pending' }),
      Quotation.countDocuments({ status: 'approved' }),
      Quotation.countDocuments({ status: 'rejected' }),
      Quotation.countDocuments({ status: 'expired' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        expired,
        total: pending + approved + rejected + expired,
      },
    });
  } catch (error: any) {
    console.error('Error fetching quotation stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics',
    });
  }
};
