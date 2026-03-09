const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  provider: { type: String, trim: true },
  memberNumber: { type: String, trim: true },
  planName: { type: String, trim: true },
  isPrimary: { type: Boolean, default: true }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  relation: { type: String, trim: true },
  phone: { type: String, trim: true }
}, { _id: false });

const patientSchema = new mongoose.Schema({
  mrn: { type: String, required: true, unique: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other', 'unspecified'], default: 'unspecified' },
  phone: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  nationalId: { type: String, trim: true },
  address: {
    street: String,
    city: String,
    county: String,
    country: { type: String, default: 'Kenya' }
  },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
  visitType: { type: String, enum: ['OPD', 'IPD', 'Emergency', 'ANC', 'Clinic', 'Theatre'], default: 'OPD' },
  department: { type: String, trim: true },
  triageLevel: { type: String, enum: ['pending', 'low', 'medium', 'high', 'emergency'], default: 'pending' },
  currentStatus: {
    type: String,
    enum: ['registered', 'waiting', 'queued', 'under-review', 'admitted', 'discharged', 'closed'],
    default: 'registered'
  },
  bloodGroup: { type: String, trim: true },
  allergies: [String],
  insuranceProfiles: [insuranceSchema],
  emergencyContact: contactSchema,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

patientSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

module.exports = mongoose.model('Patient', patientSchema);
