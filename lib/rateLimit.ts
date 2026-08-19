type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Per-process only. Replace with shared storage if the app ever runs on multiple instances
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (bucket.count >= limit) {
        return false;
    }
    bucket.count += 1;
    return true;
}
