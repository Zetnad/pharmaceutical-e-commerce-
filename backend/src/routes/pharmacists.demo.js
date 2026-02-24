const express = require('express');
const router = express.Router();

// In-memory demo data
const demoPharmacists = [
  { _id: 'demo1', pharmacyName: 'PharmaCare Nairobi', plan: 'starter', patientsCount: 312, phone: '+254700111222', status: 'verified' },
  { _id: 'demo2', pharmacyName: 'MediPlus Pharmacy', plan: 'growth', patientsCount: 128, phone: '+254700333444', status: 'verified' }
];

const demoPatients = {
  demo1: [
    { id: 'u1', name: 'Amina Khalid', phone: '+254700111222', email: 'amina@example.com', lastVisit: '2026-02-20' },
    { id: 'u3', name: 'Peter Otieno', phone: '+254700555666', email: 'peter@example.com', lastVisit: '2026-01-15' }
  ],
  demo2: [
    { id: 'u2', name: 'Samuel Waweru', phone: '+254700333444', email: 'samuel@example.com', lastVisit: '2026-02-10' }
  ]
};

// GET /api/pharmacists  (public)
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Demo pharmacists', pharmacists: demoPharmacists });
});

// GET /api/pharmacists/:id  (public)
router.get('/:id', (req, res) => {
  const p = demoPharmacists.find(x => x._id === req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Demo pharmacist', pharmacist: p, products: [] });
});

// GET /api/pharmacists/:id/patients
router.get('/:id/patients', (req, res) => {
  const id = req.params.id;
  const list = demoPatients[id] || [];
  res.json({ success: true, message: 'Demo patients', patients: list });
});

// PUT /api/pharmacists/:id/plan (admin) — in demo mode we just update memory
router.put('/:id/plan', (req, res) => {
  const id = req.params.id;
  const p = demoPharmacists.find(x => x._id === id);
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  const { plan } = req.body;
  if (!plan || !['starter', 'growth', 'enterprise'].includes(plan)) return res.status(400).json({ success: false, message: 'Invalid plan' });
  p.plan = plan;
  res.json({ success: true, message: 'Demo plan updated', pharmacist: p });
});

module.exports = router;
