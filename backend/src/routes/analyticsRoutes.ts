import express from 'express';
import {
  getProductAnalytics,
  getLocationAnalytics,
  getDashboardAnalytics,
  getProductViewsAnalytics,
  getProductViewDetails,
  getCartAnalytics,
  getCartDetails,
  getQuoteAnalytics,
  getQuoteDetails,
  getContactAnalytics,
  getContactDetails,
  getRegistrationAnalytics,
  getRegistrationDetails,
  getSearchAnalytics,
  getSearchDetails,
  trackEvent,
} from '../controllers/analyticsController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

// Public route for tracking events (optional auth)
router.post('/track', trackEvent);

// All other routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

// Dashboard and legacy routes
router.get('/dashboard', getDashboardAnalytics);
router.get('/products', getProductAnalytics);
router.get('/locations', getLocationAnalytics);

// Product views analytics
router.get('/product-views', getProductViewsAnalytics);
router.get('/product-views/details', getProductViewDetails);

// Cart analytics
router.get('/cart', getCartAnalytics);
router.get('/cart/details', getCartDetails);

// Quote analytics
router.get('/quotes', getQuoteAnalytics);
router.get('/quotes/details', getQuoteDetails);

// Contact form analytics
router.get('/contacts', getContactAnalytics);
router.get('/contacts/details', getContactDetails);

// User registration analytics
router.get('/registrations', getRegistrationAnalytics);
router.get('/registrations/details', getRegistrationDetails);

// Search analytics
router.get('/searches', getSearchAnalytics);
router.get('/searches/details', getSearchDetails);

export default router;
