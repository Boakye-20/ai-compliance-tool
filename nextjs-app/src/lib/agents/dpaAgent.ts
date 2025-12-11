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

Return ONLY valid JSON with this exact structure (no markdown, no explanatory text):
{
  "document_type_detected": "${docType}",
  "article_22_adm": { "status": "MET", "evidence_found": ["quote 1"], "gap": "none", "priority": "LOW" },
  "article_5_fairness": { "status": "PARTIALLY_MET", "evidence_found": ["quote 1"], "gap": "description", "priority": "MEDIUM" },
  "article_13_transparency": { "status": "NOT_MET", "evidence_found": [], "gap": "description", "priority": "HIGH" },
  "article_35_dpia": { "status": "MET", "evidence_found": ["quote 1"], "gap": "none", "priority": "LOW" },
  "overall_score": 75,
  "critical_gaps": ["gap 1", "gap 2"],
  "strengths": ["strength 1", "strength 2"],
  "priority_actions": ["action 1", "action 2"],
  "compliance_summary": "2-3 sentence summary of compliance status"
}

Status values: MET, PARTIALLY_MET, NOT_MET, or EVIDENCE_MISSING.
Priority values: CRITICAL, HIGH, MEDIUM, or LOW.
Score range: 0-100 as a number.

IMPORTANT: Return ONLY the JSON object. No markdown code fences. No text before or after.
`;
}

export async function analyzeDPACompliance(extractedData: ExtractedData): Promise<DPAResult> {
    const prompt = getDPAPrompt(extractedData);

    try {
        console.log('DPA agent: calling Perplexity...');
        const response = await callPerplexity(prompt, 'sonar-reasoning');
        console.log('DPA agent: raw response length:', response.length);
        console.log('DPA agent: first 300 chars:', response.slice(0, 300));
        const result = parseJsonResponse<DPAResult>(response);
        console.log('DPA agent: parsed successfully, score:', (result as any).overall_score);

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
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('DPA analysis error:', errMsg);
        console.error('Full error:', error);
        return {
            framework: 'UK DPA / GDPR',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: `DPA analysis failed: ${errMsg.slice(0, 200)}`,
        };
    }
}
