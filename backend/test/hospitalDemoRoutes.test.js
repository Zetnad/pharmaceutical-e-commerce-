const request = require('supertest');
const express = require('express');
const router = require('../src/routes/hospital.demo');

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

test('POST /api/hospital/patients registers a patient', async () => {
  const res = await request(app)
    .post('/api/hospital/patients')
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

test('GET /api/hospital/claims returns claims summary', async () => {
  const res = await request(app).get('/api/hospital/claims');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.summary.totalClaims).toBeGreaterThan(0);
  expect(Array.isArray(res.body.claims)).toBe(true);
});
