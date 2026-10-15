// Retry helper for cold-starting servers (Render free tier wakes in ~30-60s).
// Pure module — unit-tested from the server test suite.
export const DEFAULT_DELAYS = [1500, 3000, 6000, 10000];

export class RetryableError extends Error {}

export async function withRetry(fn, { delays = DEFAULT_DELAYS, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!(err instanceof RetryableError) || attempt === delays.length) throw err;
      await sleep(delays[attempt]);
    }
  }
  throw lastError;
}

export function isRetryableStatus(status) {
  return status === 502 || status === 503 || status === 504;
}

// VITE_API_URL may be a bare origin (https://x.onrender.com) or already end in /api.
export function resolveApiBase(envUrl) {
  if (!envUrl) return '/api';
  const trimmed = envUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}
