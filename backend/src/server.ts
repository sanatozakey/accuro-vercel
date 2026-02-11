import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { seedAdminUser } from './utils/seedAdmin';
import { corsConfig } from './config/cors';
import { createIndexes } from './config/indexes';
import { socketService } from './services/socketService';
import { generalLimiter } from './middleware/rateLimiter';

// Load env vars
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import quoteRoutes from './routes/quoteRoutes';
import contactRoutes from './routes/contactRoutes';
import userRoutes from './routes/userRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import reviewRoutes from './routes/reviewRoutes';
import activityLogRoutes from './routes/activityLogRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import purchaseHistoryRoutes from './routes/purchaseHistoryRoutes';
import userHistoryRoutes from './routes/userHistoryRoutes';
import reportRoutes from './routes/reportRoutes';
import activeSessionRoutes from './routes/activeSessionRoutes';
import productRoutes from './routes/productRoutes';
import settingsRoutes from './routes/settingsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import googleCalendarRoutes from './routes/googleCalendarRoutes';
import completionProofRoutes from './routes/completionProofRoutes';
import emailRoutes from './routes/emailRoutes';
import rateLimitRoutes from './routes/rateLimitRoutes';

// Initialize app
const app: Application = express();

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io with CORS origins
const corsOrigins = corsConfig.origin as string[];
socketService.initialize(httpServer, corsOrigins);

// Connect to database
connectDB().then(async () => {
  // Seed admin user after DB connection
  await seedAdminUser();

  // Create database indexes for optimal performance
  await createIndexes();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use(cors(corsConfig));

// Security headers middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for images
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://api.cloudinary.com'],
    },
  },
}));

// General rate limiting (applies to all routes)
app.use(generalLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/purchases', purchaseHistoryRoutes);
app.use('/api/user-history', userHistoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sessions', activeSessionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/completion-proofs', completionProofRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/rate-limits', rateLimitRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Accuro Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 Accuro Backend Server Running           ║
║                                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Port: ${PORT}                                   ║
║   MongoDB: Connected                         ║
║   Socket.io: Enabled                         ║
║                                              ║
║   API Endpoints:                             ║
║   - Health:   GET  /api/health               ║
║   - Auth:     POST /api/auth/register        ║
║   - Auth:     POST /api/auth/login           ║
║   - Bookings: GET  /api/bookings             ║
║   - Quotes:   GET  /api/quotes               ║
║   - Contacts: POST /api/contacts             ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;
