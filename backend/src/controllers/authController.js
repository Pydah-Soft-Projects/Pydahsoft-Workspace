const userService = require('../services/userService');
const User = require('../models/User');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const io = req.app.get('io');
    const userData = await userService.loginUser(username, password, io);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: userData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Authentication failed' }
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: user,
      message: 'User profile retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching user profile' }
    });
  }
};

const seedSuperAdminController = async (req, res) => {
  try {
    const result = await userService.seedSuperAdmin();
    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to seed superadmin' }
    });
  }
};

module.exports = {
  login,
  getMe,
  seedSuperAdminController
};
