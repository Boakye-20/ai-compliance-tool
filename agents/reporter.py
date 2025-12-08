from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from typing import Dict, Any, Optional
from datetime import datetime
import unicodedata


def _clean_text(text: Any) -> str:
    """Normalise text for PDF so odd Unicode (e.g. non-breaking hyphens) don't render as black boxes."""
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)

    # Normalise to NFKC to flatten odd characters
    text = unicodedata.normalize("NFKC", text)

    # Replace common problematic glyphs that built-in Helvetica doesn't support well
    replacements = {
        "\u2011": "-",  # non-breaking hyphen
        "\u2010": "-",  # hyphen
        "\u2013": "-",  # en dash
        "\u2014": "-",  # em dash
        "\u00a0": " ",  # non-breaking space
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)

    # Strip control characters except newlines and tabs
    cleaned_chars = []
    for ch in text:
        code = ord(ch)
        if code < 32 and ch not in "\n\t":
            cleaned_chars.append(" ")
        else:
            cleaned_chars.append(ch)
    return "".join(cleaned_chars)


def generate_report(
    extracted_data: Dict[str, Any],
    ico_result: Optional[Dict[str, Any]],
    eu_act_result: Optional[Dict[str, Any]],
    dpa_result: Optional[Dict[str, Any]],
    iso_result: Optional[Dict[str, Any]],
    synthesis: Dict[str, Any]
) -> bytes:
    """Generate PDF compliance report"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        topMargin=0.5*inch, 
        bottomMargin=0.5*inch,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch
    )
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles matching design system
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0284c7'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#111827'),
        spaceAfter=12,
        spaceBefore=20
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8,
        spaceBefore=12
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=12
    )
    
    # Title page
    story.append(Paragraph("AI Governance Hub", title_style))
    story.append(Paragraph("AI Compliance Tool Report", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Suite branding
    suite_text = """
    <para align=center>
    <b>Module 2: AI Compliance Tool</b><br/>
    Multi-framework AI governance assessment
    </para>
    """
    story.append(Paragraph(suite_text, body_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Document metadata
    story.append(Paragraph("Document Information", heading_style))
    
    # Use Paragraph objects in table cells so long text wraps
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#111827'),
        leading=14
    )
    
    metadata_data = [
        ["Use Case:", Paragraph(_clean_text(extracted_data.get('use_case', 'N/A')), table_cell_style)],
        ["System Type:", Paragraph(_clean_text(extracted_data.get('system_type', 'N/A')), table_cell_style)],
        ["Analysis Date:", datetime.now().strftime("%Y-%m-%d %H:%M")],
        ["Frameworks:", Paragraph(_clean_text(", ".join(synthesis.get('frameworks_analyzed', []))), table_cell_style)]
    ]
    
    metadata_table = Table(metadata_data, colWidths=[1.5*inch, 5*inch])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f9ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#111827')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb'))
    ]))
    
    story.append(metadata_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    
    # UK Alignment Score (big metric)
    score = synthesis.get('uk_alignment_score', 0)
    if score >= 70:
        score_color = '#10b981'
    elif score >= 50:
        score_color = '#f59e0b'
    else:
        score_color = '#dc2626'
    
    score_text = f"""
    <para align=center>
    <font size=36 color="{score_color}"><b>{score}%</b></font><br/>
    <font size=12 color="#6b7280">UK Alignment Score</font>
    </para>
    """
    story.append(Paragraph(score_text, body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(_clean_text(synthesis.get('summary', 'No summary available')), body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Critical gaps summary
    total_gaps = synthesis.get('total_critical_gaps', 0)
    if total_gaps > 0:
        gaps_text = f"""
        <para>
        <b><font color="#dc2626">⚠ {total_gaps} Critical Gaps Identified</font></b><br/>
        Immediate remediation required across frameworks.
        </para>
        """
        story.append(Paragraph(gaps_text, body_style))
    
    story.append(PageBreak())
    
    # Framework Scores
    story.append(Paragraph("Framework Analysis Summary", heading_style))
    
    scores_data = [["Framework", "Score", "Status"]]
    for framework, fw_score in synthesis.get('framework_scores', {}).items():
        if fw_score >= 70:
            status = "✓ Compliant"
        elif fw_score >= 50:
            status = "⚠ Gaps Detected"
        else:
            status = "✗ Critical"
        scores_data.append([framework, f"{fw_score}%", status])
    
    if len(scores_data) > 1:
        scores_table = Table(scores_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        scores_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
        ]))
        story.append(scores_table)
    
    story.append(Spacer(1, 0.3*inch))
    
    # Cross-framework gaps
    cross_gaps = synthesis.get('cross_framework_gaps', [])
    if cross_gaps:
        story.append(Paragraph("Cross-Framework Critical Issues", heading_style))
        
        for gap in cross_gaps:
            issue = _clean_text(gap.get('issue', 'Unknown issue'))
            impacts = _clean_text(", ".join(gap.get('impacts', [])))
            recommendation = _clean_text(gap.get('recommendation', 'No recommendation'))
            gap_text = f"""
            <para>
            <b><font color="#dc2626">• {issue}</font></b><br/>
            <font color="#6b7280">Impacts: {impacts}</font><br/>
            <font color="#111827">Recommendation: {recommendation}</font>
            </para>
            """
            story.append(Paragraph(gap_text, body_style))
        story.append(Spacer(1, 0.1*inch))
    
    story.append(PageBreak())
    
    # Priority Actions
    story.append(Paragraph("Priority Remediation Actions", heading_style))
    
    priority_actions = synthesis.get('priority_actions', [])
    if priority_actions:
        for i, action in enumerate(priority_actions, 1):
            action_text = f"<para><b>{i}.</b> {_clean_text(action)}</para>"
            story.append(Paragraph(action_text, body_style))
    else:
        story.append(Paragraph("No priority actions identified.", body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Detailed framework results
    for result in [ico_result, eu_act_result, dpa_result, iso_result]:
        if result and not result.get('error'):
            story.append(PageBreak())
            story.append(Paragraph(f"Detailed Analysis: {_clean_text(result.get('framework', 'Unknown'))}", heading_style))
            story.append(Paragraph(_clean_text(result.get('compliance_summary', 'No summary available')), body_style))
            story.append(Spacer(1, 0.2*inch))
            
            # Add critical gaps from this framework
            critical_gaps = result.get('critical_gaps', [])
            if critical_gaps:
                story.append(Paragraph("Critical Gaps:", subheading_style))
                for gap in critical_gaps:
                    story.append(Paragraph(f"• {_clean_text(gap)}", body_style))
            
            # Add priority actions from this framework
            fw_actions = result.get('priority_actions', [])
            if fw_actions:
                story.append(Spacer(1, 0.1*inch))
                story.append(Paragraph("Recommended Actions:", subheading_style))
                for action in fw_actions[:3]:
                    story.append(Paragraph(f"• {_clean_text(action)}", body_style))
    
    # Footer
    story.append(PageBreak())
    footer_text = """
    <para align=center>
    <font size=8 color="#9ca3af">
    Generated by AI Governance Hub<br/>
    This report is for informational purposes only and does not constitute legal advice.<br/>
    Consult qualified legal and compliance professionals for definitive guidance.<br/><br/>
    © 2025 AI Governance Hub
    </font>
    </para>
    """
    story.append(Paragraph(footer_text, body_style))
    
    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
