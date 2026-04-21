// Lightweight in-memory per-IP rate limiter. Suitable for launch traffic
// where a single Fluid Compute instance typically serves most requests from
// the same client. For higher scale, swap the `buckets` Map for Upstash
// Redis (`@upstash/ratelimit`) — the call site API stays the same.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  request: Request,
  key: string,
  opts: { windowMs: number; max: number }
): RateLimitResult {
  const ip = getClientIp(request);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + opts.windowMs };
    buckets.set(bucketKey, fresh);
    return { ok: true, remaining: opts.max - 1, resetAt: fresh.resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= opts.max;
  return {
    ok,
    remaining: Math.max(0, opts.max - existing.count),
    resetAt: existing.resetAt,
  };
}

// Best-effort pruning to keep the map bounded. Cheap O(n) sweep on every
// 200th call — acceptable for small key spaces.
let opsSinceSweep = 0;
export function maybeSweep() {
  opsSinceSweep += 1;
  if (opsSinceSweep < 200) return;
  opsSinceSweep = 0;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please slow down and try again shortly.",
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfterSec),
        "x-ratelimit-remaining": "0",
      },
    }
  );
}
