const express = require('express');
const { protectHospitalWrite, authorizeHospitalRoles } = require('../middleware/auth');

const router = express.Router();

const facilities = [
  {
    id: 'fac-main',
    name: 'MediHub Main Hospital',
    type: 'hospital',
    location: 'Nairobi',
    beds: 180,
    occupancyRate: 0.88,
    services: ['Emergency', 'Medicine', 'Surgery', 'Maternity', 'Pharmacy', 'Laboratory'],
    patientsToday: 284,
    claimsAcceptanceRate: 0.94,
    projectedPayrollKes: 3200000,
    overtimeExposureKes: 210000,
    pharmacyAlerts: 2,
    staffingAlerts: 2,
    priority: 'ICU night cover'
  },
  {
    id: 'fac-clinic',
    name: 'Riverside Specialist Clinic',
    type: 'clinic',
    location: 'Nairobi',
    beds: 24,
    occupancyRate: 0.41,
    services: ['Outpatient', 'Imaging', 'Day Procedures', 'Pharmacy'],
    patientsToday: 92,
    claimsAcceptanceRate: 0.96,
    projectedPayrollKes: 900000,
    overtimeExposureKes: 64000,
    pharmacyAlerts: 1,
    staffingAlerts: 0,
    priority: 'Scale imaging slots'
  },
  {
    id: 'fac-maternity',
    name: 'Community Maternity Centre',
    type: 'maternity-centre',
    location: 'Kiambu',
    beds: 42,
    occupancyRate: 0.76,
    services: ['ANC', 'Delivery', 'Newborn Care', 'Pharmacy'],
    patientsToday: 36,
    claimsAcceptanceRate: 0.85,
    projectedPayrollKes: 700000,
    overtimeExposureKes: 88000,
    pharmacyAlerts: 0,
    staffingAlerts: 1,
    priority: 'Midwife locum + payer follow-up'
  }
];

const staff = [
  {
    id: 'stf-001',
    name: 'Dr. Leah Kimani',
    role: 'doctor',
    department: 'Medicine',
    facilityId: 'fac-main',
    shift: 'day',
    status: 'on-duty',
    licenseNumber: 'KMPDC-443210',
    workload: 0.74
  },
  {
    id: 'stf-002',
    name: 'Kelvin Mutua',
    role: 'clinical_officer',
    department: 'Outpatient',
    facilityId: 'fac-main',
    shift: 'day',
    status: 'on-duty',
    licenseNumber: 'COC-11842',
    workload: 0.84
  },
  {
    id: 'stf-003',
    name: 'Agnes Muthoni',
    role: 'nurse',
    department: 'Ward Operations',
    facilityId: 'fac-main',
    shift: 'day',
    status: 'handover-lead',
    licenseNumber: 'NCK-22015',
    workload: 0.91
  },
  {
    id: 'stf-004',
    name: 'Brian Omondi',
    role: 'pharmacist',
    department: 'Hospital Pharmacy',
    facilityId: 'fac-main',
    shift: 'day',
    status: 'on-duty',
    licenseNumber: 'PPB-99831',
    workload: 0.69
  },
  {
    id: 'stf-005',
    name: 'Grace Naliaka',
    role: 'finance',
    department: 'Claims and Billing',
    facilityId: 'fac-main',
    shift: 'day',
    status: 'on-duty',
    licenseNumber: null,
    workload: 0.72
  },
  {
    id: 'stf-006',
    name: 'Janet Wanjiru',
    role: 'hr',
    department: 'Workforce Management',
    facilityId: 'fac-main',
    shift: 'day',
    status: 'on-duty',
    licenseNumber: null,
    workload: 0.58
  }
];

const patients = [
  {
    id: 'pt-1001',
    mrn: 'MH-1001',
    name: 'Amina Noor',
    gender: 'female',
    age: 28,
    phone: '+254700111222',
    visitType: 'OPD',
    triageLevel: 'medium',
    department: 'Outpatient',
    facilityId: 'fac-main',
    insurance: { provider: 'SHA', memberNumber: 'SHA-022311' },
    currentStatus: 'waiting',
    allergies: ['Penicillin']
  },
  {
    id: 'pt-1002',
    mrn: 'MH-1002',
    name: 'Peter Mwangi',
    gender: 'male',
    age: 54,
    phone: '+254700333444',
    visitType: 'Emergency',
    triageLevel: 'high',
    department: 'Emergency',
    facilityId: 'fac-main',
    insurance: { provider: 'AAR', memberNumber: 'AAR-918221' },
    currentStatus: 'under-review',
    allergies: []
  },
  {
    id: 'pt-1003',
    mrn: 'MH-1003',
    name: 'Faith Akinyi',
    gender: 'female',
    age: 31,
    phone: '+254700555666',
    visitType: 'ANC',
    triageLevel: 'low',
    department: 'Maternity',
    facilityId: 'fac-maternity',
    insurance: { provider: 'Jubilee', memberNumber: 'JBL-554219' },
    currentStatus: 'queued',
    allergies: []
  }
];

const encounters = [
  {
    id: 'enc-001',
    patientId: 'pt-1001',
    patientName: 'Amina Noor',
    encounterType: 'outpatient',
    department: 'Outpatient',
    assignedTo: 'Kelvin Mutua',
    assignedRole: 'clinical_officer',
    status: 'triage-complete',
    nextAction: 'Consultation and malaria screen',
    claimStatus: 'eligibility-confirmed'
  },
  {
    id: 'enc-002',
    patientId: 'pt-1002',
    patientName: 'Peter Mwangi',
    encounterType: 'emergency',
    department: 'Emergency',
    assignedTo: 'Dr. Leah Kimani',
    assignedRole: 'doctor',
    status: 'critical-review',
    nextAction: 'ECG, troponin, urgent physician review',
    claimStatus: 'self-pay-deposit'
  },
  {
    id: 'enc-003',
    patientId: 'pt-1003',
    patientName: 'Faith Akinyi',
    encounterType: 'maternity',
    department: 'ANC',
    assignedTo: 'Agnes Muthoni',
    assignedRole: 'nurse',
    status: 'awaiting-vitals',
    nextAction: 'Routine ANC checks and labs',
    claimStatus: 'preauth-not-required'
  }
];

const claims = [
  {
    id: 'clm-001',
    patientName: 'Faith Akinyi',
    payer: 'Jubilee',
    amount: 18200,
    status: 'submitted',
    stage: 'claim-scrub-complete',
    denialRisk: 'low'
  },
  {
    id: 'clm-002',
    patientName: 'David Kiptoo',
    payer: 'SHA',
    amount: 42800,
    status: 'pending-authorization',
    stage: 'waiting-supporting-documents',
    denialRisk: 'medium'
  },
  {
    id: 'clm-003',
    patientName: 'Mercy Njeri',
    payer: 'AAR',
    amount: 61400,
    status: 'partially-paid',
    stage: 'denial-follow-up',
    denialRisk: 'high'
  }
];

const pharmacy = {
  dispensingQueue: [
    {
      prescriptionId: 'rx-1001',
      patientName: 'Amina Noor',
      source: 'OPD',
      status: 'verification-pending',
      note: 'Check penicillin allergy before release'
    },
    {
      prescriptionId: 'rx-1002',
      patientName: 'Daniel Kiptoo',
      source: 'Surgical Ward',
      status: 'ward-refill',
      note: 'Analgesia refill due in 45 minutes'
    }
  ],
  stockAlerts: [
    { item: 'Ceftriaxone 1g vial', status: 'low-stock', daysOnHand: 3 },
    { item: 'Insulin cartridge', status: 'expiry-risk', daysToExpiry: 24 },
    { item: 'Blood gas cartridge', status: 'critical', daysOnHand: 2 }
  ],
  controlledRegister: {
    pendingReconciliation: 1,
    lastVariance: 'Theatre opioid balance mismatch pending sign-off'
  }
};

const staffing = {
  rosterGaps: [
    { department: 'Emergency', role: 'nurse', shift: 'night', gap: 1, severity: 'high' },
    { department: 'Maternity', role: 'midwife', shift: 'night', gap: 1, severity: 'medium' },
    { department: 'Outpatient', role: 'clinical_officer', shift: 'weekend', gap: 1, severity: 'medium' }
  ],
  payrollSummary: {
    projectedPayrollKes: 4800000,
    overtimeExposureKes: 362000,
    locumExposureKes: 91000,
    expiringCredentials: 7
  }
};

const modules = [
  'patient_administration',
  'emr_and_encounters',
  'doctor_nurse_clinical_officer_workflows',
  'hospital_pharmacy',
  'billing_and_claims',
  'staffing_and_payroll',
  'executive_analytics',
  'ai_governance'
];

const nextMrnNumber = () => {
  const highest = patients.reduce((max, patient) => {
    const value = Number(String(patient.mrn || '').split('-')[1] || 0);
    return Math.max(max, value);
  }, 1000);
  return `MH-${highest + 1}`;
};

const nextEncounterNumber = () => {
  const highest = encounters.reduce((max, encounter) => {
    const value = Number(String(encounter.encounterNumber || encounter.id || '').split('-')[1] || 0);
    return Math.max(max, value);
  }, 1000);
  return `ENC-${highest + 1}`;
};

const nextClaimNumber = () => {
  const highest = claims.reduce((max, claim) => {
    const value = Number(String(claim.claimNumber || claim.id || '').split('-')[1] || 0);
    return Math.max(max, value);
  }, 1000);
  return `CLM-${highest + 1}`;
};

router.get('/overview', (req, res) => {
  return res.json({
    success: true,
    message: 'Hospital overview fetched.',
    overview: {
      platform: 'MediHub HMS',
      modules,
      facilities,
      kpis: {
        totalPatientsToday: 412,
        occupancyRate: 0.84,
        claimsAcceptanceRate: 0.91,
        criticalStockAlerts: pharmacy.stockAlerts.length,
        rosterGaps: staffing.rosterGaps.length
      },
      aiGovernance: {
        enabled: true,
        approvedUseCases: ['ambient_documentation', 'triage_support', 'claims_readiness', 'medication_safety'],
        humanReviewRequired: true
      }
    }
  });
});

router.get('/facilities', (req, res) => {
  return res.json({
    success: true,
    message: 'Facilities fetched.',
    facilities
  });
});

router.get('/facilities/:id', (req, res) => {
  const facility = facilities.find((item) => item.id === req.params.id);
  if (!facility) return res.status(404).json({ success: false, message: 'Facility not found.' });
  return res.json({ success: true, message: 'Facility fetched.', facility });
});

router.post('/facilities', protectHospitalWrite, authorizeHospitalRoles('admin'), (req, res) => {
  const {
    name,
    code,
    type,
    city,
    county,
    country,
    totalBeds,
    occupiedBeds,
    departments,
    services,
    patientsToday,
    claimsAcceptanceRate,
    projectedPayrollKes,
    overtimeExposureKes
  } = req.body || {};

  if (!name) return res.status(400).json({ success: false, message: 'Facility name is required.' });

  const facility = {
    id: `fac-${Date.now()}`,
    name,
    code: code || '',
    type: type || 'hospital',
    location: city || county || country || 'Kenya',
    beds: Number(totalBeds || 0),
    totalBeds: Number(totalBeds || 0),
    occupiedBeds: Number(occupiedBeds || 0),
    occupancyRate: Number(totalBeds || 0) ? Number(occupiedBeds || 0) / Number(totalBeds || 1) : 0,
    services: Array.isArray(services) ? services : String(services || '').split(',').map((item) => item.trim()).filter(Boolean),
    departments: Array.isArray(departments) ? departments : String(departments || '').split(',').map((item) => item.trim()).filter(Boolean),
    patientsToday: Number(patientsToday || 0),
    claimsAcceptanceRate: Number(claimsAcceptanceRate || 0),
    projectedPayrollKes: Number(projectedPayrollKes || 0),
    overtimeExposureKes: Number(overtimeExposureKes || 0),
    pharmacyAlerts: 0,
    staffingAlerts: 0,
    priority: 'New facility created'
  };
  facilities.push(facility);
  return res.status(201).json({ success: true, message: 'Facility created successfully.', facility });
});

router.put('/facilities/:id', protectHospitalWrite, authorizeHospitalRoles('admin'), (req, res) => {
  const facility = facilities.find((item) => item.id === req.params.id);
  if (!facility) return res.status(404).json({ success: false, message: 'Facility not found.' });

  const {
    name,
    code,
    type,
    city,
    county,
    country,
    totalBeds,
    occupiedBeds,
    departments,
    services,
    patientsToday,
    claimsAcceptanceRate,
    projectedPayrollKes,
    overtimeExposureKes
  } = req.body || {};

  if (name !== undefined) facility.name = name;
  if (code !== undefined) facility.code = code;
  if (type !== undefined) facility.type = type;
  if (city !== undefined || county !== undefined || country !== undefined) facility.location = city || county || country || facility.location;
  if (totalBeds != null) {
    facility.beds = Number(totalBeds);
    facility.totalBeds = Number(totalBeds);
  }
  if (occupiedBeds != null) {
    facility.occupiedBeds = Number(occupiedBeds);
    facility.occupancyRate = facility.beds ? Number(occupiedBeds) / facility.beds : 0;
  }
  if (departments !== undefined) facility.departments = Array.isArray(departments) ? departments : String(departments || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (services !== undefined) facility.services = Array.isArray(services) ? services : String(services || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (patientsToday != null) facility.patientsToday = Number(patientsToday);
  if (claimsAcceptanceRate != null) facility.claimsAcceptanceRate = Number(claimsAcceptanceRate);
  if (projectedPayrollKes != null) facility.projectedPayrollKes = Number(projectedPayrollKes);
  if (overtimeExposureKes != null) facility.overtimeExposureKes = Number(overtimeExposureKes);

  return res.json({ success: true, message: 'Facility updated successfully.', facility });
});

router.get('/patients', (req, res) => {
  const { status, department, q } = req.query;
  let result = [...patients];

  if (status) result = result.filter((patient) => patient.currentStatus === status);
  if (department) result = result.filter((patient) => patient.department.toLowerCase() === String(department).toLowerCase());
  if (q) {
    const term = String(q).toLowerCase();
    result = result.filter((patient) => patient.name.toLowerCase().includes(term) || patient.mrn.toLowerCase().includes(term));
  }

  return res.json({
    success: true,
    message: 'Hospital patients fetched.',
    total: result.length,
    patients: result
  });
});

router.get('/patients/:id', (req, res) => {
  const patient = patients.find((item) => item.id === req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
  return res.json({
    success: true,
    message: 'Hospital patient fetched.',
    patient: {
      ...patient,
      firstName: patient.name.split(' ')[0] || patient.name,
      lastName: patient.name.split(' ').slice(1).join(' ') || '',
      email: patient.email || null,
      nationalId: patient.nationalId || null,
      dateOfBirth: patient.dateOfBirth || null,
      bloodGroup: patient.bloodGroup || null,
      insuranceProfiles: patient.insurance ? [{ ...patient.insurance, isPrimary: true }] : [],
      emergencyContact: patient.emergencyContact || null,
      address: patient.address || {}
    }
  });
});

router.post('/patients', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), (req, res) => {
  const { name, gender, age, phone, visitType, department, facilityId, insuranceProvider, insuranceMemberNumber } = req.body || {};

  if (!name || !visitType || !department || !facilityId) {
    return res.status(400).json({
      success: false,
      message: 'name, visitType, department, and facilityId are required.'
    });
  }

  const facility = facilities.find((item) => item.id === facilityId);
  if (!facility) {
    return res.status(400).json({ success: false, message: 'Invalid facilityId.' });
  }

  const id = `pt-${Date.now()}`;
  const patient = {
    id,
    mrn: nextMrnNumber(),
    name,
    gender: gender || 'unspecified',
    age: Number(age || 0),
    phone: phone || null,
    visitType,
    triageLevel: 'pending',
    department,
    facilityId,
    insurance: {
      provider: insuranceProvider || 'self-pay',
      memberNumber: insuranceMemberNumber || null
    },
    currentStatus: 'registered',
    allergies: []
  };

  patients.push(patient);

  return res.status(201).json({
    success: true,
    message: 'Patient registered successfully.',
    patient
  });
});

router.put('/patients/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), (req, res) => {
  const patient = patients.find((item) => item.id === req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  const { name, gender, age, phone, visitType, department, triageLevel, currentStatus, insuranceProvider, insuranceMemberNumber, allergies } = req.body || {};
  if (name) patient.name = name;
  if (gender) patient.gender = gender;
  if (age != null) patient.age = Number(age);
  if (phone !== undefined) patient.phone = phone;
  if (visitType) patient.visitType = visitType;
  if (department) patient.department = department;
  if (triageLevel) patient.triageLevel = triageLevel;
  if (currentStatus) patient.currentStatus = currentStatus;
  if (Array.isArray(allergies)) patient.allergies = allergies;
  if (insuranceProvider) {
    patient.insurance = {
      provider: insuranceProvider,
      memberNumber: insuranceMemberNumber || null
    };
  }

  return res.json({ success: true, message: 'Patient updated successfully.', patient });
});

router.get('/encounters', (req, res) => {
  const { status, department } = req.query;
  let result = [...encounters];
  if (status) result = result.filter((encounter) => encounter.status === status);
  if (department) result = result.filter((encounter) => encounter.department.toLowerCase() === String(department).toLowerCase());

  return res.json({
    success: true,
    message: 'Hospital encounters fetched.',
    total: result.length,
    encounters: result
  });
});

router.get('/encounters/:id', (req, res) => {
  const encounter = encounters.find((item) => item.id === req.params.id);
  if (!encounter) return res.status(404).json({ success: false, message: 'Encounter not found.' });
  const patient = patients.find((item) => item.id === encounter.patientId);
  return res.json({
    success: true,
    message: 'Hospital encounter fetched.',
    encounter: {
      ...encounter,
      patientMrn: patient?.mrn || null,
      triageNotes: encounter.triageNotes || '',
      diagnosisSummary: encounter.diagnosisSummary || '',
      admittedAt: encounter.admittedAt || null,
      dischargedAt: encounter.dischargedAt || null
    }
  });
});

router.post('/encounters', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), (req, res) => {
  const { patientId, facilityId, department, encounterType, assignedRole, status, nextAction, claimStatus } = req.body || {};
  if (!patientId || !facilityId || !department) {
    return res.status(400).json({ success: false, message: 'patientId, facilityId, and department are required.' });
  }

  const patient = patients.find((item) => item.id === patientId);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  const encounter = {
    id: `enc-${Date.now()}`,
    encounterNumber: nextEncounterNumber(),
    patientId,
    patientName: patient.name,
    encounterType: encounterType || 'outpatient',
    department,
    assignedTo: req.body.assignedTo || null,
    assignedRole: assignedRole || null,
    status: status || 'registered',
    nextAction: nextAction || 'Clinical review pending',
    claimStatus: claimStatus || 'self-pay',
    triageNotes: req.body.triageNotes || '',
    diagnosisSummary: req.body.diagnosisSummary || ''
  };
  encounters.unshift(encounter);
  patient.currentStatus = ['admitted'].includes(encounter.status) ? 'admitted' : 'under-review';

  return res.status(201).json({ success: true, message: 'Encounter created successfully.', encounter });
});

router.put('/encounters/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), (req, res) => {
  const encounter = encounters.find((item) => item.id === req.params.id);
  if (!encounter) return res.status(404).json({ success: false, message: 'Encounter not found.' });

  const { department, encounterType, assignedTo, assignedRole, status, nextAction, claimStatus, triageNotes, diagnosisSummary } = req.body || {};
  if (department) encounter.department = department;
  if (encounterType) encounter.encounterType = encounterType;
  if (assignedTo !== undefined) encounter.assignedTo = assignedTo;
  if (assignedRole) encounter.assignedRole = assignedRole;
  if (status) encounter.status = status;
  if (nextAction !== undefined) encounter.nextAction = nextAction;
  if (claimStatus) encounter.claimStatus = claimStatus;
  if (triageNotes !== undefined) encounter.triageNotes = triageNotes;
  if (diagnosisSummary !== undefined) encounter.diagnosisSummary = diagnosisSummary;

  const patient = patients.find((item) => item.id === encounter.patientId);
  if (patient && status) {
    if (status === 'admitted') patient.currentStatus = 'admitted';
    else if (['discharged', 'closed'].includes(status)) patient.currentStatus = 'discharged';
    else patient.currentStatus = 'under-review';
  }

  return res.json({ success: true, message: 'Encounter updated successfully.', encounter });
});

router.get('/staff', (req, res) => {
  const { role, department, facilityId } = req.query;
  let result = [...staff];
  if (role) result = result.filter((member) => member.role === role);
  if (department) result = result.filter((member) => member.department.toLowerCase() === String(department).toLowerCase());
  if (facilityId) result = result.filter((member) => member.facilityId === facilityId);

  return res.json({
    success: true,
    message: 'Hospital staff fetched.',
    total: result.length,
    staff: result
  });
});

router.get('/claims', (req, res) => {
  const { status, payer, denialRisk, q } = req.query;
  let result = [...claims];
  if (status) result = result.filter((claim) => claim.status === status);
  if (payer) result = result.filter((claim) => String(claim.payer).toLowerCase() === String(payer).toLowerCase());
  if (denialRisk) result = result.filter((claim) => claim.denialRisk === denialRisk);
  if (q) {
    const term = String(q).toLowerCase();
    result = result.filter((claim) =>
      String(claim.patientName || '').toLowerCase().includes(term)
      || String(claim.payer || '').toLowerCase().includes(term)
      || String(claim.claimNumber || claim.id || '').toLowerCase().includes(term)
    );
  }

  const summary = {
    totalClaims: result.length,
    submitted: result.filter((claim) => claim.status === 'submitted').length,
    pendingAuthorization: result.filter((claim) => claim.status === 'pending-authorization').length,
    denialFollowUp: result.filter((claim) => claim.stage === 'denial-follow-up').length
  };

  return res.json({
    success: true,
    message: 'Hospital claims fetched.',
    summary,
    claims: result
  });
});

router.post('/claims', protectHospitalWrite, authorizeHospitalRoles('admin', 'finance'), (req, res) => {
  const { patientId, payer, amount, status, stage, denialRisk, notes } = req.body || {};
  const patient = patients.find((item) => item.id === patientId);
  if (!patient || !payer || amount == null) {
    return res.status(400).json({ success: false, message: 'patientId, payer, and amount are required.' });
  }

  const claim = {
    id: `clm-${Date.now()}`,
    claimNumber: nextClaimNumber(),
    patientName: patient.name,
    payer,
    amount: Number(amount),
    status: status || 'draft',
    stage: stage || 'eligibility-check',
    denialRisk: denialRisk || 'low',
    note: notes || ''
  };
  claims.unshift(claim);

  return res.status(201).json({ success: true, message: 'Claim created successfully.', claim });
});

router.put('/claims/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'finance'), (req, res) => {
  const claim = claims.find((item) => item.id === req.params.id);
  if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });

  const { payer, amount, status, stage, denialRisk, notes } = req.body || {};
  if (payer !== undefined) claim.payer = payer;
  if (amount != null) claim.amount = Number(amount);
  if (status) claim.status = status;
  if (stage) claim.stage = stage;
  if (denialRisk) claim.denialRisk = denialRisk;
  if (notes !== undefined) claim.note = notes;

  return res.json({ success: true, message: 'Claim updated successfully.', claim });
});

router.get('/pharmacy', (req, res) => {
  return res.json({
    success: true,
    message: 'Hospital pharmacy status fetched.',
    pharmacy
  });
});

router.get('/staffing', (req, res) => {
  return res.json({
    success: true,
    message: 'Hospital staffing status fetched.',
    staffing
  });
});

module.exports = router;
