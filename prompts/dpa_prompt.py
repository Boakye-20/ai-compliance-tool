def get_dpa_prompt(extracted_data: dict) -> str:
    """Generate DPA/GDPR compliance analysis prompt (document-type aware)."""

    doc_type = extracted_data.get("document_type", "SYSTEM_SPEC")
    topics_covered = extracted_data.get("compliance_topics_covered", [])

    return f"""
You are a UK Data Protection Act 2018 / GDPR compliance specialist for AI systems.

**DOCUMENT TYPE: {doc_type}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE": Score based on whether it DISCUSSES/RECOMMENDS data protection practices. A playbook covering DPIA, lawful basis, transparency should score HIGH.
- If document_type is "SYSTEM_SPEC": Score based on whether it DEMONSTRATES specific compliance.

**DOCUMENT DETAILS:**
- Document type: {doc_type}
- Topics covered: {', '.join(topics_covered) if topics_covered else 'None identified'}
- Use case: {extracted_data.get('use_case', 'Unknown')}
- Data types: {', '.join(extracted_data.get('data_types', []))}
- Personal data: {extracted_data.get('has_personal_data', 'Unknown')}

**DOCUMENT TEXT:**
{extracted_data.get('full_text', '')[:25000]}

---

Analyze these AI-relevant GDPR/DPA requirements:

1. Article 22 - Automated decision-making
2. Article 5 - Data principles
3. Article 13/14 - Transparency
4. Article 35 - DPIA

For each article, find SPECIFIC QUOTES or SECTIONS that address it.

Return ONLY valid JSON (no markdown):
{{
  "document_type_detected": "{doc_type}",
  "article_22_adm": {{
    "status": "MET" | "PARTIALLY_MET" | "NOT_MET" | "EVIDENCE_MISSING",
    "evidence_found": ["Quote 1", "Quote 2"],
    "sections_relevant": ["Section names"],
    "gap": "What's missing",
    "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  }},
  "article_5_fairness": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "article_13_transparency": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "article_35_dpia": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "overall_score": 0-100,
  "critical_gaps": [],
  "strengths": ["What the document does well on data protection"],
  "priority_actions": [],
  "compliance_summary": "2-3 sentence summary"
}}

IMPORTANT: A government AI playbook that extensively discusses GDPR, DPIAs, data protection by design should score 60-85%, not 0%.
"""
