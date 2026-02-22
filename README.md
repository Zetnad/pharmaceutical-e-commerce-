# pharmaceutical-e-commerce-

This repository contains a static front-end (`index.html`) for a pharmaceutical marketplace and a Node.js/Express backend packaged separately in `medihub-backend.zip` (extracted to the `backend/` directory).

The back-end provides a comprehensive REST API used by the front‑end for product listings, AI symptom analysis, user authentication and more.

---

## Getting started

1. **Extract the backend** (already done):
   ```bash
   unzip medihub-backend.zip -d backend
   ```

2. **Install dependencies and configure**
   ```bash
   cd backend
   npm install            # or yarn
   cp .env.example .env   # edit values (MongoDB URI, CLIENT_URL=http://localhost:5500 etc.)
   ```

3. **Seed database (optional)**
   ```bash
   npm run seed
   ```

4. **Start the backend server**
   ```bash
   npm run dev            # development with nodemon
   # or
   npm start              # production
   ```
   The API will be available at `http://localhost:5000/api`.

5. **Serve the front end**
   You can open `index.html` directly in the browser, or run a simple static server:
   ```bash
   # from the project root
   npx http-server -c-1 . -p 5500
   # or
   python3 -m http.server 5500
   ```
   Navigate to `http://localhost:5500`.

6. **Linking**
   The front end already contains JavaScript that hits the backend endpoints (see the `<script>` blocks at the bottom of `index.html`).
   - Product cards are fetched from `/api/products` and displayed dynamically.
   - The AI symptom chat sends requests to `/api/ai/analyze`.
   - CORS is enabled on the server; make sure `CLIENT_URL` in `.env` matches your front‑end origin (e.g. `http://localhost:5500`).

---

## Development notes

- Backend code lives under `backend/src` with Express routers, controllers and MongoDB models.
- Front end is a single portable HTML file that can be extended or replaced with a framework later.

---

Feel free to modify the UI or expand the API; the two components are decoupled and communicate over HTTP.
