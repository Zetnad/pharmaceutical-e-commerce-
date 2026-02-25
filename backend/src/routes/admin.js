const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', ctrl.getPlatformStats);
router.get('/pharmacists', ctrl.getAllPharmacists);
router.get('/pharmacists/pending', ctrl.getPendingPharmacists);
router.put('/pharmacists/:id/verify', ctrl.verifyPharmacist);
router.put('/pharmacists/:id/domain', ctrl.updatePharmacistDomain);
router.put('/pharmacists/:id/subscription', ctrl.updatePharmacistSubscription);
router.get('/users', ctrl.getUsers);
router.put('/users/:id/toggle', ctrl.toggleUser);
router.get('/orders', ctrl.getAllOrders);

module.exports = router;
