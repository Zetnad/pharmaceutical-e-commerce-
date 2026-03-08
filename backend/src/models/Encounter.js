const mongoose = require('mongoose');

const encounterSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  encounterNumber: { type: String, required: true, unique: true, trim: true },
  encounterType: {
    type: String,
    enum: ['outpatient', 'inpatient', 'emergency', 'maternity', 'procedure', 'telehealth'],
    default: 'outpatient'
  },
  department: { type: String, required: true, trim: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedRole: {
    type: String,
    enum: ['doctor', 'nurse', 'clinical_officer', 'pharmacist', 'lab_technologist', 'radiographer', 'finance', 'admin', null],
    default: null
  },
  status: {
    type: String,
    enum: ['registered', 'triage-complete', 'awaiting-vitals', 'active', 'critical-review', 'admitted', 'discharged', 'closed'],
    default: 'registered'
  },
  nextAction: { type: String, trim: true },
  triageNotes: { type: String, trim: true },
  diagnosisSummary: { type: String, trim: true },
  claimStatus: {
    type: String,
    enum: ['self-pay', 'eligibility-confirmed', 'preauth-pending', 'preauth-approved', 'claim-submitted', 'claim-settled'],
    default: 'self-pay'
  },
  admittedAt: Date,
  dischargedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Encounter', encounterSchema);
