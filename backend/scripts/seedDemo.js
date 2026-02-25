/*
 seedDemo.js
 Simple seeding script to add demo data into a real MongoDB instance.
 Run with: node backend/scripts/seedDemo.js
 Make sure MONGODB_URI is set in the environment or backend/.env
*/
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../../backend/.env' });
const Pharmacist = require('../src/models/Pharmacist');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Aborting seed.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for seeding.');

  try {
    // Clean a small subset (careful in production)
    await Pharmacist.deleteMany({ demoSeed: true });
    await User.deleteMany({ demoSeed: true });
    await Product.deleteMany({ demoSeed: true });
    await Order.deleteMany({ demoSeed: true });

    // Create demo users
    const u1 = await User.create({ name: 'Amina Khalid', email: 'amina@demo.local', password: 'Password1!', phone: '+254700111222', role: 'patient', demoSeed: true });
    const u2 = await User.create({ name: 'Samuel Waweru', email: 'samuel@demo.local', password: 'Password1!', phone: '+254700333444', role: 'patient', demoSeed: true });

    // Create demo pharmacists
    const p1 = await Pharmacist.create({ user: u1._id, pharmacyName: 'PharmaCare Nairobi', licenseNumber: 'LIC-DEM-001', plan: 'starter', status: 'verified', phone: '+254700111222', demoSeed: true });
    const p2 = await Pharmacist.create({ user: u2._id, pharmacyName: 'MediPlus Pharmacy', licenseNumber: 'LIC-DEM-002', plan: 'growth', status: 'verified', phone: '+254700333444', demoSeed: true });

    // Create demo products
    const prod1 = await Product.create({ name: 'Paracetamol 500mg', description: 'Pain reliever', price: 50, pharmacist: p1._id, isActive: true, demoSeed: true });
    const prod2 = await Product.create({ name: 'Cough Syrup', description: 'Cough relief', price: 200, pharmacist: p2._id, isActive: true, demoSeed: true });

    // Create demo orders linking patients and pharmacists
    await Order.create({ user: u1._id, items: [{ product: prod1._id, qty: 2, price: prod1.price, pharmacist: p1._id }], totalAmount: prod1.price * 2, shippingAddress: {}, orderStatus: 'delivered', demoSeed: true });
    await Order.create({ user: u2._id, items: [{ product: prod2._id, qty: 1, price: prod2.price, pharmacist: p2._id }], totalAmount: prod2.price, shippingAddress: {}, orderStatus: 'processing', demoSeed: true });

    console.log('Demo data seeded successfully.');
  } catch (e) {
    console.error('Seeding failed:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
