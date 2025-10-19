import express from 'express';
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  verifyEmail,
  resendVerification,
  uploadProfilePicture,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
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

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validateUpdateDetails, handleValidationErrors, updateDetails);
router.put('/updatepassword', protect, validateUpdatePassword, handleValidationErrors, updatePassword);
router.put('/upload-profile-picture', protect, uploadProfilePicture);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', validateForgotPassword, handleValidationErrors, resendVerification);
router.post('/forgot-password', validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, handleValidationErrors, resetPassword);

export default router;
