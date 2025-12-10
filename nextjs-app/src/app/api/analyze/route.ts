import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { runCompliancePipeline } from '../../../lib/backend/graph';
import { saveJob } from '../../../lib/backend/storage';
import { AnalysisJob, FrameworkCode } from '../../../lib/backend/types';

// Allow long-running job (Node runtime, not edge)
export const maxDuration = 300; // seconds

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const frameworksRaw = formData.getAll('frameworks') as string[];

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        if (!frameworksRaw.length) {
            return NextResponse.json({ error: 'At least one framework must be selected' }, { status: 400 });
        }

        const frameworks = frameworksRaw as FrameworkCode[];
        const buffer = Buffer.from(await file.arrayBuffer());

        const state = await runCompliancePipeline(buffer, frameworks);

        const jobId = uuidv4();
        const job: AnalysisJob = {
            id: jobId,
            state,
            report_bytes: state.report_bytes,
            created_at: new Date().toISOString(),
        };
        saveJob(job);

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
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Analysis failed' },
            { status: 500 },
        );
    }
}
