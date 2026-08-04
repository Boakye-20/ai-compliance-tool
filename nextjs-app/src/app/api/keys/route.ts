import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '../../../lib/db/client';

// API key management. Returns 501 when persistence isn't configured so the UI can
// show an honest "not yet provisioned" state.
//
// This route creates, lists, and revokes the credentials that grant access to
// the analysis pipeline at a higher rate limit, so it must not be open to the
// public itself. It requires a separate administrator secret, set only in the
// deployment environment and never exposed to the browser. There is
// intentionally no default: if ADMIN_SECRET is unset, every request here is
// rejected rather than silently allowed.

function notConfigured() {
    return NextResponse.json({ error: 'Persistence backend not configured' }, { status: 501 });
}

function isAuthorisedAdmin(request: NextRequest): boolean {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) return false;
    const provided = request.headers.get('x-admin-secret');
    return Boolean(provided) && provided === secret;
}

function unauthorised() {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
}

export async function GET(request: NextRequest) {
    if (!isDbConfigured()) return notConfigured();
    if (!isAuthorisedAdmin(request)) return unauthorised();
    const { getOrCreateDefaultOrg, listApiKeys } = await import('../../../lib/db/queries');
    const orgId = await getOrCreateDefaultOrg();
    return NextResponse.json({ keys: await listApiKeys(orgId) });
}

export async function POST(request: NextRequest) {
    if (!isDbConfigured()) return notConfigured();
    if (!isAuthorisedAdmin(request)) return unauthorised();
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
    if (!isAuthorisedAdmin(request)) return unauthorised();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { revokeApiKey } = await import('../../../lib/db/queries');
    await revokeApiKey(id);
    return NextResponse.json({ ok: true });
}
