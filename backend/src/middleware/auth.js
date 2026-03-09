const jwt = require('jsonwebtoken');
const User = require('../models/User');
const demoAuth = require('../config/demoAuth');

const extractBearerToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

// Protect routes — verify JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (!req.user.isActive) return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action.`
      });
    }
    next();
  };
};

// Optional auth (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
  let token = extractBearerToken(req);
  if (token) {
    if (demoAuth.verify(token)) {
      req.user = demoAuth.getProfile(token);
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) { /* silent */ }
  }
  next();
};

// Protect hospital write routes — accepts either a real JWT user or a demo staff token.
exports.protectHospitalWrite = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  if (demoAuth.verify(token)) {
    req.user = demoAuth.getProfile(token);
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (!req.user.isActive) return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

exports.authorizeHospitalRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role || 'unknown'}' is not authorized for this hospital action.`
      });
    }
    next();
  };
};
