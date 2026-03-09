const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  authorName: { type: String, trim: true, default: 'Unknown Staff' },
  authorRole: {
    type: String,
    enum: ['doctor', 'nurse', 'clinical_officer', 'pharmacist', 'lab_technologist', 'radiographer', 'finance', 'admin', 'other'],
    default: 'other'
  },
  noteType: {
    type: String,
    enum: ['triage', 'progress', 'nursing', 'handover', 'discharge', 'coordination'],
    default: 'progress'
  },
  content: { type: String, required: true, trim: true }
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  ownerRole: {
    type: String,
    enum: ['doctor', 'nurse', 'clinical_officer', 'pharmacist', 'lab_technologist', 'radiographer', 'finance', 'admin', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  dueLabel: { type: String, trim: true, default: '' }
}, { timestamps: true });

const checklistItemSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

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
  notesTimeline: [noteSchema],
  careTasks: [taskSchema],
  admissionChecklist: [checklistItemSchema],
  dischargeChecklist: [checklistItemSchema],
  admittedAt: Date,
  dischargedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Encounter', encounterSchema);
