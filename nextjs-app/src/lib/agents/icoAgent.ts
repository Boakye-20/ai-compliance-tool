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

Return ONLY valid JSON with this exact structure (no markdown, no text before or after):
{
  "document_type_detected": "${docType}",
  "principle_1_safety": { "status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW" },
  "principle_2_fairness": { "status": "PARTIALLY_MET", "evidence_found": ["quote"], "gap": "description", "priority": "MEDIUM" },
  "principle_3_accountability": { "status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW" },
  "principle_4_contestability": { "status": "NOT_MET", "evidence_found": [], "gap": "description", "priority": "HIGH" },
  "principle_5_data_minimization": { "status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW" },
  "overall_score": 65,
  "critical_gaps": ["gap 1"],
  "strengths": ["strength 1", "strength 2"],
  "priority_actions": ["action 1", "action 2"],
  "compliance_summary": "Summary of compliance status."
}

Status: MET, PARTIALLY_MET, NOT_MET, or EVIDENCE_MISSING.
Priority: CRITICAL, HIGH, MEDIUM, or LOW.
Score: 0-100 as a number.

IMPORTANT: Return ONLY the JSON object. No markdown. No explanatory text.
`;
}

export async function analyzeICOCompliance(extractedData: ExtractedData): Promise<ICOResult> {
    const prompt = getICOPrompt(extractedData);

    try {
        console.log('ICO agent: calling Perplexity...');
        const response = await callPerplexity(prompt, 'sonar-pro');
        console.log('ICO agent: raw response length:', response.length);
        console.log('ICO agent: first 300 chars:', response.slice(0, 300));
        const result = parseJsonResponse<ICOResult>(response);
        console.log('ICO agent: parsed successfully, score:', (result as any).overall_score);

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
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('ICO analysis error:', errMsg);
        console.error('Full error:', error);
        return {
            framework: 'UK ICO',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: `ICO analysis failed: ${errMsg.slice(0, 200)}`,
        };
    }
}
