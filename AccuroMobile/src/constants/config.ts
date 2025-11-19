// App configuration constants
export const APP_CONFIG = {
  // App info
  APP_NAME: 'Accuro Mobile',
  APP_VERSION: '1.0.0',

  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Image upload
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],

  // Cache
  CACHE_EXPIRY: 5 * 60 * 1000, // 5 minutes

  // Session
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes

  // Booking
  BOOKING_TIME_SLOTS: [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30',
  ],

  // Currency
  DEFAULT_CURRENCY: 'PHP',
  SUPPORTED_CURRENCIES: ['PHP', 'USD'],
  EXCHANGE_RATE_USD_TO_PHP: 56.5,

  // Product categories
  PRODUCT_CATEGORIES: [
    'Calibration Software',
    'Field Calibrators',
    'Workshop Calibrators',
    'Temperature Calibration',
    'Pressure Generation',
    'Accessories',
  ],

  // Notification types
  NOTIFICATION_TYPES: {
    BOOKING: 'booking',
    QUOTATION: 'quotation',
    SYSTEM: 'system',
    ADMIN_MESSAGE: 'admin_message',
  },

  // Booking statuses
  BOOKING_STATUSES: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
  },

  // Quotation statuses
  QUOTATION_STATUSES: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // User roles
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'superadmin',
  },
};

export default APP_CONFIG;
