import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { synthesizeGaps } from '../../../lib/agents/synthesizer';
import { AnalysisJob, FrameworkCode } from '../../../lib/backend/types';
import { saveJob, persistJob } from '../../../lib/backend/storage';
import { isDbConfigured } from '../../../lib/db/client';

// Metadata-only ingestion. Accepts a privacy-mode JSON payload (produced by the
// local Python CLI or exported from a prior analysis) that already contains the
// per-framework results, and re-runs the deterministic scoring server-side.
// No raw document is ever uploaded. Persistence + API-key auth are added in Phase 3.

export const maxDuration = 30;

interface IngestPayload {
    extracted_data?: any;
    ico_result?: any;
    dpa_result?: any;
    eu_act_result?: any;
    iso_result?: any;
    frameworks?: FrameworkCode[];
    status_messages?: string[];
    source?: 'ci' | 'ingest';
}

export async function POST(request: NextRequest) {
    try {
        // When persistence is enabled, ingest requires a valid API key (used by the
        // CLI and CI/CD). Without a DB, ingest stays open so the privacy-mode UI works.
        let orgId: string | null = null;
        if (isDbConfigured()) {
            const auth = request.headers.get('authorization') || '';
            const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
            const { validateApiKey } = await import('../../../lib/db/queries');
            orgId = await validateApiKey(token);
            if (!orgId) {
                return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
            }
        }

        const payload = (await request.json()) as IngestPayload;

        if (!payload || typeof payload !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const hasAnyResult =
            payload.ico_result || payload.dpa_result || payload.eu_act_result || payload.iso_result;
        if (!hasAnyResult) {
            return NextResponse.json(
                { error: 'Payload must include at least one framework result (ico_result, dpa_result, eu_act_result, iso_result)' },
                { status: 400 },
            );
        }

        const selected: FrameworkCode[] =
            payload.frameworks && payload.frameworks.length
                ? payload.frameworks
                : ([
                      payload.ico_result && 'ICO',
                      payload.dpa_result && 'DPA',
                      payload.eu_act_result && 'EU_AI_ACT',
                      payload.iso_result && 'ISO_42001',
                  ].filter(Boolean) as FrameworkCode[]);

        const synthesis = synthesizeGaps(
            payload.ico_result || null,
            payload.eu_act_result || null,
            payload.dpa_result || null,
            payload.iso_result || null,
            selected,
        );

        const jobId = uuidv4();

        // Persist to durable history (no-op when DB not configured).
        const job: AnalysisJob = {
            id: jobId,
            state: {
                pdf_path: '',
                extracted_data: payload.extracted_data || null,
                selected_frameworks: selected,
                ico_result: payload.ico_result || null,
                eu_act_result: payload.eu_act_result || null,
                dpa_result: payload.dpa_result || null,
                iso_result: payload.iso_result || null,
                synthesis,
                report_bytes: null,
                status_messages: payload.status_messages || [],
            },
            report_bytes: null,
            created_at: new Date().toISOString(),
        };
        saveJob(job);
        const auditSource = payload.source === 'ci' ? 'ci' : 'ingest';
        await persistJob(job, auditSource, orgId);

        return NextResponse.json({
            job_id: jobId,
            analysis: {
                extracted_data: payload.extracted_data || null,
                ico_result: payload.ico_result || null,
                dpa_result: payload.dpa_result || null,
                eu_act_result: payload.eu_act_result || null,
                iso_result: payload.iso_result || null,
                synthesis,
                status_messages: payload.status_messages || ['Scored from metadata payload (privacy mode)'],
            },
            report_base64: null,
        });
    } catch (error) {
        console.error('Ingest error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Ingest failed' },
            { status: 500 },
        );
    }
}
