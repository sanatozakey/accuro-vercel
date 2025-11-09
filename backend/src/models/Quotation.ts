import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotationItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  specifications?: string;
}

export interface IQuotation extends Document {
  quotationNumber: string;
  userId: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;

  items: IQuotationItem[];
  additionalRequirements?: string;

  status: 'pending' | 'approved' | 'rejected' | 'expired';

  // Admin fields (filled when approved)
  validUntil?: Date;
  totalAmount?: number;
  currency: 'PHP' | 'USD';
  paymentTerms?: string;
  deliveryTerms?: string;
  adminNotes?: string;
  termsAndConditions?: string;

  // PDF
  pdfUrl?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true, trim: true },
  productImage: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, min: 0 },
  totalPrice: { type: Number, min: 0 },
  specifications: { type: String, trim: true, maxlength: 1000 },
});

const QuotationSchema = new Schema<IQuotation>(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    items: {
      type: [QuotationItemSchema],
      required: true,
      validate: {
        validator: (items: IQuotationItem[]) => items.length > 0,
        message: 'At least one item is required',
      },
    },
    additionalRequirements: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    validUntil: {
      type: Date,
    },
    totalAmount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['PHP', 'USD'],
      default: 'PHP',
    },
    paymentTerms: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    deliveryTerms: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    termsAndConditions: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
QuotationSchema.index({ userId: 1, createdAt: -1 });
QuotationSchema.index({ status: 1, createdAt: -1 });
QuotationSchema.index({ quotationNumber: 1 });

// Auto-generate quotation number before saving
QuotationSchema.pre('save', async function (next) {
  if (this.isNew && !this.quotationNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Quotation').countDocuments({
      quotationNumber: new RegExp(`^QT-${year}-`),
    });
    this.quotationNumber = `QT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);
