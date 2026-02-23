import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils';
import { getGithubFile, putGithubFile } from '@/lib/github';

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
        const { type, content, sha } = await req.json();
        const path = type === 'manifest' ? 'content/assets-manifest.json' : 'content/site.json';

        const contentStr = JSON.stringify(content, null, 2);
        const base64 = Buffer.from(contentStr).toString('base64');

        const result = await putGithubFile(path, base64, `CMS: update ${path}`, sha);
        return NextResponse.json({ success: true, commit: result.commit, content: result.content }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
