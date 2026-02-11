import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
  user: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}

const RefreshTokenSchema: Schema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    userAgent: String,
    ipAddress: String,
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: Date,
    revokedReason: String,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient token validation
RefreshTokenSchema.index({ token: 1, isRevoked: 1 });
RefreshTokenSchema.index({ user: 1, isRevoked: 1 });

// Method to check if token is valid
RefreshTokenSchema.methods.isValid = function (): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Static method to clean up expired tokens
RefreshTokenSchema.statics.cleanupExpired = async function () {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Remove revoked tokens after 30 days
    ],
  });
};

// Static method to revoke all tokens for a user
RefreshTokenSchema.statics.revokeAllForUser = async function (
  userId: mongoose.Types.ObjectId,
  reason: string = 'User requested logout from all devices'
) {
  return this.updateMany(
    { user: userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
  );
};

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
