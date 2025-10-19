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
import {
  validateCreateBooking,
  validateUpdateBooking,
  handleValidationErrors,
} from '../middleware/validation';

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin'), getBookings)
  .post(protect, validateCreateBooking, handleValidationErrors, createBooking);

router.get('/upcoming', getBookings); // Public endpoint for calendar view
router.get('/check-availability', checkAvailability); // Public endpoint to check slot availability
router.get('/my', protect, getMyBookings);

router
  .route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('admin'), validateUpdateBooking, handleValidationErrors, updateBooking)
  .delete(protect, authorize('admin'), deleteBooking);

// New booking action routes
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reschedule', protect, validateUpdateBooking, handleValidationErrors, rescheduleBooking);
router.put('/:id/complete', protect, authorize('admin'), completeBooking);

export default router;
