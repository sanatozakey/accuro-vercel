import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  company?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
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
    company: {
      type: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isApproved: {
      type: Boolean,
      default: false,
      // Admin must approve before review shows publicly
    },
    isPublic: {
      type: Boolean,
      default: true,
      // User can choose to make their review private
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ReviewSchema.index({ booking: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ isApproved: 1, isPublic: 1, createdAt: -1 });
ReviewSchema.index({ rating: -1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
