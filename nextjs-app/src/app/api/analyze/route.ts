import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { runCompliancePipeline } from '../../../lib/backend/graph';
import { saveJob, persistJob } from '../../../lib/backend/storage';
import { AnalysisJob, FrameworkCode } from '../../../lib/backend/types';
import { validatePdfUpload } from '../../../lib/fileValidation';
import { isRateLimited, getClientIp } from '../../../lib/rateLimit';
import { isDbConfigured } from '../../../lib/db/client';

// Allow long-running job (Node runtime, not edge)
export const maxDuration = 300; // seconds

// The web demo stays open to unauthenticated visitors, but at a much lower
// ceiling than a request carrying a valid API key. Both limits exist to bound
// the cost of the underlying language model calls, not to gate the product.
const UNAUTHENTICATED_LIMIT_PER_HOUR = 8;
const AUTHENTICATED_LIMIT_PER_HOUR = 60;
const RATE_LIMIT_WINDOW_MINUTES = 60;

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-api-key');
        let orgId: string | null = null;
        if (apiKey) {
            if (!isDbConfigured()) {
                return NextResponse.json(
                    { error: 'API key authentication is not available in this environment.' },
                    { status: 501 },
                );
            }
            const { validateApiKey } = await import('../../../lib/db/queries');
            orgId = await validateApiKey(apiKey);
            if (!orgId) {
                return NextResponse.json({ error: 'Invalid or revoked API key.' }, { status: 401 });
            }
        }

        const clientIp = getClientIp(request);
        const bucketKey = orgId ? `org:${orgId}` : `ip:${clientIp}`;
        const limit = orgId ? AUTHENTICATED_LIMIT_PER_HOUR : UNAUTHENTICATED_LIMIT_PER_HOUR;
        if (await isRateLimited(bucketKey, limit, RATE_LIMIT_WINDOW_MINUTES)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again in an hour.' },
                { status: 429 },
            );
        }

        const formData = await request.formData();
        
        // Support either 'files' (multiple) or 'file' (legacy single)
        let files = formData.getAll('files') as File[];
        if (files.length === 0) {
            const singleFile = formData.get('file') as File | null;
            if (singleFile) files = [singleFile];
        }

        const frameworksRaw = formData.getAll('frameworks') as string[];

        if (files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }
        if (!frameworksRaw.length) {
            return NextResponse.json({ error: 'At least one framework must be selected' }, { status: 400 });
        }

        const frameworks = frameworksRaw as FrameworkCode[];
        
        const buffers: Buffer[] = [];
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileCheck = validatePdfUpload(file, buffer);
            if (!fileCheck.valid) {
                return NextResponse.json({ error: `File ${file.name}: ${fileCheck.reason}` }, { status: 400 });
            }
            buffers.push(buffer);
        }

        const state = await runCompliancePipeline(buffers, frameworks);

        const jobId = uuidv4();
        const job: AnalysisJob = {
            id: jobId,
            state,
            report_bytes: state.report_bytes,
            created_at: new Date().toISOString(),
        };
        saveJob(job);
        await persistJob(job, 'web', orgId);

        const stateForResponse = {
            ...state,
            report_bytes: null,
            extracted_data: state.extracted_data
                ? { ...state.extracted_data, full_text: undefined }
                : null,
        };

        const reportBase64 = state.report_bytes ? Buffer.from(state.report_bytes).toString('base64') : null;

        return NextResponse.json({
            job_id: jobId,
            analysis: stateForResponse,
            report_base64: reportBase64,
        });
    } catch (error) {
        // Full detail goes to server logs only. The client receives a message
        // with no internal detail, so stack traces and library errors are
        // never exposed to the caller.
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Analysis failed. Please try again or contact support if the problem persists.' },
            { status: 500 },
        );
    }
}
