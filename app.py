import streamlit as st
import os
from pathlib import Path
import tempfile
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Page config - must be first Streamlit command
st.set_page_config(
    page_title="AI Compliance Tool | AI Governance Hub",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS matching Policy Tracker exactly
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
    font-family: 'Inter', -apple-system, system-ui, sans-serif !important;
}

/* Remove default browser/Streamlit top spacing */
body {
    margin: 0 !important;
}

.block-container {
    padding-top: 0 !important;
}

.main {
    background-color: #f9fafb;
    padding-top: 0 !important;
}

/* Header matching Policy Tracker */
.header-container {
    background: linear-gradient(180deg, #e8eef5 0%, #f8f9fb 100%);
    padding: 1.25rem 2rem 1rem 2rem;
    margin: -1rem -1rem 0 -1rem;
    border-bottom: 1px solid #e5e7eb;
    text-align: center;
}

.header-title {
    color: #111827;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
}

.nav-bar {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 2rem;
}

.nav-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
}

.nav-tabs {
    display: inline-flex;
    gap: 2rem;
}

.nav-tab {
    color: #6b7280;
    text-decoration: none;
    font-size: 0.875rem;
    padding: 0.75rem 0.25rem;
    border-bottom: 2px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.nav-tab.active {
    color: #0ea5e9;
    border-bottom-color: #0ea5e9;
}

.nav-tab:hover {
    color: #0ea5e9;
}

/* Stat cards matching Policy Tracker exactly */
.stat-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.stat-label {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
}

.stat-value {
    color: #111827;
    font-size: 2rem;
    font-weight: 600;
    margin: 0.25rem 0 0 0;
}

.stat-sublabel {
    color: #9ca3af;
    font-size: 0.75rem;
    margin: 0.25rem 0 0 0;
}

.stat-icon {
    font-size: 1.75rem;
    opacity: 0.7;
}

/* Section cards */
.section-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.section-title {
    color: #111827;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
}

/* Filter row styling */
.filter-container {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
}

.filter-label {
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

/* Hide Streamlit branding */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}

/* Better button styling */
.stButton > button {
    background-color: #0ea5e9 !important;
    color: white !important;
    border: none !important;
    border-radius: 6px !important;
    font-weight: 500 !important;
    padding: 0.5rem 1rem !important;
}

.stButton > button:hover {
    background-color: #0284c7 !important;
}

/* Checkbox styling */
.stCheckbox {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
}

/* File uploader */
[data-testid="stFileUploader"] {
    background: white;
    border: 2px dashed #e5e7eb;
    border-radius: 8px;
    padding: 2rem;
}

[data-testid="stFileUploader"]:hover {
    border-color: #0ea5e9;
}

/* Tabs styling */
.stTabs [data-baseweb="tab-list"] {
    gap: 0;
    background: white;
    border-radius: 8px 8px 0 0;
    border: 1px solid #e5e7eb;
    border-bottom: none;
    padding: 0 1rem;
}

.stTabs [data-baseweb="tab"] {
    color: #6b7280;
    border-bottom: 2px solid transparent;
    padding: 1rem 1.5rem;
}

.stTabs [aria-selected="true"] {
    color: #0ea5e9 !important;
    border-bottom-color: #0ea5e9 !important;
    background: transparent !important;
}

.stTabs [data-baseweb="tab-panel"] {
    background: white;
    border: 1px solid #e5e7eb;
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 1.5rem;
}
</style>
""", unsafe_allow_html=True)

# Header matching Policy Tracker style: title bar + separate nav bar
st.markdown("""
<div class="header-container">
    <h1 class="header-title">AI Compliance Tool</h1>
</div>
<div class="nav-bar">
  <div class="nav-inner">
    <div class="nav-tabs">
        <a href="#" class="nav-tab active">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            Compliance Check
        </a>
        <a href="https://uk-ai-policy-tracker-next.vercel.app/" target="_blank" class="nav-tab">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M3.5 13A1.5 1.5 0 0 1 2 11.5v-8A1.5 1.5 0 0 1 3.5 2h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 0 3 3.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 1 0v3A1.5 1.5 0 0 1 11.5 13h-8z"/>
                <path fill-rule="evenodd" d="M10.5 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V3.707L4.854 8.854a.5.5 0 1 1-.708-.708L9.293 3H6.5a.5.5 0 0 1 0-1h4z"/>
            </svg>
            Policy Tracker
        </a>
        <a href="#" class="nav-tab">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
            About
        </a>
    </div>
  </div>
</div>
""", unsafe_allow_html=True)

# API key check
api_key = os.environ.get("PPLX_API_KEY")
if not api_key:
    st.error("🔑 PPLX_API_KEY not set. Create a `.env` file with your API key.")
    st.code("PPLX_API_KEY=your_key_here")
    st.stop()

# Add spacing after header
st.markdown('<div style="margin-top: 2rem;"></div>', unsafe_allow_html=True)

# Filter row - matching Policy Tracker's filter style
st.markdown('<div class="filter-container">', unsafe_allow_html=True)

filter_col1, filter_col2 = st.columns(2)

with filter_col1:
    st.markdown('<p class="filter-label">Select Frameworks</p>', unsafe_allow_html=True)
    frameworks_selected = st.multiselect(
        "Select Frameworks",
        options=["ICO", "DPA", "EU_AI_ACT", "ISO_42001"],
        default=["ICO", "DPA"],
        format_func=lambda x: {
            "ICO": "🇬🇧 UK ICO",
            "DPA": "🔒 UK DPA/GDPR", 
            "EU_AI_ACT": "🇪🇺 EU AI Act",
            "ISO_42001": "📋 ISO 42001"
        }.get(x, x),
        label_visibility="collapsed"
    )

with filter_col2:
    st.markdown('<p class="filter-label">Upload Document</p>', unsafe_allow_html=True)
    uploaded_file = st.file_uploader(
        "Choose PDF",
        type=["pdf"],
        label_visibility="collapsed"
    )

st.markdown('</div>', unsafe_allow_html=True)

frameworks = frameworks_selected if frameworks_selected else []

# Framework descriptions
st.markdown("""
<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">🇬🇧 UK ICO</div>
        <div style="color: #6b7280; font-size: 0.8rem;">5 AI principles for responsible AI development from the Information Commissioner's Office</div>
    </div>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">🔒 UK DPA/GDPR</div>
        <div style="color: #6b7280; font-size: 0.8rem;">Data protection requirements for AI systems under UK Data Protection Act 2018</div>
    </div>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">🇪🇺 EU AI Act</div>
        <div style="color: #6b7280; font-size: 0.8rem;">Risk-based AI regulation framework from the European Union</div>
    </div>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">📋 ISO 42001</div>
        <div style="color: #6b7280; font-size: 0.8rem;">AI management system certification standard (ISO/IEC 42001)</div>
    </div>
</div>
""", unsafe_allow_html=True)

# Stat cards row - exactly matching Policy Tracker
if 'last_analysis' in st.session_state:
    synthesis = st.session_state.last_analysis.get('synthesis', {})
    score = synthesis.get('uk_alignment_score', 0)
    gaps = synthesis.get('total_critical_gaps', 0)
    fw_count = len(synthesis.get('frameworks_analyzed', []))
    actions = len(synthesis.get('priority_actions', []))
else:
    score = 0
    gaps = 0
    fw_count = 0
    actions = 0

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(f"""
    <div class="stat-card">
        <div>
            <p class="stat-label">UK Alignment Score</p>
            <p class="stat-value">{score}%</p>
        </div>
        <span class="stat-icon">📊</span>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="stat-card">
        <div>
            <p class="stat-label">Critical Gaps</p>
            <p class="stat-value">{gaps}</p>
            <p class="stat-sublabel">{'⚠️ needs attention' if gaps > 0 else '✓ none found'}</p>
        </div>
        <span class="stat-icon">🛡️</span>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="stat-card">
        <div>
            <p class="stat-label">Frameworks</p>
            <p class="stat-value">{fw_count}</p>
            <p class="stat-sublabel">{len(frameworks)} selected</p>
        </div>
        <span class="stat-icon">📋</span>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Main content area
if uploaded_file:
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(uploaded_file.getvalue())
        tmp_path = tmp_file.name
    
    # Action buttons
    btn_col1, btn_col2, btn_col3 = st.columns([1, 1, 4])
    
    with btn_col1:
        analyze_btn = st.button("🚀 Run Analysis", type="primary", use_container_width=True)
    
    with btn_col2:
        if 'last_analysis' in st.session_state and st.session_state.last_analysis.get('report_bytes'):
            st.download_button(
                "📥 Download PDF",
                data=st.session_state.last_analysis['report_bytes'],
                file_name=f"compliance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                mime="application/pdf",
                use_container_width=True
            )
    
    if analyze_btn:
        if not frameworks:
            st.error("Please select at least one framework")
            st.stop()
        
        from graph import compliance_graph, ComplianceState
        
        initial_state: ComplianceState = {
            "pdf_path": tmp_path,
            "extracted_data": {},
            "selected_frameworks": frameworks,
            "ico_result": None,
            "eu_act_result": None,
            "dpa_result": None,
            "iso_result": None,
            "synthesis": {},
            "report_bytes": b"",
            "status_messages": []
        }
        
        try:
            with st.spinner("🤖 Analyzing document..."):
                displayed_messages = set()
                final_state = None

                for event in compliance_graph.stream(initial_state):
                    for node_name, node_state in event.items():
                        if node_state and isinstance(node_state, dict):
                            final_state = node_state
                            for msg in node_state.get('status_messages', []):
                                if msg not in displayed_messages:
                                    st.write(msg)
                                    displayed_messages.add(msg)

                if final_state:
                    st.session_state.last_analysis = final_state

                st.success("✅ Analysis complete!")
                st.rerun()

        except Exception as e:
            st.error("❌ Analysis failed")
            st.error(f"Error: {str(e)}")
            import traceback
            st.code(traceback.format_exc())

# Results section
if 'last_analysis' in st.session_state:
    results = st.session_state.last_analysis
    synthesis = results.get('synthesis', {})
    extracted = results.get('extracted_data', {})
    
    # Document type banner
    doc_type = extracted.get('document_type', 'Unknown')
    scoring_basis = "(Scoring based on guidance/recommendations coverage)" if doc_type == "GUIDANCE" else "(Scoring based on specific compliance evidence)"
    st.markdown(f"""
    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <strong>Document Type Detected:</strong> {doc_type}
        <span style="color: #6b7280; margin-left: 1rem;">{scoring_basis}</span>
    </div>
    """, unsafe_allow_html=True)
    
    # Two column layout for results
    left_col, right_col = st.columns([1, 1])
    
    with left_col:
        st.markdown("### Compliance by Framework")
        
        # Framework results with inline details (no expanders to avoid visual glitches)
        for fw_key, fw_name, emoji in [
            ('ico_result', 'UK ICO', '🇬🇧'),
            ('dpa_result', 'UK DPA/GDPR', '🔒'),
            ('eu_act_result', 'EU AI Act', '🇪🇺'),
            ('iso_result', 'ISO 42001', '📋')
        ]:
            if results.get(fw_key):
                result = results[fw_key]
                fw_score = result.get('score', 0)

                status_override = result.get('status')
                if status_override == "NOT_EVALUATED":
                    bar_color = "#9ca3af"
                    status_text = "Not evaluated"
                elif fw_score >= 70:
                    bar_color = "#10b981"
                    status_text = "Good Coverage"
                elif fw_score >= 50:
                    bar_color = "#f59e0b"
                    status_text = "Partial Coverage"
                else:
                    bar_color = "#dc2626"
                    status_text = "Gaps Found"

                # Card header
                st.markdown(f"""
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.75rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                        <span style="font-weight:600;">{emoji} {fw_name}</span>
                        <span style="color:{bar_color};font-weight:600;">{fw_score}% · {status_text}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # Summary
                st.markdown(f"**Summary:** {result.get('compliance_summary', 'No summary')}")

                # If NOT_EVALUATED, just show the summary, skip evidence section
                if status_override == "NOT_EVALUATED":
                    raw = result.get('raw_response')
                    if raw:
                        with st.expander("Debug: Raw model output"):
                            st.code(str(raw)[:1000])
                else:
                    # Strengths
                    strengths = result.get('strengths', [])
                    if strengths:
                        st.markdown("**✅ Strengths:**")
                        for s in strengths[:3]:
                            st.markdown(f"- {s}")

                    # Evidence found
                    st.markdown("**📄 Evidence Found:**")

                    evidence_keys = [
                        k for k in result.keys()
                        if k.startswith('principle_') or k.startswith('article_') or k in ['governance', 'risk_management', 'data_lifecycle', 'monitoring']
                    ]

                    for key in evidence_keys:
                        if isinstance(result.get(key), dict):
                            item = result[key]
                            item_status = item.get('status', 'Unknown')
                            evidence = item.get('evidence_found', item.get('evidence', []))

                            status_icon = "✅" if item_status == "MET" else "⚠️" if item_status == "PARTIALLY_MET" else "❌"

                            display_name = (
                                key.replace('principle_', 'Principle ')
                                   .replace('article_', 'Article ')
                                   .replace('_', ' ')
                                   .title()
                            )

                            st.markdown(f"**{status_icon} {display_name}:** {item_status}")

                            if evidence and isinstance(evidence, list):
                                for e in evidence[:2]:
                                    text = str(e)
                                    st.markdown(f"  - _{text[:150]}..._" if len(text) > 150 else f"  - _{text}_")
                            elif evidence and isinstance(evidence, str) and evidence:
                                text = evidence
                                st.markdown(f"  - _{text[:150]}..._" if len(text) > 150 else f"  - _{text}_")

                    gaps = result.get('critical_gaps', [])
                    if gaps:
                        st.markdown("**❌ Gaps:**")
                        for g in gaps:
                            st.markdown(f"- {g}")
    
    with right_col:
        st.markdown("### Priority Actions")
        
        priority_actions = synthesis.get('priority_actions', [])
        if priority_actions:
            for i, action in enumerate(priority_actions[:5], 1):
                st.markdown(f"""
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; display: flex; align-items: flex-start; gap: 0.75rem;">
                    <span style="background: #0ea5e9; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">{i}</span>
                    <span style="color: #374151; font-size: 0.875rem;">{action}</span>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.success("✅ No critical actions required")
        
        # Cross-framework issues
        cross_gaps = synthesis.get('cross_framework_gaps', [])
        if cross_gaps:
            st.markdown("### ⚠️ Cross-Framework Issues")
            for gap in cross_gaps:
                st.markdown(f"""
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem;">
                    <div style="color: #dc2626; font-weight: 500; margin-bottom: 0.5rem;">{gap.get('issue', 'Unknown')}</div>
                    <div style="color: #6b7280; font-size: 0.875rem;">Impacts: {', '.join(gap.get('impacts', []))}</div>
                </div>
                """, unsafe_allow_html=True)
        
        # Overall strengths section
        st.markdown("### 💪 Document Strengths")
        all_strengths = []
        for fw_key in ['ico_result', 'dpa_result', 'eu_act_result', 'iso_result']:
            if results.get(fw_key):
                all_strengths.extend(results[fw_key].get('strengths', []))
        
        if all_strengths:
            for s in all_strengths[:5]:
                st.markdown(f"- {s}")
        else:
            st.info("Run analysis to see strengths")

elif not uploaded_file:
    # Empty state
    st.markdown("""
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 3rem; text-align: center; margin-top: 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
        <h3 style="color: #111827; margin: 0 0 0.5rem 0;">Upload a Document to Begin</h3>
        <p style="color: #6b7280; margin: 0;">Select frameworks and upload a PDF to run compliance analysis</p>
    </div>
    """, unsafe_allow_html=True)

# Footer
st.markdown("""
<div style='text-align: center; color: #9ca3af; font-size: 0.75rem; padding: 2rem 0; margin-top: 2rem;'>
    <p style="margin: 0;">AI Governance Hub • Built by Paul Kwarteng</p>
    <p style="margin: 0.25rem 0 0 0;">This tool is for informational purposes only and does not constitute legal advice.</p>
</div>
""", unsafe_allow_html=True)