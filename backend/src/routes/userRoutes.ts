import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
} from '../controllers/userController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/role', changeUserRole);
router.delete('/:id', deleteUser);

export default router;
