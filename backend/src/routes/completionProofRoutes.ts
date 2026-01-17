import express from 'express';
import {
  createCompletionProof,
  getCompletionProof,
  getCompletionProofByBooking,
  updateCompletionProof,
  deleteAttachment,
  getAllCompletionProofs,
} from '../controllers/completionProofController';
import { protect, authorize } from '../middleware/auth';
import { proofUpload } from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all completion proofs (admin only)
router.get('/', authorize('admin'), getAllCompletionProofs);

// Create completion proof with file uploads (admin only)
router.post(
  '/',
  authorize('admin'),
  proofUpload.array('attachments', 5),
  createCompletionProof
);

// Get completion proof by booking ID
router.get('/booking/:bookingId', getCompletionProofByBooking);

// Get single completion proof
router.get('/:id', getCompletionProof);

// Update completion proof (admin only)
router.put(
  '/:id',
  authorize('admin'),
  proofUpload.array('attachments', 5),
  updateCompletionProof
);

// Delete attachment from proof (admin only)
router.delete('/:id/attachments/:filename', authorize('admin'), deleteAttachment);

export default router;
