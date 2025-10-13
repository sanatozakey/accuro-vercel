import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
  completeBooking,
  checkAvailability,
} from '../controllers/bookingController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin'), getBookings)
  .post(protect, createBooking); // Require authentication to track user bookings

router.get('/upcoming', getBookings); // Public endpoint for calendar view
router.get('/check-availability', checkAvailability); // Public endpoint to check slot availability
router.get('/my', protect, getMyBookings);

router
  .route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('admin'), updateBooking)
  .delete(protect, authorize('admin'), deleteBooking);

// New booking action routes
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reschedule', protect, rescheduleBooking);
router.put('/:id/complete', protect, authorize('admin'), completeBooking);

export default router;
