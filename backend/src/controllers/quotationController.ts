import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Quotation from '../models/Quotation';
import User from '../models/User';
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

    // Notify all admins and superadmins about the new quotation request
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'superadmin'] },
      }).select('_id').lean();

      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: (admin as any)._id.toString(),
          type: 'quotation',
          title: 'New Quotation Request',
          message: `${customerName} from ${company} has requested a quotation (${quotation.quotationNumber}) with ${items.length} item(s).`,
          relatedId: quotation._id.toString(),
          relatedType: 'quotation',
          actionUrl: '/admin/quotations',
        });
      }
    } catch (notificationError) {
      console.error('Failed to send admin quotation notifications:', notificationError);
    }

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
    const isAdminOrAbove = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const query: any = isAdminOrAbove ? {} : { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // Auto-expire any quoted quotations whose validUntil has passed
    await Quotation.updateMany(
      { status: 'quoted', validUntil: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );

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
    const isAdminOrAbove = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    // Check authorization: admin/superadmin can see all, users can only see their own
    const quotationOwnerId = (quotation.userId as any)._id
      ? (quotation.userId as any)._id.toString()
      : quotation.userId.toString();
    if (!isAdminOrAbove && quotationOwnerId !== userId?.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to view this quotation' });
      return;
    }

    // Auto-expire if validUntil has passed
    if (quotation.status === 'quoted' && quotation.validUntil && new Date(quotation.validUntil) < new Date()) {
      quotation.status = 'expired';
      await quotation.save();
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

// Update quotation (admin/superadmin only)
export const updateQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdminOrAbove = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!isAdminOrAbove) {
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

// Send quote to customer (admin/superadmin) - sets pricing and sends for customer approval
// Also handles re-quotation when customer has declined
export const sendQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdminOrAbove = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!isAdminOrAbove) {
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

    if (!totalAmount || !validUntil) {
      res.status(400).json({
        success: false,
        message: 'Total amount and valid until date are required',
      });
      return;
    }

    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    if (quotation.status !== 'pending' && quotation.status !== 'declined') {
      res.status(400).json({
        success: false,
        message: `Cannot send quote for quotation with status: ${quotation.status}`,
      });
      return;
    }

    // If re-quoting a declined quotation, save previous quote to history
    if (quotation.status === 'declined') {
      quotation.quotationHistory.push({
        totalAmount: quotation.totalAmount,
        validUntil: quotation.validUntil,
        paymentTerms: quotation.paymentTerms,
        deliveryTerms: quotation.deliveryTerms,
        termsAndConditions: quotation.termsAndConditions,
        currency: quotation.currency,
        quotedAt: quotation.quotedAt,
        declinedAt: quotation.declinedAt,
        declineReason: quotation.declineReason,
      });
      // Clear decline fields
      quotation.declineReason = undefined;
      quotation.declinedAt = undefined;
    }

    quotation.status = 'quoted';
    quotation.totalAmount = totalAmount;
    quotation.validUntil = validUntil;
    quotation.paymentTerms = paymentTerms || '50% upon order, 50% upon delivery';
    quotation.deliveryTerms = deliveryTerms || '30-45 days from order confirmation';
    quotation.adminNotes = adminNotes;
    quotation.termsAndConditions = termsAndConditions;
    quotation.currency = currency || quotation.currency;
    quotation.quotedAt = new Date();

    await quotation.save();

    // Send notification to customer
    try {
      await NotificationService.notifyQuotationStatusChange(
        quotation.userId,
        quotation._id as mongoose.Types.ObjectId,
        quotation.quotationNumber,
        'quoted'
      );
    } catch (notificationError) {
      console.error('Failed to send quotation notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: 'Quote sent to customer for approval',
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error sending quote:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send quote',
    });
  }
};

// Customer accepts a quoted quotation
export const acceptQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    // Only the quotation owner can accept
    if (quotation.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to accept this quotation' });
      return;
    }

    if (quotation.status !== 'quoted') {
      res.status(400).json({
        success: false,
        message: `Cannot accept quotation with status: ${quotation.status}`,
      });
      return;
    }

    // Check if quotation has expired
    if (quotation.validUntil && new Date(quotation.validUntil) < new Date()) {
      quotation.status = 'expired';
      await quotation.save();
      res.status(400).json({
        success: false,
        message: 'This quotation has expired. Please request a new quotation.',
      });
      return;
    }

    quotation.status = 'accepted';
    quotation.acceptedAt = new Date();

    await quotation.save();

    // Notify the customer
    try {
      await NotificationService.notifyQuotationStatusChange(
        quotation.userId,
        quotation._id as mongoose.Types.ObjectId,
        quotation.quotationNumber,
        'accepted'
      );
    } catch (notificationError) {
      console.error('Failed to send quotation notification:', notificationError);
    }

    // Notify all admins that customer accepted
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'superadmin'] },
      }).select('_id').lean();

      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: (admin as any)._id.toString(),
          type: 'quotation',
          title: 'Quotation Accepted by Customer',
          message: `${quotation.customerName} (${quotation.company}) has accepted quotation ${quotation.quotationNumber}.`,
          relatedId: quotation._id.toString(),
          relatedType: 'quotation',
          actionUrl: '/admin/quotations',
        });
      }
    } catch (adminNotificationError) {
      console.error('Failed to send admin accept notifications:', adminNotificationError);
    }

    res.status(200).json({
      success: true,
      message: 'Quotation accepted successfully',
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error accepting quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept quotation',
    });
  }
};

// Customer declines a quoted quotation
export const declineQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const { declineReason } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    // Only the quotation owner can decline
    if (quotation.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to decline this quotation' });
      return;
    }

    if (quotation.status !== 'quoted') {
      res.status(400).json({
        success: false,
        message: `Cannot decline quotation with status: ${quotation.status}`,
      });
      return;
    }

    quotation.status = 'declined';
    quotation.declinedAt = new Date();
    quotation.declineReason = declineReason || '';

    await quotation.save();

    // Notify the customer
    try {
      await NotificationService.notifyQuotationStatusChange(
        quotation.userId,
        quotation._id as mongoose.Types.ObjectId,
        quotation.quotationNumber,
        'declined'
      );
    } catch (notificationError) {
      console.error('Failed to send quotation notification:', notificationError);
    }

    // Notify all admins that customer declined
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'superadmin'] },
      }).select('_id').lean();

      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: (admin as any)._id.toString(),
          type: 'quotation',
          title: 'Quotation Declined by Customer',
          message: `${quotation.customerName} (${quotation.company}) has declined quotation ${quotation.quotationNumber}.${declineReason ? ` Reason: ${declineReason}` : ''}`,
          relatedId: quotation._id.toString(),
          relatedType: 'quotation',
          actionUrl: '/admin/quotations',
        });
      }
    } catch (adminNotificationError) {
      console.error('Failed to send admin decline notifications:', adminNotificationError);
    }

    res.status(200).json({
      success: true,
      message: 'Quotation declined',
      data: quotation,
    });
  } catch (error: any) {
    console.error('Error declining quotation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to decline quotation',
    });
  }
};

// Reject quotation (admin/superadmin only)
export const rejectQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdminOrAbove = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!isAdminOrAbove) {
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

// Delete quotation (admin/superadmin only)
export const deleteQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdminOrAbove = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!isAdminOrAbove) {
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

// Get quotation statistics (admin/superadmin only)
export const getQuotationStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdminOrAbove = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!isAdminOrAbove) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const [pending, quoted, accepted, declined, rejected, expired] = await Promise.all([
      Quotation.countDocuments({ status: 'pending' }),
      Quotation.countDocuments({ status: 'quoted' }),
      Quotation.countDocuments({ status: 'accepted' }),
      Quotation.countDocuments({ status: 'declined' }),
      Quotation.countDocuments({ status: 'rejected' }),
      Quotation.countDocuments({ status: 'expired' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        quoted,
        accepted,
        declined,
        rejected,
        expired,
        total: pending + quoted + accepted + declined + rejected + expired,
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
