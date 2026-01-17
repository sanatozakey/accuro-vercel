import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  image?: string;
  beamexUrl?: string;
  features?: string[];
  priceRange?: string;
  priceRangeUSD?: string;
  estimatedPrice?: number;
  estimatedPriceUSD?: number;
  specifications?: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  // Inventory fields
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name must not exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description must not exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [100, 'Category must not exceed 100 characters'],
    },
    image: {
      type: String,
      trim: true,
    },
    beamexUrl: {
      type: String,
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    priceRange: {
      type: String,
      trim: true,
    },
    priceRangeUSD: {
      type: String,
      trim: true,
    },
    estimatedPrice: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    estimatedPriceUSD: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    // Inventory fields
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    trackInventory: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ stockQuantity: 1, trackInventory: 1 }); // For stock filtering

export default mongoose.model<IProduct>('Product', ProductSchema);
