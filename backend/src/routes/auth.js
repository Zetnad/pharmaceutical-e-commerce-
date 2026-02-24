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
	const remember = req.body.remember === true || req.body.remember === 'true';
	const ttl = remember ? 7 * 24 * 3600 : 3600; // 7 days vs 1 hour
	const issued = demoAuth.issue(email || 'demo@local', ttl);
	return res.json({ success: true, message: 'Demo admin token issued', token: issued.token, issuedAt: issued.issuedAt, expiresAt: issued.expiresAt });
});

router.post('/register', register);
router.post('/login', login);
// GET /api/auth/me — if demo token provided return demo profile, otherwise use protect middleware
router.get('/me', (req, res, next) => {
	try {
		const auth = req.headers['authorization'] || '';
		const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
		if (token && demoAuth.verify(token)) {
			const profile = demoAuth.getProfile(token);
			return res.json({ success: true, message: 'Demo admin profile', user: profile });
		}
		// fall back to regular protected route
		protect(req, res, (err) => {
			if (err) return next(err);
			return getMe(req, res, next);
		});
	} catch (e) { next(e); }
});
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/change-password', protect, changePassword);

// Demo revoke endpoint — revoke token passed via Authorization header
router.post('/demo-revoke', (req, res) => {
	const auth = req.headers['authorization'] || '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
	if (!token) return res.status(400).json({ success: false, message: 'Token required in Authorization header' });
	const ok = demoAuth.revoke(token);
	return res.json({ success: ok, message: ok ? 'Token revoked' : 'Token not found' });
});

module.exports = router;
