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

const router = express.Router();

// Public/User routes
router.route('/my-purchases').get(protect, getMyPurchases);
router.route('/').post(protect, createPurchase);
router.route('/:id').get(protect, getPurchase);
router.route('/:id/cancel').put(protect, cancelPurchase);

// Admin routes
router.route('/').get(protect, authorize('admin', 'superadmin'), getAllPurchases);
router.route('/:id').put(protect, authorize('admin', 'superadmin'), updatePurchase);

export default router;
