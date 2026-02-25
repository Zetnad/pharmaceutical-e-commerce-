const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['patient', 'pharmacist', 'admin'], default: 'patient' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist' }, // Links a patient to a specific B2B2C pharmacy
  plan: { type: String, enum: ['free', 'premium', 'family'], default: 'free' },
  avatar: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  address: {
    street: String, city: String, county: String,
    country: { type: String, default: 'Kenya' }
  },
  familyMembers: [{ name: String, relation: String, dateOfBirth: Date }],
  healthHistory: [{ medication: String, date: Date, notes: String }],
  aiChecksUsed: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verifyEmailToken: String,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check AI check limits
userSchema.methods.canUseAI = function () {
  if (this.plan === 'free') return this.aiChecksUsed < 5;
  return true; // Premium & family = unlimited
};

module.exports = mongoose.model('User', userSchema);
