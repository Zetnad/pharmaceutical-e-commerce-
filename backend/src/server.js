const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const pharmacistRoutes = require('./routes/pharmacists');
const pharmacistDemoRoutes = require('./routes/pharmacists.demo');
const aiRoutes = require('./routes/ai');
const prescriptionRoutes = require('./routes/prescriptions');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const { resolveTenant } = require('./middleware/tenantResolver');

const app = express();

// ─── Connect Database (skip and run demo pharmacists routes if no DB URI provided) ───
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.warn('⚠️ MONGODB_URI not set — running in demo mode for pharmacists routes');
}

// ─── Security Middleware ───
app.use(helmet());

// ─── CORS ───
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-domain', 'X-Tenant-Domain']
}));

// ─── Rate Limiting ───
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: 'AI request limit reached. Please wait a moment.' }
});

app.use('/api/', limiter);
app.use('/api/ai/', aiLimiter);

// ─── Body Parsers ───
// Raw body for Stripe webhooks (must be before express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logger ───
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files (uploads) ───
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MediHub HMS API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    demo: !process.env.MONGODB_URI
  });
});

// ─── Tenant Resolver Middleware ───
app.use('/api', resolveTenant);

// ─── Public Store Info Endpoint ───
app.get('/api/store', (req, res) => {
  if (req.tenant) {
    return res.json({ success: true, data: { name: req.tenant.pharmacyName, theme: req.tenant.theme, subdomain: req.tenant.subdomain } });
  }
  return res.json({ success: false, message: 'Not a tenant domain' });
});

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
// Mount pharmacists routes; prefer real routes when DB is configured, otherwise use demo router
if (process.env.MONGODB_URI) {
  app.use('/api/pharmacists', pharmacistRoutes);
} else {
  app.use('/api/pharmacists', pharmacistDemoRoutes);
}
app.use('/api/ai', aiRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Start Server ───
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 MediHub HMS Backend running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api\n`);
});

module.exports = app;
