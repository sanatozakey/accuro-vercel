import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken, generateRefreshToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import emailService from '../utils/emailService';
import ActivityLog from '../models/ActivityLog';
import RefreshToken from '../models/RefreshToken';
import { jwtConfig } from '../config/jwt';
import { verifyTOTP, verifyBackupCode } from '../utils/totp';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      company,
      role: 'user',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken, name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // @ts-ignore
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to database
    try {
      await saveRefreshToken(user._id.toString(), refreshToken, req);
    } catch (tokenError) {
      console.error('Failed to save refresh token:', tokenError);
      // Continue registration even if refresh token save fails
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'USER_REGISTERED',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `User registered: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        company: user.company,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user - include 2FA fields
    const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorBackupCodes');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minute${lockTimeRemaining > 1 ? 's' : ''}.`,
        lockUntil: user.lockUntil,
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts on failed login
      await user.incrementLoginAttempts();

      // Refetch user to get updated loginAttempts count
      const updatedUser = await User.findById(user._id);
      const attemptsRemaining = 5 - (updatedUser?.loginAttempts || 0);

      if (attemptsRemaining > 0 && attemptsRemaining <= 2) {
        return res.status(401).json({
          success: false,
          message: `Invalid credentials. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before account lockout.`,
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // If no 2FA code provided, return 2FA required response
      if (!twoFactorCode) {
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: 'Two-factor authentication required',
        });
      }

      // Verify 2FA code (could be TOTP or backup code)
      let twoFactorValid = false;
      let usedBackupCode = false;

      // First try TOTP verification
      if (user.twoFactorSecret && verifyTOTP(user.twoFactorSecret, twoFactorCode)) {
        twoFactorValid = true;
      }

      // If TOTP fails, try backup code
      if (!twoFactorValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const backupCodeIndex = verifyBackupCode(twoFactorCode, user.twoFactorBackupCodes);
        if (backupCodeIndex !== -1) {
          twoFactorValid = true;
          usedBackupCode = true;
          // Remove the used backup code
          user.twoFactorBackupCodes.splice(backupCodeIndex, 1);
          await user.save();
        }
      }

      if (!twoFactorValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication code',
        });
      }
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Track login activity
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Update login tracking fields
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    user.lastLoginIP = ipAddress;

    // Add to login history (keep only last 20 entries)
    if (!user.loginHistory) {
      user.loginHistory = [];
    }
    user.loginHistory.unshift({
      loginAt: new Date(),
      ipAddress,
      userAgent,
    });
    if (user.loginHistory.length > 20) {
      user.loginHistory = user.loginHistory.slice(0, 20);
    }
    await user.save();

    // @ts-ignore
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to database
    try {
      await saveRefreshToken(user._id.toString(), refreshToken, req);
    } catch (tokenError) {
      console.error('Failed to save refresh token:', tokenError);
      // Continue login even if refresh token save fails
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'LOGIN',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `User logged in: ${user.email}${user.twoFactorEnabled ? ' (with 2FA)' : ''}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        company: user.company,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);

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

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req: AuthRequest, res: Response) => {
  try {
    // Check if email is being changed and if it already exists
    if (req.body.email && req.body.email !== req.user!.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account',
        });
      }
    }

    // Validate profile picture size if provided (max 3MB base64 string for safety)
    if (req.body.profilePicture !== undefined && req.body.profilePicture) {
      const base64String = req.body.profilePicture;

      // Check if it's a valid base64 image
      if (!base64String.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format. Must be a base64 encoded image.',
        });
      }

      // Estimate size of base64 string (approximately 75% of string length)
      const estimatedSizeInBytes = base64String.length * 0.75;
      const maxSizeInBytes = 3 * 1024 * 1024; // 3MB

      if (estimatedSizeInBytes > maxSizeInBytes) {
        return res.status(400).json({
          success: false,
          message: 'Image is too large. Please use an image smaller than 1MB.',
        });
      }
    }

    const fieldsToUpdate: any = {};
    if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name;
    if (req.body.email !== undefined) fieldsToUpdate.email = req.body.email;
    if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone;
    if (req.body.company !== undefined) fieldsToUpdate.company = req.body.company;
    if (req.body.profilePicture !== undefined) fieldsToUpdate.profilePicture = req.body.profilePicture;

    const user = await User.findByIdAndUpdate(req.user!._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'PROFILE_UPDATED',
        resourceType: 'user',
        resourceId: user._id.toString(),
        details: `Profile updated for user: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // @ts-ignore
    const token = generateToken(user._id.toString());

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'PASSWORD_CHANGED',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `Password changed by user: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      data: {
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find user with this verification token that hasn't expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'EMAIL_VERIFIED',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `Email verified for user: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken, user.name);

    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully! Please check your inbox.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Upload profile picture
// @route   PUT /api/auth/upload-profile-picture
// @access  Private
export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a profile picture',
      });
    }

    // Basic validation for base64 image
    if (!profilePicture.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { profilePicture },
      { new: true, runValidators: true }
    );

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

// @desc    Forgot password - Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save hashed token to database
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send email with reset link
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.name);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent! Please check your inbox.',
      });
    } catch (emailError) {
      // If email fails, remove reset token from database
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Hash the token from URL to match against database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    // Reset login attempts on password reset
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'PASSWORD_RESET',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `Password reset for user: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Helper function to save refresh token
const saveRefreshToken = async (
  userId: string,
  refreshToken: string,
  req: Request
): Promise<void> => {
  // Parse expiry from config (e.g., '7d' -> 7 days)
  const expiryDays = parseInt(jwtConfig.refreshTokenExpiry) || 7;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    token: refreshToken,
    user: userId,
    expiresAt,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
  });
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public (requires valid refresh token)
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify the refresh token JWT
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, jwtConfig.secret);
    } catch (jwtError: any) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Check if it's actually a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
    }

    // Find the refresh token in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      isRevoked: false,
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or has been revoked',
      });
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
      });
    }

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id.toString());

    // Optionally rotate refresh token for added security
    // For now, we'll keep the same refresh token

    res.status(200).json({
      success: true,
      data: {
        token: newAccessToken,
        // Include user data for frontend convenience
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Logout - invalidate refresh token
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the specific refresh token
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken, user: req.user!._id },
        { isRevoked: true, revokedAt: new Date(), revokedReason: 'User logged out' }
      );
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'LOGOUT',
        resourceType: 'auth',
        resourceId: req.user!._id.toString(),
        details: `User logged out: ${req.user!.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Logout from all devices - invalidate all refresh tokens
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    // Revoke all refresh tokens for the user
    await RefreshToken.updateMany(
      { user: req.user!._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'User logged out from all devices' }
    );

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'LOGOUT_ALL',
        resourceType: 'auth',
        resourceId: req.user!._id.toString(),
        details: `User logged out from all devices: ${req.user!.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get active sessions (refresh tokens) for user
// @route   GET /api/auth/sessions
// @access  Private
export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await RefreshToken.find({
      user: req.user!._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('userAgent ipAddress createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Request account deletion
// @route   POST /api/auth/delete-account-request
// @access  Private
export const deleteAccountRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to confirm account deletion',
      });
    }

    // Verify password
    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Mark user for deletion (soft delete)
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.updateMany(
      { user: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'Account deletion requested' }
    );

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'ACCOUNT_DELETION_REQUESTED',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `Account deletion requested for: ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Account deletion request submitted. Your account has been deactivated.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Revoke a specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await RefreshToken.findOneAndUpdate(
      { _id: sessionId, user: req.user!._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'User revoked session' }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already revoked',
      });
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'SESSION_REVOKED',
        resourceType: 'auth',
        resourceId: sessionId,
        details: `Session revoked by user: ${req.user!.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
