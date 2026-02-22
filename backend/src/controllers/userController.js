const User = require('../models/User');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');

// @route  GET /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  sendSuccess(res, 200, 'Profile fetched.', { user });
});

// @route  PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (req.file) user.avatar = `/uploads/misc/${req.file.filename}`;

  await user.save();
  sendSuccess(res, 200, 'Profile updated.', { user });
});

// @route  GET /api/users/health-history
exports.getHealthHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('healthHistory');
  sendSuccess(res, 200, 'Health history fetched.', { history: user.healthHistory });
});

// @route  POST /api/users/health-history
exports.addHealthEntry = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.healthHistory.push({ medication: req.body.medication, date: req.body.date, notes: req.body.notes });
  await user.save();
  sendSuccess(res, 201, 'Health entry added.', { history: user.healthHistory });
});

// @route  POST /api/users/family-members
exports.addFamilyMember = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.plan === 'free') return sendError(res, 403, 'Upgrade to Premium to add family members.');
  user.familyMembers.push(req.body);
  await user.save();
  sendSuccess(res, 201, 'Family member added.', { familyMembers: user.familyMembers });
});

// @route  PUT /api/users/upgrade-plan
exports.upgradePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const validPlans = ['free', 'premium', 'family'];
  if (!validPlans.includes(plan)) return sendError(res, 400, 'Invalid plan.');

  await User.findByIdAndUpdate(req.user._id, { plan, aiChecksUsed: 0 });
  sendSuccess(res, 200, `Plan upgraded to ${plan} successfully.`);
});
