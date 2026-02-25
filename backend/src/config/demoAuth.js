// Persisted demo token store (tokens saved to backend/data/demoTokens.json)
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'backend_data');
const TOKEN_FILE = path.join(DATA_DIR, 'demoTokens.json');

// In-memory map of token -> meta
const store = new Map();

function loadFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(TOKEN_FILE)) {
      fs.writeFileSync(TOKEN_FILE, JSON.stringify({}), 'utf8');
    }
    const raw = fs.readFileSync(TOKEN_FILE, 'utf8');
    const obj = JSON.parse(raw || '{}');
    Object.entries(obj).forEach(([token, meta]) => {
      // ignore expired tokens on load
      if (meta.expiresAt && Date.now() <= meta.expiresAt) store.set(token, meta);
    });
    console.log(`[demoAuth] loaded ${store.size} tokens from disk`);
  } catch (e) { console.warn('demoAuth load failed', e); }
}

function saveToDisk() {
  try {
    const obj = {};
    for (const [t, meta] of store.entries()) obj[t] = meta;
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) { console.warn('demoAuth save failed', e); }
}

function issue(email, ttlSeconds = 3600) {
  const t = `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ttlSeconds * 1000;
  const meta = { email, issuedAt, expiresAt };
  store.set(t, meta);
  saveToDisk();
  console.log(`[demoAuth] issued token for ${email} expiresAt=${new Date(expiresAt).toISOString()}`);
  return { token: t, issuedAt, expiresAt };
}

function verify(token) {
  if (!token) return false;
  const meta = store.get(token);
  if (!meta) return false;
  if (Date.now() > meta.expiresAt) {
    store.delete(token);
    saveToDisk();
    console.log(`[demoAuth] token expired and removed: ${token}`);
    return false;
  }
  return true;
}

function revoke(token) {
  if (store.has(token)) {
    store.delete(token);
    saveToDisk();
    console.log(`[demoAuth] token revoked: ${token}`);
    return true;
  }
  return false;
}

function getProfile(token) {
  const meta = store.get(token);
  if (!meta) return null;
  return {
    id: 'demo-admin',
    name: meta.email || 'Demo Admin',
    email: meta.email || 'demo@local',
    role: 'admin',
    demo: true,
    issuedAt: meta.issuedAt,
    expiresAt: meta.expiresAt
  };
}

// Load existing tokens from disk when module is loaded
loadFromDisk();

module.exports = { issue, verify, revoke, getProfile };
