from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import agents
from agents.extractor import extract_pdf_data
from agents.router import route_frameworks
from agents.ico_agent import analyze_ico_compliance
from agents.eu_act_agent import analyze_eu_act_compliance
from agents.dpa_agent import analyze_dpa_compliance
from agents.iso_agent import analyze_iso_compliance
from agents.synthesizer import synthesize_gaps
from agents.reporter import generate_report


# State definition
class ComplianceState(TypedDict):
    pdf_path: str
    extracted_data: Dict[str, Any]
    selected_frameworks: List[str]
    ico_result: Optional[Dict[str, Any]]
    eu_act_result: Optional[Dict[str, Any]]
    dpa_result: Optional[Dict[str, Any]]
    iso_result: Optional[Dict[str, Any]]
    synthesis: Dict[str, Any]
    report_bytes: bytes
    status_messages: List[str]


# Initialize OpenAI models
def get_extractor_model():
    """Model used for PDF extraction.

    GPT-4o has a 128k context window and excels at reading long, dense
    documents (DPIAs, specs) and extracting structured data reliably.
    """
    return ChatOpenAI(model="gpt-4o", temperature=0)


def get_analysis_model():
    """Model used for compliance analysis.

    GPT-4o-mini is fast and cost-effective for structured scoring against
    known regulatory frameworks. It receives already-extracted data.
    """
    return ChatOpenAI(model="gpt-4o-mini", temperature=0)


def supervisor_node(state: ComplianceState) -> ComplianceState:
    """Orchestrates the workflow"""
    state["status_messages"].append("🎯 Supervisor: Starting compliance analysis...")
    return state


def extractor_node(state: ComplianceState) -> ComplianceState:
    """Extract structured data from PDF"""
    state["status_messages"].append("📄 Extractor: Parsing PDF...")
    
    extractor_model = get_extractor_model()
    extracted = extract_pdf_data(state["pdf_path"], extractor_model)
    state["extracted_data"] = extracted
    
    use_case = extracted.get('use_case', 'Unknown')[:50]
    data_types_count = len(extracted.get('data_types', []))
    
    state["status_messages"].append(
        f"✅ Extractor: Found use case '{use_case}...', {data_types_count} data types"
    )
    return state


def router_node(state: ComplianceState) -> ComplianceState:
    """Route to appropriate framework agents"""
    state["status_messages"].append("🧭 Router: Selecting frameworks...")
    
    # Route based on user selection + content analysis
    frameworks = route_frameworks(
        state["extracted_data"],
        state["selected_frameworks"]
    )
    
    state["selected_frameworks"] = frameworks
    state["status_messages"].append(
        f"✅ Router: Invoking {', '.join(frameworks)}"
    )
    return state


def ico_agent_node(state: ComplianceState) -> ComplianceState:
    """UK ICO compliance analysis"""
    if "ICO" not in state["selected_frameworks"]:
        return state
    
    state["status_messages"].append("🔍 ICO Agent: Analyzing UK compliance...")
    
    analysis_model = get_analysis_model()
    result = analyze_ico_compliance(state["extracted_data"], analysis_model)
    state["ico_result"] = result
    
    state["status_messages"].append(
        f"✅ ICO Agent: Score {result.get('score', 0)}% "
        f"({result.get('critical_gaps_count', 0)} critical gaps)"
    )
    return state


def eu_act_agent_node(state: ComplianceState) -> ComplianceState:
    """EU AI Act compliance analysis"""
    if "EU_AI_ACT" not in state["selected_frameworks"]:
        return state
    
    state["status_messages"].append("🔍 EU AI Act Agent: Analyzing risk tier...")
    
    analysis_model = get_analysis_model()
    result = analyze_eu_act_compliance(state["extracted_data"], analysis_model)
    state["eu_act_result"] = result
    
    state["status_messages"].append(
        f"✅ EU AI Act Agent: {result.get('risk_tier', 'Unknown')} risk, "
        f"{result.get('critical_gaps_count', 0)} gaps"
    )
    return state


def dpa_agent_node(state: ComplianceState) -> ComplianceState:
    """GDPR/DPA compliance analysis"""
    if "DPA" not in state["selected_frameworks"]:
        return state
    
    state["status_messages"].append("🔍 DPA Agent: Analyzing data protection...")
    
    analysis_model = get_analysis_model()
    result = analyze_dpa_compliance(state["extracted_data"], analysis_model)
    state["dpa_result"] = result
    
    state["status_messages"].append(
        f"✅ DPA Agent: Score {result.get('score', 0)}% "
        f"({result.get('critical_gaps_count', 0)} critical gaps)"
    )
    return state


def iso_agent_node(state: ComplianceState) -> ComplianceState:
    """ISO 42001 compliance analysis"""
    if "ISO_42001" not in state["selected_frameworks"]:
        return state
    
    state["status_messages"].append("🔍 ISO 42001 Agent: Analyzing governance...")
    
    analysis_model = get_analysis_model()
    result = analyze_iso_compliance(state["extracted_data"], analysis_model)
    state["iso_result"] = result
    
    state["status_messages"].append(
        f"✅ ISO Agent: Score {result.get('score', 0)}% "
        f"({result.get('critical_gaps_count', 0)} critical gaps)"
    )
    return state


def synthesizer_node(state: ComplianceState) -> ComplianceState:
    """Synthesize results across frameworks"""
    state["status_messages"].append("📊 Synthesizer: Cross-checking frameworks...")
    
    synthesis = synthesize_gaps(
        ico_result=state.get("ico_result"),
        eu_act_result=state.get("eu_act_result"),
        dpa_result=state.get("dpa_result"),
        iso_result=state.get("iso_result"),
        selected_frameworks=state["selected_frameworks"]
    )
    
    state["synthesis"] = synthesis
    state["status_messages"].append(
        f"✅ Synthesizer: UK Alignment Score {synthesis.get('uk_alignment_score', 0)}%"
    )
    return state


def reporter_node(state: ComplianceState) -> ComplianceState:
    """Generate final report"""
    state["status_messages"].append("📝 Reporter: Generating compliance report...")
    
    report_bytes = generate_report(
        extracted_data=state["extracted_data"],
        ico_result=state.get("ico_result"),
        eu_act_result=state.get("eu_act_result"),
        dpa_result=state.get("dpa_result"),
        iso_result=state.get("iso_result"),
        synthesis=state["synthesis"]
    )
    
    state["report_bytes"] = report_bytes
    state["status_messages"].append("✅ Reporter: Report ready for download")
    return state


def build_compliance_graph():
    """Construct the LangGraph workflow"""
    workflow = StateGraph(ComplianceState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("extractor", extractor_node)
    workflow.add_node("router", router_node)
    workflow.add_node("ico_agent", ico_agent_node)
    workflow.add_node("eu_act_agent", eu_act_agent_node)
    workflow.add_node("dpa_agent", dpa_agent_node)
    workflow.add_node("iso_agent", iso_agent_node)
    workflow.add_node("synthesizer", synthesizer_node)
    workflow.add_node("reporter", reporter_node)
    
    # Define edges (linear flow)
    workflow.set_entry_point("supervisor")
    workflow.add_edge("supervisor", "extractor")
    workflow.add_edge("extractor", "router")
    workflow.add_edge("router", "ico_agent")
    workflow.add_edge("ico_agent", "eu_act_agent")
    workflow.add_edge("eu_act_agent", "dpa_agent")
    workflow.add_edge("dpa_agent", "iso_agent")
    workflow.add_edge("iso_agent", "synthesizer")
    workflow.add_edge("synthesizer", "reporter")
    workflow.add_edge("reporter", END)
    
    return workflow.compile()


# Create the compiled graph
compliance_graph = build_compliance_graph()
