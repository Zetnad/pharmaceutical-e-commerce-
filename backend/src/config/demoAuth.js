// Simple in-memory demo admin token store
const tokens = new Set();

function issue(email) {
  const t = `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  tokens.add(t);
  return t;
}

function verify(token) {
  if (!token) return false;
  return tokens.has(token);
}

function revoke(token) {
  tokens.delete(token);
}

module.exports = { issue, verify, revoke };
