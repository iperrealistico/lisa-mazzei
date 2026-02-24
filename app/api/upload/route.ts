import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils';
import { putGithubFile, deleteGithubFile, getGithubFileSha } from '@/lib/github';
import { put as putBlob, del as delBlob } from '@vercel/blob';

export async function GET(req: Request) {
    if (!requireAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
        repo: process.env.GITHUB_REPO,
        token: process.env.GITHUB_TOKEN
    });
}

export async function POST(req: Request) {
    if (!requireAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { filename, base64, backend, folder, previewMode } = await req.json();
        if (!filename || !base64) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const buffer = Buffer.from(base64, 'base64');

        if (backend === 'blob') {
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                return NextResponse.json({ error: 'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN.' }, { status: 400 });
            }
            const blob = await putBlob(filename, buffer, { access: 'public', addRandomSuffix: true });
            return NextResponse.json({ url: blob.url, backend: 'blob', id: blob.url, byteSize: buffer.length }, { status: 200 });
        } else {
            const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
            let path = '';
            let sha: string | undefined = undefined;

            if (previewMode) {
                path = `public/preview/${safeFilename}`;
                sha = await getGithubFileSha(path);
            } else {
                const uploadFolder = folder ? `public/${folder}/img` : 'public/uploads';
                path = `${uploadFolder}/${Date.now()}_${safeFilename}`;
            }

            await putGithubFile(path, base64, `Upload ${filename}`, sha);

            const publicUrl = path.replace('public/', '');
            return NextResponse.json({ url: publicUrl, backend: 'github', id: path, byteSize: Math.round(base64.length * 0.75) }, { status: 200 });
        }
    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!requireAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, backend, sha } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        if (backend === 'blob') {
            if (process.env.BLOB_READ_WRITE_TOKEN) {
                await delBlob(id);
            }
            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            if (!sha) return NextResponse.json({ error: 'Missing sha for GitHub delete' }, { status: 400 });
            await deleteGithubFile(id, `Delete ${id}`, sha);
            return NextResponse.json({ success: true }, { status: 200 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
