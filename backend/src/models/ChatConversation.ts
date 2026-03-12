import mongoose, { Document, Schema } from 'mongoose';

export interface IChatConversation extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'closed';
  lastMessage: string;
  lastMessageAt: Date;
  unreadByUser: number;
  unreadByAdmin: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadByUser: {
      type: Number,
      default: 0,
    },
    unreadByAdmin: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching conversations sorted by recent activity
ChatConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema);
