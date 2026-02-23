import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils';
import { putGithubFile } from '@/lib/github';
import pngToIco from 'png-to-ico';

export async function POST(req: Request) {
    if (!requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { base64 } = await req.json();
        if (!base64) return NextResponse.json({ error: 'Missing image data' }, { status: 400 });

        // Clean prefix if any
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, 'base64');

        const icoBuffer = await pngToIco(buffer as any);
        const icoBase64 = icoBuffer.toString('base64');

        await putGithubFile('public/favicon.ico', icoBase64, 'Update favicon.ico');
        await putGithubFile('public/icon.png', cleanBase64, 'Update icon.png');
        await putGithubFile('public/apple-icon.png', cleanBase64, 'Update apple-icon.png');

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
