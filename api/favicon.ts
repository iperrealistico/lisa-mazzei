import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './utils';
import { putGithubFile } from './github';
import pngToIco from 'png-to-ico';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        if (req.method === 'POST') {
            const { base64 } = req.body;
            if (!base64) return res.status(400).json({ error: 'Missing image data' });

            // Clean prefix if any
            const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(cleanBase64, 'base64');

            const icoBuffer = await pngToIco(buffer as any);
            const icoBase64 = icoBuffer.toString('base64');

            await putGithubFile('public/favicon.ico', icoBase64, 'Update favicon.ico');
            await putGithubFile('public/icon.png', cleanBase64, 'Update icon.png');
            await putGithubFile('public/apple-icon.png', cleanBase64, 'Update apple-icon.png');

            return res.status(200).json({ success: true });
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
