const Facility = require('../models/Facility');
const Patient = require('../models/Patient');
const Encounter = require('../models/Encounter');
const Claim = require('../models/Claim');
const User = require('../models/User');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');

const buildMrn = async () => {
  const count = await Patient.countDocuments();
  return `MH-${1001 + count}`;
};

const buildEncounterNumber = async () => {
  const count = await Encounter.countDocuments();
  return `ENC-${1001 + count}`;
};

const buildClaimNumber = async () => {
  const count = await Claim.countDocuments();
  return `CLM-${1001 + count}`;
};

const parseName = (name = '') => {
  const trimmed = String(name).trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts.shift(),
    lastName: parts.join(' ') || 'Unknown'
  };
};

const staffRoles = ['doctor', 'nurse', 'clinical_officer', 'pharmacist', 'lab_technologist', 'radiographer', 'finance', 'hr', 'admin'];

const serializePatient = (patient) => ({
  id: patient._id,
  mrn: patient.mrn,
  name: `${patient.firstName} ${patient.lastName}`.trim(),
  gender: patient.gender,
  phone: patient.phone,
  visitType: patient.visitType,
  triageLevel: patient.triageLevel,
  department: patient.department,
  facilityId: patient.facility?._id || patient.facility,
  facilityName: patient.facility?.name || null,
  insurance: patient.insuranceProfiles?.[0] || null,
  currentStatus: patient.currentStatus,
  allergies: patient.allergies || []
});

const serializeEncounter = (encounter) => ({
  id: encounter._id,
  encounterNumber: encounter.encounterNumber,
  patientId: encounter.patient?._id || encounter.patient || null,
  patientName: encounter.patient?.firstName ? `${encounter.patient.firstName} ${encounter.patient.lastName}`.trim() : null,
  encounterType: encounter.encounterType,
  department: encounter.department,
  facilityId: encounter.facility?._id || encounter.facility,
  facilityName: encounter.facility?.name || null,
  assignedTo: encounter.assignedTo?.name || null,
  assignedRole: encounter.assignedRole,
  status: encounter.status,
  nextAction: encounter.nextAction,
  claimStatus: encounter.claimStatus
});

const serializeClaim = (claim) => ({
  id: claim._id,
  claimNumber: claim.claimNumber,
  patientName: claim.patient?.firstName ? `${claim.patient.firstName} ${claim.patient.lastName}`.trim() : null,
  payer: claim.payer,
  amount: claim.amount,
  status: claim.status,
  stage: claim.stage,
  denialRisk: claim.denialRisk,
  facilityName: claim.facility?.name || null
});

// @route  GET /api/hospital/overview
exports.getOverview = asyncHandler(async (req, res) => {
  const [facilities, totalPatients, totalClaims, totalStaff, recentEncounters] = await Promise.all([
    Facility.find({ isActive: true }).sort('name'),
    Patient.countDocuments({ isActive: true }),
    Claim.countDocuments(),
    User.countDocuments({ role: { $in: staffRoles }, isActive: true }),
    Encounter.find().sort('-createdAt').limit(5).populate('patient', 'mrn firstName lastName').populate('assignedTo', 'name role')
  ]);

  const totalBeds = facilities.reduce((sum, facility) => sum + (facility.totalBeds || 0), 0);
  const occupiedBeds = facilities.reduce((sum, facility) => sum + (facility.occupiedBeds || 0), 0);
  const criticalStockAlerts = facilities.reduce((sum, facility) => sum + (facility.pharmacyAlerts || []).length, 0);
  const rosterGaps = facilities.reduce((sum, facility) => sum + (facility.staffingAlerts || []).length, 0);
  const patientsToday = facilities.reduce((sum, facility) => sum + (facility.operationalMetrics?.patientsToday || 0), 0);

  const claimSummary = await Claim.aggregate([
    {
      $group: {
        _id: null,
        submitted: {
          $sum: {
            $cond: [{ $in: ['$status', ['submitted', 'partially-paid', 'paid']] }, 1, 0]
          }
        },
        accepted: {
          $sum: {
            $cond: [{ $in: ['$status', ['partially-paid', 'paid']] }, 1, 0]
          }
        }
      }
    }
  ]);

  const submittedClaims = claimSummary[0]?.submitted || 0;
  const acceptedClaims = claimSummary[0]?.accepted || 0;

  sendSuccess(res, 200, 'Hospital overview fetched.', {
    overview: {
      platform: 'MediHub HMS',
      modules: [
        'patient_administration',
        'emr_and_encounters',
        'doctor_nurse_clinical_officer_workflows',
        'hospital_pharmacy',
        'billing_and_claims',
        'staffing_and_payroll',
        'executive_analytics',
        'ai_governance'
      ],
      facilities: facilities.map((facility) => ({
        id: facility._id,
        name: facility.name,
        code: facility.code,
        type: facility.type,
        location: facility.location?.city || facility.location?.county || facility.location?.country,
        beds: facility.totalBeds,
        occupancyRate: facility.totalBeds ? facility.occupiedBeds / facility.totalBeds : 0,
        services: facility.services || []
      })),
      kpis: {
        totalPatients,
        totalPatientsToday: patientsToday,
        occupancyRate: totalBeds ? occupiedBeds / totalBeds : 0,
        claimsAcceptanceRate: submittedClaims ? acceptedClaims / submittedClaims : 0,
        totalClaims,
        totalStaff,
        criticalStockAlerts,
        rosterGaps
      },
      aiGovernance: {
        enabled: true,
        approvedUseCases: ['ambient_documentation', 'triage_support', 'claims_readiness', 'medication_safety'],
        humanReviewRequired: true
      },
      recentEncounters: recentEncounters.map((encounter) => ({
        id: encounter._id,
        encounterNumber: encounter.encounterNumber,
        patientName: encounter.patient ? `${encounter.patient.firstName} ${encounter.patient.lastName}`.trim() : 'Unknown Patient',
        assignedTo: encounter.assignedTo?.name || null,
        status: encounter.status,
        nextAction: encounter.nextAction
      }))
    }
  });
});

// @route  GET /api/hospital/facilities
exports.getFacilities = asyncHandler(async (req, res) => {
  const facilities = await Facility.find({ isActive: true }).sort('name');
  sendSuccess(res, 200, 'Facilities fetched.', {
    facilities: facilities.map((facility) => ({
      id: facility._id,
      name: facility.name,
      code: facility.code,
      type: facility.type,
      location: facility.location?.city || facility.location?.county || facility.location?.country,
      totalBeds: facility.totalBeds,
      occupiedBeds: facility.occupiedBeds,
      occupancyRate: facility.totalBeds ? facility.occupiedBeds / facility.totalBeds : 0,
      services: facility.services || [],
      patientsToday: facility.operationalMetrics?.patientsToday || 0,
      claimsAcceptanceRate: facility.operationalMetrics?.claimsAcceptanceRate || 0,
      projectedPayrollKes: facility.operationalMetrics?.projectedPayrollKes || 0,
      overtimeExposureKes: facility.operationalMetrics?.overtimeExposureKes || 0,
      pharmacyAlerts: facility.pharmacyAlerts || [],
      staffingAlerts: facility.staffingAlerts || [],
      executiveAlerts: facility.executiveAlerts || []
    }))
  });
});

// @route  GET /api/hospital/patients
exports.getPatients = asyncHandler(async (req, res) => {
  const { status, department, q, facilityId } = req.query;
  const query = { isActive: true };
  if (status) query.currentStatus = status;
  if (department) query.department = new RegExp(`^${String(department)}$`, 'i');
  if (facilityId) query.facility = facilityId;
  if (q) {
    query.$or = [
      { firstName: new RegExp(String(q), 'i') },
      { lastName: new RegExp(String(q), 'i') },
      { mrn: new RegExp(String(q), 'i') }
    ];
  }

  const patients = await Patient.find(query).sort('-createdAt').populate('facility', 'name code type');
  sendSuccess(res, 200, 'Hospital patients fetched.', {
    total: patients.length,
    patients: patients.map(serializePatient)
  });
});

// @route  POST /api/hospital/patients
exports.createPatient = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    name,
    gender,
    age,
    dateOfBirth,
    phone,
    email,
    nationalId,
    visitType,
    department,
    facilityId,
    insuranceProvider,
    insuranceMemberNumber,
    planName,
    emergencyContact
  } = req.body || {};

  if ((!firstName && !name) || !visitType || !department || !facilityId) {
    return sendError(res, 400, 'firstName or name, visitType, department, and facilityId are required.');
  }

  const facility = await Facility.findById(facilityId);
  if (!facility) return sendError(res, 400, 'Invalid facilityId.');

  const parsed = firstName ? { firstName, lastName: lastName || 'Unknown' } : parseName(name);
  const patient = await Patient.create({
    mrn: await buildMrn(),
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    gender: gender || 'unspecified',
    dateOfBirth: dateOfBirth || undefined,
    phone,
    email,
    nationalId,
    facility: facility._id,
    visitType,
    department,
    currentStatus: 'registered',
    triageLevel: 'pending',
    insuranceProfiles: insuranceProvider ? [{
      provider: insuranceProvider,
      memberNumber: insuranceMemberNumber || null,
      planName: planName || null,
      isPrimary: true
    }] : [],
    emergencyContact: emergencyContact || undefined
  });

  if (!dateOfBirth && age) {
    const years = Number(age);
    if (!Number.isNaN(years) && years > 0) {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - years);
      patient.dateOfBirth = dob;
      await patient.save();
    }
  }

  await patient.populate('facility', 'name code type');
  sendSuccess(res, 201, 'Patient registered successfully.', { patient: serializePatient(patient) });
});

// @route  PUT /api/hospital/patients/:id
exports.updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate('facility', 'name code type');
  if (!patient) return sendError(res, 404, 'Patient not found.');

  const {
    firstName,
    lastName,
    name,
    gender,
    dateOfBirth,
    phone,
    email,
    nationalId,
    visitType,
    department,
    triageLevel,
    currentStatus,
    facilityId,
    insuranceProvider,
    insuranceMemberNumber,
    planName,
    allergies
  } = req.body || {};

  if (name && !firstName && !lastName) {
    const parsed = parseName(name);
    patient.firstName = parsed.firstName;
    patient.lastName = parsed.lastName;
  }
  if (firstName) patient.firstName = firstName;
  if (lastName) patient.lastName = lastName;
  if (gender) patient.gender = gender;
  if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
  if (phone !== undefined) patient.phone = phone;
  if (email !== undefined) patient.email = email;
  if (nationalId !== undefined) patient.nationalId = nationalId;
  if (visitType) patient.visitType = visitType;
  if (department) patient.department = department;
  if (triageLevel) patient.triageLevel = triageLevel;
  if (currentStatus) patient.currentStatus = currentStatus;
  if (Array.isArray(allergies)) patient.allergies = allergies;
  if (facilityId) {
    const facility = await Facility.findById(facilityId);
    if (!facility) return sendError(res, 400, 'Invalid facilityId.');
    patient.facility = facility._id;
  }
  if (insuranceProvider) {
    patient.insuranceProfiles = [{
      provider: insuranceProvider,
      memberNumber: insuranceMemberNumber || null,
      planName: planName || null,
      isPrimary: true
    }];
  }

  await patient.save();
  await patient.populate('facility', 'name code type');
  sendSuccess(res, 200, 'Patient updated successfully.', { patient: serializePatient(patient) });
});

// @route  GET /api/hospital/encounters
exports.getEncounters = asyncHandler(async (req, res) => {
  const { status, department, facilityId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (department) query.department = new RegExp(`^${String(department)}$`, 'i');
  if (facilityId) query.facility = facilityId;

  const encounters = await Encounter.find(query)
    .sort('-createdAt')
    .populate('patient', 'mrn firstName lastName')
    .populate('facility', 'name code')
    .populate('assignedTo', 'name role');

  sendSuccess(res, 200, 'Hospital encounters fetched.', {
    total: encounters.length,
    encounters: encounters.map(serializeEncounter)
  });
});

// @route  POST /api/hospital/encounters
exports.createEncounter = asyncHandler(async (req, res) => {
  const {
    patientId,
    facilityId,
    department,
    encounterType,
    assignedToId,
    assignedRole,
    status,
    nextAction,
    claimStatus,
    triageNotes
  } = req.body || {};

  if (!patientId || !facilityId || !department) {
    return sendError(res, 400, 'patientId, facilityId, and department are required.');
  }

  const [patient, facility] = await Promise.all([
    Patient.findById(patientId),
    Facility.findById(facilityId)
  ]);
  if (!patient) return sendError(res, 404, 'Patient not found.');
  if (!facility) return sendError(res, 404, 'Facility not found.');

  let assignedUser = null;
  if (assignedToId) {
    assignedUser = await User.findById(assignedToId);
    if (!assignedUser) return sendError(res, 404, 'Assigned staff user not found.');
  }

  const encounter = await Encounter.create({
    patient: patient._id,
    facility: facility._id,
    encounterNumber: await buildEncounterNumber(),
    encounterType: encounterType || 'outpatient',
    department,
    assignedTo: assignedUser?._id || null,
    assignedRole: assignedRole || assignedUser?.role || null,
    status: status || 'registered',
    nextAction,
    claimStatus: claimStatus || 'self-pay',
    triageNotes
  });

  if (patient.currentStatus === 'registered') {
    patient.currentStatus = encounter.status === 'admitted' ? 'admitted' : 'under-review';
    await patient.save();
  }

  await encounter.populate('patient', 'mrn firstName lastName');
  await encounter.populate('facility', 'name code');
  await encounter.populate('assignedTo', 'name role');
  sendSuccess(res, 201, 'Encounter created successfully.', { encounter: serializeEncounter(encounter) });
});

// @route  PUT /api/hospital/encounters/:id
exports.updateEncounter = asyncHandler(async (req, res) => {
  const encounter = await Encounter.findById(req.params.id)
    .populate('patient', 'mrn firstName lastName currentStatus')
    .populate('facility', 'name code')
    .populate('assignedTo', 'name role');
  if (!encounter) return sendError(res, 404, 'Encounter not found.');

  const {
    department,
    encounterType,
    assignedToId,
    assignedRole,
    status,
    nextAction,
    claimStatus,
    triageNotes,
    diagnosisSummary
  } = req.body || {};

  if (department) encounter.department = department;
  if (encounterType) encounter.encounterType = encounterType;
  if (assignedToId) {
    const assignedUser = await User.findById(assignedToId);
    if (!assignedUser) return sendError(res, 404, 'Assigned staff user not found.');
    encounter.assignedTo = assignedUser._id;
    encounter.assignedRole = assignedRole || assignedUser.role;
  } else if (assignedRole) {
    encounter.assignedRole = assignedRole;
  }
  if (status) encounter.status = status;
  if (nextAction !== undefined) encounter.nextAction = nextAction;
  if (claimStatus) encounter.claimStatus = claimStatus;
  if (triageNotes !== undefined) encounter.triageNotes = triageNotes;
  if (diagnosisSummary !== undefined) encounter.diagnosisSummary = diagnosisSummary;
  if (status === 'admitted' && !encounter.admittedAt) encounter.admittedAt = new Date();
  if (status === 'discharged') encounter.dischargedAt = new Date();

  await encounter.save();

  const patient = await Patient.findById(encounter.patient?._id || encounter.patient);
  if (patient && status) {
    if (status === 'admitted') patient.currentStatus = 'admitted';
    if (['discharged', 'closed'].includes(status)) patient.currentStatus = 'discharged';
    if (['active', 'critical-review', 'triage-complete', 'awaiting-vitals'].includes(status)) patient.currentStatus = 'under-review';
    await patient.save();
  }

  await encounter.populate('patient', 'mrn firstName lastName');
  await encounter.populate('facility', 'name code');
  await encounter.populate('assignedTo', 'name role');
  sendSuccess(res, 200, 'Encounter updated successfully.', { encounter: serializeEncounter(encounter) });
});

// @route  GET /api/hospital/staff
exports.getStaff = asyncHandler(async (req, res) => {
  const { role, department, facilityName } = req.query;
  const query = { role: { $in: staffRoles }, isActive: true };
  if (role) query.role = role;
  if (department) query['staffProfile.department'] = new RegExp(`^${String(department)}$`, 'i');
  if (facilityName) query['staffProfile.facilityName'] = new RegExp(`^${String(facilityName)}$`, 'i');

  const staff = await User.find(query).sort('name').select('-password');
  sendSuccess(res, 200, 'Hospital staff fetched.', {
    total: staff.length,
    staff
  });
});

// @route  GET /api/hospital/claims
exports.getClaims = asyncHandler(async (req, res) => {
  const claims = await Claim.find()
    .sort('-createdAt')
    .populate('patient', 'mrn firstName lastName')
    .populate('facility', 'name code');

  const summary = {
    totalClaims: claims.length,
    submitted: claims.filter((claim) => claim.status === 'submitted').length,
    pendingAuthorization: claims.filter((claim) => claim.status === 'pending-authorization').length,
    denialFollowUp: claims.filter((claim) => claim.stage === 'denial-follow-up').length
  };

  sendSuccess(res, 200, 'Hospital claims fetched.', {
    summary,
    claims: claims.map(serializeClaim)
  });
});

// @route  POST /api/hospital/claims
exports.createClaim = asyncHandler(async (req, res) => {
  const { patientId, encounterId, facilityId, payer, memberNumber, amount, status, stage, denialRisk, notes } = req.body || {};
  if (!patientId || !facilityId || !payer || amount == null) {
    return sendError(res, 400, 'patientId, facilityId, payer, and amount are required.');
  }

  const [patient, facility, encounter] = await Promise.all([
    Patient.findById(patientId),
    Facility.findById(facilityId),
    encounterId ? Encounter.findById(encounterId) : Promise.resolve(null)
  ]);

  if (!patient) return sendError(res, 404, 'Patient not found.');
  if (!facility) return sendError(res, 404, 'Facility not found.');
  if (encounterId && !encounter) return sendError(res, 404, 'Encounter not found.');

  const claim = await Claim.create({
    claimNumber: await buildClaimNumber(),
    patient: patient._id,
    encounter: encounter?._id || null,
    facility: facility._id,
    payer,
    memberNumber,
    amount: Number(amount),
    status: status || 'draft',
    stage: stage || 'eligibility-check',
    denialRisk: denialRisk || 'low',
    notes,
    submittedAt: ['submitted', 'pending-authorization', 'partially-paid', 'paid'].includes(status) ? new Date() : undefined
  });

  await claim.populate('patient', 'mrn firstName lastName');
  await claim.populate('facility', 'name code');
  sendSuccess(res, 201, 'Claim created successfully.', { claim: serializeClaim(claim) });
});

// @route  PUT /api/hospital/claims/:id
exports.updateClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id)
    .populate('patient', 'mrn firstName lastName')
    .populate('facility', 'name code');
  if (!claim) return sendError(res, 404, 'Claim not found.');

  const { payer, memberNumber, amount, status, stage, denialRisk, notes } = req.body || {};
  if (payer !== undefined) claim.payer = payer;
  if (memberNumber !== undefined) claim.memberNumber = memberNumber;
  if (amount != null) claim.amount = Number(amount);
  if (status) {
    claim.status = status;
    if (['submitted', 'pending-authorization', 'partially-paid', 'paid'].includes(status) && !claim.submittedAt) {
      claim.submittedAt = new Date();
    }
    if (status === 'paid') {
      claim.settledAt = new Date();
    }
  }
  if (stage) claim.stage = stage;
  if (denialRisk) claim.denialRisk = denialRisk;
  if (notes !== undefined) claim.notes = notes;

  await claim.save();
  await claim.populate('patient', 'mrn firstName lastName');
  await claim.populate('facility', 'name code');
  sendSuccess(res, 200, 'Claim updated successfully.', { claim: serializeClaim(claim) });
});

// @route  GET /api/hospital/pharmacy
exports.getPharmacyOverview = asyncHandler(async (req, res) => {
  const facilities = await Facility.find({ isActive: true }).select('name code pharmacyAlerts executiveAlerts');
  const stockAlerts = facilities.flatMap((facility) =>
    (facility.pharmacyAlerts || []).map((alert) => ({
      facilityId: facility._id,
      facilityName: facility.name,
      title: alert.title,
      status: alert.status,
      details: alert.details,
      metricValue: alert.metricValue
    }))
  );

  const pendingReconciliation = stockAlerts.filter((alert) =>
    /controlled|reconciliation|variance/i.test(`${alert.title} ${alert.details || ''}`)
  ).length;

  sendSuccess(res, 200, 'Hospital pharmacy status fetched.', {
    pharmacy: {
      summary: {
        totalAlerts: stockAlerts.length,
        criticalAlerts: stockAlerts.filter((alert) => ['high', 'critical'].includes(alert.status)).length
      },
      stockAlerts,
      controlledRegister: {
        pendingReconciliation,
        lastVariance: stockAlerts.find((alert) => /variance/i.test(`${alert.title} ${alert.details || ''}`))?.details || null
      }
    }
  });
});

// @route  GET /api/hospital/staffing
exports.getStaffingOverview = asyncHandler(async (req, res) => {
  const facilities = await Facility.find({ isActive: true }).select('name code staffingAlerts operationalMetrics');
  const rosterGaps = facilities.flatMap((facility) =>
    (facility.staffingAlerts || []).map((alert) => ({
      facilityId: facility._id,
      facilityName: facility.name,
      department: alert.title,
      severity: alert.status,
      details: alert.details,
      gap: alert.metricValue
    }))
  );

  const payrollSummary = facilities.reduce((summary, facility) => {
    summary.projectedPayrollKes += facility.operationalMetrics?.projectedPayrollKes || 0;
    summary.overtimeExposureKes += facility.operationalMetrics?.overtimeExposureKes || 0;
    return summary;
  }, {
    projectedPayrollKes: 0,
    overtimeExposureKes: 0,
    expiringCredentials: 0
  });

  payrollSummary.expiringCredentials = await User.countDocuments({
    role: { $in: staffRoles },
    isActive: true,
    'staffProfile.licenseNumber': { $exists: true, $ne: '' }
  });

  sendSuccess(res, 200, 'Hospital staffing status fetched.', {
    staffing: {
      rosterGaps,
      payrollSummary
    }
  });
});
