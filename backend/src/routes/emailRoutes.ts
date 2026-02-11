import express from 'express';
import { sendBulkEmail, previewRecipients } from '../controllers/emailController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.post('/bulk', sendBulkEmail);
router.get('/preview-recipients', previewRecipients);

export default router;
