# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

MediHub is a pharmaceutical e-commerce SaaS platform (B2B2C marketplace) for the East African market. It consists of:

- **Backend**: Node.js/Express REST API in `backend/` (port 5000)
- **Frontend**: Vanilla HTML/CSS/JS static files served from the repo root (port 5500)
- **Database**: MongoDB (port 27017)

### Running services

1. **MongoDB**: Start with `sudo -u mongodb mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork --bind_ip 127.0.0.1`
2. **Backend**: `cd backend && npm run dev` (uses nodemon, port 5000)
3. **Frontend**: `npx http-server -c-1 . -p 5500` from the repo root

### Commands

| Task | Command | Working Directory |
|------|---------|-------------------|
| Install deps | `npm install` | `backend/` |
| Dev server | `npm run dev` | `backend/` |
| Tests | `npm test` | `backend/` |
| Seed DB | `npm run seed` | `backend/` |
| Serve frontend | `npx http-server -c-1 . -p 5500` | repo root |

### Non-obvious notes

- The backend runs in **demo mode** when `MONGODB_URI` is not set (skips MongoDB, only stub pharmacist routes work). For full functionality, MongoDB must be running and `MONGODB_URI` must be set in `backend/.env`.
- The `.env` file is not committed; create from `backend/.env.example`. Key required values: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL=http://localhost:5500`.
- Tests (`npm test`) use Jest + Supertest and only cover demo-mode functionality (no MongoDB needed for tests).
- There is a pre-existing frontend bug: the Marketplace page fails to load products because `js/scripts.js` expects the `/api/products` response to be a flat array, but the API returns `{success: true, products: [...]}`. The API itself works correctly (verified via curl).
- Optional external APIs (Anthropic Claude, Stripe, SMTP) require their own secrets in `.env`; the app runs without them but those specific features will be unavailable.
- MongoDB driver deprecation warnings (`useNewUrlParser`, `useUnifiedTopology`) are cosmetic and can be ignored.
- `backend/scripts/seedDemo.js` is a separate demo seeder; the primary seeder is `npm run seed` which runs `backend/src/config/seed.js`.
