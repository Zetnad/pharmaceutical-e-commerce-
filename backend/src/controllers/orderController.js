const Order = require('../models/Order');
const Product = require('../models/Product');
const Pharmacist = require('../models/Pharmacist');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// @route  POST /api/orders
exports.placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, notes, prescriptionId } = req.body;
  if (!items || items.length === 0) return sendError(res, 400, 'No order items provided.');

  // Validate stock and calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product).populate('pharmacist');
    if (!product) return sendError(res, 404, `Product ${item.product} not found.`);
    if (product.stock < item.quantity) return sendError(res, 400, `Insufficient stock for ${product.name}.`);
    if (product.requiresPrescription && !prescriptionId)
      return sendError(res, 400, `${product.name} requires a valid prescription.`);

    // Tenant Isolation: Ensure the product belongs to the store the user is currently visiting
    if (req.tenant && product.pharmacist._id.toString() !== req.tenant._id.toString()) {
      return sendError(res, 400, `${product.name} is not available at this pharmacy.`);
    }

    orderItems.push({
      product: product._id, name: product.name,
      quantity: item.quantity, price: product.price,
      pharmacist: product.pharmacist._id
    });
    subtotal += product.price * item.quantity;

    // Deduct stock
    product.stock -= item.quantity;
    product.totalSold += item.quantity;
    await product.save();
  }

  const deliveryFee = subtotal > 2000 ? 0 : 200; // Free delivery over KSh 2000
  const totalAmount = subtotal + deliveryFee;

  const order = await Order.create({
    user: req.user._id, items: orderItems, shippingAddress,
    paymentMethod, subtotal, deliveryFee, totalAmount, notes,
    prescription: prescriptionId || undefined,
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24hrs
  });

  // Email confirmation
  try { await emailService.sendOrderConfirmation(req.user.email, req.user.name, order); } catch (e) { }

  // Update pharmacist revenue
  for (const item of orderItems) {
    await Pharmacist.findByIdAndUpdate(item.pharmacist, {
      $inc: { totalSales: item.quantity, totalRevenue: item.price * item.quantity }
    });
  }

  sendSuccess(res, 201, 'Order placed successfully.', { order });
});

// @route  GET /api/orders/my
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user._id };
  if (status) query.orderStatus = status;

  // Tenant Isolation: Only show orders placed at the current tenant's pharmacy
  if (req.tenant) {
    query['items.pharmacist'] = req.tenant._id;
  }

  const [orders, total] = await Promise.all([
    Order.find(query).populate('items.product', 'name images').sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit)),
    Order.countDocuments(query)
  ]);

  sendSuccess(res, 200, 'Orders fetched.', { orders, total, pages: Math.ceil(total / limit) });
});

// @route  GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images dosage')
    .populate('prescription');

  if (!order) return sendError(res, 404, 'Order not found.');
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    return sendError(res, 403, 'Unauthorized.');

  sendSuccess(res, 200, 'Order fetched.', { order });
});

// @route  PUT /api/orders/:id/status  (pharmacist/admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'email name');
  if (!order) return sendError(res, 404, 'Order not found.');

  order.orderStatus = status;
  if (status === 'delivered') { order.deliveredAt = Date.now(); order.paymentStatus = 'paid'; }
  await order.save();

  try { await emailService.sendOrderStatusUpdate(order.user.email, order.user.name, order); } catch (e) { }
  sendSuccess(res, 200, 'Order status updated.', { order });
});

// @route  PUT /api/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return sendError(res, 404, 'Order not found.');
  if (!['placed', 'confirmed'].includes(order.orderStatus))
    return sendError(res, 400, 'Cannot cancel an order that is already being prepared or delivered.');

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, totalSold: -item.quantity } });
  }

  order.orderStatus = 'cancelled';
  await order.save();
  sendSuccess(res, 200, 'Order cancelled successfully.', { order });
});

// @route  GET /api/orders/pharmacist  (pharmacist only)
exports.getPharmacistOrders = asyncHandler(async (req, res) => {
  const pharmacist = await Pharmacist.findOne({ user: req.user._id });
  if (!pharmacist) return sendError(res, 403, 'Pharmacist profile not found.');

  const { page = 1, limit = 20, status } = req.query;
  const query = { 'items.pharmacist': pharmacist._id };
  if (status) query.orderStatus = status;

  const [orders, total] = await Promise.all([
    Order.find(query).populate('user', 'name phone').populate('items.product', 'name price')
      .sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    Order.countDocuments(query)
  ]);

  sendSuccess(res, 200, 'Orders fetched.', { orders, total });
});
