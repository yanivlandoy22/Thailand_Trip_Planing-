const cors = require('cors');

// Allowed browser origins for the API (split deploy: client on Vercel, API on Render).
// Auth is bearer-token (no cookies), so this is defense-in-depth, not the auth layer.
const VERCEL_ORIGIN = /^https:\/\/thailand-trip-plan(?:ner|ing)(?:-[a-z0-9-]+)?\.vercel\.app$/;
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function extraOrigins() {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isAllowedOrigin(origin, host) {
  if (!origin) return true; // non-browser / same-origin GET without Origin header
  try {
    if (host && new URL(origin).host === host) return true; // Render serving its own client
  } catch {
    return false;
  }
  return VERCEL_ORIGIN.test(origin) || LOCAL_ORIGIN.test(origin) || extraOrigins().includes(origin);
}

// Disallowed origins simply get no CORS headers (browser blocks the response).
const corsPolicy = cors((req, callback) => {
  callback(null, { origin: isAllowedOrigin(req.headers.origin, req.headers.host) });
});

module.exports = { corsPolicy, isAllowedOrigin };
