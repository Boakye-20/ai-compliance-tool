import { ExtractedData, FrameworkCode } from '../backend/types';

const HIGH_RISK_KEYWORDS = [
    'biometric',
    'facial',
    'emotion',
    'credit scoring',
    'recruitment',
    'law enforcement',
    'border control',
    'facial recognition',
    'live facial',
    'watchlist',
];

export function routeFrameworks(extractedData: ExtractedData, userSelections: FrameworkCode[]): FrameworkCode[] {
    // IMPORTANT: Respect user selections - this is the primary source of truth
    // Only use the detected frameworks as suggestions for logging/messaging purposes

    // Clone user selections to avoid modifying the original array
    return [...userSelections];

    /* Removed auto-triggering logic: The user's explicit selections should be respected
    const frameworks = new Set<FrameworkCode>(userSelections);

    // Auto-trigger ICO/DPA if personal data detected
    if (extractedData.has_personal_data) {
        frameworks.add('ICO');
        frameworks.add('DPA');
    }

    // Auto-trigger EU AI Act for high-risk indicators
    const combinedText = [
        ...extractedData.keywords,
        extractedData.system_type,
        extractedData.use_case,
        extractedData.deployment_context,
    ]
        .join(' ')
        .toLowerCase();

    if (HIGH_RISK_KEYWORDS.some((kw) => combinedText.includes(kw))) {
        frameworks.add('EU_AI_ACT');
    }

    // Biometric data always triggers EU AI Act
    if (extractedData.has_biometric_data) {
        frameworks.add('EU_AI_ACT');
    }

    // ISO 42001 is always relevant for governance if anything is being evaluated
    if (frameworks.size > 0) {
        frameworks.add('ISO_42001');
    }

    return Array.from(frameworks);
    */
}
