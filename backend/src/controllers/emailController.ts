import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/emailService';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';

// @desc    Send bulk email to users
// @route   POST /api/email/bulk
// @access  Private/Admin
export const sendBulkEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, content, recipientFilter } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required',
      });
    }

    // Build user query based on filter
    const query: any = { isDeleted: { $ne: true } };

    if (recipientFilter === 'verified') {
      query.isEmailVerified = true;
    } else if (recipientFilter === 'unverified') {
      query.isEmailVerified = false;
    } else if (recipientFilter === 'admins') {
      query.role = { $in: ['admin', 'superadmin'] };
    }
    // 'all' doesn't add any filter

    const users = await User.find(query).select('email name');

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients found matching the filter',
      });
    }

    const recipients = users.map((user) => ({
      email: user.email,
      name: user.name,
    }));

    // Send bulk email
    const results = await emailService.sendBulkEmail(recipients, subject, content);

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'BULK_EMAIL_SENT',
        resourceType: 'system',
        details: `Bulk email sent: ${results.sent} successful, ${results.failed} failed`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      data: {
        totalRecipients: recipients.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Only return first 10 errors
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Preview email recipients
// @route   GET /api/email/preview-recipients
// @access  Private/Admin
export const previewRecipients = async (req: AuthRequest, res: Response) => {
  try {
    const { filter } = req.query;

    // Build user query based on filter
    const query: any = { isDeleted: { $ne: true } };

    if (filter === 'verified') {
      query.isEmailVerified = true;
    } else if (filter === 'unverified') {
      query.isEmailVerified = false;
    } else if (filter === 'admins') {
      query.role = { $in: ['admin', 'superadmin'] };
    }

    const count = await User.countDocuments(query);
    const sample = await User.find(query).select('email name').limit(5);

    res.status(200).json({
      success: true,
      data: {
        count,
        sample: sample.map((u) => ({ email: u.email, name: u.name })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
