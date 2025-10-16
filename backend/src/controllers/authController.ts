import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import emailService from '../utils/emailService';
import ActivityLog from '../models/ActivityLog';

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
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

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

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // @ts-ignore
    const token = generateToken(user._id.toString());

    // Log activity
    try {
      await ActivityLog.create({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'LOGIN',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        details: `User logged in: ${user.email}`,
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
