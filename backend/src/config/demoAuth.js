// Simple in-memory demo admin token store with expiry and basic profile
const store = new Map(); // token -> { email, issuedAt, expiresAt }

function issue(email, ttlSeconds = 3600) {
  const t = `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ttlSeconds * 1000;
  store.set(t, { email, issuedAt, expiresAt });
  console.log(`[demoAuth] issued token for ${email} expiresAt=${new Date(expiresAt).toISOString()}`);
  return { token: t, issuedAt, expiresAt };
}

function verify(token) {
  if (!token) return false;
  const meta = store.get(token);
  if (!meta) return false;
  if (Date.now() > meta.expiresAt) {
    store.delete(token);
    console.log(`[demoAuth] token expired and removed: ${token}`);
    return false;
  }
  return true;
}

function revoke(token) {
  if (store.has(token)) {
    store.delete(token);
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

module.exports = { issue, verify, revoke, getProfile };
