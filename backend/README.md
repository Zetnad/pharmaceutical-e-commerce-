# MediHub Backend API 🏥

Production-ready Node.js/Express backend for the MediHub pharmaceutical SaaS platform.

## 🏗️ Architecture

```
medihub-backend/
├── src/
│   ├── server.js              # Entry point
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── seed.js            # Database seeder
│   ├── models/
│   │   ├── User.js            # Patient & admin accounts
│   │   ├── Pharmacist.js      # Pharmacy profiles
│   │   ├── Product.js         # Drug/product listings
│   │   ├── Order.js           # Orders with tracking
│   │   ├── Prescription.js    # Upload & verification
│   │   └── AIConsultation.js  # AI symptom sessions
│   ├── controllers/
│   │   ├── authController.js       # Register, login, reset password
│   │   ├── userController.js       # Profile, health history
│   │   ├── productController.js    # CRUD, search, reviews
│   │   ├── orderController.js      # Place, track, cancel orders
│   │   ├── pharmacistController.js # Apply, dashboard, manage
│   │   ├── aiController.js         # Claude AI symptom analysis
│   │   ├── prescriptionController.js # Upload & verify
│   │   ├── paymentController.js    # Stripe + M-Pesa
│   │   └── adminController.js      # Platform management
│   ├── routes/                # Express routers
│   ├── middleware/
│   │   ├── auth.js            # JWT protection & RBAC
│   │   ├── upload.js          # Multer file handling
│   │   └── errorHandler.js    # Centralized errors
│   └── services/
│       └── emailService.js    # Nodemailer templates
└── uploads/                   # File storage
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm / yarn

### 2. Installation
```bash
cd medihub-backend
npm install
cp .env.example .env
# Fill in your .env values
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Start Server
```bash
npm run dev      # Development (with nodemon)
npm start        # Production
```

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api`

### 🔐 Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current user |
| POST | `/auth/forgot-password` | Send reset email |
| PUT | `/auth/reset-password/:token` | Reset password |
| PUT | `/auth/change-password` | Change password (auth) |

### 👤 Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get profile |
| PUT | `/users/profile` | Update profile + avatar |
| GET | `/users/health-history` | Get health history |
| POST | `/users/health-history` | Add entry |
| POST | `/users/family-members` | Add family member (Premium) |
| PUT | `/users/upgrade-plan` | Change subscription plan |

### 💊 Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all (with filters & pagination) |
| GET | `/products?search=paracetamol` | Full-text search |
| GET | `/products?category=pain-relief` | Filter by category |
| GET | `/products?type=OTC` | OTC or Rx |
| GET | `/products/:id` | Get single product |
| POST | `/products` | List product (pharmacist) |
| PUT | `/products/:id` | Update product (pharmacist) |
| DELETE | `/products/:id` | Remove listing (pharmacist) |
| POST | `/products/:id/review` | Add review (patient) |
| GET | `/products/categories` | All categories |

### 📦 Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Place new order |
| GET | `/orders/my` | Get my orders |
| GET | `/orders/pharmacist` | Get pharmacy orders |
| GET | `/orders/:id` | Get order details |
| PUT | `/orders/:id/status` | Update status (pharmacist/admin) |
| PUT | `/orders/:id/cancel` | Cancel order (patient) |

### 🧠 AI Symptom Checker
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/analyze` | Analyze symptoms (Claude AI) |
| GET | `/ai/history` | My consultation history |
| GET | `/ai/consultation/:id` | Get single consultation |

**POST /ai/analyze Request Body:**
```json
{
  "symptoms": "I have a headache, fever of 38°C, and sore throat for 2 days",
  "sessionId": "optional-uuid"
}
```

**Response includes:** possibleConditions, suggestedMedications, urgencyLevel, selfCareAdvice, disclaimer

### 💳 Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-intent` | Stripe payment intent |
| POST | `/payments/webhook` | Stripe webhook |
| POST | `/payments/mpesa` | M-Pesa STK push |
| POST | `/payments/mpesa/confirm` | Confirm M-Pesa payment |

### 🏪 Pharmacists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pharmacists` | Browse verified pharmacies |
| GET | `/pharmacists/:id` | Pharmacy detail + products |
| POST | `/pharmacists/apply` | Apply (upload license) |
| GET | `/pharmacists/me` | My pharmacist profile |
| GET | `/pharmacists/dashboard` | Dashboard stats |
| PUT | `/pharmacists/me` | Update profile |

### 📋 Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/prescriptions` | Upload prescription |
| GET | `/prescriptions/my` | My prescriptions |
| GET | `/prescriptions/:id` | Get prescription |
| PUT | `/prescriptions/:id/verify` | Verify (pharmacist/admin) |

### 🛡️ Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Platform stats |
| GET | `/admin/pharmacists/pending` | Pending verifications |
| PUT | `/admin/pharmacists/:id/verify` | Approve/reject pharmacist |
| GET | `/admin/users` | All users |
| PUT | `/admin/users/:id/toggle` | Activate/deactivate user |
| GET | `/admin/orders` | All orders |

---

## 🔑 Authentication

Include JWT token in all protected requests:
```
Authorization: Bearer <your_jwt_token>
```

## 👥 Roles
- **patient** — browse, order, AI checker, prescriptions
- **pharmacist** — all patient permissions + manage products & orders
- **admin** — full platform access

## 📁 File Uploads

| Field | Allowed Types | Max Size | Purpose |
|-------|--------------|----------|---------|
| `prescription` | JPG, PNG, PDF | 5MB | Prescription uploads |
| `license` | JPG, PNG, PDF | 5MB | Pharmacist license |
| `product` | JPG, PNG | 5MB | Product images (max 5) |
| `avatar` | JPG, PNG | 5MB | Profile picture |

---

## 🧪 Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medihub.com | admin123456 |
| Pharmacist | james@pharmacare.ke | pharm123456 |
| Patient | patient@medihub.com | patient123456 |

---

## 🔒 Security Features
- JWT authentication with expiry
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min global, 10 req/min for AI)
- Helmet.js security headers
- CORS protection
- File type validation
- Role-based access control (RBAC)

## 📦 Tech Stack
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **AI:** Anthropic Claude API
- **Payments:** Stripe + M-Pesa (Daraja API)
- **Email:** Nodemailer
- **File Upload:** Multer
- **Security:** Helmet, express-rate-limit

## 🌍 Deployment (Production)
```bash
# Set NODE_ENV=production in .env
# Use MongoDB Atlas for database
# Use PM2 for process management:
npm install -g pm2
pm2 start src/server.js --name medihub-api
pm2 save
```
