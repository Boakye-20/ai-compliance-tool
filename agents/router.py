from typing import List, Dict, Any


def route_frameworks(extracted_data: Dict[str, Any], user_selections: List[str]) -> List[str]:
    """
    Deterministic routing based on user selections + content analysis.
    Returns list of framework codes to invoke.
    """
    frameworks = []
    
    # Always include user-selected frameworks
    frameworks.extend(user_selections)
    
    # Auto-trigger based on content (if not already selected)
    
    # ICO/DPA - trigger if personal data detected
    if extracted_data.get("has_personal_data") and "ICO" not in frameworks:
        frameworks.append("ICO")
    
    if extracted_data.get("has_personal_data") and "DPA" not in frameworks:
        frameworks.append("DPA")
    
    # EU AI Act - trigger if biometric or high-risk keywords
    high_risk_keywords = [
        "biometric", "facial", "emotion", "credit scoring", 
        "recruitment", "law enforcement", "border control"
    ]
    
    keywords_text = " ".join(extracted_data.get("keywords", [])).lower()
    system_type = extracted_data.get("system_type", "").lower()
    use_case = extracted_data.get("use_case", "").lower()
    combined_text = f"{keywords_text} {system_type} {use_case}"
    
    if any(kw in combined_text for kw in high_risk_keywords):
        if "EU_AI_ACT" not in frameworks:
            frameworks.append("EU_AI_ACT")
    
    # ISO 42001 - trigger for any system (governance always relevant)
    if "ISO_42001" not in frameworks and len(frameworks) > 0:
        frameworks.append("ISO_42001")
    
    return list(set(frameworks))  # Remove duplicates
