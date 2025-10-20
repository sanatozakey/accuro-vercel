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

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin', 'superadmin'), getQuotes)
  .post(createQuote);

router.route('/my').get(protect, getMyQuotes);

router
  .route('/:id')
  .get(protect, getQuote)
  .put(protect, authorize('admin', 'superadmin'), updateQuote)
  .delete(protect, authorize('admin', 'superadmin'), deleteQuote);

export default router;
