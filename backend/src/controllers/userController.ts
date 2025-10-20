import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import ActivityLog from '../models/ActivityLog';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, company, profilePicture } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Track changes for activity log
    const changes: string[] = [];

    // Update fields if provided (excluding role - use separate endpoint)
    if (name && name !== user.name) {
      changes.push(`name: "${user.name}" → "${name}"`);
      user.name = name;
    }
    if (email && email !== user.email) {
      changes.push(`email: "${user.email}" → "${email}"`);
      user.email = email;
    }
    if (phone !== undefined && phone !== user.phone) {
      changes.push(`phone: "${user.phone}" → "${phone}"`);
      user.phone = phone;
    }
    if (company !== undefined && company !== user.company) {
      changes.push(`company: "${user.company}" → "${company}"`);
      user.company = company;
    }
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    await user.save();

    // Log activity
    if (changes.length > 0) {
      try {
        await ActivityLog.create({
          user: req.user!._id,
          userName: req.user!.name,
          userEmail: req.user!.email,
          action: 'USER_UPDATED',
          resourceType: 'user',
          resourceId: user._id.toString(),
          details: `User ${user.email} updated. Changes: ${changes.join(', ')}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user!._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Prevent regular admin from deleting super admin
    if (user.role === 'superadmin' && req.user!.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can delete super admin accounts',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'USER_DELETED',
        resourceType: 'user',
        resourceId: user._id.toString(),
        details: `User ${user.name} (${user.email}) deleted by ${req.user!.role}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Change user role (Super Admin only for admin/superadmin roles)
// @route   PATCH /api/users/:id/role
// @access  Private/Admin or Super Admin
export const changeUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    // Validate role
    if (!role || !['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: user, admin, superadmin',
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent changing your own role
    if (targetUser._id.toString() === req.user!._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    // Role change permission logic
    const currentUserRole = req.user!.role;
    const targetCurrentRole = targetUser.role;

    // Only super admin can change roles to/from superadmin
    if ((role === 'superadmin' || targetCurrentRole === 'superadmin') && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can manage super admin roles',
      });
    }

    // Only super admin can change admin roles
    if ((role === 'admin' || targetCurrentRole === 'admin') && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can manage admin roles',
      });
    }

    // Store old role for logging
    const oldRole = targetUser.role;

    // Update role
    targetUser.role = role;
    await targetUser.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'user',
        resourceId: targetUser._id.toString(),
        details: `User ${targetUser.email} role changed from "${oldRole}" to "${role}" by ${currentUserRole}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      data: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
