def get_eu_act_prompt(extracted_data: dict) -> str:
    """Generate EU AI Act compliance analysis prompt (document-type aware)."""

    doc_type = extracted_data.get("document_type", "SYSTEM_SPEC")
    topics_covered = extracted_data.get("compliance_topics_covered", [])

    return f"""
You are an EU AI Act compliance specialist.

**DOCUMENT TYPE: {doc_type}**

CRITICAL SCORING GUIDANCE:
- If document_type is "GUIDANCE": Assess whether it provides frameworks for EU AI Act compliance (risk classification, high-risk obligations, transparency). Government guidance covering these = HIGH score.
- If document_type is "SYSTEM_SPEC": Assess specific system against EU AI Act requirements.

**DOCUMENT DETAILS:**
- Document type: {doc_type}
- Topics covered: {', '.join(topics_covered) if topics_covered else 'None identified'}
- Use case: {extracted_data.get('use_case', 'Unknown')}
- System type: {extracted_data.get('system_type', 'Unknown')}
- Biometric data: {extracted_data.get('has_biometric_data', 'Unknown')}
- Deployment: {extracted_data.get('deployment_context', 'Unknown')}

**DOCUMENT TEXT:**
{extracted_data.get('full_text', '')[:25000]}

---

**RISK TIERS:**
- PROHIBITED: Subliminal manipulation, social scoring, untargeted facial scraping
- HIGH_RISK: Biometrics, critical infrastructure, education, employment, credit scoring, law enforcement
- LIMITED_RISK: Emotion recognition, chatbots, deepfakes
- MINIMAL_RISK: Everything else

**HIGH-RISK OBLIGATIONS (if applicable):**
1. Risk management system
2. Data governance (representative datasets)
3. Technical documentation
4. Record-keeping/logging
5. Transparency
6. Human oversight
7. Accuracy, robustness, cybersecurity
8. Quality management system

For GUIDANCE documents: Assess coverage of EU AI Act concepts.
For SYSTEM_SPEC: Classify risk and check obligations.

Return ONLY valid JSON (no markdown):
{{
  "document_type_detected": "{doc_type}",
  "risk_tier": "PROHIBITED" | "HIGH_RISK" | "LIMITED_RISK" | "MINIMAL_RISK" | "N/A_GUIDANCE",
  "risk_justification": "Why this classification (or 'Guidance document - assessing coverage')",
  "eu_act_coverage": {{
    "risk_classification_discussed": true/false,
    "high_risk_obligations_discussed": true/false,
    "transparency_requirements_discussed": true/false,
    "prohibited_practices_discussed": true/false
  }},
  "evidence_found": ["Key quotes about EU AI Act compliance"],
  "sections_relevant": ["Relevant section names"],
  "obligations_if_high_risk": {{
    "risk_management_system": {{"status": "MET"|"PARTIALLY_MET"|"NOT_MET"|"EVIDENCE_MISSING"|"N/A", "evidence_found": [], "gap": "..."}},
    "data_governance": {{"status": "...", "evidence_found": [], "gap": "..."}},
    "technical_documentation": {{"status": "...", "evidence_found": [], "gap": "..."}},
    "record_keeping": {{"status": "...", "evidence_found": [], "gap": "..."}},
    "transparency": {{"status": "...", "evidence_found": [], "gap": "..."}},
    "human_oversight": {{"status": "...", "evidence_found": [], "gap": "..."}},
    "accuracy_robustness": {{"status": "...", "evidence_found": [], "gap": "..."}},
    "quality_management": {{"status": "...", "evidence_found": [], "gap": "..."}}
  }},
  "overall_score": 0-100,
  "critical_gaps": [],
  "strengths": [],
  "priority_actions": [],
  "compliance_summary": "2-3 sentences"
}}
"""
