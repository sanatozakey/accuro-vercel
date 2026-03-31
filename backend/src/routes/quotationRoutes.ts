import express from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  sendQuote,
  acceptQuotation,
  declineQuotation,
  rejectQuotation,
  deleteQuotation,
  getQuotationStats,
} from '../controllers/quotationController';
import { protect, adminOnly } from '../middleware/auth';
import { validateCreateQuotation, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', validateCreateQuotation, handleValidationErrors, createQuotation);
router.get('/', getQuotations);

// Customer approval/decline routes
router.put('/:id/accept', acceptQuotation);
router.put('/:id/decline', declineQuotation);

// Admin-only routes (static paths must come before /:id param route)
router.get('/stats/overview', adminOnly, getQuotationStats);
router.get('/:id', getQuotationById);
router.put('/:id', adminOnly, updateQuotation);
router.put('/:id/send-quote', adminOnly, sendQuote);
router.put('/:id/reject', adminOnly, rejectQuotation);
router.delete('/:id', adminOnly, deleteQuotation);

export default router;
