const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true },
  name: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  brand: { type: String, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['pain-relief', 'cold-flu', 'cardiovascular', 'dermatology', 'mother-baby', 'vitamins', 'mental-health', 'antibiotics', 'diabetes', 'respiratory', 'digestive', 'other'],
    required: true
  },
  type: { type: String, enum: ['OTC', 'Rx'], default: 'OTC' }, // Over-the-counter or prescription
  price: { type: Number, required: true, min: 0 }, // KSh
  stock: { type: Number, required: true, min: 0, default: 0 },
  unit: { type: String, default: 'pack' }, // pack, bottle, tube, etc.
  dosage: String,          // e.g. "500mg"
  form: String,            // tablet, capsule, syrup, cream, inhaler
  sideEffects: [String],
  warnings: [String],
  storageInstructions: String,
  expiryDate: Date,
  images: [String],
  isActive: { type: Boolean, default: true },
  requiresPrescription: { type: Boolean, default: false },
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
}, { timestamps: true });

// Full-text search index
productSchema.index({ name: 'text', genericName: 'text', brand: 'text', description: 'text' });

// Auto-calculate rating
productSchema.pre('save', function (next) {
  if (this.reviews.length > 0) {
    this.rating = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
