"use client";

import { useMemo, useState } from 'react';
import { Wrench, Download, Loader2, FileCode, Copy, Check } from 'lucide-react';
import { RemediationKit as Kit } from '@/lib/remediation/templates';

interface GapItem {
    framework: string;
    gap: string;
}

interface RemediationPanelProps {
    icoResult: any;
    dpaResult: any;
    euActResult: any;
    isoResult: any;
    synthesis: any;
}

function downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function RemediationPanel({ icoResult, dpaResult, euActResult, isoResult, synthesis }: RemediationPanelProps) {
    const [kits, setKits] = useState<Record<string, Kit>>({});
    const [loadingKey, setLoadingKey] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const gaps = useMemo<GapItem[]>(() => {
        const out: GapItem[] = [];
        const sources = [
            { name: 'UK ICO', result: icoResult },
            { name: 'UK DPA / GDPR', result: dpaResult },
            { name: 'EU AI Act', result: euActResult },
            { name: 'ISO 42001', result: isoResult },
        ];
        for (const s of sources) {
            const list: string[] = s.result?.critical_gaps || [];
            list.forEach((g) => out.push({ framework: s.name, gap: g }));
        }
        // Cross-framework issues from the synthesizer
        (synthesis?.cross_framework_gaps || []).forEach((g: any) =>
            out.push({ framework: 'Cross-framework', gap: `${g.issue}: ${g.recommendation}` }),
        );
        return out;
    }, [icoResult, dpaResult, euActResult, isoResult, synthesis]);

    const generate = async (key: string, item: GapItem) => {
        setLoadingKey(key);
        try {
            const res = await fetch('/api/remediate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gap: item.gap, framework: item.framework }),
            });
            const data = await res.json();
            if (data.kit) setKits((prev) => ({ ...prev, [key]: data.kit }));
        } catch (e) {
            console.error('Failed to generate remediation kit:', e);
        } finally {
            setLoadingKey(null);
        }
    };

    const copy = async (id: string, content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(id);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };

    if (gaps.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Wrench className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No critical gaps flagged — nothing to remediate.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Gap Remediation</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{gaps.length} flagged</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Generate plug-and-play code and schemas your engineers can drop into their stack to close each gap.
            </p>

            <div className="space-y-3">
                {gaps.map((item, idx) => {
                    const key = `${item.framework}-${idx}`;
                    const kit = kits[key];
                    return (
                        <div key={key} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <span className="text-xs font-medium text-gray-500">{item.framework}</span>
                                    <p className="text-sm text-gray-800 mt-0.5">{item.gap}</p>
                                </div>
                                {!kit && (
                                    <button
                                        onClick={() => generate(key, item)}
                                        disabled={loadingKey === key}
                                        className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap flex-shrink-0"
                                    >
                                        {loadingKey === key ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                                        ) : (
                                            <><Wrench className="w-4 h-4" /> Generate Remediation Kit</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {kit && (
                                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="mb-3">
                                        <p className="font-semibold text-gray-900">{kit.title}</p>
                                        <p className="text-xs text-blue-700">{kit.clause}</p>
                                        <p className="text-sm text-gray-600 mt-1">{kit.description}</p>
                                    </div>
                                    <div className="space-y-3">
                                        {kit.files.map((f) => {
                                            const fileId = `${key}-${f.filename}`;
                                            return (
                                                <div key={fileId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                                                        <span className="flex items-center gap-2 text-xs font-mono text-gray-700">
                                                            <FileCode className="w-3.5 h-3.5" /> {f.filename}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => copy(fileId, f.content)}
                                                                className="text-gray-400 hover:text-gray-700"
                                                                title="Copy"
                                                            >
                                                                {copied === fileId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => downloadFile(f.filename, f.content)}
                                                                className="text-gray-400 hover:text-gray-700"
                                                                title="Download"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <pre className="text-xs p-3 overflow-x-auto max-h-64 text-gray-800">{f.content}</pre>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
