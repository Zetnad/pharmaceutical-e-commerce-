const mongoose = require('mongoose');

const pharmacistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyName: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, unique: true },
  licenseDocument: { type: String }, // file path
  businessRegistration: { type: String },
  plan: { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'starter' },
  status: { type: String, enum: ['pending', 'verified', 'suspended', 'rejected'], default: 'pending' },
  subdomain: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, // e.g., 'johnspharmacy'
  customDomain: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, // e.g., 'www.johnspharmacy.com'
  theme: {
    primaryColor: { type: String, default: '#0d9e6e' },
    secondaryColor: { type: String, default: '#0b1120' }
  },
  location: {
    address: String, city: String, county: String,
    country: { type: String, default: 'Kenya' },
    coordinates: { lat: Number, lng: Number }
  },
  phone: String,
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  deliveryAvailable: { type: Boolean, default: false },
  deliveryRadius: { type: Number, default: 10 }, // km
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }, // KSh
  commissionRate: { type: Number, default: 3 }, // percentage
  stripeAccountId: String,
  bankDetails: {
    bankName: String, accountNumber: String, accountName: String
  },
  rejectionReason: String,
}, { timestamps: true });

pharmacistSchema.virtual('products', {
  ref: 'Product', localField: '_id', foreignField: 'pharmacist'
});

module.exports = mongoose.model('Pharmacist', pharmacistSchema);
