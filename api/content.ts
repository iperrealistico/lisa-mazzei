import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './utils';
import { getGithubFile, putGithubFile } from './github';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!requireAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        if (req.method === 'GET') {
            const { type } = req.query; // 'site' or 'manifest'
            const path = type === 'manifest' ? 'content/assets-manifest.json' : 'content/site.json';

            const file = await getGithubFile(path);
            if (!file) {
                return res.status(404).json({ error: 'File not found on GitHub' });
            }
            return res.status(200).json({ content: JSON.parse(file.content), sha: file.sha });
        }

        if (req.method === 'POST') {
            const { type, content, sha } = req.body;
            const path = type === 'manifest' ? 'content/assets-manifest.json' : 'content/site.json';

            const contentStr = JSON.stringify(content, null, 2);
            const base64 = Buffer.from(contentStr).toString('base64');

            const result = await putGithubFile(path, base64, `CMS: update ${path}`, sha);
            return res.status(200).json({ success: true, commit: result.commit, content: result.content });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
