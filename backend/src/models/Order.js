const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist' }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String, street: String, city: String,
    county: String, phone: String, country: { type: String, default: 'Kenya' }
  },
  paymentMethod: { type: String, enum: ['mpesa', 'card', 'cash'], default: 'mpesa' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentResult: {
    transactionId: String, status: String,
    updateTime: String, mpesaCode: String
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'],
    default: 'placed'
  },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  estimatedDelivery: Date,
  deliveredAt: Date,
  notes: String,
  trackingHistory: [{
    status: String, message: String, timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Auto-add tracking entry on status change
orderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus')) {
    const messages = {
      placed: 'Order placed successfully',
      confirmed: 'Order confirmed by pharmacy',
      preparing: 'Pharmacy is preparing your order',
      dispatched: 'Order dispatched for delivery',
      delivered: 'Order delivered successfully',
      cancelled: 'Order cancelled'
    };
    this.trackingHistory.push({
      status: this.orderStatus,
      message: messages[this.orderStatus] || this.orderStatus
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
