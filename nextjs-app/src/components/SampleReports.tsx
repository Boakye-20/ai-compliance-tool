"use client";

import { useState, useEffect, useRef } from 'react';
import { FileText, Download, Calendar, BarChart3, Trash2, Upload, Loader2 } from 'lucide-react';

interface BlobSample {
    id: string;
    name: string;
    score: number;
    date: string;
    frameworks: string[];
    url: string;
    pathname: string;
}

export interface SampleReport {
    id: string;
    name: string;
    documentName: string;
    date: string;
    score: number;
    frameworks: string[];
    pdfBase64: string;
}

const STORAGE_KEY = 'ai_compliance_sample_reports';

function getScoreColor(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
}

function getScoreBg(score: number): string {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
}

export function getSavedReports(): SampleReport[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function saveReport(report: SampleReport): void {
    if (typeof window === 'undefined') return;
    try {
        const existing = getSavedReports();
        const updated = [report, ...existing].slice(0, 10); // Keep max 10 reports
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('sampleReportsUpdated'));
    } catch (e) {
        console.error('Failed to save report:', e);
    }
}

export function deleteReport(id: string): void {
    if (typeof window === 'undefined') return;
    try {
        const existing = getSavedReports();
        const updated = existing.filter((r) => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('sampleReportsUpdated'));
    } catch (e) {
        console.error('Failed to delete report:', e);
    }
}

export function SampleReports() {
    const [reports, setReports] = useState<SampleReport[]>([]);
    const [blobSamples, setBlobSamples] = useState<BlobSample[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadName, setUploadName] = useState('');
    const [uploadScore, setUploadScore] = useState('60');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setReports(getSavedReports());
        fetchBlobSamples();

        const handleUpdate = () => setReports(getSavedReports());
        window.addEventListener('sampleReportsUpdated', handleUpdate);
        return () => window.removeEventListener('sampleReportsUpdated', handleUpdate);
    }, []);

    const fetchBlobSamples = async () => {
        try {
            const res = await fetch('/api/samples');
            const data = await res.json();
            setBlobSamples(data.samples || []);
        } catch (e) {
            console.error('Failed to fetch samples:', e);
        }
    };

    const handleUpload = async (file: File) => {
        if (!file || !uploadName) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', uploadName);
            formData.append('score', uploadScore);
            formData.append('frameworks', 'UK ICO,UK DPA/GDPR,EU AI Act,ISO 42001');

            const res = await fetch('/api/samples', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchBlobSamples();
                setShowUpload(false);
                setUploadName('');
                setUploadScore('60');
            } else {
                const err = await res.json();
                alert(err.error || 'Upload failed');
            }
        } catch (e) {
            console.error('Upload failed:', e);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteBlob = async (pathname: string) => {
        if (!confirm('Remove this sample?')) return;
        try {
            await fetch('/api/samples', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pathname }),
            });
            await fetchBlobSamples();
        } catch (e) {
            console.error('Delete failed:', e);
        }
    };

    const handleDownload = (report: SampleReport) => {
        try {
            const byteCharacters = atob(report.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${report.documentName.replace(/\.pdf$/i, '')}_compliance_report.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to download report:', e);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Remove this report from samples?')) {
            deleteReport(id);
        }
    };

    const hasAnySamples = blobSamples.length > 0 || reports.length > 0;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Sample Reports</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Portfolio Examples
                    </span>
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                    <Upload className="w-4 h-4" />
                    Add Sample
                </button>
            </div>

            {/* Upload form */}
            {showUpload && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Report name"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                            type="number"
                            placeholder="Score (0-100)"
                            value={uploadScore}
                            onChange={(e) => setUploadScore(e.target.value)}
                            min="0"
                            max="100"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(file);
                            }}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!uploadName || isUploading}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                            ) : (
                                <><Upload className="w-4 h-4" /> Upload PDF</>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">Upload a compliance report PDF to showcase in your portfolio.</p>
                </div>
            )}

            {!hasAnySamples && !showUpload && (
                <p className="text-sm text-gray-500 text-center py-4">
                    No sample reports yet. Click &quot;Add Sample&quot; to upload one.
                </p>
            )}

            <div className="space-y-3">
                {/* Blob samples (visible to everyone) */}
                {blobSamples.map((sample) => (
                    <div
                        key={sample.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${getScoreBg(sample.score)}`}>
                                <BarChart3 className={`w-5 h-5 ${getScoreColor(sample.score)}`} />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{sample.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(sample.date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    <span>•</span>
                                    <span>{sample.frameworks.length} frameworks</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`text-lg font-bold ${getScoreColor(sample.score)}`}>
                                {sample.score}%
                            </div>
                            <a
                                href={sample.url}
                                download
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </a>
                            <button
                                onClick={() => handleDeleteBlob(sample.pathname)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove sample"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* User-saved samples (localStorage, only visible in current browser) */}
                {reports.map((report) => (
                    <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${getScoreBg(report.score)}`}>
                                <BarChart3 className={`w-5 h-5 ${getScoreColor(report.score)}`} />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{report.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(report.date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    <span>•</span>
                                    <span>{report.frameworks.length} frameworks</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`text-lg font-bold ${getScoreColor(report.score)}`}>
                                {report.score}%
                            </div>
                            <button
                                onClick={() => handleDownload(report)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={() => handleDelete(report.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove from samples"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
