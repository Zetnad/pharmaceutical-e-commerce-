const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// Generate JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @route  POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password)
    return sendError(res, 400, 'Name, email, and password are required.');

  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 400, 'Email already registered.');

  // Only allow patient/pharmacist on self-registration
  const allowedRoles = ['patient', 'pharmacist'];
  const userRole = allowedRoles.includes(role) ? role : 'patient';

  const user = await User.create({ name, email, password, phone, role: userRole });

  // Send welcome email
  try { await emailService.sendWelcome(user.email, user.name); } catch (e) { /* non-blocking */ }

  const token = generateToken(user._id);
  sendSuccess(res, 201, 'Account created successfully.', {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan }
  });
});

// @route  POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 400, 'Email and password are required.');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    return sendError(res, 401, 'Invalid email or password.');

  if (!user.isActive) return sendError(res, 401, 'Your account has been deactivated. Contact support.');

  const token = generateToken(user._id);
  sendSuccess(res, 200, 'Login successful.', {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, avatar: user.avatar }
  });
});

// @route  GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  sendSuccess(res, 200, 'User fetched.', { user });
});

// @route  POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return sendError(res, 404, 'No account found with that email.');

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    await emailService.sendPasswordReset(user.email, user.name, resetUrl);
    sendSuccess(res, 200, 'Password reset link sent to your email.');
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    sendError(res, 500, 'Failed to send email. Try again later.');
  }
});

// @route  PUT /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) return sendError(res, 400, 'Invalid or expired reset token.');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendSuccess(res, 200, 'Password reset successful. Please log in.');
});

// @route  PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword)))
    return sendError(res, 400, 'Current password is incorrect.');

  user.password = newPassword;
  await user.save();
  sendSuccess(res, 200, 'Password changed successfully.');
});
