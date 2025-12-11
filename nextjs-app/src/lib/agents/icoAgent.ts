import { ExtractedData, ICOResult } from '../backend/types';
import { callPerplexity, parseJsonResponse } from '../llm/perplexityClient';

function getICOPrompt(extractedData: ExtractedData): string {
    const docType = extractedData.document_type || 'SYSTEM_SPEC';

    return `
You are a UK ICO AI compliance specialist analyzing against the 5 ICO AI principles.

TASK: Create a JSON object with your analysis - NO TEXT before or after the JSON object.

Document: ${docType} - ${extractedData.use_case || 'Unknown'}

Focus on these 5 ICO AI principles:
1. Safety, Security & Robustness
2. Fairness & Transparency
3. Accountability & Governance
4. Contestability & Redress
5. Data Minimization & Privacy

Document excerpt:
${extractedData.full_text?.slice(0, 6000) || ''}

Return a valid JSON object with this structure:
{
  "document_type_detected": "${docType}",
  "principle_1_safety": { 
    "status": "MET", 
    "evidence_found": ["Quote from document"],
    "gap": "none", 
    "priority": "LOW" 
  },
  "principle_2_fairness": { 
    "status": "PARTIALLY_MET", 
    "evidence_found": ["Quote from document"], 
    "gap": "Brief description", 
    "priority": "MEDIUM" 
  },
  "principle_3_accountability": { 
    "status": "MET", 
    "evidence_found": ["Quote from document"],
    "gap": "none", 
    "priority": "LOW" 
  },
  "principle_4_contestability": { 
    "status": "NOT_MET", 
    "evidence_found": [], 
    "gap": "Brief description", 
    "priority": "HIGH" 
  },
  "principle_5_data_minimization": { 
    "status": "MET", 
    "evidence_found": ["Quote from document"], 
    "gap": "none", 
    "priority": "LOW" 
  },
  "overall_score": 65,
  "critical_gaps": ["Gap 1"],
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
