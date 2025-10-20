import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: 'user' | 'booking' | 'review' | 'quote' | 'purchase' | 'auth' | 'system';
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      // Examples: 'LOGIN', 'LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      // 'BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_CANCELLED', 'REVIEW_CREATED', etc.
    },
    resourceType: {
      type: String,
      enum: ['user', 'booking', 'review', 'quote', 'purchase', 'auth', 'system'],
      required: true,
    },
    resourceId: {
      type: String,
      // ID of the resource being acted upon (e.g., booking ID, user ID)
    },
    details: {
      type: String,
      // Additional context about the action
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ resourceType: 1, createdAt: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
