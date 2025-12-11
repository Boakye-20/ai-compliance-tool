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
        primary: rgb(0.055, 0.647, 0.913),
        secondary: rgb(0.067, 0.094, 0.153),
        text: rgb(0.2, 0.2, 0.2),
        textLight: rgb(0.4, 0.4, 0.4),
        textMuted: rgb(0.6, 0.6, 0.6),
        success: rgb(0.063, 0.725, 0.506),
        warning: rgb(0.961, 0.62, 0.043),
        danger: rgb(0.863, 0.149, 0.149),
        background: rgb(0.97, 0.97, 0.97),
        backgroundWarm: rgb(1, 0.98, 0.95),
        border: rgb(0.85, 0.85, 0.85),
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

function truncateText(text: string, maxLength: number): string {
    const clean = sanitizeText(text);
    if (clean.length <= maxLength) return clean;
    return clean.slice(0, maxLength - 3).trim() + '...';
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

function getScoreRating(score: number): string {
    // Adjusted bands so mid-50s are treated as Moderate, not Weak
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Moderate';
    if (score >= 30) return 'Weak';
    return 'Critical';
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

function drawHeading(ctx: PageContext, text: string, level: 1 | 2 | 3 = 2): PageContext {
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

    ctx.page.drawText('•', {
        x: bulletX,
        y: ctx.y,
        size: CONFIG.fonts.body,
        font: ctx.fonts.regular,
        color: CONFIG.colors.primary,
    });

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

    ctx.page.drawRectangle({
        x,
        y: ctx.y - boxHeight,
        width,
        height: boxHeight,
        color: CONFIG.colors.background,
        borderColor: CONFIG.colors.border,
        borderWidth: 1,
    });

    ctx.page.drawText(`${score}%`, {
        x: x + width / 2 - ctx.fonts.bold.widthOfTextAtSize(`${score}%`, 28) / 2,
        y: ctx.y - 35,
        size: 28,
        font: ctx.fonts.bold,
        color: scoreColor,
    });

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

function drawStatusBadge(ctx: PageContext, status: ComplianceStatus, x: number, y: number): void {
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
        ctx.page.drawText(truncateText(value, 70), {
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

function extractTopIssues(
    icoResult: ICOResult | null,
    dpaResult: DPAResult | null,
    euActResult: EUActResult | null,
    isoResult: ISOResult | null
): string[] {
    const issues: string[] = [];

    // Collect NOT_MET principles
    const checkPrinciple = (name: string, result: PrincipleResult | undefined) => {
        if (result?.status === 'NOT_MET' && result.gap && result.gap !== 'none') {
            issues.push(name);
        }
    };

    if (icoResult) {
        checkPrinciple('Contestability & redress mechanisms', icoResult.principle_4_contestability);
        checkPrinciple('Safety & security measures', icoResult.principle_1_safety);
        checkPrinciple('Fairness & bias testing', icoResult.principle_2_fairness);
    }

    if (dpaResult) {
        checkPrinciple('Transparency obligations (Art. 13/14)', dpaResult.article_13_transparency);
        checkPrinciple('Automated decision-making safeguards (Art. 22)', dpaResult.article_22_adm);
    }

    // Add from critical gaps
    const allResults = [icoResult, dpaResult, euActResult, isoResult].filter(Boolean);
    for (const result of allResults) {
        if (result?.critical_gaps) {
            for (const gap of result.critical_gaps.slice(0, 2)) {
                const shortGap = truncateText(gap, 50);
                if (!issues.some((i) => i.toLowerCase().includes(shortGap.toLowerCase().slice(0, 20)))) {
                    issues.push(shortGap);
                }
            }
        }
    }

    return issues.slice(0, 3);
}

function drawExecutiveSummary(
    ctx: PageContext,
    synthesis: Synthesis,
    icoResult: ICOResult | null,
    dpaResult: DPAResult | null,
    euActResult: EUActResult | null,
    isoResult: ISOResult | null
): PageContext {
    ctx = drawHeading(ctx, 'Executive Summary', 1);

    // Score boxes row
    const boxWidth = 110;
    const boxSpacing = 15;
    const startX = CONFIG.page.margin;

    ctx = drawScoreBox(ctx, 'UK ALIGNMENT', synthesis.uk_alignment_score, startX, boxWidth);

    // Critical gaps box
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

    // Rating box
    const ratingX = gapsX + boxWidth + boxSpacing;
    const rating = getScoreRating(synthesis.uk_alignment_score);
    const ratingColor = getScoreColor(synthesis.uk_alignment_score);

    ctx.page.drawRectangle({
        x: ratingX,
        y: ctx.y - gapsBoxHeight,
        width: boxWidth,
        height: gapsBoxHeight,
        color: CONFIG.colors.background,
        borderColor: CONFIG.colors.border,
        borderWidth: 1,
    });

    ctx.page.drawText(rating, {
        x: ratingX + boxWidth / 2 - ctx.fonts.bold.widthOfTextAtSize(rating, 18) / 2,
        y: ctx.y - 38,
        size: 18,
        font: ctx.fonts.bold,
        color: ratingColor,
    });

    const ratingLabel = 'COMPLIANCE';
    ctx.page.drawText(ratingLabel, {
        x: ratingX + boxWidth / 2 - ctx.fonts.regular.widthOfTextAtSize(ratingLabel, CONFIG.fonts.small) / 2,
        y: ctx.y - 55,
        size: CONFIG.fonts.small,
        font: ctx.fonts.regular,
        color: CONFIG.colors.textLight,
    });

    ctx.y -= 85;

    // Top issues callout
    const topIssues = extractTopIssues(icoResult, dpaResult, euActResult, isoResult);

    if (topIssues.length > 0) {
        ctx = ensureSpace(ctx, 60);

        // Key risks box
        const boxY = ctx.y;
        const risksBoxHeight = 20 + topIssues.length * 16;

        ctx.page.drawRectangle({
            x: CONFIG.page.margin,
            y: boxY - risksBoxHeight,
            width: CONFIG.page.width - 2 * CONFIG.page.margin,
            height: risksBoxHeight,
            color: rgb(1, 0.97, 0.95),
            borderColor: CONFIG.colors.warning,
            borderWidth: 1,
        });

        // Left accent bar
        ctx.page.drawRectangle({
            x: CONFIG.page.margin,
            y: boxY - risksBoxHeight,
            width: 4,
            height: risksBoxHeight,
            color: CONFIG.colors.warning,
        });

        ctx.page.drawText('KEY RISKS:', {
            x: CONFIG.page.margin + 15,
            y: boxY - 14,
            size: CONFIG.fonts.small,
            font: ctx.fonts.bold,
            color: CONFIG.colors.warning,
        });

        for (let i = 0; i < topIssues.length; i++) {
            ctx.page.drawText(`• ${topIssues[i]}`, {
                x: CONFIG.page.margin + 15,
                y: boxY - 30 - i * 14,
                size: CONFIG.fonts.small,
                font: ctx.fonts.regular,
                color: CONFIG.colors.text,
            });
        }

        ctx.y -= risksBoxHeight + 15;
    }

    // Summary paragraph
    ctx = drawText(ctx, synthesis.summary, {
        size: CONFIG.fonts.body,
        color: CONFIG.colors.text,
        lineHeight: CONFIG.fonts.body + 6,
    });

    ctx.y -= CONFIG.spacing.section;
    return ctx;
}

function drawWhatThisMeans(ctx: PageContext, synthesis: Synthesis): PageContext {
    ctx = ensureSpace(ctx, 100);

    // Section with background
    const boxHeight = 80;

    ctx.page.drawRectangle({
        x: CONFIG.page.margin,
        y: ctx.y - boxHeight,
        width: CONFIG.page.width - 2 * CONFIG.page.margin,
        height: boxHeight,
        color: CONFIG.colors.backgroundWarm,
        borderColor: CONFIG.colors.border,
        borderWidth: 1,
    });

    // Left accent
    ctx.page.drawRectangle({
        x: CONFIG.page.margin,
        y: ctx.y - boxHeight,
        width: 4,
        height: boxHeight,
        color: CONFIG.colors.primary,
    });

    ctx.page.drawText('What This Means', {
        x: CONFIG.page.margin + 15,
        y: ctx.y - 18,
        size: CONFIG.fonts.heading3,
        font: ctx.fonts.bold,
        color: CONFIG.colors.secondary,
    });

    // Generate plain-English explanation
    let explanation: string;
    const score = synthesis.uk_alignment_score;

    if (score >= 70) {
        explanation =
            'This system demonstrates strong alignment with UK AI governance requirements. Minor gaps should be addressed before deployment, but overall regulatory risk is low.';
    } else if (score >= 50) {
        explanation =
            'This system has moderate compliance gaps that require attention before deployment. Without remediation, you may face regulatory scrutiny, enforcement action, or reputational risk.';
    } else {
        explanation =
            'This system has significant compliance gaps that pose material regulatory risk. Deployment in current state could result in enforcement action, fines, or mandatory operational changes.';
    }

    const lines = wrapText(explanation, CONFIG.page.width - 2 * CONFIG.page.margin - 30, CONFIG.fonts.body, ctx.fonts.regular);
    let textY = ctx.y - 38;

    for (const line of lines) {
        ctx.page.drawText(line, {
            x: CONFIG.page.margin + 15,
            y: textY,
            size: CONFIG.fonts.body,
            font: ctx.fonts.regular,
            color: CONFIG.colors.text,
        });
        textY -= CONFIG.fonts.body + 5;
    }

    ctx.y -= boxHeight + 20;
    return ctx;
}

function drawFrameworkScores(ctx: PageContext, synthesis: Synthesis): PageContext {
    ctx = drawHeading(ctx, 'Framework Scores', 2);

    const barHeight = 24;
    const barMaxWidth = 280;
    const labelWidth = 130;

    for (const [framework, score] of Object.entries(synthesis.framework_scores)) {
        ctx = ensureSpace(ctx, barHeight + 15);

        ctx.page.drawText(truncateText(framework, 22), {
            x: CONFIG.page.margin,
            y: ctx.y - barHeight / 2 + 4,
            size: CONFIG.fonts.body,
            font: ctx.fonts.regular,
            color: CONFIG.colors.text,
        });

        const barX = CONFIG.page.margin + labelWidth;
        ctx.page.drawRectangle({
            x: barX,
            y: ctx.y - barHeight,
            width: barMaxWidth,
            height: barHeight,
            color: CONFIG.colors.background,
        });

        const scoreWidth = (score / 100) * barMaxWidth;
        if (scoreWidth > 0) {
            ctx.page.drawRectangle({
                x: barX,
                y: ctx.y - barHeight,
                width: scoreWidth,
                height: barHeight,
                color: getScoreColor(score),
            });
        }

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

    for (let i = 0; i < Math.min(actions.length, 5); i++) {
        const action = actions[i];
        ctx = ensureSpace(ctx, 30);

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

function drawFrameworkHeader(ctx: PageContext, name: string, score: number): PageContext {
    ctx = ensureSpace(ctx, 50);

    const headerHeight = 36;

    // Background with left accent bar
    ctx.page.drawRectangle({
        x: CONFIG.page.margin,
        y: ctx.y - headerHeight,
        width: CONFIG.page.width - 2 * CONFIG.page.margin,
        height: headerHeight,
        color: CONFIG.colors.background,
    });

    // Coloured left border
    ctx.page.drawRectangle({
        x: CONFIG.page.margin,
        y: ctx.y - headerHeight,
        width: 5,
        height: headerHeight,
        color: getScoreColor(score),
    });

    // Framework name
    ctx.page.drawText(name, {
        x: CONFIG.page.margin + 15,
        y: ctx.y - 23,
        size: CONFIG.fonts.heading2,
        font: ctx.fonts.bold,
        color: CONFIG.colors.secondary,
    });

    // Score on right
    const scoreText = `${score}%`;
    const scoreWidth = ctx.fonts.bold.widthOfTextAtSize(scoreText, CONFIG.fonts.heading2);
    ctx.page.drawText(scoreText, {
        x: CONFIG.page.width - CONFIG.page.margin - scoreWidth - 15,
        y: ctx.y - 23,
        size: CONFIG.fonts.heading2,
        font: ctx.fonts.bold,
        color: getScoreColor(score),
    });

    ctx.y -= headerHeight + 15;
    return ctx;
}

function drawRequirementsTable(ctx: PageContext, principles: { name: string; result: PrincipleResult | undefined }[]): PageContext {
    ctx = ensureSpace(ctx, 25);

    ctx.page.drawText('Requirements:', {
        x: CONFIG.page.margin,
        y: ctx.y,
        size: CONFIG.fonts.heading3,
        font: ctx.fonts.bold,
        color: CONFIG.colors.secondary,
    });
    ctx.y -= 18;

    for (const principle of principles) {
        if (!principle.result) continue;

        ctx = ensureSpace(ctx, 18);

        // Requirement name (truncated)
        ctx.page.drawText(truncateText(principle.name, 35), {
            x: CONFIG.page.margin + 5,
            y: ctx.y,
            size: CONFIG.fonts.small,
            font: ctx.fonts.regular,
            color: CONFIG.colors.text,
        });

        // Status badge
        drawStatusBadge(ctx, principle.result.status, CONFIG.page.margin + 220, ctx.y);

        ctx.y -= 16;
    }

    ctx.y -= 10;
    return ctx;
}

function drawFrameworkDetail(ctx: PageContext, fw: FrameworkDisplay): PageContext {
    if (!fw.result || fw.result.score === 0) return ctx;

    ctx = drawFrameworkHeader(ctx, fw.name, fw.result.score);

    // Summary (truncated to 2 lines max)
    if (fw.result.compliance_summary) {
        const summaryLines = wrapText(
            fw.result.compliance_summary,
            CONFIG.page.width - 2 * CONFIG.page.margin,
            CONFIG.fonts.body,
            ctx.fonts.regular
        ).slice(0, 3);

        for (const line of summaryLines) {
            ctx = ensureSpace(ctx, CONFIG.fonts.body + 5);
            ctx.page.drawText(line, {
                x: CONFIG.page.margin,
                y: ctx.y,
                size: CONFIG.fonts.body,
                font: ctx.fonts.regular,
                color: CONFIG.colors.textLight,
            });
            ctx.y -= CONFIG.fonts.body + 5;
        }
        ctx.y -= 10;
    }

    // Requirements table (compact)
    if (fw.principles && fw.principles.length > 0) {
        ctx = drawRequirementsTable(ctx, fw.principles);
    }

    // Strengths (max 2)
    if (fw.result.strengths && fw.result.strengths.length > 0) {
        ctx = ensureSpace(ctx, 25);
        ctx.page.drawText('Strengths', {
            x: CONFIG.page.margin,
            y: ctx.y,
            size: CONFIG.fonts.heading3,
            font: ctx.fonts.bold,
            color: CONFIG.colors.success,
        });
        ctx.y -= 16;

        for (const strength of fw.result.strengths.slice(0, 2)) {
            ctx = drawBulletPoint(ctx, truncateText(strength, 120));
        }
    }

    // Critical Gaps (max 2)
    if (fw.result.critical_gaps && fw.result.critical_gaps.length > 0) {
        ctx = ensureSpace(ctx, 25);
        ctx.page.drawText('Critical Gaps', {
            x: CONFIG.page.margin,
            y: ctx.y,
            size: CONFIG.fonts.heading3,
            font: ctx.fonts.bold,
            color: CONFIG.colors.danger,
        });
        ctx.y -= 16;

        for (const gap of fw.result.critical_gaps.slice(0, 2)) {
            ctx = drawBulletPoint(ctx, truncateText(gap, 120));
        }
    }

    ctx.y -= CONFIG.spacing.section;
    return ctx;
}

function drawDetailedFindings(ctx: PageContext, frameworks: FrameworkDisplay[]): PageContext {
    // Check if we have any detailed gaps to show
    const hasDetailedGaps = frameworks.some(
        (fw) =>
            fw.principles?.some((p) => p.result?.gap && p.result.gap !== 'none' && p.result.gap.length > 50) ||
            (fw.result?.critical_gaps && fw.result.critical_gaps.some((g) => g.length > 50))
    );

    if (!hasDetailedGaps) return ctx;

    ctx = createNewPage(ctx);
    ctx = drawHeading(ctx, 'Detailed Findings', 1);

    for (const fw of frameworks) {
        if (!fw.result || fw.result.score === 0) continue;

        // Check if this framework has detailed findings
        const hasFindings =
            fw.principles?.some((p) => p.result?.gap && p.result.gap !== 'none' && p.result.gap.length > 30) ||
            (fw.result.critical_gaps && fw.result.critical_gaps.length > 0);

        if (!hasFindings) continue;

        ctx = ensureSpace(ctx, 40);
        ctx.page.drawText(fw.shortName, {
            x: CONFIG.page.margin,
            y: ctx.y,
            size: CONFIG.fonts.heading2,
            font: ctx.fonts.bold,
            color: CONFIG.colors.primary,
        });
        ctx.y -= 22;

        // Full gap details from principles
        if (fw.principles) {
            for (const principle of fw.principles) {
                if (!principle.result?.gap || principle.result.gap === 'none' || principle.result.gap === 'N/A') continue;

                ctx = ensureSpace(ctx, 40);

                ctx.page.drawText(principle.name, {
                    x: CONFIG.page.margin,
                    y: ctx.y,
                    size: CONFIG.fonts.body,
                    font: ctx.fonts.bold,
                    color: CONFIG.colors.text,
                });
                ctx.y -= 14;

                ctx = drawText(ctx, principle.result.gap, {
                    size: CONFIG.fonts.small,
                    color: CONFIG.colors.textLight,
                    x: CONFIG.page.margin + 10,
                    maxWidth: CONFIG.page.width - 2 * CONFIG.page.margin - 10,
                });

                ctx.y -= 8;
            }
        }

        ctx.y -= 15;
    }

    return ctx;
}

function drawFooters(ctx: PageContext): void {
    const totalPages = ctx.doc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
        const page = ctx.doc.getPage(i);

        page.drawLine({
            start: { x: CONFIG.page.margin, y: 35 },
            end: { x: CONFIG.page.width - CONFIG.page.margin, y: 35 },
            thickness: 0.5,
            color: CONFIG.colors.border,
        });

        const pageText = `Page ${i + 1} of ${totalPages}`;
        page.drawText(pageText, {
            x: CONFIG.page.margin,
            y: 22,
            size: CONFIG.fonts.tiny,
            font: ctx.fonts.regular,
            color: CONFIG.colors.textMuted,
        });

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

    // Page 1: Executive Summary
    ctx = drawHeader(ctx);
    ctx = drawHorizontalRule(ctx);
    ctx = drawDocumentInfo(ctx, extractedData, synthesis);
    ctx = drawExecutiveSummary(ctx, synthesis, icoResult, dpaResult, euActResult, isoResult);
    ctx = drawWhatThisMeans(ctx, synthesis);
    ctx = drawFrameworkScores(ctx, synthesis);
    ctx = drawPriorityActions(ctx, synthesis.priority_actions);

    // Page 2+: Framework Details
    ctx = drawHorizontalRule(ctx);
    ctx = drawHeading(ctx, 'Framework Analysis', 1);

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
            shortName: 'EU AI Act',
            result: euActResult,
        },
        {
            name: 'ISO/IEC 42001:2023',
            shortName: 'ISO 42001',
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
        ctx = drawFrameworkDetail(ctx, fw);
    }

    // Final page: Detailed Findings (full gap text)
    ctx = drawDetailedFindings(ctx, frameworks);

    // Add footers
    drawFooters(ctx);

    return doc.save();
}