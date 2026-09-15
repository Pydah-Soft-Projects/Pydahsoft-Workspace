const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized, no token provided' }
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'pydahsoft_super_secret_jwt_key_2026'
    );

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User belonging to this token no longer exists' }
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is inactive. Contact system administrator.' }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized, token validation failed' }
    });
  }
};

module.exports = { protect };
