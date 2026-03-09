require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Pharmacist = require('../models/Pharmacist');
const Product = require('../models/Product');
const Facility = require('../models/Facility');
const Patient = require('../models/Patient');
const Encounter = require('../models/Encounter');
const Claim = require('../models/Claim');

const connectDB = require('./db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Pharmacist.deleteMany(),
    Product.deleteMany(),
    Facility.deleteMany(),
    Patient.deleteMany(),
    Encounter.deleteMany(),
    Claim.deleteMany()
  ]);
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

  // Create hospital staff users
  const doctor = await User.create({
    name: 'Dr. Leah Kimani',
    email: 'leah@medihub.com',
    password: 'doctor123456',
    role: 'doctor',
    phone: '+254733123456',
    isVerified: true,
    staffProfile: {
      employeeId: 'EMP-DR-001',
      department: 'Medicine',
      facilityName: 'MediHub Main Hospital',
      specialty: 'Internal Medicine',
      licenseNumber: 'KMPDC-443210',
      shiftPattern: 'day'
    }
  });

  const clinicalOfficer = await User.create({
    name: 'Kelvin Mutua',
    email: 'kelvin@medihub.com',
    password: 'co123456',
    role: 'clinical_officer',
    phone: '+254734123456',
    isVerified: true,
    staffProfile: {
      employeeId: 'EMP-CO-001',
      department: 'Outpatient',
      facilityName: 'MediHub Main Hospital',
      specialty: 'General Clinical Practice',
      licenseNumber: 'COC-11842',
      shiftPattern: 'day'
    }
  });

  const nurse = await User.create({
    name: 'Agnes Muthoni',
    email: 'agnes@medihub.com',
    password: 'nurse123456',
    role: 'nurse',
    phone: '+254735123456',
    isVerified: true,
    staffProfile: {
      employeeId: 'EMP-NR-001',
      department: 'Ward Operations',
      facilityName: 'MediHub Main Hospital',
      specialty: 'Inpatient Nursing',
      licenseNumber: 'NCK-22015',
      shiftPattern: 'day'
    }
  });

  const financeOfficer = await User.create({
    name: 'Grace Naliaka',
    email: 'grace@medihub.com',
    password: 'finance123456',
    role: 'finance',
    phone: '+254736123456',
    isVerified: true,
    staffProfile: {
      employeeId: 'EMP-FN-001',
      department: 'Claims and Billing',
      facilityName: 'MediHub Main Hospital',
      specialty: 'Revenue Cycle',
      shiftPattern: 'day'
    }
  });

  // Create hospital facilities
  const mainHospital = await Facility.create({
    name: 'MediHub Main Hospital',
    code: 'MMH',
    type: 'hospital',
    location: { address: 'Upper Hill', city: 'Nairobi', county: 'Nairobi', country: 'Kenya' },
    departments: ['Emergency', 'Medicine', 'Surgery', 'Maternity', 'Outpatient', 'Hospital Pharmacy', 'Laboratory'],
    totalBeds: 180,
    occupiedBeds: 158,
    services: ['Emergency', 'Medicine', 'Surgery', 'Maternity', 'Pharmacy', 'Laboratory'],
    operationalMetrics: {
      patientsToday: 284,
      claimsAcceptanceRate: 0.93,
      projectedPayrollKes: 3200000,
      overtimeExposureKes: 210000
    },
    pharmacyAlerts: [
      { title: 'Ceftriaxone 1g vial', status: 'high', details: 'Low stock, 3 days on hand', metricValue: 3 },
      { title: 'Controlled register variance', status: 'critical', details: 'Theatre opioid reconciliation pending sign-off', metricValue: 1 }
    ],
    staffingAlerts: [
      { title: 'Emergency nurse gap', status: 'high', details: 'Night shift short by one nurse', metricValue: 1 },
      { title: 'Weekend clinical officer gap', status: 'medium', details: 'Outpatient load forecast exceeds cover', metricValue: 1 }
    ],
    executiveAlerts: [
      { title: 'Claims documentation watch', status: 'medium', details: 'Admission notes missing for selected inpatients', metricValue: 4 }
    ]
  });

  const specialistClinic = await Facility.create({
    name: 'Riverside Specialist Clinic',
    code: 'RSC',
    type: 'clinic',
    location: { address: 'Riverside Drive', city: 'Nairobi', county: 'Nairobi', country: 'Kenya' },
    departments: ['Outpatient', 'Imaging', 'Day Procedures', 'Pharmacy'],
    totalBeds: 24,
    occupiedBeds: 10,
    services: ['Outpatient', 'Imaging', 'Day Procedures', 'Pharmacy'],
    operationalMetrics: {
      patientsToday: 92,
      claimsAcceptanceRate: 0.96,
      projectedPayrollKes: 900000,
      overtimeExposureKes: 64000
    },
    pharmacyAlerts: [
      { title: 'Insulin cartridge', status: 'medium', details: 'Expiry risk in 24 days', metricValue: 24 }
    ],
    staffingAlerts: [],
    executiveAlerts: []
  });

  const maternityCentre = await Facility.create({
    name: 'Community Maternity Centre',
    code: 'CMC',
    type: 'maternity-centre',
    location: { address: 'Thika Road', city: 'Kiambu', county: 'Kiambu', country: 'Kenya' },
    departments: ['ANC', 'Delivery', 'Newborn Care', 'Pharmacy'],
    totalBeds: 42,
    occupiedBeds: 32,
    services: ['ANC', 'Delivery', 'Newborn Care', 'Pharmacy'],
    operationalMetrics: {
      patientsToday: 36,
      claimsAcceptanceRate: 0.85,
      projectedPayrollKes: 700000,
      overtimeExposureKes: 88000
    },
    pharmacyAlerts: [],
    staffingAlerts: [
      { title: 'Midwife gap', status: 'medium', details: 'Night shift locum required', metricValue: 1 }
    ],
    executiveAlerts: [
      { title: 'Maternity denial follow-up', status: 'medium', details: 'Supporting documents required for payer review', metricValue: 2 }
    ]
  });

  // Create hospital patients
  const patient1 = await Patient.create({
    mrn: 'MH-1001',
    firstName: 'Amina',
    lastName: 'Noor',
    gender: 'female',
    phone: '+254700111222',
    facility: mainHospital._id,
    visitType: 'OPD',
    department: 'Outpatient',
    triageLevel: 'medium',
    currentStatus: 'waiting',
    allergies: ['Penicillin'],
    insuranceProfiles: [{ provider: 'SHA', memberNumber: 'SHA-022311', planName: 'National Cover', isPrimary: true }]
  });

  const patient2 = await Patient.create({
    mrn: 'MH-1002',
    firstName: 'Peter',
    lastName: 'Mwangi',
    gender: 'male',
    phone: '+254700333444',
    facility: mainHospital._id,
    visitType: 'Emergency',
    department: 'Emergency',
    triageLevel: 'high',
    currentStatus: 'under-review',
    insuranceProfiles: [{ provider: 'AAR', memberNumber: 'AAR-918221', planName: 'Corporate', isPrimary: true }]
  });

  const patient3 = await Patient.create({
    mrn: 'MH-1003',
    firstName: 'Faith',
    lastName: 'Akinyi',
    gender: 'female',
    phone: '+254700555666',
    facility: maternityCentre._id,
    visitType: 'ANC',
    department: 'ANC',
    triageLevel: 'low',
    currentStatus: 'queued',
    insuranceProfiles: [{ provider: 'Jubilee', memberNumber: 'JBL-554219', planName: 'Family', isPrimary: true }]
  });

  // Create encounters
  const encounter1 = await Encounter.create({
    patient: patient1._id,
    facility: mainHospital._id,
    encounterNumber: 'ENC-1001',
    encounterType: 'outpatient',
    department: 'Outpatient',
    assignedTo: clinicalOfficer._id,
    assignedRole: 'clinical_officer',
    status: 'triage-complete',
    nextAction: 'Consultation and malaria screen',
    claimStatus: 'eligibility-confirmed',
    triageNotes: 'Fever, sore throat, body aches for 2 days.'
  });

  const encounter2 = await Encounter.create({
    patient: patient2._id,
    facility: mainHospital._id,
    encounterNumber: 'ENC-1002',
    encounterType: 'emergency',
    department: 'Emergency',
    assignedTo: doctor._id,
    assignedRole: 'doctor',
    status: 'critical-review',
    nextAction: 'ECG, troponin, urgent physician review',
    claimStatus: 'self-pay',
    triageNotes: 'Chest discomfort on exertion.'
  });

  await Encounter.create({
    patient: patient3._id,
    facility: maternityCentre._id,
    encounterNumber: 'ENC-1003',
    encounterType: 'maternity',
    department: 'ANC',
    assignedTo: nurse._id,
    assignedRole: 'nurse',
    status: 'awaiting-vitals',
    nextAction: 'Routine ANC checks and labs',
    claimStatus: 'preauth-approved',
    triageNotes: 'Routine antenatal follow-up.'
  });

  // Create claims
  await Claim.create({
    claimNumber: 'CLM-1001',
    patient: patient3._id,
    encounter: null,
    facility: maternityCentre._id,
    payer: 'Jubilee',
    memberNumber: 'JBL-554219',
    amount: 18200,
    status: 'submitted',
    stage: 'claim-scrub-complete',
    denialRisk: 'low',
    submittedAt: new Date()
  });

  await Claim.create({
    claimNumber: 'CLM-1002',
    patient: patient1._id,
    encounter: encounter1._id,
    facility: mainHospital._id,
    payer: 'SHA',
    memberNumber: 'SHA-022311',
    amount: 42800,
    status: 'pending-authorization',
    stage: 'waiting-supporting-documents',
    denialRisk: 'medium'
  });

  await Claim.create({
    claimNumber: 'CLM-1003',
    patient: patient2._id,
    encounter: encounter2._id,
    facility: mainHospital._id,
    payer: 'AAR',
    memberNumber: 'AAR-918221',
    amount: 61400,
    status: 'partially-paid',
    stage: 'denial-follow-up',
    denialRisk: 'high',
    submittedAt: new Date()
  });

  console.log('\n✅ Database seeded successfully!\n');
  console.log('─── Test Accounts ───');
  console.log('Admin:      admin@medihub.com      / admin123456');
  console.log('Pharmacist: james@pharmacare.ke    / pharm123456');
  console.log('Patient:    patient@medihub.com    / patient123456');
  console.log('Doctor:     leah@medihub.com       / doctor123456');
  console.log('Clin. Off.: kelvin@medihub.com     / co123456');
  console.log('Nurse:      agnes@medihub.com      / nurse123456');
  console.log('Finance:    grace@medihub.com      / finance123456');
  console.log('─────────────────────\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
