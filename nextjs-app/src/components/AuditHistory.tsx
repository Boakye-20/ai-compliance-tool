"use client";

import { useEffect, useState } from 'react';
import { History, Calendar } from 'lucide-react';

interface AuditSummary {
    id: string;
    source: string;
    score: number;
    criticalGaps: number;
    frameworks: string[];
    documentType: string | null;
    createdAt: string;
}

function scoreColor(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
}

export function AuditHistory() {
    const [audits, setAudits] = useState<AuditSummary[]>([]);
    const [available, setAvailable] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/audits');
                const data = await res.json();
                setAvailable(!!data.available);
                setAudits(data.audits || []);
            } catch {
                setAvailable(false);
            } finally {
                setLoaded(true);
            }
        })();
    }, []);

    // Hidden until persistence is provisioned — keeps the tab clean pre-Phase-3-infra.
    if (!loaded || !available) return null;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Audit History</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{audits.length} stored</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Every analysis and pipeline submission, persisted for continuous compliance.</p>

            {audits.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No audits recorded yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                                <th className="py-2 pr-4 font-medium">Date</th>
                                <th className="py-2 pr-4 font-medium">Source</th>
                                <th className="py-2 pr-4 font-medium">Frameworks</th>
                                <th className="py-2 pr-4 font-medium">Gaps</th>
                                <th className="py-2 font-medium text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {audits.map((au) => (
                                <tr key={au.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 pr-4 text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {new Date(au.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 uppercase">{au.source}</span>
                                    </td>
                                    <td className="py-3 pr-4 text-gray-600">{au.frameworks.length}</td>
                                    <td className="py-3 pr-4 text-gray-600">{au.criticalGaps}</td>
                                    <td className={`py-3 text-right font-bold ${scoreColor(au.score)}`}>{au.score}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
