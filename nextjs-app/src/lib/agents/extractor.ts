import { ExtractedData, DocumentType } from '../backend/types';
import { callPerplexity, parseJsonResponse } from '../llm/perplexityClient';
import { extractTextFromPdf } from '../pdf/extractPdf';

export async function extractPdfData(buffer: Buffer): Promise<ExtractedData> {
    const text = await extractTextFromPdf(buffer);

    const prompt = `
You are extracting key information from a document related to AI systems.

Document text (first portion):
${text.slice(0, 15000)}

FIRST: Determine the document type:
- "GUIDANCE" = Policy, playbook, framework, best practices guide (tells others what to do)
- "SYSTEM_SPEC" = Procurement doc, vendor spec, DPIA, technical spec (describes a specific AI system)
- "STRATEGY" = High-level strategy, vision document (aspirational, not operational)
- "ASSESSMENT" = Audit report, compliance assessment, gap analysis

Extract and return ONLY a JSON object:
{
  "document_type": "GUIDANCE" | "SYSTEM_SPEC" | "STRATEGY" | "ASSESSMENT",
  "use_case": "Brief description of what this document covers",
  "system_type": "Type of AI system discussed (or 'N/A - Guidance document')",
  "data_types": ["List", "of", "data", "types", "mentioned"],
  "has_personal_data": true/false,
  "has_biometric_data": true/false,
  "has_human_oversight": true/false,
  "deployment_context": "Where/how AI is deployed (or 'General guidance')",
  "risk_indicators": ["List", "of", "risks", "discussed"],
  "compliance_topics_covered": ["List topics like 'bias testing', 'DPIA', 'transparency', 'human oversight'"],
  "keywords": ["Key", "terms", "from", "document"]
}

CRITICAL: Output ONLY valid JSON, no markdown, no explanation.
`;

    try {
        const response = await callPerplexity(prompt, 'sonar');
        const extracted = parseJsonResponse<Omit<ExtractedData, 'full_text'>>(response);

        return {
            ...extracted,
            full_text: text.slice(0, 50000),
        };
    } catch (error) {
        console.error('Extraction error:', error);
        return {
            document_type: 'UNKNOWN' as DocumentType,
            use_case: 'Unable to extract - see full text',
            system_type: 'Unknown',
            data_types: [],
            has_personal_data: true,
            has_biometric_data: false,
            has_human_oversight: false,
            deployment_context: 'Unknown',
            risk_indicators: [],
            compliance_topics_covered: [],
            keywords: [],
            full_text: text.slice(0, 50000),
        };
    }
}
