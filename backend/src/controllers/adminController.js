const User = require('../models/User');
const Pharmacist = require('../models/Pharmacist');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AIConsultation = require('../models/AIConsultation');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// @route  GET /api/admin/stats
exports.getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalPharmacists, totalOrders,
    totalProducts, pendingPharmacists, aiConsultations,
    recentOrders
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Pharmacist.countDocuments({ status: 'verified' }),
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Pharmacist.countDocuments({ status: 'pending' }),
    AIConsultation.countDocuments(),
    Order.find().sort('-createdAt').limit(10).populate('user', 'name email')
  ]);

  const revenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  sendSuccess(res, 200, 'Platform stats fetched.', {
    stats: {
      totalUsers, totalPharmacists, totalOrders, totalProducts,
      pendingPharmacists, aiConsultations,
      totalRevenue: revenue[0]?.total || 0
    },
    recentOrders
  });
});

// @route  GET /api/admin/pharmacists/pending
exports.getPendingPharmacists = asyncHandler(async (req, res) => {
  const pharmacists = await Pharmacist.find({ status: 'pending' })
    .populate('user', 'name email phone createdAt').sort('-createdAt');
  sendSuccess(res, 200, 'Pending pharmacists fetched.', { pharmacists });
});

// @route  GET /api/admin/pharmacists
exports.getAllPharmacists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const [pharmacists, total] = await Promise.all([
    Pharmacist.find(query).populate('user', 'name email phone createdAt').sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit)),
    Pharmacist.countDocuments(query)
  ]);
  sendSuccess(res, 200, 'All pharmacists fetched.', { pharmacists, total });
});

// @route  PUT /api/admin/pharmacists/:id/domain
exports.updatePharmacistDomain = asyncHandler(async (req, res) => {
  const { subdomain, customDomain } = req.body;
  const pharmacist = await Pharmacist.findById(req.params.id);
  if (!pharmacist) return sendError(res, 404, 'Pharmacist not found.');

  // Check uniqueness if provided
  if (subdomain) {
    const existing = await Pharmacist.findOne({ subdomain, _id: { $ne: pharmacist._id } });
    if (existing) return sendError(res, 400, 'Subdomain is already taken by another pharmacy.');
    pharmacist.subdomain = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  if (customDomain) {
    const existing = await Pharmacist.findOne({ customDomain, _id: { $ne: pharmacist._id } });
    if (existing) return sendError(res, 400, 'Custom domain is already registered to another pharmacy.');
    pharmacist.customDomain = customDomain.toLowerCase();
  }

  await pharmacist.save();
  sendSuccess(res, 200, 'Pharmacist domains updated successfully.', { pharmacist });
});

// @route  PUT /api/admin/pharmacists/:id/subscription
exports.updatePharmacistSubscription = asyncHandler(async (req, res) => {
  const { plan, status } = req.body;
  const pharmacist = await Pharmacist.findById(req.params.id);
  if (!pharmacist) return sendError(res, 404, 'Pharmacist not found.');

  if (plan) pharmacist.plan = plan;
  if (status) {
    // Cannot force pending via this route easily, mostly activate/suspend
    const allowedStatuses = ['verified', 'suspended'];
    if (allowedStatuses.includes(status)) pharmacist.status = status;
  }

  await pharmacist.save();
  sendSuccess(res, 200, 'Pharmacist subscription updated.', { pharmacist });
});

// @route  PUT /api/admin/pharmacists/:id/verify
exports.verifyPharmacist = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // action: 'approve' | 'reject'
  const pharmacist = await Pharmacist.findById(req.params.id).populate('user', 'name email');
  if (!pharmacist) return sendError(res, 404, 'Pharmacist not found.');

  pharmacist.status = action === 'approve' ? 'verified' : 'rejected';
  if (action === 'reject') pharmacist.rejectionReason = reason;
  await pharmacist.save();

  try {
    if (action === 'approve') {
      await emailService.sendPharmacistApproved(pharmacist.user.email, pharmacist.user.name, pharmacist.pharmacyName);
    } else {
      await emailService.sendPharmacistRejected(pharmacist.user.email, pharmacist.user.name, reason);
    }
  } catch (e) { }

  sendSuccess(res, 200, `Pharmacist ${action === 'approve' ? 'approved' : 'rejected'}.`, { pharmacist });
});

// @route  GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)).select('-password'),
    User.countDocuments(query)
  ]);
  sendSuccess(res, 200, 'Users fetched.', { users, total, pages: Math.ceil(total / limit) });
});

// @route  PUT /api/admin/users/:id/toggle
exports.toggleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found.');
  user.isActive = !user.isActive;
  await user.save();
  sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}.`, { user });
});

// @route  GET /api/admin/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { orderStatus: status } : {};
  const [orders, total] = await Promise.all([
    Order.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
      .populate('user', 'name email').populate('items.pharmacist', 'pharmacyName'),
    Order.countDocuments(query)
  ]);
  sendSuccess(res, 200, 'Orders fetched.', { orders, total });
});
