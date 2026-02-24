const request = require('supertest');
const express = require('express');
const router = require('../src/routes/pharmacists.demo');
const auth = require('../src/config/demoAuth');

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/pharmacists', router);
});

test('GET /api/pharmacists returns demo list', async () => {
  const res = await request(app).get('/api/pharmacists');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.pharmacists)).toBe(true);
});

test('PUT /api/pharmacists/:id/plan requires token', async () => {
  const res = await request(app).put('/api/pharmacists/demo1/plan').send({ plan: 'growth' });
  expect(res.statusCode).toBe(401);
});

test('PUT /api/pharmacists/:id/plan with demo token succeeds', async () => {
  const issued = auth.issue('admin@demo.local', 60);
  const token = issued.token;
  const res = await request(app).put('/api/pharmacists/demo1/plan').set('Authorization', `Bearer ${token}`).send({ plan: 'growth' });
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
});
