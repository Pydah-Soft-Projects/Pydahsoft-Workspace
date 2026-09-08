const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Parent module reference is required']
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned employee is required']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user is required']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    },
    estimatedHours: {
      type: Number,
      default: 0
    },
    actualHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'Not Started',
        'In Progress',
        'Paused',
        'Submitted for Review',
        'Approved',
        'Rejected',
        'Delayed',
        'Blocked'
      ],
      default: 'Not Started'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ team: 1 });

module.exports = mongoose.model('Task', taskSchema);
