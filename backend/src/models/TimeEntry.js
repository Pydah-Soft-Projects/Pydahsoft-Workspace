const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required']
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      default: Date.now
    },
    endTime: {
      type: Date,
      default: null
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Running', 'Paused', 'Stopped'],
      default: 'Running'
    }
  },
  {
    timestamps: true
  }
);

timeEntrySchema.index({ employee: 1, status: 1 });
timeEntrySchema.index({ employee: 1, startTime: -1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
