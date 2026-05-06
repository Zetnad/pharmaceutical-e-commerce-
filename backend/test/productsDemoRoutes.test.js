const request = require('supertest');
const express = require('express');
const router = require('../src/routes/products.demo');

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/products', router);
});

test('GET /api/products returns the same envelope as the real products API', async () => {
  const res = await request(app).get('/api/products');

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.products)).toBe(true);
  expect(res.body.products.length).toBeGreaterThan(0);
  expect(res.body.total).toBeGreaterThan(0);
  expect(res.body.currentPage).toBe(1);
});

test('GET /api/products supports category and search filters', async () => {
  const categoryRes = await request(app).get('/api/products').query({ category: 'pain-relief' });
  expect(categoryRes.statusCode).toBe(200);
  expect(categoryRes.body.products.every((product) => product.category === 'pain-relief')).toBe(true);

  const searchRes = await request(app).get('/api/products').query({ search: 'cetirizine' });
  expect(searchRes.statusCode).toBe(200);
  expect(searchRes.body.products).toHaveLength(1);
  expect(searchRes.body.products[0].name).toMatch(/Cetirizine/i);
});

test('GET /api/products/:id returns a single demo product', async () => {
  const res = await request(app).get('/api/products/demo-prod-paracetamol');

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.product.name).toBe('Paracetamol 500mg');
});
