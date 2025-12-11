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

interface PageContext {
    pdfDoc: PDFDocument;
    page: any;
    y: number;
    font: any;
    fontBold: any;
    margin: number;
    contentWidth: number;
    pageWidth: number;
    pageHeight: number;
    colors: {
        skyBlue: any;
        darkGray: any;
        mediumGray: any;
        lightGray: any;
        green: any;
        yellow: any;
        red: any;
    };
}

function addPageIfNeeded(ctx: PageContext, spaceNeeded: number): PageContext {
    if (ctx.y - spaceNeeded < ctx.margin + 30) {
        ctx.page = ctx.pdfDoc.addPage([ctx.pageWidth, ctx.pageHeight]);
        ctx.y = ctx.pageHeight - ctx.margin;
    }
    return ctx;
}

function drawSection(ctx: PageContext, title: string, size: number = 14): PageContext {
    ctx = addPageIfNeeded(ctx, 40);
    ctx.page.drawText(title, {
        x: ctx.margin,
        y: ctx.y,
        size,
        font: ctx.fontBold,
        color: ctx.colors.darkGray,
    });
    ctx.y -= size + 10;
    return ctx;
}

function drawText(ctx: PageContext, text: string, size: number = 10, color?: any, indent: number = 0): PageContext {
    const lines = wrapText(cleanText(text), ctx.contentWidth - indent, size);
    for (const line of lines) {
        ctx = addPageIfNeeded(ctx, size + 5);
        ctx.page.drawText(line, {
            x: ctx.margin + indent,
            y: ctx.y,
            size,
            font: ctx.font,
            color: color || ctx.colors.mediumGray,
        });
        ctx.y -= size + 5;
    }
    return ctx;
}

function drawBullet(ctx: PageContext, text: string, size: number = 10): PageContext {
    const bulletIndent = 15;
    ctx = addPageIfNeeded(ctx, size + 5);
    ctx.page.drawText('•', {
        x: ctx.margin,
        y: ctx.y,
        size,
        font: ctx.font,
        color: ctx.colors.mediumGray,
    });
    const lines = wrapText(cleanText(text), ctx.contentWidth - bulletIndent - 5, size);
    for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
            ctx = addPageIfNeeded(ctx, size + 5);
        }
        ctx.page.drawText(lines[i], {
            x: ctx.margin + bulletIndent,
            y: ctx.y,
            size,
            font: ctx.font,
            color: ctx.colors.mediumGray,
        });
        if (i < lines.length - 1) {
            ctx.y -= size + 5;
        }
    }
    ctx.y -= size + 5;
    return ctx;
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

    const colors = {
        skyBlue: rgb(0.055, 0.647, 0.913),
        darkGray: rgb(0.067, 0.094, 0.153),
        mediumGray: rgb(0.294, 0.333, 0.388),
        lightGray: rgb(0.6, 0.6, 0.6),
        green: rgb(0.063, 0.725, 0.506),
        yellow: rgb(0.961, 0.62, 0.043),
        red: rgb(0.863, 0.149, 0.149),
    };

    let ctx: PageContext = {
        pdfDoc,
        page,
        y,
        font,
        fontBold,
        margin,
        contentWidth,
        pageWidth,
        pageHeight,
        colors,
    };

    // Title Page
    ctx.page.drawText('AI Governance Hub', {
        x: ctx.margin,
        y: ctx.y,
        size: 24,
        font: ctx.fontBold,
        color: ctx.colors.skyBlue,
    });
    ctx.y -= 30;

    ctx.page.drawText('AI Compliance Auditor Report', {
        x: ctx.margin,
        y: ctx.y,
        size: 18,
        font: ctx.fontBold,
        color: ctx.colors.darkGray,
    });
    ctx.y -= 50;

    // Document Info
    ctx = drawSection(ctx, 'Document Information');
    ctx = drawText(ctx, `Use Case: ${cleanText(extractedData.use_case)}`, 10);
    ctx = drawText(ctx, `Document Type: ${cleanText(extractedData.document_type)}`, 10);
    ctx = drawText(ctx, `System Type: ${cleanText(extractedData.system_type)}`, 10);
    ctx = drawText(ctx, `Analysis Date: ${new Date().toISOString().split('T')[0]}`, 10);
    ctx = drawText(ctx, `Frameworks: ${synthesis.frameworks_analyzed.join(', ')}`, 10);
    ctx.y -= 20;

    // Executive Summary
    ctx = drawSection(ctx, 'Executive Summary', 16);

    const score = synthesis.uk_alignment_score;
    const scoreColor = score >= 70 ? ctx.colors.green : score >= 50 ? ctx.colors.yellow : ctx.colors.red;

    ctx.page.drawText('UK Alignment Score:', {
        x: ctx.margin,
        y: ctx.y,
        size: 12,
        font: ctx.fontBold,
        color: ctx.colors.darkGray,
    });
    ctx.y -= 35;

    ctx.page.drawText(`${score}%`, {
        x: ctx.margin,
        y: ctx.y,
        size: 42,
        font: ctx.fontBold,
        color: scoreColor,
    });
    ctx.y -= 50;

    ctx = drawText(ctx, synthesis.summary, 11);
    ctx.y -= 15;

    if (synthesis.total_critical_gaps > 0) {
        ctx.page.drawText(`⚠ ${synthesis.total_critical_gaps} critical gaps require immediate attention`, {
            x: ctx.margin,
            y: ctx.y,
            size: 11,
            font: ctx.fontBold,
            color: ctx.colors.red,
        });
        ctx.y -= 25;
    }
    ctx.y -= 10;

    // Framework Scores Summary
    ctx = drawSection(ctx, 'Framework Scores');

    for (const [framework, fwScore] of Object.entries(synthesis.framework_scores)) {
        const fwColor = fwScore >= 70 ? ctx.colors.green : fwScore >= 50 ? ctx.colors.yellow : ctx.colors.red;
        ctx = addPageIfNeeded(ctx, 18);
        ctx.page.drawText(`${framework}: ${fwScore}%`, {
            x: ctx.margin,
            y: ctx.y,
            size: 12,
            font: ctx.fontBold,
            color: fwColor,
        });
        ctx.y -= 20;
    }
    ctx.y -= 10;

    // Priority Actions
    if (synthesis.priority_actions.length > 0) {
        ctx = drawSection(ctx, 'Priority Actions', 14);
        for (let i = 0; i < synthesis.priority_actions.length; i++) {
            ctx = drawBullet(ctx, `${i + 1}. ${synthesis.priority_actions[i]}`);
        }
        ctx.y -= 15;
    }

    // Detailed Framework Analysis
    const frameworks = [
        { name: 'UK ICO', result: icoResult, emoji: '🇬🇧' },
        { name: 'UK DPA/GDPR', result: dpaResult, emoji: '🔒' },
        { name: 'EU AI Act', result: euActResult, emoji: '🇪🇺' },
        { name: 'ISO/IEC 42001', result: isoResult, emoji: '📋' },
    ];

    for (const fw of frameworks) {
        if (!fw.result) continue;

        ctx = addPageIfNeeded(ctx, 100);
        ctx.y -= 10;

        // Framework Header
        ctx.page.drawText(`${fw.emoji} ${fw.name}`, {
            x: ctx.margin,
            y: ctx.y,
            size: 16,
            font: ctx.fontBold,
            color: ctx.colors.skyBlue,
        });
        ctx.y -= 25;

        const fwScore = fw.result.score || 0;
        const fwColor = fwScore >= 70 ? ctx.colors.green : fwScore >= 50 ? ctx.colors.yellow : ctx.colors.red;
        ctx.page.drawText(`Score: ${fwScore}%`, {
            x: ctx.margin,
            y: ctx.y,
            size: 14,
            font: ctx.fontBold,
            color: fwColor,
        });
        ctx.y -= 25;

        // Summary
        if (fw.result.compliance_summary) {
            ctx.page.drawText('Summary:', {
                x: ctx.margin,
                y: ctx.y,
                size: 11,
                font: ctx.fontBold,
                color: ctx.colors.darkGray,
            });
            ctx.y -= 15;
            ctx = drawText(ctx, fw.result.compliance_summary, 10);
            ctx.y -= 10;
        }

        // Strengths
        if (fw.result.strengths && fw.result.strengths.length > 0) {
            ctx.page.drawText('✓ Strengths:', {
                x: ctx.margin,
                y: ctx.y,
                size: 11,
                font: ctx.fontBold,
                color: ctx.colors.green,
            });
            ctx.y -= 15;
            for (const strength of fw.result.strengths.slice(0, 3)) {
                ctx = drawBullet(ctx, strength);
            }
            ctx.y -= 10;
        }

        // Critical Gaps
        if (fw.result.critical_gaps && fw.result.critical_gaps.length > 0) {
            ctx.page.drawText('✗ Critical Gaps:', {
                x: ctx.margin,
                y: ctx.y,
                size: 11,
                font: ctx.fontBold,
                color: ctx.colors.red,
            });
            ctx.y -= 15;
            for (const gap of fw.result.critical_gaps.slice(0, 3)) {
                ctx = drawBullet(ctx, gap);
            }
            ctx.y -= 10;
        }

        // Priority Actions
        if (fw.result.priority_actions && fw.result.priority_actions.length > 0) {
            ctx.page.drawText('Recommended Actions:', {
                x: ctx.margin,
                y: ctx.y,
                size: 11,
                font: ctx.fontBold,
                color: ctx.colors.darkGray,
            });
            ctx.y -= 15;
            for (const action of fw.result.priority_actions.slice(0, 3)) {
                ctx = drawBullet(ctx, action);
            }
        }

        ctx.y -= 20;
    }

    // Footer on last page
    const totalPages = ctx.pdfDoc.getPageCount();
    for (let i = 0; i < totalPages; i++) {
        const pg = ctx.pdfDoc.getPage(i);
        pg.drawText(`Page ${i + 1} of ${totalPages} | Generated by AI Governance Hub`, {
            x: ctx.margin,
            y: 20,
            size: 8,
            font: ctx.font,
            color: ctx.colors.lightGray,
        });
    }

    return ctx.pdfDoc.save();
}
