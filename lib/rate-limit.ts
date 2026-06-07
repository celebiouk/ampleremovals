/**
 * Simple in-memory rate limiter for API routes.
 * Limits requests per IP address within a time window.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limiter factory function.
 * Creates a rate limiter with specified limits.
 *
 * @example
 * const limiter = rateLimit({ maxRequests: 10, windowMs: 15 * 60 * 1000 });
 * const result = limiter(ipAddress);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 * }
 */
export function rateLimit(options: RateLimitOptions) {
  const { maxRequests, windowMs } = options;

  return function checkRateLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // No entry or window expired - create new entry
    if (!entry || entry.resetAt < now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: newEntry.resetAt,
      };
    }

    // Increment count
    entry.count++;

    // Check if exceeded
    if (entry.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  };
}

/**
 * Extract IP address from Next.js request headers.
 * Checks x-forwarded-for and x-real-ip headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "127.0.0.1";
}
