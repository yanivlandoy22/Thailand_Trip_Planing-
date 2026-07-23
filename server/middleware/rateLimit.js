// Minimal in-memory sliding-window rate limiter (protects the Anthropic budget).
// Good enough for a single-instance group-trip app; resets on restart.
function createRateLimiter({ windowMs = 60 * 1000, max = 15, message }) {
  const hits = new Map(); // ip -> [timestamps]

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(ip, recent);
      return res.status(429).json({ error: message });
    }
    recent.push(now);
    hits.set(ip, recent);
    // Occasional sweep so the map doesn't grow with one-off IPs
    if (hits.size > 500) {
      for (const [key, timestamps] of hits) {
        if (!timestamps.some((t) => now - t < windowMs)) hits.delete(key);
      }
    }
    next();
  };
}

module.exports = { createRateLimiter };
