import express from 'express';
import reportController from '../controllers/reportController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// Protect all routes - admin only
router.use(protect);
router.use(adminOnly);

// Generate reports
router.post('/user-activity', reportController.generateUserActivityReport);
router.post('/sales-booking', reportController.generateSalesBookingReport);
router.post('/product-performance', reportController.generateProductPerformanceReport);
router.post('/quote-request', reportController.generateQuoteRequestReport);
router.post('/contact-form', reportController.generateContactFormReport);

// Get all reports
router.get('/', reportController.getAllReports);

// Get report by ID
router.get('/:reportId', reportController.getReportById);

// Delete report
router.delete('/:reportId', reportController.deleteReport);

// Export report to PDF
router.get('/:reportId/export-pdf', reportController.exportReportToPDF);

export default router;
