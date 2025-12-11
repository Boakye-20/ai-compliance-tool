import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ExtractedData, ICOResult, DPAResult, EUActResult, ISOResult, Synthesis } from '../backend/types';

function cleanText(text: unknown): string {
    if (text === null || text === undefined) return '';
    const str = String(text);
    return str
        .replace(/[\u2011\u2010\u2013\u2014]/g, '-')
        .replace(/\u00a0/g, ' ')
        .replace(/[^\x20-\x7E\n\t]/g, '');
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const avgCharWidth = fontSize * 0.5;
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).length <= maxChars) {
            currentLine = currentLine ? `${currentLine} ${word}` : word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

export async function generateReport(
    extractedData: ExtractedData,
    icoResult: ICOResult | null,
    euActResult: EUActResult | null,
    dpaResult: DPAResult | null,
    isoResult: ISOResult | null,
    synthesis: Synthesis,
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const skyBlue = rgb(0.055, 0.647, 0.913);
    const darkGray = rgb(0.067, 0.094, 0.153);
    const mediumGray = rgb(0.294, 0.333, 0.388);
    const green = rgb(0.063, 0.725, 0.506);
    const yellow = rgb(0.961, 0.62, 0.043);
    const red = rgb(0.863, 0.149, 0.149);

    // Title
    page.drawText('AI Governance Hub', {
        x: margin,
        y,
        size: 24,
        font: fontBold,
        color: skyBlue,
    });
    y -= 30;

    page.drawText('AI Compliance Auditor Report', {
        x: margin,
        y,
        size: 18,
        font: fontBold,
        color: darkGray,
    });
    y -= 40;

    // Document Info
    page.drawText('Document Information', {
        x: margin,
        y,
        size: 14,
        font: fontBold,
        color: darkGray,
    });
    y -= 20;

    const infoLines = [
        `Use Case: ${cleanText(extractedData.use_case).slice(0, 80)}`,
        `Document Type: ${cleanText(extractedData.document_type)}`,
        `System Type: ${cleanText(extractedData.system_type).slice(0, 60)}`,
        `Analysis Date: ${new Date().toISOString().split('T')[0]}`,
        `Frameworks: ${synthesis.frameworks_analyzed.join(', ')}`,
    ];

    for (const line of infoLines) {
        page.drawText(line, {
            x: margin,
            y,
            size: 10,
            font,
            color: mediumGray,
        });
        y -= 15;
    }
    y -= 20;

    // UK Alignment Score
    page.drawText('UK Alignment Score', {
        x: margin,
        y,
        size: 14,
        font: fontBold,
        color: darkGray,
    });
    y -= 30;

    const score = synthesis.uk_alignment_score;
    const scoreColor = score >= 70 ? green : score >= 50 ? yellow : red;

    page.drawText(`${score}%`, {
        x: margin,
        y,
        size: 48,
        font: fontBold,
        color: scoreColor,
    });
    y -= 40;

    // Summary
    const summaryLines = wrapText(synthesis.summary, contentWidth, 10);
    for (const line of summaryLines) {
        page.drawText(line, {
            x: margin,
            y,
            size: 10,
            font,
            color: mediumGray,
        });
        y -= 15;
    }
    y -= 20;

    // Framework Scores
    page.drawText('Framework Scores', {
        x: margin,
        y,
        size: 14,
        font: fontBold,
        color: darkGray,
    });
    y -= 20;

    for (const [framework, fwScore] of Object.entries(synthesis.framework_scores)) {
        const fwColor = fwScore >= 70 ? green : fwScore >= 50 ? yellow : red;
        page.drawText(`${framework}: ${fwScore}%`, {
            x: margin,
            y,
            size: 11,
            font,
            color: fwColor,
        });
        y -= 18;
    }
    y -= 20;

    // Critical Gaps
    if (synthesis.total_critical_gaps > 0) {
        page.drawText(`Critical Gaps: ${synthesis.total_critical_gaps}`, {
            x: margin,
            y,
            size: 12,
            font: fontBold,
            color: red,
        });
        y -= 25;
    }

    // Priority Actions
    if (synthesis.priority_actions.length > 0) {
        page.drawText('Priority Actions', {
            x: margin,
            y,
            size: 14,
            font: fontBold,
            color: darkGray,
        });
        y -= 20;

        for (let i = 0; i < Math.min(5, synthesis.priority_actions.length); i++) {
            const action = cleanText(synthesis.priority_actions[i]).slice(0, 100);
            page.drawText(`${i + 1}. ${action}`, {
                x: margin,
                y,
                size: 10,
                font,
                color: mediumGray,
            });
            y -= 15;
        }
    }

    // Footer
    y = margin;
    page.drawText('Generated by AI Governance Hub | This report is for informational purposes only.', {
        x: margin,
        y,
        size: 8,
        font,
        color: mediumGray,
    });

    return pdfDoc.save();
}
