import { AnalysisJob } from './types';
import { isDbConfigured } from '../db/client';

// In-memory store keeps report bytes retrievable within a serverless invocation.
// Durable audit history is written separately to Postgres when configured.
const store = new Map<string, AnalysisJob>();

export function saveJob(job: AnalysisJob): void {
    store.set(job.id, job);
}

export function getJob(id: string): AnalysisJob | undefined {
    return store.get(id);
}

export function deleteJob(id: string): boolean {
    return store.delete(id);
}

// Persist an audit row to Postgres for continuous-compliance history. No-ops when
// no database is configured, and never throws — persistence must not break analysis.
export async function persistJob(
    job: AnalysisJob,
    source: 'web' | 'ingest' | 'ci' = 'web',
    orgId: string | null = null,
): Promise<void> {
    if (!isDbConfigured()) return;
    try {
        const { persistAudit, getOrCreateDefaultOrg } = await import('../db/queries');
        const state = job.state;
        const synthesis: any = state.synthesis || {};
        const resolvedOrg = orgId ?? (await getOrCreateDefaultOrg());
        await persistAudit({
            id: job.id,
            orgId: resolvedOrg,
            source,
            score: synthesis.uk_alignment_score || 0,
            criticalGaps: synthesis.total_critical_gaps || 0,
            frameworks: state.selected_frameworks || [],
            documentType: state.extracted_data?.document_type || null,
            synthesis,
            extractedData: state.extracted_data
                ? { ...state.extracted_data, full_text: undefined }
                : null,
            reportBase64: job.report_bytes ? Buffer.from(job.report_bytes).toString('base64') : null,
        });
    } catch (e) {
        console.error('persistJob failed (non-fatal):', e);
    }
}
