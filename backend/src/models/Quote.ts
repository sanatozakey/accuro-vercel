import mongoose, { Schema, Document } from 'mongoose';

export interface IQuoteItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
}

export interface IQuote extends Document {
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  items: IQuoteItem[];
  totalEstimatedPrice: number;
  message?: string;
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: {
      type: String,
      required: [true, 'Please provide a customer name'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Please provide a customer email'],
      lowercase: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Please provide a customer phone'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        estimatedPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalEstimatedPrice: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'accepted', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
QuoteSchema.index({ userId: 1, createdAt: -1 });
QuoteSchema.index({ customerEmail: 1 });
QuoteSchema.index({ status: 1, createdAt: -1 });
QuoteSchema.index({ 'items.productId': 1 });

export default mongoose.model<IQuote>('Quote', QuoteSchema);
