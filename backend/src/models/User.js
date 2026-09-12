const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'Engineering'
    },
    designation: {
      type: String,
      default: 'Software Engineer'
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      default: 'employee'
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    activeToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('role') || !this.permissions) {
    try {
      const Role = mongoose.model('Role');
      const roleDoc = await Role.findOne({ name: this.role.toLowerCase() });
      if (roleDoc && roleDoc.defaultPermissions) {
        const defaults = roleDoc.defaultPermissions.toObject
          ? roleDoc.defaultPermissions.toObject()
          : roleDoc.defaultPermissions;
        this.permissions = {
          ...defaults,
          ...(this.permissions || {})
        };
      } else if (this.role === 'superior' || this.role === 'superadmin') {
        this.permissions = {
          canViewOverview: 'write',
          canViewUsers: 'write',
          canViewEmployees: 'write',
          canViewProjects: 'write',
          canViewTeams: 'write',
          canViewTimeTracker: 'write',
          canViewReviews: 'write',
          canViewDailyPlans: 'write',
          canViewAnalytics: 'write',
          canViewAuditLogs: 'write',
          canViewSettings: 'write',
          ...(this.permissions || {})
        };
      } else if (this.role === 'teamlead') {
        this.permissions = {
          canViewOverview: 'write',
          canViewUsers: 'read',
          canViewEmployees: 'read',
          canViewProjects: 'write',
          canViewTeams: 'write',
          canViewTimeTracker: 'write',
          canViewReviews: 'write',
          canViewDailyPlans: 'write',
          canViewAnalytics: 'read',
          canViewAuditLogs: 'none',
          canViewSettings: 'none',
          ...(this.permissions || {})
        };
      } else {
        this.permissions = {
          canViewOverview: 'read',
          canViewUsers: 'none',
          canViewEmployees: 'none',
          canViewProjects: 'none',
          canViewTeams: 'read',
          canViewTimeTracker: 'write',
          canViewReviews: 'none',
          canViewDailyPlans: 'read',
          canViewAnalytics: 'read',
          canViewAuditLogs: 'none',
          canViewSettings: 'none',
          ...(this.permissions || {})
        };
      }
    } catch (e) {
      console.error('[User Pre-Save Role Defaults Error]:', e);
    }
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
