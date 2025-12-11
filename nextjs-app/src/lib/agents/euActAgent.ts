import { ExtractedData, EUActResult } from '../backend/types';
import { callPerplexity, parseJsonResponse } from '../llm/perplexityClient';

function getEUActPrompt(extractedData: ExtractedData): string {
    const docType = extractedData.document_type || 'SYSTEM_SPEC';
    const topicsCovered = extractedData.compliance_topics_covered || [];

    return `
You are an EU AI Act compliance specialist.

**DOCUMENT TYPE: ${docType}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE": Assess whether it provides frameworks for EU AI Act compliance (risk classification, high-risk obligations, transparency). Government guidance covering these = HIGH score.
- If document_type is "SYSTEM_SPEC": Assess specific system against EU AI Act requirements.

**DOCUMENT DETAILS:**
- Document type: ${docType}
- Topics covered: ${topicsCovered.length > 0 ? topicsCovered.join(', ') : 'None identified'}
- Use case: ${extractedData.use_case || 'Unknown'}
- System type: ${extractedData.system_type || 'Unknown'}
- Biometric data: ${extractedData.has_biometric_data}
- Deployment: ${extractedData.deployment_context || 'Unknown'}

**DOCUMENT TEXT:**
${extractedData.full_text?.slice(0, 25000) || ''}

---

Return ONLY valid JSON with this exact structure (no markdown, no text before or after):
{
  "document_type_detected": "${docType}",
  "risk_tier": "HIGH_RISK",
  "risk_justification": "Reason for classification",
  "eu_act_coverage": {
    "risk_classification_discussed": true,
    "high_risk_obligations_discussed": true,
    "transparency_requirements_discussed": false,
    "prohibited_practices_discussed": false
  },
  "evidence_found": ["quote 1", "quote 2"],
  "obligations_if_high_risk": {
    "risk_management_system": {"status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW"},
    "data_governance": {"status": "PARTIALLY_MET", "evidence_found": ["quote"], "gap": "description", "priority": "MEDIUM"},
    "technical_documentation": {"status": "NOT_MET", "evidence_found": [], "gap": "description", "priority": "HIGH"},
    "transparency": {"status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW"},
    "human_oversight": {"status": "MET", "evidence_found": ["quote"], "gap": "none", "priority": "LOW"}
  },
  "overall_score": 55,
  "critical_gaps": ["gap 1"],
  "strengths": ["strength 1", "strength 2"],
  "priority_actions": ["action 1", "action 2"],
  "compliance_summary": "Summary of EU AI Act compliance status."
}

Risk tier: PROHIBITED, HIGH_RISK, LIMITED_RISK, MINIMAL_RISK, or N/A_GUIDANCE.
Status: MET, PARTIALLY_MET, NOT_MET, EVIDENCE_MISSING, or N/A.
Priority: CRITICAL, HIGH, MEDIUM, or LOW.
Score: 0-100 as a number.

IMPORTANT: Return ONLY the JSON object. No markdown. No explanatory text.
`;
}

export async function analyzeEUActCompliance(extractedData: ExtractedData): Promise<EUActResult> {
    const prompt = getEUActPrompt(extractedData);

    try {
        console.log('EU Act agent: calling Perplexity...');
        const response = await callPerplexity(prompt, 'sonar-pro');
        console.log('EU Act agent: raw response length:', response.length);
        console.log('EU Act agent: first 300 chars:', response.slice(0, 300));
        const result = parseJsonResponse<EUActResult>(response);
        console.log('EU Act agent: parsed successfully, score:', (result as any).overall_score);

        const overallScore = typeof (result as any).overall_score === 'number' ? (result as any).overall_score : 0;

        let criticalGapsCount = 0;
        if (result.risk_tier === 'HIGH_RISK' && result.obligations_if_high_risk) {
            criticalGapsCount = Object.values(result.obligations_if_high_risk).filter(
                (ob: any) => ob?.priority === 'CRITICAL'
            ).length;
        }

        return {
            ...result,
            framework: 'EU AI Act',
            score: overallScore,
            critical_gaps_count: criticalGapsCount,
            critical_gaps: result.critical_gaps || [],
            priority_actions: result.priority_actions || [],
            strengths: result.strengths || [],
            compliance_summary: result.compliance_summary || 'Analysis completed.',
            risk_tier: result.risk_tier || 'UNKNOWN',
            risk_justification: result.risk_justification || '',
        };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('EU Act analysis error:', errMsg);
        console.error('Full error:', error);
        return {
            framework: 'EU AI Act',
            risk_tier: 'UNKNOWN',
            risk_justification: '',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: `EU AI Act analysis failed: ${errMsg.slice(0, 200)}`,
        };
    }
}
