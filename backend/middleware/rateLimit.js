/**
 * Small in-memory rate limiter for the public news endpoints.
 *
 * HackAware's news routes are intentionally public (no auth) so the feature
 * works for visitors who are not signed in, which makes a per-IP limiter the
 * right protection against a single client hammering the server and, through
 * it, the upstream publishers' feeds.
 *
 * Single-process by design: it complements the server-side cache rather than
 * replacing an infrastructure-level limiter. For multi-instance deployments the
 * shared cache already limits upstream traffic; per-node limits are documented
 * in docs/CYBER_NEWS.md.
 */

// Each limiter gets its own bucket store, otherwise a burst of cheap reads
// would consume the quota of a stricter limiter (e.g. news refresh).
const bucketStores = new Set();

const registerStore = (store) => {
  bucketStores.add(store);
  return store;
};

// Periodic cleanup so long-lived processes do not accumulate keys.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const store of bucketStores) {
    for (const [key, bucket] of store) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }
}, 5 * 60 * 1000);
cleanupTimer.unref?.();

const clientKey = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return (ip || req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
};

/**
 * @param {{ windowMs?: number, max?: number, message?: string, keyGenerator?: Function }} options
 */
export const createRateLimiter = ({
  windowMs = 60_000,
  max = 60,
  message = 'Too many requests. Please slow down and try again shortly.',
  keyGenerator = clientKey,
} = {}) => {
  const buckets = registerStore(new Map());

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(resetSeconds));

    if (bucket.count > max) {
      res.set('Retry-After', String(resetSeconds));
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message, retryAfterSeconds: resetSeconds },
      });
    }

    return next();
  };
};

export const resetRateLimits = () => bucketStores.forEach((store) => store.clear());
export default createRateLimiter;
