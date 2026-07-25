import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '../../../lib/db/client';

// API key management. Returns 501 when persistence isn't configured so the UI can
// show an honest "not yet provisioned" state.

function notConfigured() {
    return NextResponse.json({ error: 'Persistence backend not configured' }, { status: 501 });
}

export async function GET() {
    if (!isDbConfigured()) return notConfigured();
    const { getOrCreateDefaultOrg, listApiKeys } = await import('../../../lib/db/queries');
    const orgId = await getOrCreateDefaultOrg();
    return NextResponse.json({ keys: await listApiKeys(orgId) });
}

export async function POST(request: NextRequest) {
    if (!isDbConfigured()) return notConfigured();
    const { getOrCreateDefaultOrg, generateApiKey } = await import('../../../lib/db/queries');
    const body = await request.json().catch(() => ({}));
    const name = (body?.name as string) || 'API key';
    const orgId = await getOrCreateDefaultOrg();
    const generated = await generateApiKey(orgId, name);
    // Full key returned once; only the hash is stored.
    return NextResponse.json({ id: generated.id, key: generated.key, prefix: generated.prefix });
}

export async function DELETE(request: NextRequest) {
    if (!isDbConfigured()) return notConfigured();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { revokeApiKey } = await import('../../../lib/db/queries');
    await revokeApiKey(id);
    return NextResponse.json({ ok: true });
}
