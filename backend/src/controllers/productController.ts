import { Request, Response } from 'express';
import Product from '../models/Product';
import SiteSettings from '../models/SiteSettings';
import { AuthRequest } from '../middleware/auth';
import ActivityLog from '../models/ActivityLog';
import { getStockStatus, getStockLabel, prepareProductWithStock } from '../utils/stockUtils';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, status, search, limit, page } = req.query;

    let query: any = {};

    // Filter by category
    if (category && category !== 'All Products') {
      query.category = category;
    }

    // Filter by status (default to active for public)
    // If status is explicitly provided (even as empty string), use it; otherwise default to active
    if (status !== undefined && status !== '') {
      query.status = status;
    } else if (status === undefined) {
      query.status = 'active'; // Only show active products by default for public
    }
    // If status is empty string, don't filter by status (for admin to see all)

    // Search by name or description
    if (search) {
      query.$text = { $search: search as string };
    }

    // Pagination
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 100;
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNumber)
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      image,
      beamexUrl,
      features,
      priceRange,
      priceRangeUSD,
      estimatedPrice,
      estimatedPriceUSD,
      specifications,
      status,
    } = req.body;

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists',
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      image,
      beamexUrl,
      features,
      priceRange,
      priceRangeUSD,
      estimatedPrice,
      estimatedPriceUSD,
      specifications,
      status: status || 'active',
    });

    // Log activity
    if (req.user && req.user._id) {
      try {
        await ActivityLog.create({
          userId: req.user._id,
          action: 'create_product',
          details: `Created product: ${name}`,
          metadata: {
            productId: product._id,
            productName: name,
          },
        });
      } catch (logError) {
        console.error('Activity log creation failed:', logError);
        // Don't fail the request if activity log fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const {
      name,
      description,
      category,
      image,
      beamexUrl,
      features,
      priceRange,
      priceRangeUSD,
      estimatedPrice,
      estimatedPriceUSD,
      specifications,
      status,
    } = req.body;

    // If name is being changed, check if new name already exists
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'A product with this name already exists',
        });
      }
    }

    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (image !== undefined) product.image = image;
    if (beamexUrl !== undefined) product.beamexUrl = beamexUrl;
    if (features !== undefined) product.features = features;
    if (priceRange !== undefined) product.priceRange = priceRange;
    if (priceRangeUSD !== undefined) product.priceRangeUSD = priceRangeUSD;
    if (estimatedPrice !== undefined) product.estimatedPrice = estimatedPrice;
    if (estimatedPriceUSD !== undefined) product.estimatedPriceUSD = estimatedPriceUSD;
    if (specifications !== undefined) product.specifications = specifications;
    if (status !== undefined) product.status = status;

    await product.save();

    // Log activity
    if (req.user && req.user._id) {
      try {
        await ActivityLog.create({
          userId: req.user._id,
          action: 'update_product',
          details: `Updated product: ${product.name}`,
          metadata: {
            productId: product._id,
            productName: product.name,
          },
        });
      } catch (logError) {
        console.error('Activity log creation failed:', logError);
        // Don't fail the request if activity log fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    console.error('Product update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const productName = product.name;
    await product.deleteOne();

    // Log activity
    if (req.user && req.user._id) {
      try {
        await ActivityLog.create({
          userId: req.user._id,
          action: 'delete_product',
          details: `Deleted product: ${productName}`,
          metadata: {
            productName,
          },
        });
      } catch (logError) {
        console.error('Activity log creation failed:', logError);
        // Don't fail the request if activity log fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Product deletion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = [
      'Calibration Software',
      'Field Calibrators',
      'Workshop Calibrators',
      'Temperature Calibration',
      'Pressure Generation',
      'Accessories',
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Bulk import products
// @route   POST /api/products/bulk-import
// @access  Private/Admin
export const bulkImportProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required',
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const productData of products) {
      try {
        // Check if product already exists
        const existing = await Product.findOne({ name: productData.name });
        if (existing) {
          results.failed++;
          results.errors.push({
            product: productData.name,
            error: 'Product already exists',
          });
          continue;
        }

        await Product.create(productData);
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          product: productData.name || 'Unknown',
          error: error.message,
        });
      }
    }

    // Log activity
    if (req.user) {
      await ActivityLog.create({
        userId: req.user._id,
        action: 'bulk_import_products',
        details: `Bulk imported ${results.successful} products`,
        metadata: {
          successful: results.successful,
          failed: results.failed,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bulk import completed',
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
  },
  fileFilter: fileFilter,
});

// @desc    Upload product image
// @route   POST /api/products/upload-image
// @access  Private/Admin
export const uploadProductImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    // Generate URL for the uploaded file
    const imageUrl = `/uploads/products/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: req.file.filename,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
export const updateStock = async (req: AuthRequest, res: Response) => {
  try {
    const { stockQuantity, lowStockThreshold, trackInventory } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Update stock fields
    if (stockQuantity !== undefined) {
      if (stockQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock quantity cannot be negative',
        });
      }
      product.stockQuantity = stockQuantity;
    }

    if (lowStockThreshold !== undefined) {
      if (lowStockThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Low stock threshold cannot be negative',
        });
      }
      product.lowStockThreshold = lowStockThreshold;
    }

    if (trackInventory !== undefined) {
      product.trackInventory = trackInventory;
    }

    await product.save();

    // Log activity
    if (req.user) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'STOCK_UPDATED',
          resourceType: 'product',
          resourceId: product._id.toString(),
          details: `Stock updated for ${product.name}: qty=${product.stockQuantity}, threshold=${product.lowStockThreshold}, tracking=${product.trackInventory}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    // Calculate stock status
    const stockStatus = product.trackInventory
      ? getStockStatus(product.stockQuantity, product.lowStockThreshold)
      : null;

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        ...product.toObject(),
        stockStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Bulk update product stock
// @route   PUT /api/products/bulk-stock
// @access  Private/Admin
export const bulkUpdateStock = async (req: AuthRequest, res: Response) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required',
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const update of updates) {
      try {
        const { productId, stockQuantity, lowStockThreshold, trackInventory } = update;

        if (!productId) {
          results.failed++;
          results.errors.push({
            productId: 'unknown',
            error: 'Product ID is required',
          });
          continue;
        }

        const product = await Product.findById(productId);
        if (!product) {
          results.failed++;
          results.errors.push({
            productId,
            error: 'Product not found',
          });
          continue;
        }

        // Validate and update
        if (stockQuantity !== undefined) {
          if (stockQuantity < 0) {
            results.failed++;
            results.errors.push({
              productId,
              error: 'Stock quantity cannot be negative',
            });
            continue;
          }
          product.stockQuantity = stockQuantity;
        }

        if (lowStockThreshold !== undefined) {
          if (lowStockThreshold < 0) {
            results.failed++;
            results.errors.push({
              productId,
              error: 'Low stock threshold cannot be negative',
            });
            continue;
          }
          product.lowStockThreshold = lowStockThreshold;
        }

        if (trackInventory !== undefined) {
          product.trackInventory = trackInventory;
        }

        await product.save();
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          productId: update.productId || 'unknown',
          error: error.message,
        });
      }
    }

    // Log activity
    if (req.user) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'BULK_STOCK_UPDATED',
          resourceType: 'product',
          resourceId: 'bulk',
          details: `Bulk stock update: ${results.successful} successful, ${results.failed} failed`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk stock update completed',
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get products with stock info
// @route   GET /api/products/with-stock
// @access  Public
export const getProductsWithStock = async (req: Request, res: Response) => {
  try {
    const { category, status, search, limit, page, stockStatus } = req.query;

    // Get stock display settings
    let settings = await SiteSettings.findById('global');
    if (!settings) {
      settings = await SiteSettings.create({ _id: 'global' });
    }
    const showExactQuantity = settings.stockDisplayMode === 'exact_quantities';

    let query: any = {};

    // Filter by category
    if (category && category !== 'All Products') {
      query.category = category;
    }

    // Filter by status
    if (status !== undefined && status !== '') {
      query.status = status;
    } else if (status === undefined) {
      query.status = 'active';
    }

    // Filter by stock status
    if (stockStatus) {
      query.trackInventory = true;
      switch (stockStatus) {
        case 'out_of_stock':
          query.stockQuantity = { $lte: 0 };
          break;
        case 'low_stock':
          query.$expr = {
            $and: [
              { $gt: ['$stockQuantity', 0] },
              { $lte: ['$stockQuantity', '$lowStockThreshold'] },
            ],
          };
          break;
        case 'in_stock':
          query.$expr = { $gt: ['$stockQuantity', '$lowStockThreshold'] };
          break;
      }
    }

    // Search
    if (search) {
      query.$text = { $search: search as string };
    }

    // Pagination
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 100;
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNumber)
      .skip(skip);

    const total = await Product.countDocuments(query);

    // Add stock info to each product
    const productsWithStock = products.map((product) => {
      const productObj = product.toObject();
      return prepareProductWithStock(productObj, showExactQuantity);
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      stockDisplayMode: settings.stockDisplayMode,
      data: productsWithStock,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get low stock products (for admin dashboard)
// @route   GET /api/products/low-stock
// @access  Private/Admin
export const getLowStockProducts = async (req: AuthRequest, res: Response) => {
  try {
    // Show all products with low or zero stock for admin visibility
    // Either: stock is 0 (out of stock) OR stock is at/below threshold
    const products = await Product.find({
      status: 'active', // Only show active products
      $or: [
        { stockQuantity: 0 }, // Out of stock
        { $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } }, // Low stock
      ],
    }).sort({ stockQuantity: 1 });

    const productsWithStatus = products.map((product) => {
      const productObj = product.toObject();
      const status = getStockStatus(product.stockQuantity, product.lowStockThreshold);
      return {
        ...productObj,
        stockStatus: status,
        stockLabel: getStockLabel(status, product.stockQuantity, true),
      };
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: productsWithStatus,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
