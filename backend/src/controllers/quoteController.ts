import { Request, Response } from 'express';
import Quote from '../models/Quote';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private/Admin
export const getQuotes = async (req: Request, res: Response) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single quote
// @route   GET /api/quotes/:id
// @access  Private
export const getQuote = async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create quote request
// @route   POST /api/quotes
// @access  Public
export const createQuote = async (req: AuthRequest, res: Response) => {
  try {
    // Add user to req.body if authenticated
    if (req.user) {
      req.body.userId = req.user._id;
    }

    const quote = await Quote.create(req.body);

    // Log activity if user is authenticated
    if (req.user) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'QUOTE_CREATED',
          resourceType: 'quote',
          resourceId: quote._id.toString(),
          details: `Quote request created for ${quote.company} - ${quote.items.length} items, Total: $${quote.totalEstimatedPrice}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update quote
// @route   PUT /api/quotes/:id
// @access  Private/Admin
export const updateQuote = async (req: AuthRequest, res: Response) => {
  try {
    let quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    const originalStatus = quote.status;
    quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Log activity (assume admin is making the update)
    if (req.user) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'QUOTE_UPDATED',
          resourceType: 'quote',
          resourceId: quote!._id.toString(),
          details: `Quote updated for ${quote!.company}. Status: ${originalStatus} → ${quote!.status}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's quotes
// @route   GET /api/quotes/my
// @access  Private
export const getMyQuotes = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const quotes = await Quote.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private/Admin
export const deleteQuote = async (req: AuthRequest, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    await quote.deleteOne();

    // Log activity (assume admin is deleting)
    if (req.user) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'QUOTE_DELETED',
          resourceType: 'quote',
          resourceId: quote._id.toString(),
          details: `Quote deleted for ${quote.company} (Total: $${quote.totalEstimatedPrice})`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
