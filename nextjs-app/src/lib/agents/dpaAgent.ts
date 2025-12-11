import { ExtractedData, DPAResult } from '../backend/types';
import { callPerplexity, parseJsonResponse } from '../llm/perplexityClient';

function getDPAPrompt(extractedData: ExtractedData): string {
    const docType = extractedData.document_type || 'SYSTEM_SPEC';
    const topicsCovered = extractedData.compliance_topics_covered || [];

    return `
You are a UK Data Protection Act 2018 / GDPR compliance specialist for AI systems.

**DOCUMENT TYPE: ${docType}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE": Score based on whether it DISCUSSES/RECOMMENDS data protection practices. A playbook covering DPIA, lawful basis, transparency should score HIGH.
- If document_type is "SYSTEM_SPEC": Score based on whether it DEMONSTRATES specific compliance.

**DOCUMENT DETAILS:**
- Document type: ${docType}
- Topics covered: ${topicsCovered.length > 0 ? topicsCovered.join(', ') : 'None identified'}
- Use case: ${extractedData.use_case || 'Unknown'}
- Data types: ${extractedData.data_types?.join(', ') || 'None'}
- Personal data: ${extractedData.has_personal_data}

**DOCUMENT TEXT:**
${extractedData.full_text?.slice(0, 25000) || ''}

---

Analyze these AI-relevant GDPR/DPA requirements:

1. Article 22 - Automated decision-making
2. Article 5 - Data principles
3. Article 13/14 - Transparency
4. Article 35 - DPIA

Return ONLY valid JSON (no markdown):
{
  "document_type_detected": "${docType}",
  "article_22_adm": { "status": "...", "evidence_found": [], "sections_relevant": [], "gap": "", "priority": "..." },
  "article_5_fairness": { ... },
  "article_13_transparency": { ... },
  "article_35_dpia": { ... },
  "overall_score": 0-100,
  "critical_gaps": [],
  "strengths": [],
  "priority_actions": [],
  "compliance_summary": "2-3 sentence summary"
}

IMPORTANT: A government AI playbook that extensively discusses GDPR, DPIAs, data protection by design should score 60-85%, not 0%.
`;
}

export async function analyzeDPACompliance(extractedData: ExtractedData): Promise<DPAResult> {
    const prompt = getDPAPrompt(extractedData);

    try {
        const response = await callPerplexity(prompt, 'sonar-pro');
        const result = parseJsonResponse<DPAResult>(response);

        const overallScore = typeof (result as any).overall_score === 'number' ? (result as any).overall_score : 0;

        const criticalGapsCount = [
            result.article_22_adm,
            result.article_5_fairness,
            result.article_13_transparency,
            result.article_35_dpia,
        ].filter((p) => p?.priority === 'CRITICAL').length;

        return {
            ...result,
            framework: 'UK DPA / GDPR',
            score: overallScore,
            critical_gaps_count: criticalGapsCount,
            critical_gaps: result.critical_gaps || [],
            priority_actions: result.priority_actions || [],
            strengths: result.strengths || [],
            compliance_summary: result.compliance_summary || 'Analysis completed.',
        };
    } catch (error) {
        console.error('DPA analysis error:', error);
        return {
            framework: 'UK DPA / GDPR',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: 'UK DPA/GDPR analysis could not be completed. Treat this framework as not yet assessed.',
        };
    }
}
