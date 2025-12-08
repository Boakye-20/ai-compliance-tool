from langchain_perplexity import ChatPerplexity
from typing import Dict, Any
import json
import ast
from prompts.iso_prompt import get_iso_prompt


def analyze_iso_compliance(extracted_data: Dict[str, Any], model: ChatPerplexity) -> Dict[str, Any]:
    """Analyze ISO/IEC 42001:2023 compliance"""
    
    prompt = get_iso_prompt(extracted_data)
    
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
        
        # Count critical gaps
        critical_gaps_count = sum(
            1 for key, value in result.items()
            if isinstance(value, dict) and value.get("priority") == "CRITICAL"
        )
        
        result["critical_gaps_count"] = critical_gaps_count
        result["score"] = result.get("overall_score", 0)
        result["framework"] = "ISO/IEC 42001"
        
        return result
        
    except Exception:
        return {
            "framework": "ISO/IEC 42001",
            "score": 0,
            "critical_gaps_count": 0,
            "status": "NOT_EVALUATED",
            "critical_gaps": [],
            "priority_actions": [],
            "strengths": [],
            "raw_response": content if 'content' in locals() else "",
            "compliance_summary": "ISO 42001 analysis could not be generated from the model output. Treat this framework as not yet assessed and review ISO 42001 requirements separately."
        }
