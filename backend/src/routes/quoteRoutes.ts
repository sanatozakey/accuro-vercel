import express from 'express';
import {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
} from '../controllers/quoteController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin'), getQuotes)
  .post(createQuote);

router
  .route('/:id')
  .get(protect, getQuote)
  .put(protect, authorize('admin'), updateQuote)
  .delete(protect, authorize('admin'), deleteQuote);

export default router;
