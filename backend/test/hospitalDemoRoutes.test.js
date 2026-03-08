const request = require('supertest');
const express = require('express');
const router = require('../src/routes/hospital.demo');
const demoAuth = require('../src/config/demoAuth');

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/hospital', router);
});

test('GET /api/hospital/overview returns hospital overview payload', async () => {
  const res = await request(app).get('/api/hospital/overview');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.overview.platform).toBe('MediHub HMS');
  expect(Array.isArray(res.body.overview.modules)).toBe(true);
  expect(Array.isArray(res.body.overview.facilities)).toBe(true);
});

test('GET /api/hospital/patients can filter by department', async () => {
  const res = await request(app).get('/api/hospital/patients').query({ department: 'Outpatient' });
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.total).toBeGreaterThan(0);
  expect(res.body.patients.every((patient) => patient.department === 'Outpatient')).toBe(true);
});

test('GET /api/hospital/facilities returns facility list', async () => {
  const res = await request(app).get('/api/hospital/facilities');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.facilities)).toBe(true);
  expect(res.body.facilities.length).toBeGreaterThan(0);
});

test('POST /api/hospital/facilities requires admin role', async () => {
  const nurseToken = demoAuth.issue('nurse.facility@demo.local', 60, { role: 'nurse', name: 'Facility Nurse' }).token;
  const deniedRes = await request(app)
    .post('/api/hospital/facilities')
    .set('Authorization', `Bearer ${nurseToken}`)
    .send({ name: 'Unauthorized Facility' });
  expect(deniedRes.statusCode).toBe(403);

  const adminToken = demoAuth.issue('admin.facility@demo.local', 60, { role: 'admin', name: 'Facility Admin' }).token;
  const okRes = await request(app)
    .post('/api/hospital/facilities')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'New Executive Facility', totalBeds: 10, occupiedBeds: 4 });
  expect(okRes.statusCode).toBe(201);
  expect(okRes.body.success).toBe(true);
  expect(okRes.body.facility.name).toBe('New Executive Facility');
});

test('GET /api/hospital/patients/:id returns patient detail payload', async () => {
  const listRes = await request(app).get('/api/hospital/patients');
  const patientId = listRes.body.patients[0].id;
  const res = await request(app).get(`/api/hospital/patients/${patientId}`);
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.patient.id).toBe(patientId);
  expect(res.body.patient.insuranceProfiles).toBeDefined();
});

test('POST /api/hospital/patients registers a patient', async () => {
  const issued = demoAuth.issue('nurse@demo.local', 60, { role: 'nurse', name: 'Demo Nurse' });
  const res = await request(app)
    .post('/api/hospital/patients')
    .set('Authorization', `Bearer ${issued.token}`)
    .send({
      name: 'Janet Otieno',
      gender: 'female',
      age: 42,
      phone: '+254700999888',
      visitType: 'OPD',
      department: 'Outpatient',
      facilityId: 'fac-main',
      insuranceProvider: 'SHA',
      insuranceMemberNumber: 'SHA-009991'
    });

  expect(res.statusCode).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.patient.name).toBe('Janet Otieno');
  expect(res.body.patient.mrn).toMatch(/^MH-\d+$/);
  expect(res.body.patient.currentStatus).toBe('registered');
});

test('POST /api/hospital/patients requires write auth', async () => {
  const res = await request(app)
    .post('/api/hospital/patients')
    .send({ name: 'Unauthorized User', visitType: 'OPD', department: 'Outpatient', facilityId: 'fac-main' });
  expect(res.statusCode).toBe(401);
});

test('POST /api/hospital/claims enforces finance/admin role', async () => {
  const nurseToken = demoAuth.issue('nurse2@demo.local', 60, { role: 'nurse', name: 'Another Nurse' }).token;
  const deniedRes = await request(app)
    .post('/api/hospital/claims')
    .set('Authorization', `Bearer ${nurseToken}`)
    .send({ patientId: 'pt-1001', payer: 'SHA', amount: 1000 });
  expect(deniedRes.statusCode).toBe(403);

  const financeToken = demoAuth.issue('finance@demo.local', 60, { role: 'finance', name: 'Demo Finance' }).token;
  const okRes = await request(app)
    .post('/api/hospital/claims')
    .set('Authorization', `Bearer ${financeToken}`)
    .send({ patientId: 'pt-1001', payer: 'SHA', amount: 1000 });
  expect(okRes.statusCode).toBe(201);
  expect(okRes.body.success).toBe(true);
});

test('PUT /api/hospital/encounters/:id updates encounter status', async () => {
  const roleToken = demoAuth.issue('doctor@demo.local', 60, { role: 'doctor', name: 'Demo Doctor' }).token;
  const createRes = await request(app)
    .post('/api/hospital/encounters')
    .set('Authorization', `Bearer ${roleToken}`)
    .send({
      patientId: 'pt-1001',
      facilityId: 'fac-main',
      department: 'Outpatient',
      encounterType: 'outpatient',
      assignedRole: 'doctor',
      status: 'active',
      nextAction: 'Review laboratory findings'
    });

  expect(createRes.statusCode).toBe(201);
  const encounterId = createRes.body.encounter.id;

  const updateRes = await request(app)
    .put(`/api/hospital/encounters/${encounterId}`)
    .set('Authorization', `Bearer ${roleToken}`)
    .send({ status: 'discharged', nextAction: 'Complete discharge counseling' });

  expect(updateRes.statusCode).toBe(200);
  expect(updateRes.body.encounter.status).toBe('discharged');
});

test('GET /api/hospital/encounters/:id returns encounter detail payload', async () => {
  const res = await request(app).get('/api/hospital/encounters');
  const encounterId = res.body.encounters[0].id;
  const detailRes = await request(app).get(`/api/hospital/encounters/${encounterId}`);
  expect(detailRes.statusCode).toBe(200);
  expect(detailRes.body.success).toBe(true);
  expect(detailRes.body.encounter.id).toBe(encounterId);
  expect(detailRes.body.encounter).toHaveProperty('triageNotes');
});

test('GET /api/hospital/claims returns claims summary', async () => {
  const res = await request(app).get('/api/hospital/claims');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.summary.totalClaims).toBeGreaterThan(0);
  expect(Array.isArray(res.body.claims)).toBe(true);
});

test('GET /api/hospital/claims supports status filtering', async () => {
  const res = await request(app).get('/api/hospital/claims').query({ status: 'pending-authorization' });
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.claims.every((claim) => claim.status === 'pending-authorization')).toBe(true);
});
