import mongoose, { Schema, Document } from 'mongoose';

export type SyncDirection = 'booking_to_google' | 'google_to_booking';
export type SyncAction = 'create' | 'update' | 'delete';
export type SyncStatus = 'success' | 'failed' | 'pending' | 'skipped';

export interface ICalendarSyncLog extends Document {
  bookingId?: mongoose.Types.ObjectId;
  googleEventId?: string;
  direction: SyncDirection;
  action: SyncAction;
  status: SyncStatus;
  error?: string;
  details?: string;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
}

const CalendarSyncLogSchema: Schema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    googleEventId: {
      type: String,
    },
    direction: {
      type: String,
      enum: ['booking_to_google', 'google_to_booking'],
      required: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'skipped'],
      default: 'pending',
    },
    error: {
      type: String,
    },
    details: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
CalendarSyncLogSchema.index({ bookingId: 1 });
CalendarSyncLogSchema.index({ googleEventId: 1 });
CalendarSyncLogSchema.index({ status: 1, createdAt: -1 });
CalendarSyncLogSchema.index({ createdAt: -1 });

export default mongoose.model<ICalendarSyncLog>('CalendarSyncLog', CalendarSyncLogSchema);
