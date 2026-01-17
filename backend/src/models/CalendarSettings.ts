import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarSettings extends Document {
  // OAuth tokens
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;

  // Calendar info
  calendarId: string;
  calendarEmail: string;

  // Sync settings
  syncEnabled: boolean;
  lastSyncAt?: Date;
  webhookChannelId?: string;
  webhookResourceId?: string;
  webhookExpiration?: Date;

  // Metadata
  connectedBy: mongoose.Types.ObjectId;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarSettingsSchema: Schema = new Schema(
  {
    // OAuth tokens (encrypted in production)
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    tokenExpiry: {
      type: Date,
      required: true,
    },

    // Calendar info
    calendarId: {
      type: String,
      required: true,
      default: 'primary',
    },
    calendarEmail: {
      type: String,
      required: true,
    },

    // Sync settings
    syncEnabled: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: {
      type: Date,
    },

    // Webhook settings for real-time sync
    webhookChannelId: {
      type: String,
    },
    webhookResourceId: {
      type: String,
    },
    webhookExpiration: {
      type: Date,
    },

    // Who connected this calendar
    connectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Only one calendar settings record should exist (singleton pattern)
CalendarSettingsSchema.index({ calendarId: 1 }, { unique: true });

export default mongoose.model<ICalendarSettings>('CalendarSettings', CalendarSettingsSchema);
