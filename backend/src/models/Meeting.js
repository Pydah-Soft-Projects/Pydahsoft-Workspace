const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      default: 'Instant Team Meeting'
    },
    description: {
      type: String,
      default: ''
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    hostName: {
      type: String,
      required: true
    },
    hostRole: {
      type: String,
      default: 'Member'
    },
    meetingLink: {
      type: String,
      required: true
    },
    passcode: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['instant', 'scheduled'],
      default: 'instant'
    },
    status: {
      type: String,
      enum: ['active', 'scheduled', 'ended'],
      default: 'active'
    },
    scheduledAt: {
      type: Date,
      default: Date.now
    },
    invitedUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String
      }
    ],
    activeParticipants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    inMeetingMessages: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderName: String,
        message: String,
        sentAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

meetingSchema.index({ createdAt: -1 });
meetingSchema.index({ status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
