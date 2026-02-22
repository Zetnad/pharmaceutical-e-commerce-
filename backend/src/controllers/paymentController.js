const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');

// @route  POST /api/payments/create-intent
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return sendError(res, 404, 'Order not found.');
  if (order.paymentStatus === 'paid') return sendError(res, 400, 'Order already paid.');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalAmount * 100), // convert to cents (or lowest currency unit)
    currency: 'kes',
    metadata: { orderId: order._id.toString(), userId: req.user._id.toString() }
  });

  sendSuccess(res, 200, 'Payment intent created.', {
    clientSecret: paymentIntent.client_secret,
    amount: order.totalAmount
  });
});

// @route  POST /api/payments/webhook (Stripe webhook)
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const { orderId } = event.data.object.metadata;
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paymentResult: {
        transactionId: event.data.object.id,
        status: 'succeeded',
        updateTime: new Date().toISOString()
      }
    });
  }

  res.json({ received: true });
});

// @route  POST /api/payments/mpesa  (M-Pesa STK Push simulation)
exports.initiateMpesa = asyncHandler(async (req, res) => {
  const { orderId, phoneNumber } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return sendError(res, 404, 'Order not found.');

  // In production: integrate Safaricom Daraja API here
  // For now, simulate a response
  const mockTransactionId = `MPESA${Date.now()}`;
  sendSuccess(res, 200, 'M-Pesa STK push sent. Enter your PIN to complete payment.', {
    transactionId: mockTransactionId,
    amount: order.totalAmount,
    phone: phoneNumber
  });
});

// @route  POST /api/payments/mpesa/confirm
exports.confirmMpesa = asyncHandler(async (req, res) => {
  const { orderId, mpesaCode } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return sendError(res, 404, 'Order not found.');

  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.paymentResult = {
    transactionId: mpesaCode, status: 'paid',
    mpesaCode, updateTime: new Date().toISOString()
  };
  await order.save();
  sendSuccess(res, 200, 'Payment confirmed successfully.', { order });
});
