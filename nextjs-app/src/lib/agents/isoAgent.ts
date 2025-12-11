import { ExtractedData, ISOResult } from '../backend/types';
import { callPerplexity, parseJsonResponse } from '../llm/perplexityClient';

function getISOPrompt(extractedData: ExtractedData): string {
    const docType = extractedData.document_type || 'SYSTEM_SPEC';
    const topicsCovered = extractedData.compliance_topics_covered || [];

    return `
You are an ISO/IEC 42001:2023 (AI Management System) compliance specialist.

**DOCUMENT TYPE: ${docType}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE": Score based on whether it PROVIDES FRAMEWORKS for AI governance, risk management, lifecycle management. Government guidance covering these topics should score WELL.
- If document_type is "SYSTEM_SPEC": Score based on specific organizational implementation.

**DOCUMENT DETAILS:**
- Document type: ${docType}
- Topics covered: ${topicsCovered.length > 0 ? topicsCovered.join(', ') : 'None identified'}
- Use case: ${extractedData.use_case || 'Unknown'}
- Human oversight: ${extractedData.has_human_oversight}

**DOCUMENT TEXT:**
${extractedData.full_text?.slice(0, 25000) || ''}

---

Analyze these ISO 42001 requirement areas:
1. Governance Framework
2. Risk Management
3. Data Quality & Lifecycle
4. Monitoring & Incident Response

Return ONLY valid JSON (no markdown):
{
  "document_type_detected": "${docType}",
  "governance": { "status": "...", "evidence_found": [], "sections_relevant": [], "gap": "", "priority": "..." },
  "risk_management": { ... },
  "data_lifecycle": { ... },
  "monitoring": { ... },
  "overall_score": 0-100,
  "critical_gaps": [],
  "strengths": [],
  "priority_actions": [],
  "compliance_summary": "2-3 sentence summary"
}

IMPORTANT: The "..." tokens in the JSON shape above are ONLY illustrative. In your actual JSON output you MUST fill in complete objects for every field and you MUST NOT output any "...". If information is missing, still provide full objects with empty arrays or explanatory strings.
`;
}

export async function analyzeISOCompliance(extractedData: ExtractedData): Promise<ISOResult> {
    const prompt = getISOPrompt(extractedData);

    try {
        const response = await callPerplexity(prompt, 'sonar-pro');
        const result = parseJsonResponse<ISOResult>(response);

        const overallScore = typeof (result as any).overall_score === 'number' ? (result as any).overall_score : 0;

        const criticalGapsCount = [result.governance, result.risk_management, result.data_lifecycle, result.monitoring].filter(
            (p) => (p as any)?.priority === 'CRITICAL'
        ).length;

        return {
            ...result,
            framework: 'ISO/IEC 42001',
            score: overallScore,
            critical_gaps_count: criticalGapsCount,
            critical_gaps: result.critical_gaps || [],
            priority_actions: result.priority_actions || [],
            strengths: result.strengths || [],
            compliance_summary: result.compliance_summary || 'Analysis completed.',
        };
    } catch (error) {
        console.error('ISO analysis error:', error);
        return {
            framework: 'ISO/IEC 42001',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: 'ISO 42001 analysis could not be completed. Treat this framework as not yet assessed.',
        };
    }
}
