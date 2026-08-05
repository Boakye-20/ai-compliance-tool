"use client";

import { useState, useEffect } from 'react';
import { LayoutDashboard, Boxes, Wrench, Plug, ShieldCheck, Lock } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { FrameworkSelector } from '@/components/FrameworkSelector';
import { StatsCards } from '@/components/StatsCards';
import { AnalysisResults } from '@/components/AnalysisResults';
import { MultiDocumentUpload } from '@/components/MultiDocumentUpload';
import { QuizSelfAssessment } from '@/components/QuizSelfAssessment';
import { ActionPlan } from '@/components/ActionPlan';
import { generateClientSidePdf } from '@/lib/pdfGenerator';
import { FrameworkDescriptions } from '@/components/FrameworkDescriptions';
import { EmptyState } from '@/components/EmptyState';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { AnalysisStepper } from '@/components/AnalysisStepper';
import { SampleReports } from '@/components/SampleReports';
import { AiBomTable } from '@/components/AiBomTable';
import { SystemInventory } from '@/components/SystemInventory';
import { GapChecklist } from '@/components/GapChecklist';
import { CrossFrameworkGaps } from '@/components/CrossFrameworkGaps';
import { ComplianceMatrixView } from '@/components/ComplianceMatrixView';
import { RemediationPanel } from '@/components/RemediationKit';
import { PolicySyncBanner } from '@/components/PolicySyncBanner';
import { IntegrationsTab } from '@/components/IntegrationsTab';

export type FrameworkKey = "ICO" | "DPA" | "EU_AI_ACT" | "ISO_42001";

export interface AnalysisResponse {
    job_id: string;
    analysis: {
        extracted_data: any;
        ico_result?: any;
        dpa_result?: any;
        eu_act_result?: any;
        iso_result?: any;
        synthesis: any;
        status_messages: string[];
    };
    report_base64?: string;
}

type TabKey = 'assessment' | 'bom' | 'gaps' | 'integrations';
type IngestMode = 'pdf' | 'metadata' | 'quiz';

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'assessment', label: 'Assessment', icon: LayoutDashboard },
    { key: 'bom', label: 'AI BOM', icon: Boxes },
    { key: 'gaps', label: 'Gaps & Remediation', icon: Wrench },
    { key: 'integrations', label: 'Integrations', icon: Plug },
];

export default function CompliancePage() {
    const [activeTab, setActiveTab] = useState<TabKey>('assessment');
    const [ingestMode, setIngestMode] = useState<IngestMode>('pdf');
    const [selectedFrameworks, setSelectedFrameworks] = useState<FrameworkKey[]>(["ICO", "DPA"]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<Array<{file: File, docType: string}>>([]);
    const [quizPayload, setQuizPayload] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [gapsInitialFilter, setGapsInitialFilter] = useState(false);

    // Simulate progress during analysis (PDF pipeline only)
    useEffect(() => {
        if (!isAnalyzing || ingestMode !== 'pdf') {
            setCurrentStep(0);
            return;
        }

        const totalSteps = 4 + selectedFrameworks.length;
        let step = 0;
        const progressInterval = setInterval(() => {
            step++;
            setCurrentStep(step);
            if (step >= totalSteps - 1) clearInterval(progressInterval);
        }, 5000);

        return () => clearInterval(progressInterval);
    }, [isAnalyzing, selectedFrameworks.length, ingestMode]);

    const switchMode = (mode: IngestMode) => {
        setIngestMode(mode);
        setUploadedFile(null);
        setUploadedFiles([]);
        setQuizPayload(null);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (ingestMode === 'pdf' && uploadedFiles.length === 0) return;
        if (ingestMode === 'metadata' && !uploadedFile) return;
        if (ingestMode === 'quiz' && !quizPayload) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            if (ingestMode === 'metadata') {
                // Privacy mode: parse the anonymised JSON payload locally and score it
                // server-side without ever uploading a raw document.
                const text = await uploadedFile!.text();
                let payload: any;
                try {
                    payload = JSON.parse(text);
                } catch {
                    throw new Error('Selected file is not valid JSON.');
                }

                const response = await fetch('/api/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) throw new Error(await response.text());
                setAnalysis(await response.json());
            } else if (ingestMode === 'quiz') {
                const response = await fetch('/api/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quizPayload),
                });
                if (!response.ok) throw new Error(await response.text());
                setAnalysis(await response.json());
            } else {
                if (selectedFrameworks.length === 0) return;
                const formData = new FormData();
                uploadedFiles.forEach((f) => {
                    formData.append('files', f.file);
                    formData.append('fileTypes', f.docType);
                });
                selectedFrameworks.forEach((fw) => formData.append('frameworks', fw));

                const response = await fetch('/api/analyze', { method: 'POST', body: formData });
                if (!response.ok) throw new Error(await response.text());
                setAnalysis(await response.json());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownloadBrowserPdf = () => {
        if (!analysis) return;
        const baseName = uploadedFile?.name?.replace(/\.(pdf|json)$/i, '') || 'compliance';
        generateClientSidePdf(analysis, `${baseName}_summary.pdf`);
    };

    const handleDownloadReport = () => {
        if (!analysis?.report_base64) return;
        try {
            const byteCharacters = atob(analysis.report_base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const baseName = uploadedFile?.name?.replace(/\.(pdf|json)$/i, '') || 'document';
            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseName}_compliance_report.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to download report:', e);
        }
    };

    const handleSaveToSamples = async () => {
        if (!analysis?.report_base64 || !uploadedFile) return;
        try {
            const baseName = uploadedFile.name.replace(/\.(pdf|json)$/i, '') || 'document';
            const score = analysis.analysis.synthesis?.uk_alignment_score || 0;
            const names: Record<FrameworkKey, string> = {
                ICO: 'UK ICO', DPA: 'UK DPA/GDPR', EU_AI_ACT: 'EU AI Act', ISO_42001: 'ISO 42001',
            };
            const frameworkNames = selectedFrameworks.map((fw) => names[fw]);

            const byteCharacters = atob(analysis.report_base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const file = new File([byteArray], `${baseName}_compliance_report.pdf`, { type: 'application/pdf' });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', `${baseName} Compliance Report`);
            formData.append('score', String(score));
            formData.append('frameworks', frameworkNames.join(','));

            const res = await fetch('/api/samples', { method: 'POST', body: formData });
            if (!res.ok) {
                console.error('Failed to save sample report:', await res.text());
                alert('Failed to save report to samples');
                return;
            }
            alert('Report saved to samples (shared across devices)');
        } catch (e) {
            console.error('Failed to save report to samples:', e);
            alert('Failed to save report to samples');
        }
    };

    const goToGaps = () => {
        setGapsInitialFilter(true);
        setActiveTab('gaps');
    };

    const canAnalyze =
        !isAnalyzing && (
            (ingestMode === 'metadata' && uploadedFile) || 
            (ingestMode === 'pdf' && uploadedFiles.length > 0 && selectedFrameworks.length > 0) ||
            (ingestMode === 'quiz' && quizPayload !== null)
        );

    const a = analysis?.analysis;

    return (
        <div className="max-w-7xl mx-auto px-8">
            {/* Live regulatory sync */}
            <PolicySyncBanner />

            {/* Workspace tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`nav-tab rounded-none border-b-2 -mb-px ${
                                activeTab === tab.key
                                    ? 'active border-primary'
                                    : 'border-transparent'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ===== Assessment tab ===== */}
            {activeTab === 'assessment' && (
                <>
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        {/* Ingestion mode toggle */}
                        <div className="mb-5">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Ingestion Mode</h3>
                            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                                <button
                                    onClick={() => switchMode('pdf')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        ingestMode === 'pdf' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                                    }`}
                                >
                                    <ShieldCheck className="w-4 h-4" /> Standard PDF Upload
                                </button>
                                <button
                                    onClick={() => switchMode('metadata')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        ingestMode === 'metadata' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                                    }`}
                                >
                                    <Lock className="w-4 h-4" /> Metadata Payload (Privacy Mode)
                                </button>
                                <button
                                    onClick={() => switchMode('quiz')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        ingestMode === 'quiz' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                                    }`}
                                >
                                    <LayoutDashboard className="w-4 h-4" /> Quick Self-Assessment
                                </button>
                            </div>
                            {ingestMode === 'metadata' && (
                                <p className="text-xs text-gray-500 mt-2 max-w-2xl">
                                    Privacy mode scores a lightweight, anonymised JSON payload — extracted locally by the
                                    compliance CLI — so raw documents never leave your environment. Ideal for public sector
                                    and enterprise risk teams with data-residency requirements.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Select Frameworks</h3>
                                <FrameworkSelector selected={selectedFrameworks} onChange={setSelectedFrameworks} />
                                {ingestMode === 'metadata' && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Frameworks are derived from the payload in privacy mode.
                                    </p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    {ingestMode === 'pdf' ? 'Upload Evidence Documents' : ingestMode === 'metadata' ? 'Upload Metadata Payload' : 'System Details'}
                                </h3>
                                {ingestMode === 'pdf' && (
                                    <MultiDocumentUpload files={uploadedFiles} onChange={setUploadedFiles} />
                                )}
                                {ingestMode === 'metadata' && (
                                    <FileUpload file={uploadedFile} onChange={setUploadedFile} mode="json" />
                                )}
                                {ingestMode === 'quiz' && (
                                    <QuizSelfAssessment 
                                        onSubmit={(payload) => {
                                            setQuizPayload(payload);
                                            // The handleAnalyze button handles submission
                                        }} 
                                        onCancel={() => switchMode('pdf')} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <FrameworkDescriptions />
                    <SampleReports />
                    <StatsCards analysis={analysis} selectedCount={selectedFrameworks.length} onGapsClick={goToGaps} />

                    <div className="mt-6">
                        {ingestMode === 'pdf' && (
                            <AnalysisStepper
                                isAnalyzing={isAnalyzing}
                                selectedFrameworks={selectedFrameworks}
                            />
                        )}

                        {((ingestMode === 'pdf' && uploadedFiles.length > 0) || (ingestMode === 'metadata' && uploadedFile) || (ingestMode === 'quiz' && quizPayload)) && (
                            <div className="flex gap-3 mb-6">
                                <button onClick={handleAnalyze} disabled={!canAnalyze} className="btn-primary flex items-center gap-2">
                                    🚀 {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                                </button>
                                {analysis?.report_base64 && (
                                    <>
                                        <button onClick={handleDownloadReport} className="btn-secondary">
                                            📄 Download Full Report (PDF)
                                        </button>
                                        <button onClick={handleDownloadBrowserPdf} className="btn-secondary">
                                            📊 Download Summary (PDF)
                                        </button>
                                        <button onClick={handleSaveToSamples} className="btn-secondary">
                                            💾 Save to Samples
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                                <p className="mt-2 text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {analysis ? <AnalysisResults analysis={analysis} /> : <EmptyState />}
                    </div>
                </>
            )}

            {/* ===== AI BOM tab ===== */}
            {activeTab === 'bom' && (
                <div className="space-y-6">
                    <StatsCards analysis={analysis} selectedCount={selectedFrameworks.length} onGapsClick={goToGaps} />
                    <SystemInventory extractedData={a?.extracted_data} />
                    <AiBomTable extractedData={a?.extracted_data} />
                </div>
            )}

            {/* ===== Gaps & Remediation tab ===== */}
            {activeTab === 'gaps' && (
                <div className="space-y-6">
                    {a ? (
                        <>
                            {/* Cross-framework gap correlations */}
                            {a.synthesis?.cross_framework_gaps?.length > 0 && (
                                <CrossFrameworkGaps gaps={a.synthesis.cross_framework_gaps} />
                            )}

                            {/* Action Plan */}
                            {a.synthesis?.action_plan?.length > 0 && (
                                <ActionPlan actionPlan={a.synthesis.action_plan} />
                            )}

                            {/* Searchable compliance matrix */}
                            <ComplianceMatrixView
                                icoResult={a.ico_result}
                                dpaResult={a.dpa_result}
                                euActResult={a.eu_act_result}
                                isoResult={a.iso_result}
                                selectedFrameworks={selectedFrameworks}
                            />

                            <GapChecklist
                                icoResult={a.ico_result}
                                dpaResult={a.dpa_result}
                                euActResult={a.eu_act_result}
                                isoResult={a.iso_result}
                                initialGapsOnly={gapsInitialFilter}
                            />
                            <RemediationPanel
                                icoResult={a.ico_result}
                                dpaResult={a.dpa_result}
                                euActResult={a.eu_act_result}
                                isoResult={a.iso_result}
                                synthesis={a.synthesis}
                            />
                        </>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                            Run an analysis on the Assessment tab to see gaps and remediation kits.
                        </div>
                    )}
                </div>
            )}

            {/* ===== Integrations tab ===== */}
            {activeTab === 'integrations' && <IntegrationsTab />}

            <footer className="text-center text-gray-400 text-xs py-8 mt-8">
                <p>AI Governance Hub • Built by Paul Kwarteng</p>
                <p className="mt-1">This tool is for informational purposes only and does not constitute legal advice.</p>
            </footer>
        </div>
    );
}
