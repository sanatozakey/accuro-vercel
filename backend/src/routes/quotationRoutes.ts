import express from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  approveQuotation,
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

// Admin-only routes (static paths must come before /:id param route)
router.get('/stats/overview', adminOnly, getQuotationStats);
router.get('/:id', getQuotationById);
router.put('/:id', adminOnly, updateQuotation);
router.put('/:id/approve', adminOnly, approveQuotation);
router.put('/:id/reject', adminOnly, rejectQuotation);
router.delete('/:id', adminOnly, deleteQuotation);

export default router;
