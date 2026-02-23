import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils';
import { putGithubFile, getGithubFileSha } from '@/lib/github';
import pngToIco from 'png-to-ico';
import { Jimp, JimpMime } from 'jimp';

export async function POST(req: Request) {
    if (!requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { base64 } = await req.json();
        if (!base64) return NextResponse.json({ error: 'Missing image data' }, { status: 400 });

        // Clean prefix if any
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, 'base64');

        // Initialise Jimp Image for resizing
        const jimpImg = await Jimp.read(buffer);

        // Standard 192x192 Chrome/Android icon
        const iconBuffer = await jimpImg.clone().resize({ w: 192, h: 192 }).getBuffer(JimpMime.png);
        // iOS 180x180 specific Apple Touch Icon
        const appleIconBuffer = await jimpImg.clone().resize({ w: 180, h: 180 }).getBuffer(JimpMime.png);

        // ICO generation natively (png-to-ico automatically builds multiple scales like 16, 32, 256)
        const icoBuffer = await pngToIco(buffer as any);
        const icoBase64 = icoBuffer.toString('base64');

        const icoSha = await getGithubFileSha('public/favicon.ico');
        await putGithubFile('public/favicon.ico', icoBase64, 'Update favicon.ico', icoSha);

        const iconSha = await getGithubFileSha('public/icon.png');
        await putGithubFile('public/icon.png', iconBuffer.toString('base64'), 'Update icon.png', iconSha);

        const appleSha = await getGithubFileSha('public/apple-icon.png');
        await putGithubFile('public/apple-icon.png', appleIconBuffer.toString('base64'), 'Update apple-icon.png', appleSha);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
