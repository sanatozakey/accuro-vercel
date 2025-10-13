import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/database';
import { errorHandler } from '../src/middleware/errorHandler';
import { seedAdminUser } from '../src/utils/seedAdmin';

// Load env vars
dotenv.config();

// Import routes
import authRoutes from '../src/routes/authRoutes';
import bookingRoutes from '../src/routes/bookingRoutes';
import quoteRoutes from '../src/routes/quoteRoutes';
import contactRoutes from '../src/routes/contactRoutes';
import userRoutes from '../src/routes/userRoutes';
import analyticsRoutes from '../src/routes/analyticsRoutes';
import reviewRoutes from '../src/routes/reviewRoutes';
import activityLogRoutes from '../src/routes/activityLogRoutes';

// Initialize app
const app: Application = express();

// Connect to database (with connection pooling for serverless)
let isConnected = false;
const initDB = async () => {
  if (!isConnected) {
    await connectDB();
    await seedAdminUser();
    isConnected = true;
  }
};

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - Simplified for Vercel
app.use(
  cors({
    origin: true, // Allow all origins in development, or use specific origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Additional CORS headers for Vercel
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize DB before handling requests
app.use(async (req: Request, res: Response, next) => {
  await initDB();
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Accuro Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Accuro Backend API',
    version: '1.0.0',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Export for Vercel serverless
export default app;

// Also export as handler for Vercel
module.exports = app;
