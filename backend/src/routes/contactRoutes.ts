import express from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contactController';
import { protect, authorize } from '../middleware/auth';
import {
  validateContactForm,
  handleValidationErrors,
} from '../middleware/validation';

const router = express.Router();

router.route('/').get(protect, authorize('admin', 'superadmin'), getContacts).post(validateContactForm, handleValidationErrors, createContact);

router
  .route('/:id')
  .get(protect, authorize('admin', 'superadmin'), getContact)
  .put(protect, authorize('admin', 'superadmin'), updateContact)
  .delete(protect, authorize('admin', 'superadmin'), deleteContact);

export default router;
