// Add your sample reports here. 
// 1. Place the PDF in public/samples/ folder
// 2. Add an entry below with the details
// 3. Commit and push - everyone will see it!

export interface StaticSampleReport {
    id: string;
    name: string;
    documentName: string;
    date: string;
    score: number;
    frameworks: string[];
    pdfPath: string; // Path relative to public folder, e.g. '/samples/my-report.pdf'
}

export const staticSampleReports: StaticSampleReport[] = [
    {
        id: 'lfr-dpia-portfolio',
        name: 'LFR DPIA Compliance Report',
        documentName: 'lfr-dpia.pdf',
        date: '2025-12-11',
        score: 61,
        frameworks: ['UK ICO', 'UK DPA/GDPR', 'EU AI Act', 'ISO 42001'],
        pdfPath: '/samples/lfr-dpia_compliance_report.pdf',
    },
    {
        id: 'operation-centron-portfolio',
        name: 'Operation Centron DPIA Compliance Report',
        documentName: 'operation-centron-dpia.pdf',
        date: '2025-12-11',
        score: 42,
        frameworks: ['UK ICO', 'UK DPA/GDPR', 'EU AI Act', 'ISO 42001'],
        pdfPath: '/samples/operation-centron-dpia_compliance_report.pdf',
    },
];
