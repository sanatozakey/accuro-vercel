import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  reportType: 'user_activity' | 'sales_booking' | 'product_performance' | 'quote_request' | 'contact_form' | 'custom';
  title: string;
  generatedBy: mongoose.Types.ObjectId;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    status?: string;
    userId?: mongoose.Types.ObjectId;
    productCategory?: string;
    [key: string]: any;
  };
  data: any;
  summary: {
    totalRecords: number;
    keyMetrics: Record<string, any>;
  };
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reportType: {
      type: String,
      enum: ['user_activity', 'sales_booking', 'product_performance', 'quote_request', 'contact_form', 'custom'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    filters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    summary: {
      totalRecords: {
        type: Number,
        required: true,
      },
      keyMetrics: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    fileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
reportSchema.index({ reportType: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
