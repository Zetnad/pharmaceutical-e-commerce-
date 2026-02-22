const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.single('prescription'), ctrl.uploadPrescription);
router.get('/my', protect, ctrl.getMyPrescriptions);
router.get('/:id', protect, ctrl.getPrescription);
router.put('/:id/verify', protect, authorize('pharmacist', 'admin'), ctrl.verifyPrescription);

module.exports = router;
