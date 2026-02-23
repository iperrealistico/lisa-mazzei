// No longer using VercelRequest from @vercel/node

const rateLimits = new Map<string, { attempts: number, lockedUntil: number }>();

export function checkRateLimit(ip: string) {
    const now = Date.now();
    const entry = rateLimits.get(ip) || { attempts: 0, lockedUntil: 0 };

    if (now < entry.lockedUntil) {
        return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
    }

    if (entry.attempts >= 10) { // 10 attempts allowed
        entry.lockedUntil = now + 5 * 60 * 1000; // 5 min
        entry.attempts = 0;
        rateLimits.set(ip, entry);
        return { allowed: false, retryAfter: 300 };
    }

    return { allowed: true };
}

export function recordAttempt(ip: string) {
    const entry = rateLimits.get(ip) || { attempts: 0, lockedUntil: 0 };
    entry.attempts += 1;
    rateLimits.set(ip, entry);
}

export function resetAttempts(ip: string) {
    rateLimits.delete(ip);
}

export function requireAuth(req: Request): boolean {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    const token = authHeader.split(' ')[1];
    return token === process.env.ADMIN_PASSWORD;
}

export function getIp(req: Request): string {
    return req.headers.get('x-forwarded-for') || 'unknown';
}
