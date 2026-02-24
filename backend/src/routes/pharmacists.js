const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pharmacistController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getPharmacists);
router.get('/me', protect, authorize('pharmacist'), ctrl.getMyProfile);
router.get('/dashboard', protect, authorize('pharmacist'), ctrl.getDashboard);
// list patients for a pharmacist (admin or pharmacist themselves)
router.get('/:id/patients', protect, authorize('pharmacist', 'admin'), ctrl.getPharmacistPatients);
router.get('/:id', ctrl.getPharmacist);
router.post('/apply', protect, upload.fields([{ name: 'license', maxCount: 1 }]), ctrl.applyAsPharmacist);
router.put('/me', protect, authorize('pharmacist'), ctrl.updateProfile);
// allow admins to update a pharmacist's plan/pricing
router.put('/:id/plan', protect, authorize('admin'), ctrl.updatePharmacistPlan);

module.exports = router;
