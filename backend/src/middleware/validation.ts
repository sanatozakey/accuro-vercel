import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
      })),
    });
  }
  next();
};

// Password strength validation helper
const passwordValidation = () =>
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)
    .withMessage('Password contains invalid characters');

// Email validation helper
const emailValidation = () =>
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim();

// Phone validation helper (Philippine format)
const phoneValidation = () =>
  body('phone')
    .optional()
    .matches(/^(\+63|0)[0-9]{10}$/)
    .withMessage('Phone number must be in valid Philippine format (+639XXXXXXXXX or 09XXXXXXXXX)');

// Name validation helper
const nameValidation = () =>
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes');

// ==================== AUTH VALIDATIONS ====================

export const validateRegister: ValidationChain[] = [
  nameValidation(),
  emailValidation(),
  passwordValidation(),
  phoneValidation(),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name must not exceed 200 characters'),
];

export const validateLogin: ValidationChain[] = [
  emailValidation(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateForgotPassword: ValidationChain[] = [
  emailValidation(),
];

export const validateResetPassword: ValidationChain[] = [
  passwordValidation(),
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
];

export const validateUpdatePassword: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

export const validateUpdateDetails: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  phoneValidation(),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name must not exceed 200 characters'),
  body('profilePicture')
    .optional()
    .custom((value) => {
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Invalid image format');
      }
      if (value && value.length > 4 * 1024 * 1024) {
        throw new Error('Image size too large (max 3MB)');
      }
      return true;
    }),
];

// ==================== BOOKING VALIDATIONS ====================

export const validateCreateBooking: ValidationChain[] = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (use HH:MM)'),
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('contactName')
    .trim()
    .notEmpty()
    .withMessage('Contact name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact name must be between 2 and 100 characters'),
  body('contactEmail')
    .isEmail()
    .withMessage('Please provide a valid contact email')
    .normalizeEmail()
    .trim(),
  body('contactPhone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone is required'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Meeting purpose is required'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Meeting location is required')
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('product')
    .trim()
    .notEmpty()
    .withMessage('Product/service of interest is required'),
  body('additionalInfo')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Additional information must not exceed 2000 characters'),
];

export const validateUpdateBooking: ValidationChain[] = [
  body('preferredDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('preferredTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (use HH:MM)'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
];

// ==================== PRODUCT VALIDATIONS ====================

export const validateCreateProduct: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['calibration', 'consulting', 'training', 'inspection'])
    .withMessage('Invalid category'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must not exceed 100 characters'),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'archived'])
    .withMessage('Invalid status value'),
];

export const validateUpdateProduct: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .optional()
    .trim()
    .isIn(['calibration', 'consulting', 'training', 'inspection'])
    .withMessage('Invalid category'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must not exceed 100 characters'),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'archived'])
    .withMessage('Invalid status value'),
];

// ==================== REVIEW VALIDATIONS ====================

export const validateCreateReview: ValidationChain[] = [
  body('bookingId')
    .optional()
    .isMongoId()
    .withMessage('Invalid booking ID format'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  body('reviewType')
    .optional()
    .isIn(['booking', 'general'])
    .withMessage('Review type must be either "booking" or "general"'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

// ==================== CONTACT FORM VALIDATIONS ====================

export const validateContactForm: ValidationChain[] = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  emailValidation(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Message must be between 20 and 2000 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name must not exceed 200 characters'),
];

// ==================== ID PARAM VALIDATIONS ====================

export const validateMongoId = (paramName: string = 'id'): ValidationChain[] => [
  body(paramName)
    .optional()
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
];
