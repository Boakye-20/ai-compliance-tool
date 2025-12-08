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
    
    # Find cross-framework critical gaps
    cross_framework_gaps = []
    
    # Example: If both ICO and EU Act flag bias/fairness issues
    if ico_result and eu_act_result:
        ico_fairness_bad = False
        eu_data_gov_bad = False
        
        # Check ICO fairness
        if "principle_2_fairness" in ico_result:
            ico_fairness_bad = ico_result["principle_2_fairness"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]
        
        # Check EU Act data governance
        if eu_act_result.get("risk_tier") == "HIGH_RISK":
            obligations = eu_act_result.get("obligations_if_high_risk", {})
            if "data_governance" in obligations:
                eu_data_gov_bad = obligations["data_governance"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]
        
        if ico_fairness_bad and eu_data_gov_bad:
            cross_framework_gaps.append({
                "issue": "No bias testing or representative dataset documentation",
                "impacts": ["ICO Principle 2 (Fairness)", "EU AI Act Article 10 (Data Governance)"],
                "severity": "CRITICAL",
                "recommendation": "Implement bias testing with representative datasets and document results"
            })
    
    # Check human oversight across frameworks
    human_oversight_gaps = []
    
    if ico_result:
        if "principle_4_contestability" in ico_result:
            if ico_result["principle_4_contestability"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                human_oversight_gaps.append("ICO Contestability")
    
    if eu_act_result and eu_act_result.get("risk_tier") == "HIGH_RISK":
        obligations = eu_act_result.get("obligations_if_high_risk", {})
        if "human_oversight" in obligations:
            if obligations["human_oversight"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                human_oversight_gaps.append("EU Act Article 14")
    
    if dpa_result:
        if "article_22_adm" in dpa_result:
            if dpa_result["article_22_adm"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                human_oversight_gaps.append("GDPR Article 22")
    
    if len(human_oversight_gaps) >= 2:
        cross_framework_gaps.append({
            "issue": "Human oversight mechanisms missing across multiple frameworks",
            "impacts": human_oversight_gaps,
            "severity": "CRITICAL",
            "recommendation": "Implement human-in-the-loop review processes with documented procedures"
        })
    
    # Check transparency across frameworks
    transparency_gaps = []
    
    if ico_result:
        if "principle_2_fairness" in ico_result:
            if ico_result["principle_2_fairness"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                transparency_gaps.append("ICO Transparency")
    
    if dpa_result:
        if "article_13_transparency" in dpa_result:
            if dpa_result["article_13_transparency"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                transparency_gaps.append("GDPR Article 13/14")
    
    if eu_act_result and eu_act_result.get("risk_tier") == "HIGH_RISK":
        obligations = eu_act_result.get("obligations_if_high_risk", {})
        if "transparency" in obligations:
            if obligations["transparency"].get("status") in ["NOT_MET", "EVIDENCE_MISSING"]:
                transparency_gaps.append("EU Act Article 13")
    
    if len(transparency_gaps) >= 2:
        cross_framework_gaps.append({
            "issue": "Transparency and explainability gaps across multiple frameworks",
            "impacts": transparency_gaps,
            "severity": "HIGH",
            "recommendation": "Document AI decision logic and ensure users are informed about AI processing"
        })
    
    # Aggregate all priority actions
    all_priority_actions = []
    
    for result in [ico_result, eu_act_result, dpa_result, iso_result]:
        if result:
            all_priority_actions.extend(result.get("priority_actions", []))
    
    # Deduplicate and prioritize
    unique_actions = list(dict.fromkeys(all_priority_actions))  # Preserve order, remove duplicates
    
    # Framework scores breakdown
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
    
    return {
        "uk_alignment_score": uk_alignment_score,
        "framework_scores": framework_scores,
        "cross_framework_gaps": cross_framework_gaps,
        "total_critical_gaps": total_critical_gaps,
        "priority_actions": unique_actions[:5],  # Top 5
        "frameworks_analyzed": selected_frameworks,
        "summary": generate_summary(uk_alignment_score, total_critical_gaps)
    }


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
