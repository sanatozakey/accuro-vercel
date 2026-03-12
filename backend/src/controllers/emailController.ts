import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/emailService';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import { socketService } from '../services/socketService';

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

    // Respond immediately — emails are sent in the background.
    res.status(200).json({
      success: true,
      message: `Sending emails to ${recipients.length} recipient(s) in the background. You'll see results in the server logs.`,
      data: {
        totalRecipients: recipients.length,
      },
    });

    // Process emails in the background after response is sent
    const userId = req.user!._id.toString();

    emailService.sendBulkEmail(recipients, subject, content, (progress) => {
      // Emit real-time progress to the admin via Socket.IO
      socketService.emitToUser(userId, 'bulk-email-progress', progress);
    })
      .then(async (results) => {
        console.log(`Bulk email complete: ${results.sent} sent, ${results.failed} failed`);
        if (results.errors.length > 0) {
          console.error('Bulk email errors:', results.errors.slice(0, 10));
        }

        // Emit completion event
        socketService.emitToUser(userId, 'bulk-email-complete', {
          sent: results.sent,
          failed: results.failed,
          total: recipients.length,
        });

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
      })
      .catch((err) => {
        console.error('Bulk email background processing failed:', err);
        // Notify the admin that it failed
        socketService.emitToUser(userId, 'bulk-email-complete', {
          sent: 0,
          failed: recipients.length,
          total: recipients.length,
          error: err.message || 'Background processing failed',
        });
      });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Send individual email to a single user
// @route   POST /api/email/individual
// @access  Private/Admin
export const sendIndividualEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, content, recipientEmail, recipientName } = req.body;

    if (!subject || !content || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Subject, content, and recipient email are required',
      });
    }

    const name = recipientName || recipientEmail;
    const personalizedHtml = content.replace(/\{\{name\}\}/g, name);

    await emailService.sendEmail({
      to: recipientEmail,
      subject,
      html: personalizedHtml,
    });

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'INDIVIDUAL_EMAIL_SENT',
        resourceType: 'system',
        details: `Individual email sent to ${recipientEmail} (${name}): "${subject}"`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: `Email sent successfully to ${recipientEmail}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
    });
  }
};

// @desc    Search users for email autocomplete
// @route   GET /api/email/search-users
// @access  Private/Admin
export const searchUsersForEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.status(200).json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      isDeleted: { $ne: true },
      $or: [
        { name: searchRegex },
        { email: searchRegex },
      ],
    })
      .select('name email role isEmailVerified')
      .limit(10)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isEmailVerified: u.isEmailVerified,
      })),
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
