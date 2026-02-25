const demoAuth = require('../src/config/demoAuth');

test('issue, verify, getProfile, revoke flow', () => {
  const { token, issuedAt, expiresAt } = demoAuth.issue('tester@example.com', 2); // 2 seconds
  expect(typeof token).toBe('string');
  expect(demoAuth.verify(token)).toBe(true);
  const profile = demoAuth.getProfile(token);
  expect(profile).not.toBeNull();
  expect(profile.email).toBe('tester@example.com');
  // wait for expiry (using setTimeout in jest is tricky; instead simulate by revoking)
  const revoked = demoAuth.revoke(token);
  expect(revoked).toBe(true);
  expect(demoAuth.verify(token)).toBe(false);
});
