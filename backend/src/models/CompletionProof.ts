import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceReport {
  workPerformed: string;
  equipmentUsed?: string;
  issuesFound?: string;
  recommendations?: string;
}

export interface IAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

export interface ISignature {
  signatureData: string; // Base64 encoded signature image
  signedBy: string;
  signedAt: Date;
}

export interface IRevisionEntry {
  serviceReport: IServiceReport;
  attachments: IAttachment[];
  signature?: ISignature;
  rejectionFeedback: string;
  revisedAt: Date;
  revisedBy: mongoose.Types.ObjectId;
}

export type CompletionProofStatus = 'pending_review' | 'approved' | 'rejected';

export interface ICompletionProof extends Document {
  bookingId: mongoose.Types.ObjectId;
  serviceReport: IServiceReport;
  attachments: IAttachment[];
  signature?: ISignature;
  completedBy: mongoose.Types.ObjectId;
  completedByName: string;
  completedAt: Date;
  // Review workflow fields
  status: CompletionProofStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewFeedback?: string;
  revisionHistory: IRevisionEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const CompletionProofSchema: Schema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true, // One proof per booking
    },
    serviceReport: {
      workPerformed: {
        type: String,
        required: [true, 'Work performed description is required'],
        trim: true,
      },
      equipmentUsed: {
        type: String,
        trim: true,
      },
      issuesFound: {
        type: String,
        trim: true,
      },
      recommendations: {
        type: String,
        trim: true,
      },
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
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    signature: {
      signatureData: {
        type: String, // Base64 encoded
      },
      signedBy: {
        type: String,
      },
      signedAt: {
        type: Date,
      },
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Completed by user ID is required'],
    },
    completedByName: {
      type: String,
      required: [true, 'Completed by name is required'],
      trim: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    // Review workflow fields
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
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
    },
    revisionHistory: [{
      serviceReport: {
        workPerformed: String,
        equipmentUsed: String,
        issuesFound: String,
        recommendations: String,
      },
      attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        path: String,
        uploadedAt: Date,
      }],
      signature: {
        signatureData: String,
        signedBy: String,
        signedAt: Date,
      },
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
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
CompletionProofSchema.index({ bookingId: 1 });
CompletionProofSchema.index({ completedBy: 1 });
CompletionProofSchema.index({ completedAt: -1 });
CompletionProofSchema.index({ status: 1 });

export default mongoose.model<ICompletionProof>('CompletionProof', CompletionProofSchema);
