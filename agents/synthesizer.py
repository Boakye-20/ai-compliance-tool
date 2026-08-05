from typing import Dict, Any, Optional, List


def synthesize_gaps(
    ico_result: Optional[Dict[str, Any]],
    eu_act_result: Optional[Dict[str, Any]],
    dpa_result: Optional[Dict[str, Any]],
    iso_result: Optional[Dict[str, Any]],
    selected_frameworks: List[str]
) -> Dict[str, Any]:
    """
    Synthesize results across all frameworks.
    Calculate UK Alignment Score and identify cross-framework gaps.
    Produces enriched output for the compliance matrix, cross-framework
    gap correlations, and prioritized action plan components.
    """
    
    # Calculate UK Alignment Score (weighted)
    uk_score = 0
    weights_applied = 0
    
    if ico_result:
        uk_score += ico_result.get("score", 0) * 0.4
        weights_applied += 0.4
    
    if dpa_result:
        uk_score += dpa_result.get("score", 0) * 0.3
        weights_applied += 0.3
    
    if iso_result:
        uk_score += iso_result.get("score", 0) * 0.2
        weights_applied += 0.2
    
    # EU AI Act counts as supplementary (10% if present)
    if eu_act_result:
        uk_score += eu_act_result.get("score", 0) * 0.1
        weights_applied += 0.1
    
    # Normalize if not all frameworks were run
    if weights_applied > 0:
        uk_alignment_score = round(uk_score / weights_applied)
    else:
        uk_alignment_score = 0
    
    # ── Cross-framework gap detection ─────────────────────────────────────
    cross_framework_gaps = []
    gap_counter = 0
    
    # Bias / Fairness gap (ICO + EU Act)
    if ico_result and eu_act_result:
        ico_fairness_bad = False
        eu_data_gov_bad = False
        
        if "principle_2_fairness" in ico_result:
            ico_fairness_bad = ico_result["principle_2_fairness"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]
        
        if eu_act_result.get("risk_tier") == "HIGH_RISK":
            obligations = eu_act_result.get("obligations_if_high_risk", {})
            if "data_governance" in obligations:
                eu_data_gov_bad = obligations["data_governance"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]
        
        if ico_fairness_bad and eu_data_gov_bad:
            gap_counter += 1
            cross_framework_gaps.append({
                "id": f"gap-{gap_counter}",
                "title": "Incomplete Bias & Fairness Testing",
                "description": "No bias testing or representative dataset documentation found. This violates both ICO fairness principles and EU AI Act data governance mandates.",
                "affected_frameworks": ["UK ICO", "EU AI Act"],
                "affected_requirements": ["ICO-P2 (Fairness)", "EU-Art10 (Data Governance)"],
                "impact_score": 9,
                "suggested_fix": "Implement bias testing with representative datasets across protected characteristics and document results in a bias audit report.",
                "severity": "critical",
                # Legacy fields for backward compat
                "issue": "No bias testing or representative dataset documentation",
                "impacts": ["ICO Principle 2 (Fairness)", "EU AI Act Article 10 (Data Governance)"],
                "recommendation": "Implement bias testing with representative datasets and document results"
            })
    
    # Human oversight gap
    human_oversight_gaps = []
    human_oversight_reqs = []
    
    if ico_result:
        if "principle_4_contestability" in ico_result:
            if ico_result["principle_4_contestability"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                human_oversight_gaps.append("UK ICO")
                human_oversight_reqs.append("ICO-P4 (Contestability)")
    
    if eu_act_result and eu_act_result.get("risk_tier") == "HIGH_RISK":
        obligations = eu_act_result.get("obligations_if_high_risk", {})
        if "human_oversight" in obligations:
            if obligations["human_oversight"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                human_oversight_gaps.append("EU AI Act")
                human_oversight_reqs.append("EU-Art14 (Human Oversight)")
    
    if dpa_result:
        if "article_22_adm" in dpa_result:
            if dpa_result["article_22_adm"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                human_oversight_gaps.append("UK DPA / GDPR")
                human_oversight_reqs.append("GDPR-Art22 (Automated Decisions)")
    
    if len(human_oversight_gaps) >= 2:
        gap_counter += 1
        cross_framework_gaps.append({
            "id": f"gap-{gap_counter}",
            "title": "Human Oversight Mechanisms Missing",
            "description": "Human oversight and contestability mechanisms are absent or undocumented across multiple regulatory regimes.",
            "affected_frameworks": human_oversight_gaps,
            "affected_requirements": human_oversight_reqs,
            "impact_score": 8,
            "suggested_fix": "Implement human-in-the-loop review processes with documented override procedures and appeal mechanisms.",
            "severity": "critical",
            # Legacy
            "issue": "Human oversight mechanisms missing across multiple frameworks",
            "impacts": human_oversight_gaps,
            "recommendation": "Implement human-in-the-loop review processes with documented procedures"
        })
    
    # Transparency gap
    transparency_gaps = []
    transparency_reqs = []
    
    if ico_result:
        if "principle_2_fairness" in ico_result:
            if ico_result["principle_2_fairness"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                transparency_gaps.append("UK ICO")
                transparency_reqs.append("ICO-P2 (Transparency)")
    
    if dpa_result:
        if "article_13_transparency" in dpa_result:
            if dpa_result["article_13_transparency"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                transparency_gaps.append("UK DPA / GDPR")
                transparency_reqs.append("GDPR-Art13/14 (Transparency)")
    
    if eu_act_result and eu_act_result.get("risk_tier") == "HIGH_RISK":
        obligations = eu_act_result.get("obligations_if_high_risk", {})
        if "transparency" in obligations:
            if obligations["transparency"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                transparency_gaps.append("EU AI Act")
                transparency_reqs.append("EU-Art13 (Transparency)")
    
    if len(transparency_gaps) >= 2:
        gap_counter += 1
        cross_framework_gaps.append({
            "id": f"gap-{gap_counter}",
            "title": "Transparency & Explainability Deficiencies",
            "description": "AI decision-making logic is insufficiently documented and users are not adequately informed about AI processing across multiple frameworks.",
            "affected_frameworks": transparency_gaps,
            "affected_requirements": transparency_reqs,
            "impact_score": 7,
            "suggested_fix": "Document AI decision logic in plain language, implement explainability mechanisms, and ensure data subjects are informed per GDPR Art 13/14.",
            "severity": "high",
            # Legacy
            "issue": "Transparency and explainability gaps across multiple frameworks",
            "impacts": transparency_gaps,
            "recommendation": "Document AI decision logic and ensure users are informed about AI processing"
        })

    # DPIA gap (GDPR + ISO)
    if dpa_result and iso_result:
        dpia_bad = False
        iso_risk_bad = False

        if "article_35_dpia" in dpa_result:
            dpia_bad = dpa_result["article_35_dpia"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]

        # Check ISO risk assessment (clause 6.1)
        for key in iso_result:
            if isinstance(iso_result[key], dict) and "risk" in key.lower():
                if iso_result[key].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                    iso_risk_bad = True
                    break

        if dpia_bad and iso_risk_bad:
            gap_counter += 1
            cross_framework_gaps.append({
                "id": f"gap-{gap_counter}",
                "title": "Outdated or Missing Risk Assessment & DPIA",
                "description": "Data Protection Impact Assessment is missing or outdated, and ISO 42001 risk assessment obligations are unmet.",
                "affected_frameworks": ["UK DPA / GDPR", "ISO/IEC 42001"],
                "affected_requirements": ["GDPR-Art35 (DPIA)", "ISO-6.1 (Risk Assessment)"],
                "impact_score": 8,
                "suggested_fix": "Conduct a formal DPIA refresh under UK GDPR Article 35, aligned with ISO 42001 Clause 6.1 risk assessment requirements.",
                "severity": "high",
                "issue": "DPIA and risk assessment gaps across GDPR and ISO 42001",
                "impacts": ["UK DPA / GDPR", "ISO/IEC 42001"],
                "recommendation": "Conduct formal DPIA and risk assessment aligned with both frameworks"
            })

    # ── Aggregate priority actions ─────────────────────────────────────────
    all_priority_actions = []
    
    for result in [ico_result, eu_act_result, dpa_result, iso_result]:
        if result:
            all_priority_actions.extend(result.get("priority_actions", []))
    
    # Deduplicate and prioritize
    unique_actions = list(dict.fromkeys(all_priority_actions))
    
    # ── Build structured action plan ───────────────────────────────────────
    action_plan = _build_action_plan(
        cross_framework_gaps, unique_actions,
        ico_result, dpa_result, eu_act_result, iso_result
    )

    # ── Framework scores breakdown ─────────────────────────────────────────
    framework_scores = {}
    if ico_result:
        framework_scores["UK ICO"] = ico_result.get("score", 0)
    if eu_act_result:
        framework_scores["EU AI Act"] = eu_act_result.get("score", 0)
    if dpa_result:
        framework_scores["UK DPA / GDPR"] = dpa_result.get("score", 0)
    if iso_result:
        framework_scores["ISO/IEC 42001"] = iso_result.get("score", 0)
    
    # Total critical gaps
    total_critical_gaps = sum([
        ico_result.get("critical_gaps_count", 0) if ico_result else 0,
        eu_act_result.get("critical_gaps_count", 0) if eu_act_result else 0,
        dpa_result.get("critical_gaps_count", 0) if dpa_result else 0,
        iso_result.get("critical_gaps_count", 0) if iso_result else 0
    ])
    
    # ── Determine overall status ───────────────────────────────────────────
    overall_status = _determine_status(uk_alignment_score, total_critical_gaps)

    return {
        "uk_alignment_score": uk_alignment_score,
        "framework_scores": framework_scores,
        "cross_framework_gaps": cross_framework_gaps,
        "total_critical_gaps": total_critical_gaps,
        "priority_actions": unique_actions[:5],  # Top 5
        "action_plan": action_plan,
        "overall_status": overall_status,
        "executive_summary": generate_summary(uk_alignment_score, total_critical_gaps),
        "frameworks_analyzed": selected_frameworks,
        "summary": generate_summary(uk_alignment_score, total_critical_gaps)
    }


def _determine_status(score: int, critical_gaps: int) -> str:
    """Map score + gaps to an overall compliance status label."""
    if score >= 80 and critical_gaps == 0:
        return "Compliant"
    elif score >= 60:
        return "Substantially Aligned"
    elif score >= 40:
        return "At Risk"
    else:
        return "Non-Compliant"


def _build_action_plan(
    cross_gaps: List[Dict],
    priority_actions: List[str],
    ico_result: Optional[Dict],
    dpa_result: Optional[Dict],
    eu_act_result: Optional[Dict],
    iso_result: Optional[Dict],
) -> List[Dict[str, Any]]:
    """
    Build a structured, prioritized remediation action plan from
    cross-framework gaps and individual framework priority actions.
    """
    plan = []
    act_id = 0

    # First: derive P1/P2 actions from cross-framework gaps
    for gap in cross_gaps:
        act_id += 1
        severity = gap.get("severity", "medium")
        priority = "p1_critical" if severity in ("critical", "CRITICAL") else "p2_high"

        plan.append({
            "id": f"act-{act_id}",
            "priority": priority,
            "title": gap.get("title", gap.get("issue", "Address compliance gap")),
            "frameworks": gap.get("affected_frameworks", gap.get("impacts", [])),
            "remediation_step": gap.get("suggested_fix", gap.get("recommendation", "")),
            "estimated_days": 7 if priority == "p1_critical" else 14,
            "owner_role": _infer_owner(gap),
        })

    # Then: derive P3/P4 actions from remaining priority_actions
    seen_titles = {a["title"].lower() for a in plan}
    for action_text in priority_actions:
        if action_text.lower() in seen_titles:
            continue
        seen_titles.add(action_text.lower())
        act_id += 1

        # Infer which frameworks this action relates to
        frameworks = []
        action_lower = action_text.lower()
        if ico_result and any(k in action_lower for k in ["ico", "fairness", "bias", "transparency"]):
            frameworks.append("UK ICO")
        if dpa_result and any(k in action_lower for k in ["gdpr", "dpia", "data protection", "consent", "article"]):
            frameworks.append("UK DPA / GDPR")
        if eu_act_result and any(k in action_lower for k in ["eu", "ai act", "high risk", "conformity"]):
            frameworks.append("EU AI Act")
        if iso_result and any(k in action_lower for k in ["iso", "42001", "management system", "audit"]):
            frameworks.append("ISO/IEC 42001")
        if not frameworks:
            frameworks = ["General"]

        plan.append({
            "id": f"act-{act_id}",
            "priority": "p3_medium",
            "title": action_text,
            "frameworks": frameworks,
            "remediation_step": action_text,
            "estimated_days": 30,
            "owner_role": "AI Governance Lead",
        })

    return plan


def _infer_owner(gap: Dict) -> str:
    """Infer the responsible role based on gap content."""
    text = (
        gap.get("title", "") + " " +
        gap.get("issue", "") + " " +
        gap.get("suggested_fix", "") + " " +
        gap.get("recommendation", "")
    ).lower()

    if any(k in text for k in ["dpia", "data protection", "gdpr", "privacy"]):
        return "Data Protection Officer (DPO)"
    if any(k in text for k in ["bias", "fairness", "demographic", "dataset"]):
        return "Lead AI Data Scientist"
    if any(k in text for k in ["oversight", "human", "review", "appeal"]):
        return "AI Ethics & Governance Lead"
    if any(k in text for k in ["transparency", "explainability", "documentation"]):
        return "Technical Documentation Lead"
    if any(k in text for k in ["iso", "management system", "audit"]):
        return "Information Security Manager"
    return "AI Governance Lead"


def generate_summary(uk_score: int, critical_gaps: int) -> str:
    """Generate executive summary"""
    
    if uk_score >= 80:
        compliance_level = "Strong compliance"
    elif uk_score >= 60:
        compliance_level = "Moderate compliance"
    elif uk_score >= 40:
        compliance_level = "Weak compliance"
    else:
        compliance_level = "Critical compliance gaps"
    
    return (
        f"{compliance_level} with UK AI governance frameworks (UK Alignment Score: {uk_score}%). "
        f"{'No critical gaps identified' if critical_gaps == 0 else f'{critical_gaps} critical gaps require immediate attention'}. "
        f"Review detailed framework analyses for remediation actions."
    )
