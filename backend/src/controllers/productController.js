const Product = require('../models/Product');
const Pharmacist = require('../models/Pharmacist');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');

// @route  GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12, category, type,
    search, sort = '-createdAt', minPrice, maxPrice
  } = req.query;

  const query = { isActive: true, stock: { $gt: 0 } };

  if (category) query.category = category;
  if (type) query.type = type;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (search) query.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query).populate('pharmacist', 'pharmacyName rating location').sort(sort).skip(skip).limit(Number(limit)),
    Product.countDocuments(query)
  ]);

  sendSuccess(res, 200, 'Products fetched.', {
    products, total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page)
  });
});

// @route  GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('pharmacist', 'pharmacyName rating location phone deliveryAvailable');
  if (!product) return sendError(res, 404, 'Product not found.');
  sendSuccess(res, 200, 'Product fetched.', { product });
});

// @route  POST /api/products  (pharmacist only)
exports.createProduct = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findOne({ user: req.user._id, status: 'verified' });
  if (!pharmacist) return sendError(res, 403, 'Only verified pharmacists can list products.');

  const images = req.files ? req.files.map(f => `/uploads/products/${f.filename}`) : [];
  const product = await Product.create({ ...req.body, pharmacist: pharmacist._id, images });
  sendSuccess(res, 201, 'Product listed successfully.', { product });
});

// @route  PUT /api/products/:id  (pharmacist only)
exports.updateProduct = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findOne({ user: req.user._id });
  const product = await Product.findOne({ _id: req.params.id, pharmacist: pharmacist._id });
  if (!product) return sendError(res, 404, 'Product not found or unauthorized.');

  Object.assign(product, req.body);
  await product.save();
  sendSuccess(res, 200, 'Product updated.', { product });
});

// @route  DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findOne({ user: req.user._id });
  const product = await Product.findOne({ _id: req.params.id, pharmacist: pharmacist._id });
  if (!product) return sendError(res, 404, 'Product not found or unauthorized.');
  product.isActive = false;
  await product.save();
  sendSuccess(res, 200, 'Product removed from listing.');
});

// @route  POST /api/products/:id/review
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return sendError(res, 404, 'Product not found.');

  const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) return sendError(res, 400, 'You have already reviewed this product.');

  product.reviews.push({ user: req.user._id, rating: Number(rating), comment });
  await product.save();
  sendSuccess(res, 201, 'Review added.', { product });
});

// @route  GET /api/products/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  sendSuccess(res, 200, 'Categories fetched.', { categories });
});
