import express from 'express';
import {
  register,
  login,
  googleLogin,
  getMe,
  updateDetails,
  updatePassword,
  verifyEmail,
  resendVerification,
  uploadProfilePicture,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout,
  logoutAll,
  getSessions,
  revokeSession,
  deleteAccountRequest,
} from '../controllers/authController';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
} from '../controllers/twoFactorController';
import { protect } from '../middleware/auth';
import {
  validateRegister,
  validateLogin,
  validateUpdateDetails,
  validateUpdatePassword,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors,
} from '../middleware/validation';
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimiter';

const router = express.Router();

// Rate-limited auth routes
router.post('/register', registerLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, login);
router.post('/google', loginLimiter, googleLogin);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validateUpdateDetails, handleValidationErrors, updateDetails);
router.put('/updatepassword', protect, validateUpdatePassword, handleValidationErrors, updatePassword);
router.put('/upload-profile-picture', protect, uploadProfilePicture);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', passwordResetLimiter, validateForgotPassword, handleValidationErrors, resendVerification);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, validateResetPassword, handleValidationErrors, resetPassword);

// Refresh token routes
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

// Session management routes
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

// Account management
router.post('/delete-account-request', protect, deleteAccountRequest);

// Two-factor authentication routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/2fa/status', protect, get2FAStatus);
router.post('/2fa/regenerate-backup', protect, regenerateBackupCodes);

export default router;
