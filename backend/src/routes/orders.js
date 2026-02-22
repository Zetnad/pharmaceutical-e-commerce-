// ─── orders.js ───
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, ctrl.placeOrder);
router.get('/my', protect, ctrl.getMyOrders);
router.get('/pharmacist', protect, authorize('pharmacist'), ctrl.getPharmacistOrders);
router.get('/:id', protect, ctrl.getOrder);
router.put('/:id/status', protect, authorize('pharmacist', 'admin'), ctrl.updateOrderStatus);
router.put('/:id/cancel', protect, ctrl.cancelOrder);

module.exports = router;
