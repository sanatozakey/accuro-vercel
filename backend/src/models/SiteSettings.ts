import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  _id: string;
  stockDisplayMode: 'labels_only' | 'exact_quantities';
  defaultLowStockThreshold: number;
  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

const SiteSettingsSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: 'global',
    },
    stockDisplayMode: {
      type: String,
      enum: ['labels_only', 'exact_quantities'],
      default: 'labels_only',
    },
    defaultLowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    _id: false, // We'll use our own _id
  }
);

// Static method to get or create global settings
SiteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('global');
  if (!settings) {
    settings = await this.create({ _id: 'global' });
  }
  return settings;
};

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
