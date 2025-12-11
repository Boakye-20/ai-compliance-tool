import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

export async function GET() {
    try {
        const { blobs } = await list({ prefix: 'samples/' });

        const samples = blobs.map((blob) => {
            // Parse metadata from pathname: samples/{id}_{name}_{score}_{date}.pdf
            const filename = blob.pathname.replace('samples/', '');
            const parts = filename.replace('.pdf', '').split('_');
            const id = parts[0] || blob.pathname;
            const name = decodeURIComponent(parts[1] || 'Sample Report');
            const score = parseInt(parts[2] || '0', 10);
            const date = parts[3] || new Date().toISOString().split('T')[0];
            const frameworks = decodeURIComponent(parts[4] || 'UK ICO,UK DPA/GDPR').split(',');

            return {
                id,
                name,
                score,
                date,
                frameworks,
                url: blob.url,
                pathname: blob.pathname,
            };
        });

        return NextResponse.json({ samples });
    } catch (error) {
        console.error('Failed to list samples:', error);
        return NextResponse.json({ samples: [] });
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string || 'Sample Report';
        const score = formData.get('score') as string || '0';
        const frameworks = formData.get('frameworks') as string || 'UK ICO';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const id = Date.now().toString();
        const date = new Date().toISOString().split('T')[0];
        const encodedName = encodeURIComponent(name);
        const encodedFrameworks = encodeURIComponent(frameworks);
        const filename = `samples/${id}_${encodedName}_${score}_${date}_${encodedFrameworks}.pdf`;

        const blob = await put(filename, file, {
            access: 'public',
            contentType: 'application/pdf',
        });

        return NextResponse.json({
            success: true,
            sample: {
                id,
                name,
                score: parseInt(score, 10),
                date,
                frameworks: frameworks.split(','),
                url: blob.url,
            },
        });
    } catch (error) {
        console.error('Failed to upload sample:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { pathname } = await request.json();

        if (!pathname) {
            return NextResponse.json({ error: 'No pathname provided' }, { status: 400 });
        }

        await del(pathname);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete sample:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Delete failed' },
            { status: 500 }
        );
    }
}
