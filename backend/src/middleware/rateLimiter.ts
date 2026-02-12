import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Custom key generator that uses IP + user agent for better identification
const getClientIdentifier = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.ip || req.socket.remoteAddress || 'unknown';
  return ip;
};

// Standard response for rate limit exceeded
const rateLimitResponse = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// Strict rate limiter for login attempts - prevent brute force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: Math.ceil(15 * 60), // seconds
    });
  },
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Rate limiter for registration - prevent mass account creation
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: 'Too many accounts created. Please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many accounts created from this IP. Please try again after an hour.',
      retryAfter: Math.ceil(60 * 60),
    });
  },
});

// Rate limiter for password reset - prevent enumeration
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset attempts. Please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again later.',
      retryAfter: Math.ceil(60 * 60),
    });
  },
});

// Rate limiter for contact form - prevent spam
export const contactFormLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 submissions per day
  message: 'Too many contact submissions. Please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many contact form submissions. Please try again tomorrow.',
      retryAfter: Math.ceil(24 * 60 * 60),
    });
  },
});

// Rate limiter for quote requests
export const quoteRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 quote requests per hour
  message: 'Too many quote requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: rateLimitResponse,
});

// Rate limiter for booking creation
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bookings per hour
  message: 'Too many booking requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: rateLimitResponse,
});

// General API rate limiter - applies to all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: rateLimitResponse,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// Strict rate limiter for sensitive operations (delete, bulk actions)
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 sensitive operations per hour
  message: 'Too many sensitive operations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: rateLimitResponse,
});

// Analytics tracking rate limiter (public endpoint)
export const analyticsTrackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 events per minute
  message: 'Too many tracking events.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded for analytics tracking.',
    });
  },
});

export default {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  contactFormLimiter,
  quoteRequestLimiter,
  bookingLimiter,
  generalLimiter,
  sensitiveOperationLimiter,
  analyticsTrackLimiter,
};
