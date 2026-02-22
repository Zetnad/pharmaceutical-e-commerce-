const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  hospitalClinic: String,
  issueDate: { type: Date, required: true },
  expiryDate: Date,
  image: { type: String, required: true }, // uploaded file path
  medications: [{
    name: String, dosage: String,
    frequency: String, duration: String, notes: String
  }],
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'used', 'expired'],
    default: 'pending'
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist' },
  verifiedAt: Date,
  rejectionReason: String,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
