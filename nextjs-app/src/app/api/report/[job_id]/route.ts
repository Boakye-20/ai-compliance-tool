import { NextResponse } from 'next/server';
import { getJob } from '../../../../lib/backend/storage';
import { isDbConfigured } from '../../../../lib/db/client';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { job_id: string } }) {
    const { job_id } = params;

    // The in-memory store only survives within a single serverless
    // invocation, so most requests fall through to the durable copy in
    // Postgres, written at analysis time.
    const job = getJob(job_id);
    let pdfBuffer: Buffer | null = job?.report_bytes ? Buffer.from(job.report_bytes) : null;

    if (!pdfBuffer && isDbConfigured()) {
        const { getReportBase64 } = await import('../../../../lib/db/queries');
        const base64 = await getReportBase64(job_id);
        if (base64) pdfBuffer = Buffer.from(base64, 'base64');
    }

    if (!pdfBuffer) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="compliance_report_${job_id}.pdf"`,
        },
    });
}
