const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-intent', protect, ctrl.createPaymentIntent);
router.post('/webhook', ctrl.stripeWebhook);
router.post('/mpesa', protect, ctrl.initiateMpesa);
router.post('/mpesa/confirm', protect, ctrl.confirmMpesa);

module.exports = router;
