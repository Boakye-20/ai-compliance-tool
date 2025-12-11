"use client";

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { FrameworkSelector } from '@/components/FrameworkSelector';
import { StatsCards } from '@/components/StatsCards';
import { AnalysisResults } from '@/components/AnalysisResults';
import { FrameworkDescriptions } from '@/components/FrameworkDescriptions';
import { EmptyState } from '@/components/EmptyState';
import { AnalysisProgress } from '@/components/AnalysisProgress';

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

export default function CompliancePage() {
    const [selectedFrameworks, setSelectedFrameworks] = useState<FrameworkKey[]>(["ICO", "DPA"]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    // Simulate progress during analysis
    useEffect(() => {
        if (!isAnalyzing) {
            setCurrentStep(0);
            return;
        }

        const totalSteps = 4 + selectedFrameworks.length; // extract + route + frameworks + synthesis + report
        let step = 0;

        const progressInterval = setInterval(() => {
            step++;
            setCurrentStep(step);

            if (step >= totalSteps) {
                clearInterval(progressInterval);
            }
        }, 3000); // Move to next step every 3 seconds

        return () => clearInterval(progressInterval);
    }, [isAnalyzing, selectedFrameworks.length]);

    const handleAnalyze = async () => {
        if (!uploadedFile || selectedFrameworks.length === 0) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            selectedFrameworks.forEach(fw => formData.append('frameworks', fw));

            const response = await fetch(`/api/analyze`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data: AnalysisResponse = await response.json();
            setAnalysis(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownloadReport = () => {
        if (!analysis?.report_base64) return;

        try {
            const byteCharacters = atob(analysis.report_base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'ai_compliance_report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to download report:', e);
        }
    };

    const canAnalyze = uploadedFile && selectedFrameworks.length > 0 && !isAnalyzing;

    return (
        <div className="max-w-7xl mx-auto px-8">
            {/* Filter row */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Frameworks</h3>
                        <FrameworkSelector
                            selected={selectedFrameworks}
                            onChange={setSelectedFrameworks}
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Document</h3>
                        <FileUpload
                            file={uploadedFile}
                            onChange={setUploadedFile}
                        />
                    </div>
                </div>
            </div>

            {/* Framework descriptions */}
            <FrameworkDescriptions />

            {/* Stats cards */}
            <StatsCards analysis={analysis} selectedCount={selectedFrameworks.length} />

            <div className="mt-6">
                {/* Progress indicator */}
                <AnalysisProgress
                    selectedFrameworks={selectedFrameworks}
                    currentStep={currentStep}
                    isAnalyzing={isAnalyzing}
                />

                {/* Action buttons */}
                {uploadedFile && (
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={handleAnalyze}
                            disabled={!canAnalyze}
                            className="btn-primary flex items-center gap-2"
                        >
                            🚀 {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                        </button>

                        {analysis?.report_base64 && (
                            <button
                                onClick={handleDownloadReport}
                                className="btn-secondary"
                            >
                                📄 Download PDF Report
                            </button>
                        )}
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results or empty state */}
                {analysis ? (
                    <AnalysisResults analysis={analysis} />
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* Footer */}
            <footer className="text-center text-gray-400 text-xs py-8 mt-8">
                <p>AI Governance Hub • Built by Paul Kwarteng</p>
                <p className="mt-1">This tool is for informational purposes only and does not constitute legal advice.</p>
            </footer>
        </div>
    );
}
