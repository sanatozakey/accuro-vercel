import { Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all activity logs (Admin only)
// @route   GET /api/activity-logs
// @access  Private/Admin
export const getAllActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, action, resourceType, userId } = req.query;

    const query: any = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.user = userId;

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create activity log entry
// @route   POST /api/activity-logs
// @access  Private
export const createActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const { action, resourceType, resourceId, details } = req.body;

    const log = await ActivityLog.create({
      user: req.user!._id,
      userName: req.user!.name,
      userEmail: req.user!.email,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Helper function to log activity (can be imported and used in other controllers)
export const logActivity = async (
  user: { _id: string; name: string; email: string },
  action: string,
  resourceType: 'user' | 'booking' | 'review' | 'auth' | 'system',
  resourceId?: string,
  details?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await ActivityLog.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
