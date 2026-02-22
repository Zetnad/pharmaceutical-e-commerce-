const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pharmacistController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getPharmacists);
router.get('/me', protect, authorize('pharmacist'), ctrl.getMyProfile);
router.get('/dashboard', protect, authorize('pharmacist'), ctrl.getDashboard);
router.get('/:id', ctrl.getPharmacist);
router.post('/apply', protect, upload.fields([{ name: 'license', maxCount: 1 }]), ctrl.applyAsPharmacist);
router.put('/me', protect, authorize('pharmacist'), ctrl.updateProfile);

module.exports = router;
