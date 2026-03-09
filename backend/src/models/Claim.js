const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimNumber: { type: String, required: true, unique: true, trim: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  encounter: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', default: null },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  payer: { type: String, required: true, trim: true },
  memberNumber: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'pending-authorization', 'partially-paid', 'paid', 'denied', 'appealed'],
    default: 'draft'
  },
  stage: {
    type: String,
    enum: ['eligibility-check', 'claim-scrub-complete', 'waiting-supporting-documents', 'denial-follow-up', 'settled', 'appeal-review'],
    default: 'eligibility-check'
  },
  denialRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  notes: { type: String, trim: true },
  submittedAt: Date,
  settledAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);
