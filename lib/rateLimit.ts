/**
 * Simple in-memory rate limiter
 * Uses a Map to track request counts per IP with automatic cleanup
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns Object with allowed boolean and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry or entry has expired, create new one
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and standard forwarded headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Rate limit middleware helper for API routes
 * Returns a 429 response if rate limited
 */
export function rateLimitResponse(
  request: Request,
  limit: number = 10,
  windowMs: number = 60000
): Response | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, limit, windowMs);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil(result.resetIn / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
        },
      }
    );
  }

  return null;
}
