const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  status: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
  details: { type: String, trim: true },
  metricValue: { type: Number, default: null }
}, { _id: false });

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, uppercase: true },
  type: {
    type: String,
    enum: ['hospital', 'clinic', 'maternity-centre', 'diagnostic-centre', 'medical-centre'],
    default: 'hospital'
  },
  location: {
    address: String,
    city: String,
    county: String,
    country: { type: String, default: 'Kenya' }
  },
  departments: [String],
  totalBeds: { type: Number, default: 0, min: 0 },
  occupiedBeds: { type: Number, default: 0, min: 0 },
  services: [String],
  operationalMetrics: {
    patientsToday: { type: Number, default: 0, min: 0 },
    claimsAcceptanceRate: { type: Number, default: 0, min: 0, max: 1 },
    projectedPayrollKes: { type: Number, default: 0, min: 0 },
    overtimeExposureKes: { type: Number, default: 0, min: 0 }
  },
  pharmacyAlerts: [alertSchema],
  staffingAlerts: [alertSchema],
  executiveAlerts: [alertSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

facilitySchema.virtual('occupancyRate').get(function occupancyRate() {
  if (!this.totalBeds) return 0;
  return this.occupiedBeds / this.totalBeds;
});

module.exports = mongoose.model('Facility', facilitySchema);
