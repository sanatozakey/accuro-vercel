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
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/upload-profile-picture', protect, uploadProfilePicture);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

export default router;
