const mongoose = require('mongoose');

const workUpdateItemSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  projectName: {
    type: String,
    trim: true
  },
  updates: [
    {
      point: {
        type: String,
        required: [true, 'Update point text is required'],
        trim: true
      },
      hoursSpent: {
        type: Number,
        default: 0
      },
      status: {
        type: String,
        enum: ['Completed', 'In Progress', 'Blocked'],
        default: 'Completed'
      }
    }
  ],
  submissionStatus: {
    type: String,
    enum: ['Draft', 'Submitted', 'TL Verified', 'Verified', 'Needs Revision', 'Rejected'],
    default: 'Submitted'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verificationRemarks: {
    type: String,
    default: '',
    trim: true
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  tlVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tlVerificationRemarks: {
    type: String,
    default: '',
    trim: true
  },
  tlVerifiedAt: {
    type: Date,
    default: null
  },
  managerVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  managerVerificationRemarks: {
    type: String,
    default: '',
    trim: true
  },
  managerVerifiedAt: {
    type: Date,
    default: null
  }
});

const workUpdateSchema = new mongoose.Schema(
  {
    updateId: {
      type: String,
      unique: true,
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Work update date is required'],
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
      index: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    projectUpdates: [workUpdateItemSchema],
    overallSummary: {
      type: String,
      default: '',
      trim: true
    },
    totalHours: {
      type: Number,
      default: 0
    },
    submissionStatus: {
      type: String,
      enum: ['Draft', 'Submitted', 'TL Verified', 'Verified', 'Needs Revision', 'Rejected'],
      default: 'Submitted',
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verificationRemarks: {
      type: String,
      default: '',
      trim: true
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

workUpdateSchema.index({ date: 1, employee: 1 });

module.exports = mongoose.model('WorkUpdate', workUpdateSchema);
