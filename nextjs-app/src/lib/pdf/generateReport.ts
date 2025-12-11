import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, RGB } from 'pdf-lib';
import {
    ExtractedData,
    ICOResult,
    DPAResult,
    EUActResult,
    ISOResult,
    Synthesis,
    FrameworkResult,
    PrincipleResult,
    ComplianceStatus,
} from '../backend/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    page: {
        width: 595,
        height: 842,
        margin: 50,
    },
    fonts: {
        title: 24,
        heading1: 18,
        heading2: 14,
        heading3: 12,
        body: 10,
        small: 9,
        tiny: 8,
    },
    colors: {
        primary: rgb(0.055, 0.647, 0.913),      // Sky blue
        secondary: rgb(0.067, 0.094, 0.153),    // Dark navy
        text: rgb(0.2, 0.2, 0.2),               // Dark gray
        textLight: rgb(0.4, 0.4, 0.4),          // Medium gray
        textMuted: rgb(0.6, 0.6, 0.6),          // Light gray
        success: rgb(0.063, 0.725, 0.506),      // Green
        warning: rgb(0.961, 0.62, 0.043),       // Amber
        danger: rgb(0.863, 0.149, 0.149),       // Red
        background: rgb(0.97, 0.97, 0.97),      // Light background
        border: rgb(0.85, 0.85, 0.85),          // Border gray
        white: rgb(1, 1, 1),
    },
    spacing: {
        section: 25,
        paragraph: 12,
        line: 5,
    },
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface PageContext {
    doc: PDFDocument;
    page: PDFPage;
    y: number;
    fonts: {
        regular: PDFFont;
        bold: PDFFont;
    };
}

interface FrameworkDisplay {
    name: string;
    shortName: string;
    result: FrameworkResult | null;
    principles?: { name: string; result: PrincipleResult | undefined }[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sanitizeText(text: unknown): string {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/[\u2011\u2010\u2013\u2014]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u00a0/g, ' ')
        .replace(/[^\x20-\x7E\n\t]/g, '')
        .trim();
}

function wrapText(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
    const words = sanitizeText(text).split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
}

function getScoreColor(score: number): RGB {
    if (score >= 70) return CONFIG.colors.success;
    if (score >= 50) return CONFIG.colors.warning;
    return CONFIG.colors.danger;
}

function getStatusColor(status: ComplianceStatus): RGB {
    switch (status) {
        case 'MET':
            return CONFIG.colors.success;
        case 'PARTIALLY_MET':
            return CONFIG.colors.warning;
        case 'NOT_MET':
        case 'EVIDENCE_MISSING':
            return CONFIG.colors.danger;
        default:
            return CONFIG.colors.textMuted;
    }
}

function formatStatus(status: ComplianceStatus): string {
    switch (status) {
        case 'MET':
            return 'Met';
        case 'PARTIALLY_MET':
            return 'Partial';
        case 'NOT_MET':
            return 'Not Met';
        case 'EVIDENCE_MISSING':
            return 'No Evidence';
        default:
            return 'N/A';
    }
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ============================================================================
// PAGE MANAGEMENT
// ============================================================================

function createNewPage(ctx: PageContext): PageContext {
    const page = ctx.doc.addPage([CONFIG.page.width, CONFIG.page.height]);
    return {
        ...ctx,
        page,
        y: CONFIG.page.height - CONFIG.page.margin,
    };
}

function ensureSpace(ctx: PageContext, spaceNeeded: number): PageContext {
    if (ctx.y - spaceNeeded < CONFIG.page.margin + 40) {
        return createNewPage(ctx);
    }
    return ctx;
}

// ============================================================================
// DRAWING PRIMITIVES
// ============================================================================

function drawText(
    ctx: PageContext,
    text: string,
    options: {
        size?: number;
        font?: PDFFont;
        color?: RGB;
        x?: number;
        maxWidth?: number;
        lineHeight?: number;
    } = {}
): PageContext {
    const {
        size = CONFIG.fonts.body,
        font = ctx.fonts.regular,
        color = CONFIG.colors.text,
        x = CONFIG.page.margin,
        maxWidth = CONFIG.page.width - 2 * CONFIG.page.margin,
        lineHeight = size + CONFIG.spacing.line,
    } = options;

    const lines = wrapText(text, maxWidth, size, font);

    for (const line of lines) {
        ctx = ensureSpace(ctx, lineHeight);
        ctx.page.drawText(line, { x, y: ctx.y, size, font, color });
        ctx.y -= lineHeight;
    }

    return ctx;
}

function drawHeading(
    ctx: PageContext,
    text: string,
    level: 1 | 2 | 3 = 2
): PageContext {
    const sizes = {
        1: CONFIG.fonts.heading1,
        2: CONFIG.fonts.heading2,
        3: CONFIG.fonts.heading3,
    };

    const spacing = level === 1 ? 30 : level === 2 ? 25 : 20;
    ctx = ensureSpace(ctx, spacing);

    ctx.page.drawText(sanitizeText(text), {
        x: CONFIG.page.margin,
        y: ctx.y,
        size: sizes[level],
        font: ctx.fonts.bold,
        color: level === 1 ? CONFIG.colors.primary : CONFIG.colors.secondary,
    });

    ctx.y -= spacing;
    return ctx;
}

function drawBulletPoint(ctx: PageContext, text: string, indent: number = 0): PageContext {
    const bulletX = CONFIG.page.margin + indent;
    const textX = bulletX + 12;
    const maxWidth = CONFIG.page.width - CONFIG.page.margin - textX;

    ctx = ensureSpace(ctx, CONFIG.fonts.body + CONFIG.spacing.line);

    // Draw bullet
    ctx.page.drawText('•', {
        x: bulletX,
        y: ctx.y,
        size: CONFIG.fonts.body,
        font: ctx.fonts.regular,
        color: CONFIG.colors.primary,
    });

    // Draw text
    const lines = wrapText(text, maxWidth, CONFIG.fonts.body, ctx.fonts.regular);
    for (let i = 0; i < lines.length; i++) {
        if (i > 0) ctx = ensureSpace(ctx, CONFIG.fonts.body + CONFIG.spacing.line);
        ctx.page.drawText(lines[i], {
            x: textX,
            y: ctx.y,
            size: CONFIG.fonts.body,
            font: ctx.fonts.regular,
            color: CONFIG.colors.text,
        });
        if (i < lines.length - 1) ctx.y -= CONFIG.fonts.body + CONFIG.spacing.line;
    }

    ctx.y -= CONFIG.fonts.body + CONFIG.spacing.line + 2;
    return ctx;
}

function drawHorizontalRule(ctx: PageContext): PageContext {
    ctx = ensureSpace(ctx, 20);
    ctx.page.drawLine({
        start: { x: CONFIG.page.margin, y: ctx.y },
        end: { x: CONFIG.page.width - CONFIG.page.margin, y: ctx.y },
        thickness: 0.5,
        color: CONFIG.colors.border,
    });
    ctx.y -= 15;
    return ctx;
}

function drawScoreBox(
    ctx: PageContext,
    label: string,
    score: number,
    x: number,
    width: number
): PageContext {
    const boxHeight = 70;
    const scoreColor = getScoreColor(score);

    ctx = ensureSpace(ctx, boxHeight + 10);

    // Background
    ctx.page.drawRectangle({
        x,
        y: ctx.y - boxHeight,
        width,
        height: boxHeight,
        color: CONFIG.colors.background,
        borderColor: CONFIG.colors.border,
        borderWidth: 1,
    });

    // Score
    ctx.page.drawText(`${score}%`, {
        x: x + width / 2 - ctx.fonts.bold.widthOfTextAtSize(`${score}%`, 28) / 2,
        y: ctx.y - 35,
        size: 28,
        font: ctx.fonts.bold,
        color: scoreColor,
    });

    // Label
    const labelWidth = ctx.fonts.regular.widthOfTextAtSize(label, CONFIG.fonts.small);
    ctx.page.drawText(label, {
        x: x + width / 2 - labelWidth / 2,
        y: ctx.y - 55,
        size: CONFIG.fonts.small,
        font: ctx.fonts.regular,
        color: CONFIG.colors.textLight,
    });

    return ctx;
}

function drawStatusBadge(
    ctx: PageContext,
    status: ComplianceStatus,
    x: number,
    y: number
): void {
    const text = formatStatus(status);
    const color = getStatusColor(status);
    const padding = 4;
    const textWidth = ctx.fonts.regular.widthOfTextAtSize(text, CONFIG.fonts.tiny);

    ctx.page.drawRectangle({
        x: x - padding,
        y: y - 3,
        width: textWidth + padding * 2,
        height: CONFIG.fonts.tiny + padding * 2,
        color,
        opacity: 0.15,
    });

    ctx.page.drawText(text, {
        x,
        y,
        size: CONFIG.fonts.tiny,
        font: ctx.fonts.regular,
        color,
    });
}

// ============================================================================
// REPORT SECTIONS
// ============================================================================

function drawHeader(ctx: PageContext): PageContext {
    // Logo / Brand
    ctx.page.drawText('AI GOVERNANCE HUB', {
        x: CONFIG.page.margin,
        y: ctx.y,
        size: CONFIG.fonts.title,
        font: ctx.fonts.bold,
        color: CONFIG.colors.primary,
    });
    ctx.y -= 35;

    ctx.page.drawText('Compliance Assessment Report', {
        x: CONFIG.page.margin,
        y: ctx.y,
        size: CONFIG.fonts.heading1,
        font: ctx.fonts.bold,
        color: CONFIG.colors.secondary,
    });
    ctx.y -= 40;

    return ctx;
}

function drawDocumentInfo(ctx: PageContext, extractedData: ExtractedData, synthesis: Synthesis): PageContext {
    ctx = drawHeading(ctx, 'Document Information', 2);

    const info = [
        ['Use Case', extractedData.use_case || 'Not specified'],
        ['Document Type', extractedData.document_type || 'Unknown'],
        ['System Type', extractedData.system_type || 'Not specified'],
        ['Analysis Date', formatDate(new Date())],
        ['Frameworks Assessed', synthesis.frameworks_analyzed.join(', ')],
    ];

    for (const [label, value] of info) {
        ctx = ensureSpace(ctx, 18);
        ctx.page.drawText(`${label}:`, {
            x: CONFIG.page.margin,
            y: ctx.y,
            size: CONFIG.fonts.body,
            font: ctx.fonts.bold,
            color: CONFIG.colors.textLight,
        });
        ctx.page.drawText(sanitizeText(value), {
            x: CONFIG.page.margin + 120,
            y: ctx.y,
            size: CONFIG.fonts.body,
            font: ctx.fonts.regular,
            color: CONFIG.colors.text,
        });
        ctx.y -= 18;
    }

    ctx.y -= CONFIG.spacing.section;
    return ctx;
}

function drawExecutiveSummary(ctx: PageContext, synthesis: Synthesis): PageContext {
    ctx = drawHeading(ctx, 'Executive Summary', 1);

    // Score boxes
    const boxWidth = 120;
    const boxSpacing = 15;
    const startX = CONFIG.page.margin;

    ctx = drawScoreBox(ctx, 'UK ALIGNMENT', synthesis.uk_alignment_score, startX, boxWidth);

    // Critical gaps indicator
    const gapsX = startX + boxWidth + boxSpacing;
    const gapsBoxHeight = 70;

    ctx.page.drawRectangle({
        x: gapsX,
        y: ctx.y - gapsBoxHeight,
        width: boxWidth,
        height: gapsBoxHeight,
        color: synthesis.total_critical_gaps > 0 ? rgb(1, 0.95, 0.95) : rgb(0.95, 1, 0.95),
        borderColor: synthesis.total_critical_gaps > 0 ? CONFIG.colors.danger : CONFIG.colors.success,
        borderWidth: 1,
    });

    ctx.page.drawText(`${synthesis.total_critical_gaps}`, {
        x: gapsX + boxWidth / 2 - ctx.fonts.bold.widthOfTextAtSize(`${synthesis.total_critical_gaps}`, 28) / 2,
        y: ctx.y - 35,
        size: 28,
        font: ctx.fonts.bold,
        color: synthesis.total_critical_gaps > 0 ? CONFIG.colors.danger : CONFIG.colors.success,
    });

    const gapsLabel = 'CRITICAL GAPS';
    ctx.page.drawText(gapsLabel, {
        x: gapsX + boxWidth / 2 - ctx.fonts.regular.widthOfTextAtSize(gapsLabel, CONFIG.fonts.small) / 2,
        y: ctx.y - 55,
        size: CONFIG.fonts.small,
        font: ctx.fonts.regular,
        color: CONFIG.colors.textLight,
    });

    ctx.y -= 85;

    // Summary text
    ctx = drawText(ctx, synthesis.summary, {
        size: CONFIG.fonts.body,
        color: CONFIG.colors.text,
        lineHeight: CONFIG.fonts.body + 6,
    });

    ctx.y -= CONFIG.spacing.section;
    return ctx;
}

function drawFrameworkScores(ctx: PageContext, synthesis: Synthesis): PageContext {
    ctx = drawHeading(ctx, 'Framework Scores', 2);

    const barHeight = 24;
    const barMaxWidth = 300;
    const labelWidth = 120;

    for (const [framework, score] of Object.entries(synthesis.framework_scores)) {
        ctx = ensureSpace(ctx, barHeight + 15);

        // Label
        ctx.page.drawText(sanitizeText(framework), {
            x: CONFIG.page.margin,
            y: ctx.y - barHeight / 2 + 4,
            size: CONFIG.fonts.body,
            font: ctx.fonts.regular,
            color: CONFIG.colors.text,
        });

        // Background bar
        const barX = CONFIG.page.margin + labelWidth;
        ctx.page.drawRectangle({
            x: barX,
            y: ctx.y - barHeight,
            width: barMaxWidth,
            height: barHeight,
            color: CONFIG.colors.background,
        });

        // Score bar
        const scoreWidth = (score / 100) * barMaxWidth;
        ctx.page.drawRectangle({
            x: barX,
            y: ctx.y - barHeight,
            width: scoreWidth,
            height: barHeight,
            color: getScoreColor(score),
        });

        // Score text
        ctx.page.drawText(`${score}%`, {
            x: barX + barMaxWidth + 10,
            y: ctx.y - barHeight / 2 + 4,
            size: CONFIG.fonts.body,
            font: ctx.fonts.bold,
            color: getScoreColor(score),
        });

        ctx.y -= barHeight + 10;
    }

    ctx.y -= CONFIG.spacing.section;
    return ctx;
}

function drawPriorityActions(ctx: PageContext, actions: string[]): PageContext {
    if (actions.length === 0) return ctx;

    ctx = drawHeading(ctx, 'Priority Actions', 2);

    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        ctx = ensureSpace(ctx, 30);

        // Number badge
        const numText = `${i + 1}`;
        const numX = CONFIG.page.margin;
        ctx.page.drawRectangle({
            x: numX,
            y: ctx.y - 12,
            width: 18,
            height: 18,
            color: CONFIG.colors.primary,
        });
        ctx.page.drawText(numText, {
            x: numX + 9 - ctx.fonts.bold.widthOfTextAtSize(numText, CONFIG.fonts.small) / 2,
            y: ctx.y - 8,
            size: CONFIG.fonts.small,
            font: ctx.fonts.bold,
            color: CONFIG.colors.white,
        });

        // Action text
        const textX = numX + 28;
        const maxWidth = CONFIG.page.width - CONFIG.page.margin - textX;
        const lines = wrapText(action, maxWidth, CONFIG.fonts.body, ctx.fonts.regular);

        for (let j = 0; j < lines.length; j++) {
            if (j > 0) ctx = ensureSpace(ctx, CONFIG.fonts.body + CONFIG.spacing.line);
            ctx.page.drawText(lines[j], {
                x: textX,
                y: ctx.y,
                size: CONFIG.fonts.body,
                font: ctx.fonts.regular,
                color: CONFIG.colors.text,
            });
            ctx.y -= CONFIG.fonts.body + CONFIG.spacing.line;
        }

        ctx.y -= 8;
    }

    ctx.y -= CONFIG.spacing.section;
    return ctx;
}

function drawFrameworkDetail(ctx: PageContext, fw: FrameworkDisplay): PageContext {
    if (!fw.result) return ctx;

    ctx = ensureSpace(ctx, 80);

    // Framework header with score
    ctx.page.drawRectangle({
        x: CONFIG.page.margin,
        y: ctx.y - 35,
        width: CONFIG.page.width - 2 * CONFIG.page.margin,
        height: 40,
        color: CONFIG.colors.background,
    });

    ctx.page.drawText(fw.name, {
        x: CONFIG.page.margin + 10,
        y: ctx.y - 22,
        size: CONFIG.fonts.heading2,
        font: ctx.fonts.bold,
        color: CONFIG.colors.secondary,
    });

    const scoreText = `${fw.result.score}%`;
    const scoreX = CONFIG.page.width - CONFIG.page.margin - 60;
    ctx.page.drawText(scoreText, {
        x: scoreX,
        y: ctx.y - 22,
        size: CONFIG.fonts.heading2,
        font: ctx.fonts.bold,
        color: getScoreColor(fw.result.score),
    });

    ctx.y -= 50;

    // Summary
    if (fw.result.compliance_summary) {
        ctx = drawText(ctx, fw.result.compliance_summary, {
            size: CONFIG.fonts.body,
            color: CONFIG.colors.textLight,
            lineHeight: CONFIG.fonts.body + 5,
        });
        ctx.y -= 10;
    }

    // Principles / Requirements table (if available)
    if (fw.principles && fw.principles.length > 0) {
        ctx = ensureSpace(ctx, 25);
        ctx.page.drawText('Requirements Assessment:', {
            x: CONFIG.page.margin,
            y: ctx.y,
            size: CONFIG.fonts.heading3,
            font: ctx.fonts.bold,
            color: CONFIG.colors.secondary,
        });
        ctx.y -= 20;

        for (const principle of fw.principles) {
            if (!principle.result) continue;

            ctx = ensureSpace(ctx, 20);

            // Principle name
            ctx.page.drawText(sanitizeText(principle.name), {
                x: CONFIG.page.margin + 5,
                y: ctx.y,
                size: CONFIG.fonts.small,
                font: ctx.fonts.regular,
                color: CONFIG.colors.text,
            });

            // Status badge
            drawStatusBadge(ctx, principle.result.status, CONFIG.page.margin + 200, ctx.y);

            ctx.y -= 18;

            // Gap (if exists)
            if (principle.result.gap && principle.result.gap !== 'none' && principle.result.gap !== 'N/A') {
                const gapLines = wrapText(
                    `Gap: ${principle.result.gap}`,
                    CONFIG.page.width - 2 * CONFIG.page.margin - 20,
                    CONFIG.fonts.tiny,
                    ctx.fonts.regular
                );
                for (const line of gapLines) {
                    ctx = ensureSpace(ctx, CONFIG.fonts.tiny + 4);
                    ctx.page.drawText(line, {
                        x: CONFIG.page.margin + 15,
                        y: ctx.y,
                        size: CONFIG.fonts.tiny,
                        font: ctx.fonts.regular,
                        color: CONFIG.colors.danger,
                    });
                    ctx.y -= CONFIG.fonts.tiny + 4;
                }
            }
        }
        ctx.y -= 10;
    }

    // Strengths
    if (fw.result.strengths && fw.result.strengths.length > 0) {
        ctx = ensureSpace(ctx, 25);
        ctx.page.drawText('Strengths', {
            x: CONFIG.page.margin,
            y: ctx.y,
            size: CONFIG.fonts.heading3,
            font: ctx.fonts.bold,
            color: CONFIG.colors.success,
        });
        ctx.y -= 18;

        for (const strength of fw.result.strengths.slice(0, 4)) {
            ctx = drawBulletPoint(ctx, strength);
        }
    }

    // Critical Gaps
    if (fw.result.critical_gaps && fw.result.critical_gaps.length > 0) {
        ctx = ensureSpace(ctx, 25);
        ctx.page.drawText('Critical Gaps', {
            x: CONFIG.page.margin,
            y: ctx.y,
            size: CONFIG.fonts.heading3,
            font: ctx.fonts.bold,
            color: CONFIG.colors.danger,
        });
        ctx.y -= 18;

        for (const gap of fw.result.critical_gaps.slice(0, 4)) {
            ctx = drawBulletPoint(ctx, gap);
        }
    }

    ctx.y -= CONFIG.spacing.section;
    return ctx;
}

function drawFooters(ctx: PageContext): void {
    const totalPages = ctx.doc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
        const page = ctx.doc.getPage(i);

        // Footer line
        page.drawLine({
            start: { x: CONFIG.page.margin, y: 35 },
            end: { x: CONFIG.page.width - CONFIG.page.margin, y: 35 },
            thickness: 0.5,
            color: CONFIG.colors.border,
        });

        // Page number
        const pageText = `Page ${i + 1} of ${totalPages}`;
        page.drawText(pageText, {
            x: CONFIG.page.margin,
            y: 22,
            size: CONFIG.fonts.tiny,
            font: ctx.fonts.regular,
            color: CONFIG.colors.textMuted,
        });

        // Branding
        const brandText = 'AI Governance Hub | Compliance Assessment';
        const brandWidth = ctx.fonts.regular.widthOfTextAtSize(brandText, CONFIG.fonts.tiny);
        page.drawText(brandText, {
            x: CONFIG.page.width - CONFIG.page.margin - brandWidth,
            y: 22,
            size: CONFIG.fonts.tiny,
            font: ctx.fonts.regular,
            color: CONFIG.colors.textMuted,
        });
    }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function generateReport(
    extractedData: ExtractedData,
    icoResult: ICOResult | null,
    euActResult: EUActResult | null,
    dpaResult: DPAResult | null,
    isoResult: ISOResult | null,
    synthesis: Synthesis
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    const page = doc.addPage([CONFIG.page.width, CONFIG.page.height]);

    let ctx: PageContext = {
        doc,
        page,
        y: CONFIG.page.height - CONFIG.page.margin,
        fonts: { regular, bold },
    };

    // Build report sections
    ctx = drawHeader(ctx);
    ctx = drawHorizontalRule(ctx);
    ctx = drawDocumentInfo(ctx, extractedData, synthesis);
    ctx = drawExecutiveSummary(ctx, synthesis);
    ctx = drawFrameworkScores(ctx, synthesis);
    ctx = drawPriorityActions(ctx, synthesis.priority_actions);

    // Detailed framework analysis
    ctx = drawHorizontalRule(ctx);
    ctx = drawHeading(ctx, 'Detailed Framework Analysis', 1);

    const frameworks: FrameworkDisplay[] = [
        {
            name: 'UK ICO AI Principles',
            shortName: 'ICO',
            result: icoResult,
            principles: icoResult
                ? [
                    { name: 'Safety & Security', result: icoResult.principle_1_safety },
                    { name: 'Fairness', result: icoResult.principle_2_fairness },
                    { name: 'Accountability & Governance', result: icoResult.principle_3_accountability },
                    { name: 'Contestability & Redress', result: icoResult.principle_4_contestability },
                    { name: 'Data Minimisation', result: icoResult.principle_5_data_minimization },
                ]
                : undefined,
        },
        {
            name: 'UK Data Protection Act / GDPR',
            shortName: 'DPA',
            result: dpaResult,
            principles: dpaResult
                ? [
                    { name: 'Article 22 - Automated Decision Making', result: dpaResult.article_22_adm },
                    { name: 'Article 5 - Data Principles', result: dpaResult.article_5_fairness },
                    { name: 'Article 13/14 - Transparency', result: dpaResult.article_13_transparency },
                    { name: 'Article 35 - DPIA', result: dpaResult.article_35_dpia },
                ]
                : undefined,
        },
        {
            name: 'EU AI Act',
            shortName: 'EU',
            result: euActResult,
        },
        {
            name: 'ISO/IEC 42001:2023',
            shortName: 'ISO',
            result: isoResult,
            principles: isoResult
                ? [
                    { name: 'Governance Framework', result: isoResult.governance },
                    { name: 'Risk Management', result: isoResult.risk_management },
                    { name: 'Data Quality & Lifecycle', result: isoResult.data_lifecycle },
                    { name: 'Monitoring & Incident Response', result: isoResult.monitoring },
                ]
                : undefined,
        },
    ];

    for (const fw of frameworks) {
        if (fw.result && fw.result.score > 0) {
            ctx = drawFrameworkDetail(ctx, fw);
        }
    }

    // Add footers to all pages
    drawFooters(ctx);

    return doc.save();
}