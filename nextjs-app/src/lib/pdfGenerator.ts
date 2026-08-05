import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// import { AnalysisResponse } from './backend/types'; // Note: actually import from where appropriate, or just use `any` if it's easier, but try to use correct typing if possible.

export function generateClientSidePdf(analysis: any, filename: string = 'compliance_report.pdf') {
  const doc = new jsPDF();
  const synth = analysis.analysis.synthesis;
  
  // 1. Title Page
  doc.setFontSize(22);
  doc.text('AI Compliance Audit Report', 14, 22);
  doc.setFontSize(14);
  doc.text(`Overall Status: ${synth?.overall_status || 'Unknown'}`, 14, 32);
  doc.text(`UK Alignment Score: ${synth?.uk_alignment_score || 0}%`, 14, 40);

  // 2. Add an autoTable for the Framework Scores
  const frameworkData = synth?.frameworks_analyzed?.map((fw: string) => [
    fw,
    `${synth.framework_scores[fw] || 0}%`
  ]) || [];
  
  autoTable(doc, {
    startY: 50,
    head: [['Framework', 'Score']],
    body: frameworkData,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] }
  });

  // 3. Add an autoTable for the Action Plan
  if (synth?.action_plan?.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Remediation Action Plan', 14, 22);
    
    const actionData = synth.action_plan.map((item: any) => [
      item.priority,
      item.owner,
      `${item.effort_days} days`,
      item.action
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Priority', 'Owner', 'Effort', 'Action']],
      body: actionData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }
    });
  }

  doc.save(filename);
}
