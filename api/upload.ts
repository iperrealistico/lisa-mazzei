import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './utils';
import { putGithubFile, deleteGithubFile } from './github';
import { put as putBlob, del as delBlob } from '@vercel/blob';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!requireAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        if (req.method === 'POST') {
            const { filename, base64, backend, folder } = req.body;
            if (!filename || !base64) return res.status(400).json({ error: 'Missing parameters' });

            const buffer = Buffer.from(base64, 'base64');

            if (backend === 'blob') {
                if (!process.env.BLOB_READ_WRITE_TOKEN) {
                    return res.status(400).json({ error: 'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN.' });
                }
                const blob = await putBlob(filename, buffer, { access: 'public', addRandomSuffix: true });
                return res.status(200).json({ url: blob.url, backend: 'blob', id: blob.url, byteSize: buffer.length });
            } else {
                const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
                const uploadFolder = folder ? `public/${folder}/img` : 'public/uploads';
                const path = `${uploadFolder}/${Date.now()}_${safeFilename}`;

                await putGithubFile(path, base64, `Upload ${filename}`);

                const publicUrl = path.replace('public/', '');
                return res.status(200).json({ url: publicUrl, backend: 'github', id: path, byteSize: Math.round(base64.length * 0.75) });
            }
        }

        if (req.method === 'DELETE') {
            const { id, backend, sha } = req.body;
            if (!id) return res.status(400).json({ error: 'Missing id' });

            if (backend === 'blob') {
                if (process.env.BLOB_READ_WRITE_TOKEN) {
                    await delBlob(id);
                }
                return res.status(200).json({ success: true });
            } else {
                if (!sha) return res.status(400).json({ error: 'Missing sha for GitHub delete' });
                await deleteGithubFile(id, `Delete ${id}`, sha);
                return res.status(200).json({ success: true });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
