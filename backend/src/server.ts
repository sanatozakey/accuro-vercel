import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { seedAdminUser } from './utils/seedAdmin';
import { corsConfig } from './config/cors';
import { createIndexes } from './config/indexes';

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

// Initialize app
const app: Application = express();

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

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 Accuro Backend Server Running           ║
║                                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Port: ${PORT}                                   ║
║   MongoDB: Connected                         ║
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
