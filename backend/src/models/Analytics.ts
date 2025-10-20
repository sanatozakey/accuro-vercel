import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  eventType: 'product_view' | 'cart_add' | 'cart_remove' | 'quote_request' | 'contact_form' | 'user_registration' | 'search' | 'booking_created';
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  productId?: string;
  productName?: string;
  category?: string;
  searchTerm?: string;
  metadata?: {
    referenceId?: string; // Booking ID, Quote ID, Contact ID, etc.
    quantity?: number;
    price?: number;
    location?: string;
    device?: string;
    browser?: string;
    ip?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema: Schema = new Schema(
  {
    eventType: {
      type: String,
      enum: [
        'product_view',
        'cart_add',
        'cart_remove',
        'quote_request',
        'contact_form',
        'user_registration',
        'search',
        'booking_created',
      ],
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    productId: {
      type: String,
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    searchTerm: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
AnalyticsSchema.index({ eventType: 1, createdAt: -1 });
AnalyticsSchema.index({ userId: 1, createdAt: -1 });
AnalyticsSchema.index({ productId: 1, createdAt: -1 });
AnalyticsSchema.index({ createdAt: -1 });
AnalyticsSchema.index({ eventType: 1, productId: 1 });

export default mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
