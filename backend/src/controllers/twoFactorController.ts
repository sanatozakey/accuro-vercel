import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateOTPAuthURI,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from '../utils/totp';

// @desc    Setup 2FA - generate secret and QR code
// @route   POST /api/auth/2fa/setup
// @access  Private
export const setup2FA = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('+twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is already enabled',
      });
    }

    // Generate new secret
    const secret = generateSecret();

    // Save secret temporarily (not enabled yet)
    user.twoFactorSecret = secret;
    await user.save();

    // Generate OTP Auth URI for QR code
    const otpAuthUri = generateOTPAuthURI(secret, user.email, 'Accuro');

    res.status(200).json({
      success: true,
      data: {
        secret,
        otpAuthUri,
        // Note: Frontend should generate QR code from otpAuthUri
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
export const verify2FA = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    const user = await User.findById(req.user!._id).select('+twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is already enabled',
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please setup 2FA first',
      });
    }

    // Verify the token
    if (!verifyTOTP(user.twoFactorSecret, token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = backupCodes.map((code) => hashBackupCode(code));

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: '2FA_ENABLED',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `Two-factor authentication enabled for: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      data: {
        backupCodes, // Show these once, user must save them
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
export const disable2FA = async (req: AuthRequest, res: Response) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    const user = await User.findById(req.user!._id).select('+password +twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Verify 2FA token if provided
    if (token && user.twoFactorSecret) {
      if (!verifyTOTP(user.twoFactorSecret, token)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA code',
        });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: '2FA_DISABLED',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `Two-factor authentication disabled for: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get 2FA status
// @route   GET /api/auth/2fa/status
// @access  Private
export const get2FAStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('+twoFactorBackupCodes');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled,
        backupCodesRemaining: user.twoFactorBackupCodes?.length || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Regenerate backup codes
// @route   POST /api/auth/2fa/regenerate-backup
// @access  Private
export const regenerateBackupCodes = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    const user = await User.findById(req.user!._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = backupCodes.map((code) => hashBackupCode(code));

    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
