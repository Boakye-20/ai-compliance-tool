import { ExtractedData, DPAResult } from '../backend/types';
import { callPerplexity, parseJsonResponse } from '../llm/perplexityClient';

function getDPAPrompt(extractedData: ExtractedData): string {
    const docType = extractedData.document_type || 'SYSTEM_SPEC';

    return `
You are a UK Data Protection Act 2018 specialist analyzing AI compliance.

TASK: Create a JSON object with your analysis - NO TEXT before or after the JSON object.

Document: ${docType} - ${extractedData.use_case || 'Unknown'} 

Focus on these GDPR/DPA requirements:
1. Article 22 - Automated decision-making safeguards
2. Article 5 - Data principles (fairness, minimization, etc.)
3. Articles 13/14 - Transparency requirements
4. Article 35 - Data Protection Impact Assessment

Document excerpt:
${extractedData.full_text?.slice(0, 6000) || ''}

Return a valid JSON object with this structure:
{
  "document_type_detected": "${docType}",
  "article_22_adm": { 
    "status": "MET", 
    "evidence_found": ["Quote from document"],
    "gap": "none", 
    "priority": "LOW" 
  },
  "article_5_fairness": { 
    "status": "PARTIALLY_MET", 
    "evidence_found": ["Quote from document"], 
    "gap": "Brief description", 
    "priority": "MEDIUM" 
  },
  "article_13_transparency": { 
    "status": "NOT_MET", 
    "evidence_found": [], 
    "gap": "Brief description", 
    "priority": "HIGH" 
  },
  "article_35_dpia": { 
    "status": "MET", 
    "evidence_found": ["Quote from document"], 
    "gap": "none", 
    "priority": "LOW" 
  },
  "overall_score": 75,
  "critical_gaps": ["Gap 1", "Gap 2"],
  "strengths": ["Strength 1", "Strength 2"],
  "priority_actions": ["Action 1", "Action 2"],
  "compliance_summary": "Brief summary of compliance status"
}

Status options: MET, PARTIALLY_MET, NOT_MET, EVIDENCE_MISSING
Priority options: CRITICAL, HIGH, MEDIUM, LOW
Score: 0-100 (number)

IMPORTANT: Generate ONLY the JSON - no explanation text, no markdown, nothing else.
`;
}

export async function analyzeDPACompliance(extractedData: ExtractedData): Promise<DPAResult> {
    const prompt = getDPAPrompt(extractedData);

    try {
        console.log('DPA agent: calling Perplexity...');
        const response = await callPerplexity(prompt, 'sonar-pro');
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
