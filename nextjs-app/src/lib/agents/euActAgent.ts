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

Return ONLY valid JSON (no markdown):
{
  "document_type_detected": "${docType}",
  "risk_tier": "PROHIBITED" | "HIGH_RISK" | "LIMITED_RISK" | "MINIMAL_RISK" | "N/A_GUIDANCE",
  "risk_justification": "Why this classification (or 'Guidance document - assessing coverage')",
  "eu_act_coverage": {
    "risk_classification_discussed": true/false,
    "high_risk_obligations_discussed": true/false,
    "transparency_requirements_discussed": true/false,
    "prohibited_practices_discussed": true/false
  },
  "evidence_found": ["Key quotes about EU AI Act compliance"],
  "sections_relevant": ["Relevant section names"],
  "obligations_if_high_risk": {
    "risk_management_system": {"status": "MET"|"PARTIALLY_MET"|"NOT_MET"|"EVIDENCE_MISSING"|"N/A", "evidence_found": [], "gap": "", "priority": "..." },
    "data_governance": {"status": "...", "evidence_found": [], "gap": "", "priority": "..." },
    "technical_documentation": {"status": "...", "evidence_found": [], "gap": "", "priority": "..." },
    "record_keeping": {"status": "...", "evidence_found": [], "gap": "", "priority": "..." },
    "transparency": {"status": "...", "evidence_found": [], "gap": "", "priority": "..." },
    "human_oversight": {"status": "...", "evidence_found": [], "gap": "", "priority": "..." },
    "accuracy_robustness": {"status": "...", "evidence_found": [], "gap": "", "priority": "..." },
    "quality_management": {"status": "...", "evidence_found": [], "gap": "", "priority": "..." }
  },
  "overall_score": 0-100,
  "critical_gaps": [],
  "strengths": [],
  "priority_actions": [],
  "compliance_summary": "2-3 sentences"
}
`;
}

export async function analyzeEUActCompliance(extractedData: ExtractedData): Promise<EUActResult> {
    const prompt = getEUActPrompt(extractedData);

    try {
        const response = await callPerplexity(prompt, 'sonar-pro');
        const result = parseJsonResponse<EUActResult>(response);

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
        console.error('EU Act analysis error:', error);
        return {
            framework: 'EU AI Act',
            risk_tier: 'UNKNOWN',
            risk_justification: '',
            score: 0,
            critical_gaps_count: 0,
            critical_gaps: [],
            priority_actions: [],
            strengths: [],
            compliance_summary: 'EU AI Act analysis could not be completed. Treat this framework as not yet assessed.',
        };
    }
}
