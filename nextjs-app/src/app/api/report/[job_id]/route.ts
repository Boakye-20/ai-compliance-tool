import { NextResponse } from 'next/server';
import { getJob } from '@/lib/backend/storage';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { job_id: string } }) {
    const { job_id } = params;
    const job = getJob(job_id);

    if (!job || !job.report_bytes) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const pdfBuffer = Buffer.from(job.report_bytes);

    return new NextResponse(pdfBuffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="compliance_report_${job_id}.pdf"`,
        },
    });
}
