import { Response } from 'express';
import mongoose from 'mongoose';
import SiteSettings from '../models/SiteSettings';
import { AuthRequest } from '../middleware/auth';
import ActivityLog from '../models/ActivityLog';

// @desc    Get stock display settings
// @route   GET /api/settings/stock
// @access  Public
export const getStockSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await SiteSettings.findById('global');

    if (!settings) {
      // Create default settings if they don't exist
      settings = await SiteSettings.create({ _id: 'global' });
    }

    res.status(200).json({
      success: true,
      data: {
        stockDisplayMode: settings.stockDisplayMode,
        defaultLowStockThreshold: settings.defaultLowStockThreshold,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update stock display settings
// @route   PUT /api/settings/stock
// @access  Private/Admin
export const updateStockSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { stockDisplayMode, defaultLowStockThreshold } = req.body;

    // Validate stockDisplayMode
    if (
      stockDisplayMode &&
      !['labels_only', 'exact_quantities'].includes(stockDisplayMode)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock display mode',
      });
    }

    // Validate defaultLowStockThreshold
    if (defaultLowStockThreshold !== undefined && defaultLowStockThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold cannot be negative',
      });
    }

    let settings = await SiteSettings.findById('global');

    if (!settings) {
      settings = await SiteSettings.create({
        _id: 'global',
        stockDisplayMode: stockDisplayMode || 'labels_only',
        defaultLowStockThreshold: defaultLowStockThreshold ?? 10,
        updatedBy: new mongoose.Types.ObjectId(req.user!.id),
      });
    } else {
      if (stockDisplayMode) {
        settings.stockDisplayMode = stockDisplayMode;
      }
      if (defaultLowStockThreshold !== undefined) {
        settings.defaultLowStockThreshold = defaultLowStockThreshold;
      }
      settings.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
      await settings.save();
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'SETTINGS_UPDATED',
        resourceType: 'settings',
        resourceId: 'stock',
        details: `Stock settings updated: displayMode=${settings.stockDisplayMode}, threshold=${settings.defaultLowStockThreshold}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      data: {
        stockDisplayMode: settings.stockDisplayMode,
        defaultLowStockThreshold: settings.defaultLowStockThreshold,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
