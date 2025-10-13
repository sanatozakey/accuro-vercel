import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  productId: string;
  interactionType: 'view' | 'booking' | 'inquiry' | 'purchase';
  productCategory: string;
  weight: number; // Interaction weight for scoring
  metadata?: {
    bookingId?: string;
    duration?: number; // Time spent viewing
    context?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserInteractionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: String,
      required: true,
      trim: true,
    },
    interactionType: {
      type: String,
      enum: ['view', 'booking', 'inquiry', 'purchase'],
      required: true,
    },
    productCategory: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      default: 1,
      // Weights: view=1, inquiry=2, booking=3, purchase=5
    },
    metadata: {
      bookingId: {
        type: String,
      },
      duration: {
        type: Number, // seconds
      },
      context: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
UserInteractionSchema.index({ userId: 1, createdAt: -1 });
UserInteractionSchema.index({ productId: 1 });
UserInteractionSchema.index({ userId: 1, productId: 1 });
UserInteractionSchema.index({ interactionType: 1 });
UserInteractionSchema.index({ productCategory: 1 });

export default mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);
