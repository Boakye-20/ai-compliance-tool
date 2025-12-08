def get_ico_prompt(extracted_data: dict) -> str:
    """Generate ICO compliance analysis prompt with document-type-aware scoring."""

    doc_type = extracted_data.get("document_type", "SYSTEM_SPEC")
    topics_covered = extracted_data.get("compliance_topics_covered", [])

    return f"""
You are a UK ICO (Information Commissioner's Office) AI compliance specialist.

**DOCUMENT TYPE: {doc_type}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE" or "STRATEGY": Score based on whether it RECOMMENDS/COVERS the right practices. A playbook that discusses safety, fairness, accountability etc. should score HIGH.
- If document_type is "SYSTEM_SPEC" or "ASSESSMENT": Score based on whether it DEMONSTRATES specific compliance for a particular system.

For GUIDANCE documents: Look for sections discussing, recommending, or providing frameworks for each principle.
For SYSTEM_SPEC documents: Look for specific implementations, concrete evidence, named controls.

**DOCUMENT DETAILS:**
- Document type: {doc_type}
- Topics already identified as covered: {', '.join(topics_covered) if topics_covered else 'None identified'}
- Use case: {extracted_data.get('use_case', 'Unknown')}
- System type: {extracted_data.get('system_type', 'Unknown')}
- Data types: {', '.join(extracted_data.get('data_types', []))}
- Personal data: {extracted_data.get('has_personal_data', 'Unknown')}
- Biometric data: {extracted_data.get('has_biometric_data', 'Unknown')}
- Human oversight: {extracted_data.get('has_human_oversight', 'Unknown')}

**DOCUMENT TEXT:**
{extracted_data.get('full_text', '')[:25000]}

---

Analyze against the 5 ICO AI principles:

1. Safety, Security & Robustness
2. Fairness & Transparency
3. Accountability & Governance
4. Contestability & Redress
5. Data Minimization & Privacy

For each principle, find SPECIFIC QUOTES or SECTIONS from the document that address it.

Return ONLY valid JSON (no markdown):
{{
  "document_type_detected": "{doc_type}",
  "principle_1_safety": {{
    "status": "MET" | "PARTIALLY_MET" | "NOT_MET" | "EVIDENCE_MISSING",
    "evidence_found": ["Quote 1 from document", "Quote 2 from document"],
    "sections_relevant": ["Section names or page references"],
    "gap": "What's missing (or 'None - adequately covered')",
    "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  }},
  "principle_2_fairness": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "principle_3_accountability": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "principle_4_contestability": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "principle_5_data_minimization": {{
    "status": "...",
    "evidence_found": ["..."],
    "sections_relevant": ["..."],
    "gap": "...",
    "priority": "..."
  }},
  "overall_score": 0-100,
  "critical_gaps": ["List of critical issues - empty if none"],
  "strengths": ["What the document does well"],
  "priority_actions": ["Top 3-5 actions if any gaps exist"],
  "compliance_summary": "2-3 sentence summary"
}}

SCORING GUIDE:
- Document covers the topic with specific guidance/recommendations = MET
- Document mentions topic but lacks detail = PARTIALLY_MET
- Document does not address the topic = NOT_MET or EVIDENCE_MISSING

For a comprehensive GUIDANCE document like a government playbook, expect scores of 60-90%.
"""
