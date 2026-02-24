const Pharmacist = require('../models/Pharmacist');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// @route  POST /api/pharmacists/apply
exports.applyAsPharmacist = asyncHandler(async (req, res) => {
  const existing = await Pharmacist.findOne({ user: req.user._id });
  if (existing) return sendError(res, 400, 'You have already submitted a pharmacist application.');

  const licenseDoc = req.files?.license ? `/uploads/licenses/${req.files.license[0].filename}` : null;
  if (!licenseDoc) return sendError(res, 400, 'License document is required.');

  const pharmacist = await Pharmacist.create({
    user: req.user._id,
    pharmacyName: req.body.pharmacyName,
    licenseNumber: req.body.licenseNumber,
    licenseDocument: licenseDoc,
    businessRegistration: req.body.businessRegistration,
    location: req.body.location ? JSON.parse(req.body.location) : {},
    phone: req.body.phone,
    deliveryAvailable: req.body.deliveryAvailable === 'true',
    deliveryRadius: req.body.deliveryRadius || 10
  });

  // Update user role
  await User.findByIdAndUpdate(req.user._id, { role: 'pharmacist' });

  try { await emailService.sendPharmacistApplicationReceived(req.user.email, req.user.name); } catch (e) {}

  sendSuccess(res, 201, 'Application submitted. We will verify your license within 24-48 hours.', { pharmacist });
});

// @route  GET /api/pharmacists/me
exports.getMyProfile = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findOne({ user: req.user._id }).populate('user', 'name email');
  if (!pharmacist) return sendError(res, 404, 'Pharmacist profile not found.');
  sendSuccess(res, 200, 'Profile fetched.', { pharmacist });
});

// @route  PUT /api/pharmacists/me
exports.updateProfile = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findOne({ user: req.user._id });
  if (!pharmacist) return sendError(res, 404, 'Pharmacist profile not found.');
  Object.assign(pharmacist, req.body);
  await pharmacist.save();
  sendSuccess(res, 200, 'Profile updated.', { pharmacist });
});

// @route  GET /api/pharmacists/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findOne({ user: req.user._id });
  if (!pharmacist) return sendError(res, 404, 'Pharmacist profile not found.');

  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

  const [totalOrders, weekOrders, totalProducts, topProducts, recentOrders] = await Promise.all([
    Order.countDocuments({ 'items.pharmacist': pharmacist._id }),
    Order.countDocuments({ 'items.pharmacist': pharmacist._id, createdAt: { $gte: startOfWeek } }),
    Product.countDocuments({ pharmacist: pharmacist._id, isActive: true }),
    Product.find({ pharmacist: pharmacist._id }).sort('-totalSold').limit(5).select('name totalSold price'),
    Order.find({ 'items.pharmacist': pharmacist._id }).sort('-createdAt').limit(10)
      .populate('user', 'name phone').select('orderStatus totalAmount createdAt shippingAddress')
  ]);

  sendSuccess(res, 200, 'Dashboard data fetched.', {
    stats: {
      totalRevenue: pharmacist.totalRevenue,
      totalSales: pharmacist.totalSales,
      totalOrders,
      weekOrders,
      totalProducts,
      rating: pharmacist.rating
    },
    topProducts, recentOrders
  });
});

// @route  GET /api/pharmacists  (public — browse pharmacies)
exports.getPharmacists = asyncHandler(async (req, res) => {
  const { city, deliveryAvailable, page = 1, limit = 12 } = req.query;
  const query = { status: 'verified' };
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (deliveryAvailable) query.deliveryAvailable = deliveryAvailable === 'true';

  const [pharmacists, total] = await Promise.all([
    Pharmacist.find(query).populate('user', 'name email').sort('-rating')
      .skip((page - 1) * limit).limit(Number(limit))
      .select('pharmacyName location rating totalReviews deliveryAvailable phone'),
    Pharmacist.countDocuments(query)
  ]);

  sendSuccess(res, 200, 'Pharmacists fetched.', { pharmacists, total });
});

// @route  GET /api/pharmacists/:id  (public)
exports.getPharmacist = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findById(req.params.id)
    .populate('user', 'name email')
    .select('-licenseDocument -bankDetails -stripeAccountId');
  if (!pharmacist || pharmacist.status !== 'verified') return sendError(res, 404, 'Pharmacy not found.');

  const products = await Product.find({ pharmacist: pharmacist._id, isActive: true }).limit(20);
  sendSuccess(res, 200, 'Pharmacy fetched.', { pharmacist, products });
});

// @route GET /api/pharmacists/:id/patients
exports.getPharmacistPatients = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findById(req.params.id);
  if (!pharmacist) return sendError(res, 404, 'Pharmacist not found.');

  // Find users who placed orders with this pharmacist
  const userIds = await Order.distinct('user', { 'items.pharmacist': pharmacist._id });
  const patients = await User.find({ _id: { $in: userIds } }).select('name email phone address createdAt');
  sendSuccess(res, 200, 'Patients fetched.', { patients });
});

// @route PUT /api/pharmacists/:id/plan  (admin)
exports.updatePharmacistPlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!plan || !['starter', 'growth', 'enterprise'].includes(plan)) return sendError(res, 400, 'Invalid plan.');
  const pharmacist = await Pharmacist.findById(req.params.id);
  if (!pharmacist) return sendError(res, 404, 'Pharmacist not found.');

  pharmacist.plan = plan;
  await pharmacist.save();

  sendSuccess(res, 200, 'Pharmacist plan updated.', { pharmacist });
});
