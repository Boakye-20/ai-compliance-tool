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
${extractedData.full_text?.slice(0, 12000) || ''}

---

Analyze these ISO 42001 requirement areas:
1. Governance Framework
2. Risk Management
3. Data Quality & Lifecycle
4. Monitoring & Incident Response

Return ONLY valid JSON with this exact structure (no markdown, no text before or after):
{
  "document_type_detected": "${docType}",
  "governance": { "status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW" },
  "risk_management": { "status": "PARTIALLY_MET", "evidence_found": ["quote"], "gap": "description", "priority": "MEDIUM" },
  "data_lifecycle": { "status": "NOT_MET", "evidence_found": [], "gap": "description", "priority": "HIGH" },
  "monitoring": { "status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW" },
  "overall_score": 60,
  "critical_gaps": ["gap 1"],
  "strengths": ["strength 1", "strength 2"],
  "priority_actions": ["action 1", "action 2"],
  "compliance_summary": "Summary of ISO 42001 compliance status."
}

Status: MET, PARTIALLY_MET, NOT_MET, or EVIDENCE_MISSING.
Priority: CRITICAL, HIGH, MEDIUM, or LOW.
Score: 0-100 as a number.

IMPORTANT: Return ONLY the JSON object. No markdown. No explanatory text.
`;
}

export async function analyzeISOCompliance(extractedData: ExtractedData): Promise<ISOResult> {
    const prompt = getISOPrompt(extractedData);

    try {
        console.log('ISO agent: calling Perplexity...');
        const response = await callPerplexity(prompt, 'sonar-reasoning');
        console.log('ISO agent: raw response length:', response.length);
        console.log('ISO agent: first 300 chars:', response.slice(0, 300));
        const result = parseJsonResponse<ISOResult>(response);
        console.log('ISO agent: parsed successfully, score:', (result as any).overall_score);

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
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('ISO analysis error:', errMsg);
        console.error('Full error:', error);
        return {
            framework: 'ISO/IEC 42001',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: `ISO 42001 analysis failed: ${errMsg.slice(0, 200)}`,
        };
    }
}
