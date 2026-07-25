import { NextResponse } from 'next/server';
import { isDbConfigured } from '../../../../lib/db/client';

// One-time schema setup. Call once after provisioning Vercel Postgres:
//   curl -X POST https://your-app.vercel.app/api/db/init
// Idempotent — safe to call again.

export async function POST() {
    if (!isDbConfigured()) {
        return NextResponse.json(
            { error: 'No database configured. Set POSTGRES_URL (Vercel Postgres) first.' },
            { status: 501 },
        );
    }
    try {
        const { ensureSchema } = await import('../../../../lib/db/schema');
        await ensureSchema();
        return NextResponse.json({ ok: true, message: 'Schema created / verified.' });
    } catch (error) {
        console.error('DB init error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Schema init failed' },
            { status: 500 },
        );
    }
}
