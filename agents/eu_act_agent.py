from langchain_perplexity import ChatPerplexity
from typing import Dict, Any
import json
import ast
from prompts.eu_act_prompt import get_eu_act_prompt


def analyze_eu_act_compliance(extracted_data: Dict[str, Any], model: ChatPerplexity) -> Dict[str, Any]:
    """Analyze compliance with EU AI Act"""
    
    prompt = get_eu_act_prompt(extracted_data)
    response = model.invoke(prompt)
    
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
        
        # Robust JSON parsing
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1 and end > start:
                inner = content[start : end + 1]
                try:
                    result = json.loads(inner)
                except json.JSONDecodeError:
                    result = ast.literal_eval(inner)
            else:
                result = ast.literal_eval(content)

        if not isinstance(result, dict):
            raise ValueError("Parsed analysis is not a JSON object")
        
        # Count critical gaps in high-risk obligations
        critical_gaps_count = 0
        if result.get("risk_tier") == "HIGH_RISK":
            obligations = result.get("obligations_if_high_risk", {})
            critical_gaps_count = sum(
                1 for key, value in obligations.items()
                if isinstance(value, dict) and value.get("priority") == "CRITICAL"
            )
        
        result["critical_gaps_count"] = critical_gaps_count
        result["score"] = result.get("overall_score", 0)
        result["framework"] = "EU AI Act"
        
        return result
        
    except Exception:
        return {
            "framework": "EU AI Act",
            "risk_tier": "UNKNOWN",
            "score": 0,
            "critical_gaps_count": 0,
            "status": "NOT_EVALUATED",
            "raw_response": content if 'content' in locals() else "",
            "critical_gaps": [],
            "priority_actions": [],
            "strengths": [],
            "compliance_summary": "EU AI Act analysis could not be generated from the model output. Treat this framework as not yet assessed."
        }
