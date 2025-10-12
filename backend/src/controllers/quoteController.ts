import { Request, Response } from 'express';
import Quote from '../models/Quote';
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
export const updateQuote = async (req: Request, res: Response) => {
  try {
    let quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private/Admin
export const deleteQuote = async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    await quote.deleteOne();

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
