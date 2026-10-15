const test = require('node:test');
const assert = require('node:assert');
const { isAllowedOrigin } = require('../middleware/corsPolicy');

test('CORS allows same-origin, localhost, project Vercel URLs; rejects others', () => {
  const host = 'thailand-trip.onrender.com';
  assert.ok(isAllowedOrigin(undefined, host));
  assert.ok(isAllowedOrigin('https://thailand-trip.onrender.com', host));
  assert.ok(isAllowedOrigin('http://localhost:5173', host));
  assert.ok(isAllowedOrigin('https://thailand-trip-planner.vercel.app', host));
  assert.ok(isAllowedOrigin('https://thailand-trip-planner-git-perf-vercel-frontend-me.vercel.app', host));
  assert.ok(isAllowedOrigin('https://thailandtripplanner.vercel.app', host));
  assert.ok(isAllowedOrigin('https://thailandtripplanner-dx86qhkp7-yanivlandoy22.vercel.app', host));
  assert.ok(isAllowedOrigin('https://thailandtripplanner-git-perf-vercel-frontend-yanivlandoy22.vercel.app', host));
  assert.ok(!isAllowedOrigin('https://evil.example.com', host));
  assert.ok(!isAllowedOrigin('https://evil.vercel.app', host));
  assert.ok(!isAllowedOrigin('https://thailand-trip-planner.vercel.app.evil.com', host));
});

test('CORS_ORIGINS env adds extra allowed origins', () => {
  process.env.CORS_ORIGINS = 'https://trip.example.com, https://x.example.org/';
  try {
    assert.ok(isAllowedOrigin('https://trip.example.com', 'h'));
    assert.ok(isAllowedOrigin('https://x.example.org', 'h'));
  } finally {
    delete process.env.CORS_ORIGINS;
  }
});
