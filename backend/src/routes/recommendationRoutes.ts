import express from 'express';
import {
  getRecommendations,
  recordInteraction,
} from '../controllers/recommendationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getRecommendations);
router.post('/interaction', protect, recordInteraction);

export default router;
