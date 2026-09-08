const User = require('../models/User');
const Role = require('../models/Role');
const Team = require('../models/Team');
const { calculateEmployeePerformance } = require('../services/performanceService');
const { logAudit } = require('../services/auditService');

const getEffectiveUserPermissions = (userDoc, rolesMap) => {
  const roleName = (userDoc.role || 'employee').toLowerCase();
  const roleDoc = rolesMap[roleName];
  const defaults = roleDoc?.defaultPermissions ? (roleDoc.defaultPermissions.toObject ? roleDoc.defaultPermissions.toObject() : roleDoc.defaultPermissions) : {};
  const userPerms = userDoc.permissions ? (userDoc.permissions.toObject ? userDoc.permissions.toObject() : userDoc.permissions) : {};

  return {
    ...defaults,
    ...userPerms
  };
};

const createEmployee = async (req, res) => {
  try {
    const {
      username,
      name,
      password,
      role,
      employeeId,
      email,
      phone,
      department,
      designation,
      joiningDate
    } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username, name, and password are required' }
      });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username already exists' }
      });
    }

    const count = await User.countDocuments();
    const generatedEmpId = employeeId || `EMP${String(count + 1).padStart(3, '0')}`;
    const selectedRole = role || 'employee';

    // Fetch Role default permissions configured in Settings
    const roleDoc = await Role.findOne({ name: selectedRole.toLowerCase() });
    const defaultPermissions = roleDoc?.defaultPermissions
      ? (roleDoc.defaultPermissions.toObject ? roleDoc.defaultPermissions.toObject() : roleDoc.defaultPermissions)
      : null;

    const user = await User.create({
      employeeId: generatedEmpId,
      username: username.toLowerCase().trim(),
      name,
      password,
      role: selectedRole,
      permissions: defaultPermissions,
      email: email || '',
      phone: phone || '',
      department: department || 'Engineering',
      designation: designation || 'Software Engineer',
      joiningDate: joiningDate || new Date()
    });

    await logAudit({
      entityType: 'User',
      entityId: user._id,
      action: 'CREATE_EMPLOYEE',
      performedBy: req.user._id,
      details: { username: user.username, role: user.role }
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        _id: user._id,
        employeeId: user.employeeId,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        status: user.status,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error creating employee' }
    });
  }
};

const getEmployees = async (req, res) => {
  try {
    const { role, department, status } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.status = status;

    const userRole = req.user.role;
    const userId = req.user._id;

    // Scoping based on Role & Team:
    // 1. Managers (superadmin, superior) -> View All
    // 2. Team Lead -> View self + members of teams led by this user
    // 3. Regular Employee -> View self only
    if (req.query.purpose !== 'chat' && userRole !== 'superadmin' && userRole !== 'superior') {
      const ledTeams = await Team.find({ teamLead: userId });
      if (ledTeams.length > 0) {
        const memberIds = new Set();
        memberIds.add(String(userId));
        ledTeams.forEach((t) => {
          (t.members || []).forEach((m) => memberIds.add(String(m)));
        });
        filter._id = { $in: Array.from(memberIds) };
      } else {
        filter._id = userId;
      }
    }

    const [employees, dbRoles] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }),
      Role.find()
    ]);

    const rolesMap = {};
    dbRoles.forEach((r) => {
      rolesMap[r.name.toLowerCase()] = r;
    });

    const enrichedEmployees = employees.map((emp) => {
      const empObj = emp.toObject();
      empObj.permissions = getEffectiveUserPermissions(emp, rolesMap);
      return empObj;
    });

    res.status(200).json({
      success: true,
      data: enrichedEmployees,
      message: 'Employees retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching employees' }
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id).select('-password');
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: { message: 'Employee not found' }
      });
    }

    const performance = await calculateEmployeePerformance(id);

    res.status(200).json({
      success: true,
      data: {
        employee,
        performance
      },
      message: 'Employee profile retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching employee details' }
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.password; // Do not allow password update via standard API

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'Employee not found' }
      });
    }

    await logAudit({
      entityType: 'User',
      entityId: updatedUser._id,
      action: 'UPDATE_EMPLOYEE',
      performedBy: req.user._id,
      details: updateData
    });

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error updating employee' }
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Employee not found' }
      });
    }

    await logAudit({
      entityType: 'User',
      entityId: user._id,
      action: 'DEACTIVATE_EMPLOYEE',
      performedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      data: user,
      message: 'Employee account deactivated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error deactivating employee' }
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
