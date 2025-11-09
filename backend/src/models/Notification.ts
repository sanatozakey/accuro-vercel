import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'booking' | 'quotation' | 'system' | 'admin_message';
  title: string;
  message: string;
  relatedId?: mongoose.Types.ObjectId; // ID of related booking, quotation, etc.
  relatedType?: 'booking' | 'quotation' | 'order';
  isRead: boolean;
  actionUrl?: string; // Where to navigate when clicked
  createdAt: Date;
  readAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['booking', 'quotation', 'system', 'admin_message'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    relatedType: {
      type: String,
      enum: ['booking', 'quotation', 'order'],
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
      required: false,
      trim: true,
    },
    readAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
