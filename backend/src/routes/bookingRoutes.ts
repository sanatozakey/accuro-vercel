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
  confirmAndDispatch,
  reassignTechnician,
  startBooking,
  getMyAssignments,
  checkTechnicianAvailability,
  updateFeeStatus,
  submitFeeProof,
  serveFeeProof,
  resendFeeReceipt,
} from '../controllers/bookingController';
import { protect, authorize, technicianOrAbove, superAdminOnly } from '../middleware/auth';
import {
  validateCreateBooking,
  validateUpdateBooking,
  handleValidationErrors,
} from '../middleware/validation';
import { bookingLimiter } from '../middleware/rateLimiter';
import { proofUploadMemory } from '../middleware/upload';

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin', 'superadmin'), getBookings)
  .post(protect, bookingLimiter, validateCreateBooking, handleValidationErrors, createBooking);

router.get('/upcoming', getBookings); // Public endpoint for calendar view
router.get('/check-availability', checkAvailability); // Public endpoint to check slot availability
router.get('/my', protect, getMyBookings);

// Technician assignment routes (must be before /:id)
router.get('/my-assignments', protect, technicianOrAbove, getMyAssignments);
router.get('/technician-availability', protect, superAdminOnly, checkTechnicianAvailability);

router
  .route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('admin', 'superadmin'), validateUpdateBooking, handleValidationErrors, updateBooking)
  .delete(protect, authorize('admin', 'superadmin'), deleteBooking);

// Booking action routes
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reschedule', protect, validateUpdateBooking, handleValidationErrors, rescheduleBooking);
router.put('/:id/complete', protect, authorize('admin', 'superadmin'), completeBooking);

// Dispatch routes (superadmin only)
router.put('/:id/confirm-dispatch', protect, superAdminOnly, confirmAndDispatch);
router.put('/:id/reassign', protect, superAdminOnly, reassignTechnician);

// Technician action routes
router.put('/:id/start', protect, technicianOrAbove, startBooking);

// Fee management
router.put('/:id/fee-status', protect, authorize('admin', 'superadmin'), updateFeeStatus);
router.post('/:id/fee-proof', protect, proofUploadMemory.single('receipt'), submitFeeProof);
router.get('/:id/fee-proof', serveFeeProof);
router.post('/:id/resend-fee-receipt', protect, authorize('admin', 'superadmin'), resendFeeReceipt);

export default router;
