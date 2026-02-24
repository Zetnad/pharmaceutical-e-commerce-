const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const demoAuth = require('../config/demoAuth');

// Demo admin login (only used when server runs in demo mode)
router.post('/demo-login', (req, res) => {
	const { email, password } = req.body || {};
	const demoPassword = process.env.DEMO_ADMIN_PASSWORD || 'demo123';
	// basic check — accept any email but require demo password
	if (!password || password !== demoPassword) return res.status(401).json({ success: false, message: 'Invalid demo credentials' });
	const token = demoAuth.issue(email || 'demo@local');
	return res.json({ success: true, message: 'Demo admin token issued', token });
});

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;
