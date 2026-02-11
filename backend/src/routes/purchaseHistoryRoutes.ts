import express from 'express';
import {
  getAllPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  getMyPurchases,
  cancelPurchase,
} from '../controllers/purchaseHistoryController';
import { protect, authorize } from '../middleware/auth';
import { validateCreatePurchase, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Public/User routes
router.route('/my-purchases').get(protect, getMyPurchases);
router.route('/').post(protect, validateCreatePurchase, handleValidationErrors, createPurchase);
router.route('/:id').get(protect, getPurchase);
router.route('/:id/cancel').put(protect, cancelPurchase);

// Admin routes
router.route('/').get(protect, authorize('admin', 'superadmin'), getAllPurchases);
router.route('/:id').put(protect, authorize('admin', 'superadmin'), updatePurchase);

export default router;
