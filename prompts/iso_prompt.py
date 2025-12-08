def get_iso_prompt(extracted_data: dict) -> str:
    """Generate ISO/IEC 42001:2023 compliance analysis prompt (document-type aware)."""

    doc_type = extracted_data.get("document_type", "SYSTEM_SPEC")
    topics_covered = extracted_data.get("compliance_topics_covered", [])

    return f"""
You are an ISO/IEC 42001:2023 (AI Management System) compliance specialist.

**DOCUMENT TYPE: {doc_type}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE": Score based on whether it PROVIDES FRAMEWORKS for AI governance, risk management, lifecycle management. Government guidance covering these topics should score WELL.
- If document_type is "SYSTEM_SPEC": Score based on specific organizational implementation.

**DOCUMENT DETAILS:**
- Document type: {doc_type}
- Topics covered: {', '.join(topics_covered) if topics_covered else 'None identified'}
- Use case: {extracted_data.get('use_case', 'Unknown')}
- Human oversight: {extracted_data.get('has_human_oversight', 'Unknown')}

**DOCUMENT TEXT:**
{extracted_data.get('full_text', '')[:25000]}

---

Analyze these ISO 42001 requirement areas:

1. Governance Framework
2. Risk Management
3. Data Quality & Lifecycle
4. Monitoring & Incident Response

For each area, find SPECIFIC QUOTES or SECTIONS that address it.

Return ONLY valid JSON (no markdown):
{{
  "document_type_detected": "{doc_type}",
  "governance": {{
    "status": "MET" | "PARTIALLY_MET" | "NOT_MET" | "EVIDENCE_MISSING",
    "evidence_found": ["Quote 1", "Quote 2"],
    "sections_relevant": ["Section names"],
    "gap": "What's missing",
    "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  }},
  "risk_management": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "data_lifecycle": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "monitoring": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "overall_score": 0-100,
  "critical_gaps": [],
  "strengths": ["What the document does well"],
  "priority_actions": [],
  "compliance_summary": "2-3 sentence summary"
}}

IMPORTANT: A comprehensive government AI playbook covering governance, ethics, risk, assurance should score 50-80%.
"""
