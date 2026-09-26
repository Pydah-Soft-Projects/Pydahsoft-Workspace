const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    defaultPermissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        canViewOverview: 'write',
        canViewUsers: 'none',
        canViewEmployees: 'none',
        canViewProjects: 'none',
        canViewTeams: 'none',
        canViewTimeTracker: 'write',
        canViewReviews: 'none',
        canViewDailyPlans: 'read',
        canViewWorkUpdates: 'write',
        canViewAnalytics: 'read',
        canViewAuditLogs: 'none',
        canViewSettings: 'none'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Role', roleSchema);
