import { isDbConfigured } from './db/client';

// Per-instance fallback used only when no database is configured, or if the
// database check itself fails. This does not hold across separate serverless
// instances, so it is a best-effort backstop rather than the primary control.
const memoryStore = new Map<string, number[]>();

function memoryCheck(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = (memoryStore.get(key) || []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    memoryStore.set(key, timestamps);
    return timestamps.length <= limit;
}

// Returns true when the caller identified by `key` has exceeded `limit`
// requests within the trailing `windowMinutes`.
export async function isRateLimited(key: string, limit: number, windowMinutes: number): Promise<boolean> {
    if (isDbConfigured()) {
        try {
            const { checkRateLimit } = await import('./db/queries');
            const { allowed } = await checkRateLimit(key, limit, windowMinutes);
            return !allowed;
        } catch (error) {
            console.error('Rate limit check against the database failed, falling back to in-memory:', error);
        }
    }
    return !memoryCheck(key, limit, windowMinutes * 60_000);
}

// Best-effort client identifier. Vercel and most proxies set x-forwarded-for;
// this is not spoof-proof on its own, which is why authenticated requests are
// rate limited by organisation rather than by this value.
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}
