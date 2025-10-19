import express from 'express';
import {
  createReview,
  getPublicReviews,
  getAllReviews,
  approveReview,
  deleteReview,
  getMyReviews,
} from '../controllers/reviewController';
import { protect, adminOnly } from '../middleware/auth';
import {
  validateCreateReview,
  handleValidationErrors,
} from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/', getPublicReviews);

// Protected routes (requires authentication)
router.post('/', protect, validateCreateReview, handleValidationErrors, createReview);
router.get('/my-reviews', protect, getMyReviews);

// Admin routes
router.get('/admin', protect, adminOnly, getAllReviews);
router.put('/:id/approve', protect, adminOnly, approveReview);
router.delete('/:id', protect, adminOnly, deleteReview);

export default router;
