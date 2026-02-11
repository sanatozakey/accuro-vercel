import express from 'express';
import {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  getMyQuotes,
} from '../controllers/quoteController';
import { protect, authorize } from '../middleware/auth';
import { validateCreateQuote, handleValidationErrors } from '../middleware/validation';
import { quoteRequestLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin', 'superadmin'), getQuotes)
  .post(quoteRequestLimiter, validateCreateQuote, handleValidationErrors, createQuote);

router.route('/my').get(protect, getMyQuotes);

router
  .route('/:id')
  .get(protect, getQuote)
  .put(protect, authorize('admin', 'superadmin'), updateQuote)
  .delete(protect, authorize('admin', 'superadmin'), deleteQuote);

export default router;
