import pdfplumber
from typing import Dict, Any
from langchain_perplexity import ChatPerplexity
import json


def extract_pdf_data(pdf_path: str, model: ChatPerplexity) -> Dict[str, Any]:
    """Extract structured data from PDF using pdfplumber + Perplexity"""
    
    # Extract raw text – capture more pages for richer context
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages[:30]:  # Process up to first 30 pages (~50-60k chars)
            text += (page.extract_text() or "") + "\n"

    # Prompt Perplexity to structure the data & detect document type
    extraction_prompt = f"""
You are extracting key information from a document related to AI systems.

Document text (first portion):
{text[:50000]}

FIRST: Determine the document type:
- "GUIDANCE"  = Policy, playbook, framework, best-practice guide (tells others what to do)
- "SYSTEM_SPEC" = Procurement doc, vendor spec, DPIA, technical spec (describes a specific AI system)
- "STRATEGY"  = High-level strategy or vision document
- "ASSESSMENT" = Audit report, compliance assessment, gap analysis

Return ONLY valid JSON with the following keys:
{{
  "document_type": "GUIDANCE"|"SYSTEM_SPEC"|"STRATEGY"|"ASSESSMENT",
  "use_case": "Brief description of what this document covers",
  "system_type": "Type of AI system discussed (or 'N/A ‑ Guidance document')",
  "data_types": ["List", "of", "data", "types", "mentioned"],
  "has_personal_data": true/false,
  "has_biometric_data": true/false,
  "has_human_oversight": true/false,
  "deployment_context": "Where/how AI is deployed (or 'General guidance')",
  "risk_indicators": ["List", "of", "risks", "discussed"],
  "compliance_topics_covered": ["Topics like 'bias testing', 'DPIA', 'transparency'"],
  "keywords": ["Key", "terms", "from", "document"]
}}

CRITICAL: Output ONLY JSON – no markdown, no commentary.
"""
    
    response = model.invoke(extraction_prompt)
    
    try:
        # Handle AIMessage response
        content = response.content if hasattr(response, 'content') else str(response)
        # Clean potential markdown formatting
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        extracted = json.loads(content)
    except json.JSONDecodeError:
        # Fallback extraction
        extracted = {
            "document_type": "SYSTEM_SPEC",
            "use_case": "Unable to extract - see full text",
            "system_type": "Unknown",
            "data_types": [],
            "has_personal_data": True,  # Conservative assumption
            "has_biometric_data": False,
            "has_human_oversight": False,
            "deployment_context": "Unknown",
            "risk_indicators": [],
            "compliance_topics_covered": [],
            "keywords": []
        }
    
    extracted["full_text"] = text[:50000]
    return extracted
