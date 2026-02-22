require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Pharmacist = require('../models/Pharmacist');
const Product = require('../models/Product');

const connectDB = require('./db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([User.deleteMany(), Pharmacist.deleteMany(), Product.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // Create admin
  const admin = await User.create({ name: 'MediHub Admin', email: 'admin@medihub.com', password: 'admin123456', role: 'admin', isVerified: true });

  // Create pharmacist users
  const pharmUser1 = await User.create({ name: 'Dr. James Ochieng', email: 'james@pharmacare.ke', password: 'pharm123456', role: 'pharmacist', phone: '+254700123456', isVerified: true });
  const pharmUser2 = await User.create({ name: 'Sarah Mutua', email: 'sarah@mediplus.ke', password: 'pharm123456', role: 'pharmacist', phone: '+254711234567', isVerified: true });

  // Create pharmacist profiles
  const pharm1 = await Pharmacist.create({
    user: pharmUser1._id, pharmacyName: 'PharmaCare Nairobi',
    licenseNumber: 'PPB-2021-001234', status: 'verified',
    location: { address: 'Westlands Shopping Centre', city: 'Nairobi', county: 'Nairobi', country: 'Kenya' },
    phone: '+254700123456', deliveryAvailable: true, deliveryRadius: 15,
    rating: 4.9, totalReviews: 482, plan: 'growth'
  });

  const pharm2 = await Pharmacist.create({
    user: pharmUser2._id, pharmacyName: 'MediPlus Pharmacy',
    licenseNumber: 'PPB-2020-005678', status: 'verified',
    location: { address: 'Mombasa Road, Industrial Area', city: 'Nairobi', county: 'Nairobi', country: 'Kenya' },
    phone: '+254711234567', deliveryAvailable: true, deliveryRadius: 10,
    rating: 4.8, totalReviews: 234, plan: 'starter'
  });

  // Create sample products
  const products = [
    { pharmacist: pharm1._id, name: 'Paracetamol 500mg', genericName: 'Paracetamol', brand: 'Panadol', category: 'pain-relief', type: 'OTC', price: 280, stock: 500, unit: '100 tablets', dosage: '500mg', form: 'tablet', description: 'Fast-acting pain relief and fever reducer. Suitable for adults and children over 12 years.', warnings: ['Do not exceed 8 tablets in 24 hours', 'Avoid with alcohol'] },
    { pharmacist: pharm1._id, name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', brand: 'Amoxil', category: 'antibiotics', type: 'Rx', price: 650, stock: 200, unit: '21 capsules', dosage: '250mg', form: 'capsule', description: 'Broad-spectrum antibiotic for bacterial infections.', requiresPrescription: true, warnings: ['Prescription required', 'Complete full course'] },
    { pharmacist: pharm2._id, name: 'Vitamin C 1000mg Effervescent', genericName: 'Ascorbic Acid', brand: 'Redoxon', category: 'vitamins', type: 'OTC', price: 420, stock: 300, unit: '20 tablets', dosage: '1000mg', form: 'effervescent tablet', description: 'Immune support with high-dose Vitamin C. Lemon flavour.' },
    { pharmacist: pharm1._id, name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', brand: 'Zirtek', category: 'cold-flu', type: 'OTC', price: 380, stock: 400, unit: '30 tablets', dosage: '10mg', form: 'tablet', description: 'Non-drowsy antihistamine for allergies, hay fever, and urticaria.' },
    { pharmacist: pharm2._id, name: 'Metformin 500mg', genericName: 'Metformin HCl', brand: 'Glucophage', category: 'diabetes', type: 'Rx', price: 520, stock: 150, unit: '60 tablets', dosage: '500mg', form: 'tablet', description: 'Type 2 diabetes management.', requiresPrescription: true },
    { pharmacist: pharm1._id, name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol', brand: 'Ventolin', category: 'respiratory', type: 'Rx', price: 1200, stock: 80, unit: '200 doses', dosage: '100mcg per dose', form: 'inhaler', description: 'Relieves bronchospasm in asthma. Fast-acting bronchodilator.', requiresPrescription: true },
    { pharmacist: pharm2._id, name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', brand: 'Brufen', category: 'pain-relief', type: 'OTC', price: 320, stock: 600, unit: '24 tablets', dosage: '400mg', form: 'tablet', description: 'Anti-inflammatory pain relief for headache, toothache, and muscle pain.', warnings: ['Take with food', 'Not for under 12'] },
    { pharmacist: pharm1._id, name: 'Hydrocortisone Cream 1%', genericName: 'Hydrocortisone', brand: 'Dermacort', category: 'dermatology', type: 'OTC', price: 350, stock: 250, unit: '30g tube', dosage: '1%', form: 'cream', description: 'Relieves itching, redness, and inflammation from eczema and insect bites.' },
  ];

  await Product.insertMany(products);

  // Create patient user
  await User.create({ name: 'Amina Khalid', email: 'patient@medihub.com', password: 'patient123456', role: 'patient', phone: '+254722345678', isVerified: true, plan: 'premium' });

  console.log('\n✅ Database seeded successfully!\n');
  console.log('─── Test Accounts ───');
  console.log('Admin:      admin@medihub.com      / admin123456');
  console.log('Pharmacist: james@pharmacare.ke    / pharm123456');
  console.log('Patient:    patient@medihub.com    / patient123456');
  console.log('─────────────────────\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
