import { NextResponse } from 'next/server';
import { isDbConfigured } from '../../../lib/db/client';

// Historical audit log for the continuous-compliance view. Returns available:false
// when no database is configured so the UI can hide the history panel gracefully.

export async function GET() {
    if (!isDbConfigured()) {
        return NextResponse.json({ available: false, audits: [] });
    }
    try {
        const { getOrCreateDefaultOrg, listAudits } = await import('../../../lib/db/queries');
        const orgId = await getOrCreateDefaultOrg();
        return NextResponse.json({ available: true, audits: await listAudits(orgId) });
    } catch (error) {
        console.error('Audit history error:', error);
        return NextResponse.json({ available: false, audits: [] });
    }
}
