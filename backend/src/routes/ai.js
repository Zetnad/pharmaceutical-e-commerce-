// ai.js
const express = require('express');
const aiRouter = express.Router();
const aiCtrl = require('../controllers/aiController');
const { protect, optionalAuth } = require('../middleware/auth');

aiRouter.post('/analyze', optionalAuth, aiCtrl.analyzeSymptoms);
aiRouter.get('/history', protect, aiCtrl.getAIHistory);
aiRouter.get('/consultation/:id', protect, aiCtrl.getConsultation);

module.exports = aiRouter;
