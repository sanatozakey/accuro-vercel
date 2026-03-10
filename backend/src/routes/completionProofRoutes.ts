import express from 'express';
import {
  createCompletionProof,
  getCompletionProof,
  getCompletionProofByBooking,
  updateCompletionProof,
  deleteAttachment,
  getAllCompletionProofs,
  approveCompletionProof,
  rejectCompletionProof,
  reviseCompletionProof,
  getPendingReviewProofs,
} from '../controllers/completionProofController';
import { protect, authorize } from '../middleware/auth';
import { proofUpload } from '../middleware/upload';
import { validateCreateCompletionProof, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all completion proofs (admin only)
router.get('/', authorize('admin', 'superadmin'), getAllCompletionProofs);

// Get proofs pending review (superadmin only) - must be before /:id
router.get('/pending-review', authorize('superadmin'), getPendingReviewProofs);

// Create completion proof with file uploads (admin only)
router.post(
  '/',
  authorize('admin', 'superadmin'),
  proofUpload.array('attachments', 5),
  validateCreateCompletionProof,
  handleValidationErrors,
  createCompletionProof
);

// Get completion proof by booking ID
router.get('/booking/:bookingId', getCompletionProofByBooking);

// Get single completion proof
router.get('/:id', getCompletionProof);

// Update completion proof (admin only)
router.put(
  '/:id',
  authorize('admin', 'superadmin'),
  proofUpload.array('attachments', 5),
  updateCompletionProof
);

// Approve a completion proof (superadmin only)
router.put('/:id/approve', authorize('superadmin'), approveCompletionProof);

// Reject a completion proof (superadmin only)
router.put('/:id/reject', authorize('superadmin'), rejectCompletionProof);

// Revise a rejected completion proof (admin resubmits)
router.put(
  '/:id/revise',
  authorize('admin', 'superadmin'),
  proofUpload.array('attachments', 5),
  reviseCompletionProof
);

// Delete attachment from proof (admin only)
router.delete('/:id/attachments/:filename', authorize('admin', 'superadmin'), deleteAttachment);

export default router;
