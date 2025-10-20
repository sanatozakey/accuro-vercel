import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPurchaseHistory extends Document {
  user: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  orderNumber: string;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'other';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  notes?: string;
  relatedQuote?: mongoose.Types.ObjectId; // Link to quote if order originated from a quote
  relatedBooking?: mongoose.Types.ObjectId; // Link to booking if applicable
  deliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseHistorySchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    transactionId: {
      type: String,
    },
    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: 'USA',
      },
    },
    billingAddress: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipCode: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'processing',
      index: true,
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
    relatedQuote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    deliveryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
PurchaseHistorySchema.index({ user: 1, createdAt: -1 });
PurchaseHistorySchema.index({ orderStatus: 1, createdAt: -1 });
PurchaseHistorySchema.index({ paymentStatus: 1, orderStatus: 1 });
PurchaseHistorySchema.index({ userEmail: 1 });
PurchaseHistorySchema.index({ 'items.productId': 1 });

export default mongoose.model<IPurchaseHistory>('PurchaseHistory', PurchaseHistorySchema);
