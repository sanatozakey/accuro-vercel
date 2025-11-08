import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  bulkImportProducts,
  uploadProductImage,
  upload,
} from '../controllers/productController';
import { protect, adminOnly } from '../middleware/auth';
import {
  validateCreateProduct,
  validateUpdateProduct,
  handleValidationErrors,
} from '../middleware/validation';

const router = express.Router();

// Public routes - specific paths MUST come before parameterized paths
router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected admin routes - specific paths MUST come before parameterized paths
// Image upload route
router.post(
  '/upload-image',
  protect,
  adminOnly,
  upload.single('image'),
  uploadProductImage
);

// Bulk import route
router.post('/bulk/import', protect, adminOnly, bulkImportProducts);

router.post(
  '/',
  protect,
  adminOnly,
  validateCreateProduct,
  handleValidationErrors,
  createProduct
);

router.put(
  '/:id',
  protect,
  adminOnly,
  validateUpdateProduct,
  handleValidationErrors,
  updateProduct
);

router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
