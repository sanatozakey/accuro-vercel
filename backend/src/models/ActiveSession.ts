import mongoose, { Schema, Document } from 'mongoose';

export interface IActiveSession extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  isAnonymous: boolean;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  currentPage: string;
  referrer?: string;
  lastActivity: Date;
  startedAt: Date;
  interactions: Array<{
    type: 'click' | 'scroll' | 'hover' | 'form_interaction';
    element?: string;
    page: string;
    x?: number;
    y?: number;
    timestamp: Date;
  }>;
  pageViews: Array<{
    page: string;
    timestamp: Date;
    duration?: number;
  }>;
  isActive: boolean;
}

const ActiveSessionSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
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
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    ipAddress: String,
    userAgent: String,
    browser: String,
    browserVersion: String,
    os: String,
    device: String,
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    currentPage: {
      type: String,
      required: true,
    },
    referrer: String,
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    interactions: [
      {
        type: {
          type: String,
          enum: ['click', 'scroll', 'hover', 'form_interaction'],
          required: true,
        },
        element: String,
        page: String,
        x: Number,
        y: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pageViews: [
      {
        page: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        duration: Number,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of active sessions
ActiveSessionSchema.index({ isActive: 1, lastActivity: -1 });
ActiveSessionSchema.index({ sessionId: 1, isActive: 1 });
ActiveSessionSchema.index({ lastActivity: -1 });

// Auto-deactivate sessions older than 5 minutes
ActiveSessionSchema.pre('save', function (next) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (this.lastActivity < fiveMinutesAgo) {
    this.isActive = false;
  }
  next();
});

export default mongoose.model<IActiveSession>('ActiveSession', ActiveSessionSchema);
