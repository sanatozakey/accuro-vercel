import express from 'express';
import {
  getTransactionProofByBooking,
  getPendingTransactionProofs,
  getAllTransactionProofs,
  submitPaymentProof,
  approveTransactionProof,
  rejectTransactionProof,
  reviseTransactionProof,
  adjustTransactionItems,
  serveAttachment,
} from '../controllers/transactionProofController';
import { protect, authorize } from '../middleware/auth';
import { proofUploadMemory } from '../middleware/upload';

const router = express.Router();

// Serve attachment file from MongoDB (public — browser loads directly)
router.get('/attachment/:proofId/:filename', serveAttachment);

// All remaining routes require authentication
router.use(protect);

// Get all transaction proofs (admin/superadmin)
router.get('/', authorize('admin', 'superadmin'), getAllTransactionProofs);

// Get pending review proofs (superadmin)
router.get('/pending-review', authorize('superadmin'), getPendingTransactionProofs);

// Get transaction proof by booking ID
router.get('/booking/:bookingId', getTransactionProofByBooking);

// Customer submits payment proof with file uploads
router.post(
  '/:id/submit',
  proofUploadMemory.array('attachments', 5),
  submitPaymentProof
);

// Superadmin approves
router.put('/:id/approve', authorize('superadmin'), approveTransactionProof);

// Superadmin rejects
router.put('/:id/reject', authorize('superadmin'), rejectTransactionProof);

// Customer revises after rejection
router.put(
  '/:id/revise',
  proofUploadMemory.array('attachments', 5),
  reviseTransactionProof
);

// Admin adjusts items/quantities
router.put('/:id/adjust-items', authorize('admin', 'superadmin'), adjustTransactionItems);

export default router;
