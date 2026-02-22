const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', protect, ctrl.getProfile);
router.put('/profile', protect, upload.single('avatar'), ctrl.updateProfile);
router.get('/health-history', protect, ctrl.getHealthHistory);
router.post('/health-history', protect, ctrl.addHealthEntry);
router.post('/family-members', protect, ctrl.addFamilyMember);
router.put('/upgrade-plan', protect, ctrl.upgradePlan);

module.exports = router;
