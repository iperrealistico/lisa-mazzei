import { NextResponse } from 'next/server';
import { checkRateLimit, getIp, recordAttempt, resetAttempts } from '@/lib/utils';

export async function POST(req: Request) {
    const ip = getIp(req);
    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
        return NextResponse.json({ error: `Too many attempts, try again in ${limit.retryAfter}s` }, { status: 429 });
    }

    const { password } = await req.json();

    if (!process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'System not configured. Set ADMIN_PASSWORD in environment.' }, { status: 500 });
    }

    if (password === process.env.ADMIN_PASSWORD) {
        resetAttempts(ip);
        return NextResponse.json({ success: true, token: password }, { status: 200 });
    } else {
        recordAttempt(ip);
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
}
