import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ITransactionAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  fileData?: Buffer;
  uploadedAt: Date;
}

export interface ITransactionRevisionEntry {
  attachments: ITransactionAttachment[];
  customerNotes?: string;
  rejectionFeedback: string;
  revisedAt: Date;
  revisedBy: mongoose.Types.ObjectId;
}

export type TransactionProofStatus = 'pending_upload' | 'pending_review' | 'approved' | 'rejected';

export interface ITransactionProof extends Document {
  bookingId: mongoose.Types.ObjectId;
  quotationId: mongoose.Types.ObjectId;
  items: ITransactionItem[];
  totalAmount: number;
  currency: 'PHP' | 'USD';
  attachments: ITransactionAttachment[];
  customerNotes?: string;
  status: TransactionProofStatus;
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewFeedback?: string;
  revisionHistory: ITransactionRevisionEntry[];
  inventoryDeducted: boolean;
  inventoryDeductedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionProofSchema: Schema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation',
      required: [true, 'Quotation ID is required'],
    },
    items: [{
      productId: {
        type: String,
        required: true,
      },
      productName: {
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
        min: 0,
      },
      totalPrice: {
        type: Number,
        min: 0,
      },
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['PHP', 'USD'],
      default: 'PHP',
    },
    attachments: [{
      filename: {
        type: String,
        required: true,
      },
      originalName: {
        type: String,
        required: true,
      },
      mimeType: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      fileData: {
        type: Buffer,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    customerNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending_upload', 'pending_review', 'approved', 'rejected'],
      default: 'pending_upload',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedByName: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewFeedback: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    revisionHistory: [{
      attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        path: String,
        fileData: Buffer,
        uploadedAt: Date,
      }],
      customerNotes: String,
      rejectionFeedback: {
        type: String,
        required: true,
      },
      revisedAt: {
        type: Date,
        default: Date.now,
      },
      revisedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
    inventoryDeducted: {
      type: Boolean,
      default: false,
    },
    inventoryDeductedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TransactionProofSchema.index({ bookingId: 1 });
TransactionProofSchema.index({ quotationId: 1 });
TransactionProofSchema.index({ status: 1 });
TransactionProofSchema.index({ submittedBy: 1 });

export default mongoose.model<ITransactionProof>('TransactionProof', TransactionProofSchema);
