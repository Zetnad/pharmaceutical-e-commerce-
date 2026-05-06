const express = require('express');

const router = express.Router();

const demoProducts = [
  {
    _id: 'demo-prod-paracetamol',
    id: 'demo-prod-paracetamol',
    pharmacist: { _id: 'demo1', pharmacyName: 'PharmaCare Nairobi', rating: 4.9 },
    pharmacistName: 'PharmaCare Nairobi',
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    brand: 'Panadol',
    category: 'pain-relief',
    type: 'OTC',
    price: 280,
    stock: 500,
    unit: '100 tablets',
    dosage: '500mg',
    form: 'tablet',
    description: 'Fast-acting pain relief and fever reducer. Suitable for adults and children over 12 years.',
    rating: 4.9,
    requiresPrescription: false,
    isActive: true
  },
  {
    _id: 'demo-prod-amoxicillin',
    id: 'demo-prod-amoxicillin',
    pharmacist: { _id: 'demo1', pharmacyName: 'PharmaCare Nairobi', rating: 4.9 },
    pharmacistName: 'PharmaCare Nairobi',
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    brand: 'Amoxil',
    category: 'antibiotics',
    type: 'Rx',
    price: 650,
    stock: 200,
    unit: '21 capsules',
    dosage: '250mg',
    form: 'capsule',
    description: 'Broad-spectrum antibiotic for bacterial infections. Prescription required.',
    rating: 4.8,
    requiresPrescription: true,
    isActive: true
  },
  {
    _id: 'demo-prod-vitamin-c',
    id: 'demo-prod-vitamin-c',
    pharmacist: { _id: 'demo2', pharmacyName: 'MediPlus Pharmacy', rating: 4.8 },
    pharmacistName: 'MediPlus Pharmacy',
    name: 'Vitamin C 1000mg Effervescent',
    genericName: 'Ascorbic Acid',
    brand: 'Redoxon',
    category: 'vitamins',
    type: 'OTC',
    price: 420,
    stock: 300,
    unit: '20 tablets',
    dosage: '1000mg',
    form: 'effervescent tablet',
    description: 'Immune support with high-dose Vitamin C. Lemon flavour.',
    rating: 4.7,
    requiresPrescription: false,
    isActive: true
  },
  {
    _id: 'demo-prod-cetirizine',
    id: 'demo-prod-cetirizine',
    pharmacist: { _id: 'demo1', pharmacyName: 'PharmaCare Nairobi', rating: 4.9 },
    pharmacistName: 'PharmaCare Nairobi',
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine HCl',
    brand: 'Zirtek',
    category: 'cold-flu',
    type: 'OTC',
    price: 380,
    stock: 400,
    unit: '30 tablets',
    dosage: '10mg',
    form: 'tablet',
    description: 'Non-drowsy antihistamine for allergies, hay fever, and urticaria.',
    rating: 4.8,
    requiresPrescription: false,
    isActive: true
  },
  {
    _id: 'demo-prod-metformin',
    id: 'demo-prod-metformin',
    pharmacist: { _id: 'demo2', pharmacyName: 'MediPlus Pharmacy', rating: 4.8 },
    pharmacistName: 'MediPlus Pharmacy',
    name: 'Metformin 500mg',
    genericName: 'Metformin HCl',
    brand: 'Glucophage',
    category: 'diabetes',
    type: 'Rx',
    price: 520,
    stock: 150,
    unit: '60 tablets',
    dosage: '500mg',
    form: 'tablet',
    description: 'Type 2 diabetes management. Prescription required.',
    rating: 4.6,
    requiresPrescription: true,
    isActive: true
  },
  {
    _id: 'demo-prod-salbutamol',
    id: 'demo-prod-salbutamol',
    pharmacist: { _id: 'demo1', pharmacyName: 'PharmaCare Nairobi', rating: 4.9 },
    pharmacistName: 'PharmaCare Nairobi',
    name: 'Salbutamol Inhaler 100mcg',
    genericName: 'Salbutamol',
    brand: 'Ventolin',
    category: 'respiratory',
    type: 'Rx',
    price: 1200,
    stock: 80,
    unit: '200 doses',
    dosage: '100mcg per dose',
    form: 'inhaler',
    description: 'Relieves bronchospasm in asthma. Fast-acting bronchodilator.',
    rating: 5.0,
    requiresPrescription: true,
    isActive: true
  },
  {
    _id: 'demo-prod-ibuprofen',
    id: 'demo-prod-ibuprofen',
    pharmacist: { _id: 'demo2', pharmacyName: 'MediPlus Pharmacy', rating: 4.8 },
    pharmacistName: 'MediPlus Pharmacy',
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    brand: 'Brufen',
    category: 'pain-relief',
    type: 'OTC',
    price: 320,
    stock: 600,
    unit: '24 tablets',
    dosage: '400mg',
    form: 'tablet',
    description: 'Anti-inflammatory pain relief for headache, toothache, and muscle pain.',
    rating: 4.7,
    requiresPrescription: false,
    isActive: true
  },
  {
    _id: 'demo-prod-hydrocortisone',
    id: 'demo-prod-hydrocortisone',
    pharmacist: { _id: 'demo1', pharmacyName: 'PharmaCare Nairobi', rating: 4.9 },
    pharmacistName: 'PharmaCare Nairobi',
    name: 'Hydrocortisone Cream 1%',
    genericName: 'Hydrocortisone',
    brand: 'Dermacort',
    category: 'dermatology',
    type: 'OTC',
    price: 350,
    stock: 250,
    unit: '30g tube',
    dosage: '1%',
    form: 'cream',
    description: 'Relieves itching, redness, and inflammation from eczema and insect bites.',
    rating: 4.7,
    requiresPrescription: false,
    isActive: true
  }
];

const normalize = (value) => String(value || '').trim().toLowerCase();

const matchesSearch = (product, search) => {
  if (!search) return true;
  const haystack = [
    product.name,
    product.genericName,
    product.brand,
    product.description,
    product.pharmacistName
  ].join(' ').toLowerCase();
  return haystack.includes(search);
};

const sortProducts = (products, sort) => {
  const sorted = [...products];
  if (sort === 'price') return sorted.sort((a, b) => a.price - b.price);
  if (sort === '-price') return sorted.sort((a, b) => b.price - a.price);
  if (sort === 'name') return sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
};

router.get('/', (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    type,
    search,
    sort = '-createdAt',
    minPrice,
    maxPrice
  } = req.query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 12);
  const min = minPrice !== undefined ? Number(minPrice) : null;
  const max = maxPrice !== undefined ? Number(maxPrice) : null;
  const searchTerm = normalize(search);
  const categoryTerm = normalize(category);
  const typeTerm = normalize(type);

  const filtered = demoProducts.filter((product) => {
    if (!product.isActive || product.stock <= 0) return false;
    if (categoryTerm && normalize(product.category) !== categoryTerm) return false;
    if (typeTerm && normalize(product.type) !== typeTerm) return false;
    if (Number.isFinite(min) && product.price < min) return false;
    if (Number.isFinite(max) && product.price > max) return false;
    return matchesSearch(product, searchTerm);
  });

  const sorted = sortProducts(filtered, sort);
  const start = (pageNumber - 1) * limitNumber;
  const products = sorted.slice(start, start + limitNumber);

  res.json({
    success: true,
    message: 'Demo products fetched.',
    products,
    total: filtered.length,
    pages: Math.ceil(filtered.length / limitNumber),
    currentPage: pageNumber,
    demo: true
  });
});

router.get('/categories', (req, res) => {
  res.json({
    success: true,
    message: 'Demo categories fetched.',
    categories: [...new Set(demoProducts.map((product) => product.category))]
  });
});

router.get('/:id', (req, res) => {
  const product = demoProducts.find((item) => item._id === req.params.id || item.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  return res.json({ success: true, message: 'Demo product fetched.', product, demo: true });
});

module.exports = router;
