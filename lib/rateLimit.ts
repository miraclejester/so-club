import { headers } from 'next/headers';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Per-process only. Replace with shared storage if the app ever runs on multiple instances
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();

    // Do a cleanup of all expired buckets once the map has grown to a certain size
    if (buckets.size > 10_000) {
        for (const [k, b] of buckets) {
            if (b.resetAt <= now) {
                buckets.delete(k);
            }
        }
    }

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

export async function getClientIp(): Promise<string> {
    const h = await headers();
    const realIp = h.get('x-real-ip')?.trim();
    if (realIp) {
        return realIp;
    }
    return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
