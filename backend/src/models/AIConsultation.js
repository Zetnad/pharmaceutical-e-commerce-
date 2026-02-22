const mongoose = require('mongoose');

const aiConsultationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  symptoms: { type: String, required: true },
  aiResponse: { type: String, required: true },
  possibleConditions: [{ name: String, confidence: Number }],
  suggestedMedications: [{ name: String, dosage: String, frequency: String, type: String }],
  urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'low' },
  doctorVisitRecommended: { type: Boolean, default: false },
  ipAddress: String, // for anonymous users
  sessionId: String,
}, { timestamps: true });

module.exports = mongoose.model('AIConsultation', aiConsultationSchema);
