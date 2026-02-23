import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getIp, recordAttempt, resetAttempts } from './utils';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = getIp(req);
    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
        return res.status(429).json({ error: `Too many attempts, try again in ${limit.retryAfter}s` });
    }

    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'System not configured. Set ADMIN_PASSWORD in environment.' });
    }

    if (password === process.env.ADMIN_PASSWORD) {
        resetAttempts(ip);
        return res.status(200).json({ success: true, token: password });
    } else {
        recordAttempt(ip);
        return res.status(401).json({ error: 'Invalid password' });
    }
}
