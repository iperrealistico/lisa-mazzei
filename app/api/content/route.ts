import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils';
import { getGithubFile, putGithubFile, getGithubFileSha, putGithubFiles } from '@/lib/github';

export async function GET(req: Request) {
    if (!requireAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const path = type === 'manifest' ? 'content/assets-manifest.json' : 'content/site.json';

        const file = await getGithubFile(path);
        if (!file) {
            return NextResponse.json({ error: 'File not found on GitHub' }, { status: 404 });
        }
        return NextResponse.json({ content: JSON.parse(file.content), sha: file.sha }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!requireAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        if (body.type === 'both') {
            const siteStr = JSON.stringify(body.site, null, 2);
            const manifestStr = JSON.stringify(body.manifest, null, 2);

            const files = [
                { path: 'content/site.json', content: Buffer.from(siteStr).toString('base64') },
                { path: 'content/assets-manifest.json', content: Buffer.from(manifestStr).toString('base64') }
            ];

            const result = await putGithubFiles(files, 'CMS: Atomic update site.json and assets-manifest.json');
            return NextResponse.json({ success: true, commit: result }, { status: 200 });
        } else {
            const { type, content } = body;
            const path = type === 'manifest' ? 'content/assets-manifest.json' : 'content/site.json';

            const contentStr = JSON.stringify(content, null, 2);
            const base64 = Buffer.from(contentStr).toString('base64');

            const realSha = await getGithubFileSha(path);
            const result = await putGithubFile(path, base64, `CMS: update ${path}`, realSha);
            return NextResponse.json({ success: true, commit: result.commit, content: result.content }, { status: 200 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
