import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  getMyBookings,
} from '../controllers/bookingController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin'), getBookings)
  .post(createBooking);

router.get('/upcoming', getBookings); // Public endpoint for calendar view
router.get('/my', protect, getMyBookings);

router
  .route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('admin'), updateBooking)
  .delete(protect, authorize('admin'), deleteBooking);

export default router;
