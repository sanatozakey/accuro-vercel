import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  userId?: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  purpose: string;
  location: string;
  product: string;
  additionalInfo?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  conclusion?: string;
  cancellationReason?: string;
  rescheduleReason?: string;
  originalDate?: Date;
  originalTime?: string;
  canReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      required: [true, 'Please provide a booking date'],
    },
    time: {
      type: String,
      required: [true, 'Please provide a booking time'],
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    contactName: {
      type: String,
      required: [true, 'Please provide a contact name'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Please provide a contact email'],
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Please provide a contact phone'],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Please provide a meeting purpose'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a meeting location'],
    },
    product: {
      type: String,
      required: [true, 'Please provide a product of interest'],
    },
    additionalInfo: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
    },
    conclusion: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    rescheduleReason: {
      type: String,
      trim: true,
    },
    originalDate: {
      type: Date,
    },
    originalTime: {
      type: String,
    },
    canReview: {
      type: Boolean,
      default: false,
      // Set to true when booking is completed
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
BookingSchema.index({ date: 1, status: 1 });
BookingSchema.index({ userId: 1 });
BookingSchema.index({ contactEmail: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);
