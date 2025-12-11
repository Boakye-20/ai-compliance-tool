import { ExtractedData, ICOResult } from '../backend/types';
import { callPerplexity, parseJsonResponse } from '../llm/perplexityClient';

function getICOPrompt(extractedData: ExtractedData): string {
    const docType = extractedData.document_type || 'SYSTEM_SPEC';
    const topicsCovered = extractedData.compliance_topics_covered || [];

    return `
You are a UK ICO (Information Commissioner's Office) AI compliance specialist.

**DOCUMENT TYPE: ${docType}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE" or "STRATEGY": Score based on whether it RECOMMENDS/COVERS the right practices. A playbook that discusses safety, fairness, accountability etc. should score HIGH.
- If document_type is "SYSTEM_SPEC" or "ASSESSMENT": Score based on whether it DEMONSTRATES specific compliance for a particular system.

For GUIDANCE documents: Look for sections discussing, recommending, or providing frameworks for each principle.
For SYSTEM_SPEC documents: Look for specific implementations, concrete evidence, named controls.

**DOCUMENT DETAILS:**
- Document type: ${docType}
- Topics already identified as covered: ${topicsCovered.length > 0 ? topicsCovered.join(', ') : 'None identified'}
- Use case: ${extractedData.use_case || 'Unknown'}
- System type: ${extractedData.system_type || 'Unknown'}
- Data types: ${extractedData.data_types?.join(', ') || 'None'}
- Personal data: ${extractedData.has_personal_data}
- Biometric data: ${extractedData.has_biometric_data}
- Human oversight: ${extractedData.has_human_oversight}

**DOCUMENT TEXT:**
${extractedData.full_text?.slice(0, 25000) || ''}

---

Analyze against the 5 ICO AI principles:

1. Safety, Security & Robustness
2. Fairness & Transparency
3. Accountability & Governance
4. Contestability & Redress
5. Data Minimization & Privacy

For each principle, find SPECIFIC QUOTES or SECTIONS from the document that address it.

Return ONLY valid JSON (no markdown):
{
  "document_type_detected": "${docType}",
  "principle_1_safety": {
    "status": "MET" | "PARTIALLY_MET" | "NOT_MET" | "EVIDENCE_MISSING",
    "evidence_found": ["Quote 1 from document", "Quote 2 from document"],
    "sections_relevant": ["Section names or page references"],
    "gap": "What's missing (or 'None - adequately covered')",
    "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  },
  "principle_2_fairness": { ... },
  "principle_3_accountability": { ... },
  "principle_4_contestability": { ... },
  "principle_5_data_minimization": { ... },
  "overall_score": 0-100,
  "critical_gaps": ["List of critical issues - empty if none"],
  "strengths": ["What the document does well"],
  "priority_actions": ["Top 3-5 actions if any gaps exist"],
  "compliance_summary": "2-3 sentence summary"
}

IMPORTANT: The "..." blocks above are ONLY illustrative. In your actual JSON output you MUST fully expand every object and you MUST NOT output any "..." tokens anywhere. If information is missing, still return a complete object with empty arrays or explanatory strings.

SCORING GUIDE:
- Document covers the topic with specific guidance/recommendations = MET
- Document mentions topic but lacks detail = PARTIALLY_MET
- Document does not address the topic = NOT_MET or EVIDENCE_MISSING

For a comprehensive GUIDANCE document like a government playbook, expect scores of 60-90%.
`;
}

export async function analyzeICOCompliance(extractedData: ExtractedData): Promise<ICOResult> {
    const prompt = getICOPrompt(extractedData);

    try {
        const response = await callPerplexity(prompt, 'sonar-pro');
        const result = parseJsonResponse<ICOResult>(response);

        const overallScore = typeof (result as any).overall_score === 'number' ? (result as any).overall_score : 0;

        const criticalGapsCount = [
            result.principle_1_safety,
            result.principle_2_fairness,
            result.principle_3_accountability,
            result.principle_4_contestability,
            result.principle_5_data_minimization,
        ].filter((p) => p?.priority === 'CRITICAL').length;

        return {
            ...result,
            framework: 'UK ICO',
            score: overallScore,
            critical_gaps_count: criticalGapsCount,
            critical_gaps: result.critical_gaps || [],
            priority_actions: result.priority_actions || [],
            strengths: result.strengths || [],
            compliance_summary: result.compliance_summary || 'Analysis completed.',
        };
    } catch (error) {
        console.error('ICO analysis error:', error);
        return {
            framework: 'UK ICO',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: 'UK ICO analysis could not be completed. Treat this framework as not yet assessed.',
        };
    }
}
