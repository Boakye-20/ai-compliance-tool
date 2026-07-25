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
  "keywords": ["Key", "terms", "from", "document"],
  "foundation_models": ["Named AI/ML/foundation models or vendors mentioned, e.g. 'GPT-4', 'Claude', 'Amazon Rekognition', 'in-house CNN' (empty array if none named)"],
  "datasets": ["Named or described training/reference datasets, e.g. 'PNC watchlist', 'custody images', 'public web crawl' (empty array if none)"],
  "pii_categories": ["Categories of personal/special-category data processed, e.g. 'facial biometrics', 'names', 'criminal records', 'location' (empty array if none)"],
  "region_residency": "Where data is stored/processed if stated, e.g. 'UK', 'EU', 'US (AWS us-east-1)', otherwise 'Not specified'"
}

CRITICAL: Output ONLY valid JSON, no markdown, no explanation.
`;

    try {
        const response = await callPerplexity(prompt, 'sonar');
        const extracted = parseJsonResponse<Omit<ExtractedData, 'full_text'>>(response);

        return {
            ...extracted,
            // Defensive defaults: the model may omit newer BOM fields
            foundation_models: extracted.foundation_models ?? [],
            datasets: extracted.datasets ?? [],
            pii_categories: extracted.pii_categories ?? [],
            region_residency: extracted.region_residency ?? 'Not specified',
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
            foundation_models: [],
            datasets: [],
            pii_categories: [],
            region_residency: 'Not specified',
            full_text: text.slice(0, 50000),
        };
    }
}
