import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import {
  getStockSettings,
  updateStockSettings,
} from '../controllers/settingsController';

const router = express.Router();

// Stock settings routes
router.get('/stock', getStockSettings);
router.put('/stock', protect, adminOnly, updateStockSettings);

export default router;
