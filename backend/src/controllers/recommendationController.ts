import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import recommendationService from '../services/recommendationService';

// @desc    Get personalized recommendations for current user
// @route   GET /api/recommendations
// @access  Private
export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const recommendations = await recommendationService.getRecommendations(
      req.user!._id.toString(),
      limit
    );

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Record a product interaction
// @route   POST /api/recommendations/interaction
// @access  Private
export const recordInteraction = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, interactionType, metadata } = req.body;

    if (!productId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and interaction type are required',
      });
    }

    if (!['view', 'booking', 'inquiry', 'purchase'].includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction type',
      });
    }

    await recommendationService.recordInteraction(
      req.user!._id.toString(),
      productId,
      interactionType,
      metadata
    );

    res.status(200).json({
      success: true,
      message: 'Interaction recorded successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
