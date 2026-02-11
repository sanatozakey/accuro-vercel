import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Rate limit configuration (matches rateLimiter.ts)
const RATE_LIMIT_CONFIG = {
  login: {
    name: 'Login',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    description: 'Maximum 5 login attempts per 15 minutes (successful logins excluded)',
  },
  register: {
    name: 'Registration',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    description: 'Maximum 5 registration attempts per hour',
  },
  passwordReset: {
    name: 'Password Reset',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    description: 'Maximum 3 password reset requests per hour',
  },
  contactForm: {
    name: 'Contact Form',
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5,
    description: 'Maximum 5 contact form submissions per day',
  },
  booking: {
    name: 'Booking',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    description: 'Maximum 10 booking requests per hour',
  },
  quoteRequest: {
    name: 'Quote Request',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    description: 'Maximum 5 quote requests per hour',
  },
  general: {
    name: 'General API',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    description: 'Maximum 100 requests per 15 minutes across all endpoints',
  },
};

// @desc    Get rate limit configuration
// @route   GET /api/rate-limits/config
// @access  Private/Admin
export const getRateLimitConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = Object.entries(RATE_LIMIT_CONFIG).map(([key, value]) => ({
      id: key,
      ...value,
      windowMinutes: Math.round(value.windowMs / 60000),
      windowFormatted: formatWindow(value.windowMs),
    }));

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Helper to format window duration
function formatWindow(ms: number): string {
  const minutes = ms / 60000;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = hours / 24;
  return `${days} day${days !== 1 ? 's' : ''}`;
}
