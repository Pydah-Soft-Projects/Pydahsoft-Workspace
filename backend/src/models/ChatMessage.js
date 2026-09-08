const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      required: true
    },
    recipientType: {
      type: String,
      enum: ['all', 'individual'],
      default: 'all',
      required: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipientName: {
      type: String
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ recipientType: 1, recipientId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
