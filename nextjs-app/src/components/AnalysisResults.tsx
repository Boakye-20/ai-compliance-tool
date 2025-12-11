"use client";

import { AnalysisResponse } from '@/app/page';
import { CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';

interface AnalysisResultsProps {
    analysis: AnalysisResponse;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
    const { extracted_data, ico_result, dpa_result, eu_act_result, iso_result, synthesis } = analysis.analysis;
    const docType = extracted_data?.document_type || 'Unknown';

    const scoringBasis = docType === "GUIDANCE" ?
        "(Scoring based on guidance/recommendations coverage)" :
        "(Scoring based on specific compliance evidence)";

    const frameworks = [
        { key: 'ico_result', name: 'UK ICO', emoji: '🇬🇧', result: ico_result },
        { key: 'dpa_result', name: 'UK DPA/GDPR', emoji: '🔒', result: dpa_result },
        { key: 'eu_act_result', name: 'EU AI Act', emoji: '🇪🇺', result: eu_act_result },
        { key: 'iso_result', name: 'ISO 42001', emoji: '📋', result: iso_result },
    ];

    const getStatusInfo = (result: any) => {
        if (!result) return { color: 'text-gray-400', text: 'Not analyzed', icon: FileText };

        const status = result.status;
        if (status === "NOT_EVALUATED") {
            return { color: 'text-gray-500', text: 'Not evaluated', icon: FileText };
        }

        const score = result.score || 0;
        if (score >= 70) {
            return { color: 'text-green-600', text: 'Good Coverage', icon: CheckCircle };
        } else if (score >= 50) {
            return { color: 'text-yellow-600', text: 'Partial Coverage', icon: AlertTriangle };
        } else {
            return { color: 'text-red-600', text: 'Gaps Found', icon: XCircle };
        }
    };

    return (
        <div className="space-y-6">
            {/* Document type banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <strong>Document Type Detected:</strong> {docType}
                <span className="text-gray-600 ml-4">{scoringBasis}</span>
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Framework</h3>

                    <div className="space-y-4">
                        {frameworks.map(framework => {
                            if (!framework.result) return null;

                            const statusInfo = getStatusInfo(framework.result);
                            const StatusIcon = statusInfo.icon;
                            const score = framework.result.score || 0;

                            return (
                                <div key={framework.key} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{framework.emoji}</span>
                                            <span className="font-semibold">{framework.name}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 ${statusInfo.color} font-semibold`}>
                                            <StatusIcon className="h-4 w-4" />
                                            <span>{score}% · {statusInfo.text}</span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-700 mb-3">
                                        <strong>Summary:</strong> {framework.result.compliance_summary || 'No summary'}
                                    </div>

                                    {framework.result.status !== "NOT_EVALUATED" && (
                                        <>
                                            {/* Strengths */}
                                            {framework.result.strengths && framework.result.strengths.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="font-medium text-sm text-gray-900 mb-1">✅ Strengths:</p>
                                                    <ul className="text-sm text-gray-600 space-y-1">
                                                        {framework.result.strengths.slice(0, 3).map((strength: string, idx: number) => (
                                                            <li key={idx}>- {strength}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Evidence Found */}
                                            <div className="mb-3">
                                                <p className="font-medium text-sm text-gray-900 mb-2">📄 Evidence Found:</p>

                                                {/* Top-level evidence_found (e.g. EU AI Act aggregated evidence) */}
                                                {Array.isArray((framework.result as any).evidence_found) &&
                                                    (framework.result as any).evidence_found.length > 0 && (
                                                        <div className="text-xs text-gray-600 mb-2 ml-1">
                                                            {(framework.result as any).evidence_found
                                                                .slice(0, 3)
                                                                .map((e: string, idx: number) => (
                                                                    <div key={idx} className="italic">
                                                                        - {e.length > 150 ? `${e.substring(0, 150)}...` : e}
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}

                                                {/* Generic principles/articles and ISO pillars */}
                                                {Object.entries(framework.result).map(([key, value]) => {
                                                    if (!key.startsWith('principle_') && !key.startsWith('article_') &&
                                                        !['governance', 'risk_management', 'data_lifecycle', 'monitoring'].includes(key)) {
                                                        return null;
                                                    }

                                                    if (typeof value === 'object' && value !== null) {
                                                        const item = value as any;
                                                        const itemStatus = item.status || 'Unknown';
                                                        const evidence = item.evidence_found || item.evidence || [];

                                                        const statusIcon = itemStatus === "MET" ? "✅" :
                                                            itemStatus === "PARTIALLY_MET" ? "⚠️" : "❌";

                                                        const displayName = key
                                                            .replace('principle_', 'Principle ')
                                                            .replace('article_', 'Article ')
                                                            .replace('_', ' ')
                                                            .replace(/\b\w/g, l => l.toUpperCase());

                                                        return (
                                                            <div key={key} className="text-xs text-gray-600 mb-2">
                                                                <strong>{statusIcon} {displayName}:</strong> {itemStatus}
                                                                {Array.isArray(evidence) && evidence.length > 0 && (
                                                                    <div className="ml-4 mt-1">
                                                                        {evidence.slice(0, 2).map((e: string, idx: number) => (
                                                                            <div key={idx} className="italic">
                                                                                - {e.length > 150 ? `${e.substring(0, 150)}...` : e}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}

                                                {/* EU AI Act specific obligations */}
                                                {framework.key === 'eu_act_result' && framework.result.obligations_if_high_risk && (
                                                    Object.entries(framework.result.obligations_if_high_risk as Record<string, any>).map(([key, value]) => {
                                                        if (!value || typeof value !== 'object') return null;
                                                        const item = value as any;
                                                        const itemStatus = item.status || 'Unknown';
                                                        const evidence = item.evidence_found || item.evidence || [];

                                                        const statusIcon = itemStatus === "MET" ? "✅" :
                                                            itemStatus === "PARTIALLY_MET" ? "⚠️" : "❌";

                                                        const displayName = key
                                                            .replace(/_/g, ' ')
                                                            .replace(/\b\w/g, l => l.toUpperCase());

                                                        return (
                                                            <div key={key} className="text-xs text-gray-600 mb-2">
                                                                <strong>{statusIcon} {displayName}:</strong> {itemStatus}
                                                                {Array.isArray(evidence) && evidence.length > 0 && (
                                                                    <div className="ml-4 mt-1">
                                                                        {evidence.slice(0, 2).map((e: string, idx: number) => (
                                                                            <div key={idx} className="italic">
                                                                                - {e.length > 150 ? `${e.substring(0, 150)}...` : e}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Gaps */}
                                            {framework.result.critical_gaps && framework.result.critical_gaps.length > 0 && (
                                                <div>
                                                    <p className="font-medium text-sm text-red-700 mb-1">❌ Gaps:</p>
                                                    <ul className="text-sm text-red-600 space-y-1">
                                                        {framework.result.critical_gaps.map((gap: string, idx: number) => (
                                                            <li key={idx}>- {gap}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Debug info for NOT_EVALUATED */}
                                    {framework.result.status === "NOT_EVALUATED" && framework.result.raw_response && (
                                        <details className="mt-3">
                                            <summary className="text-xs text-gray-500 cursor-pointer">Debug: Raw model output</summary>
                                            <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto max-h-40">
                                                {framework.result.raw_response.substring(0, 1000)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Actions</h3>

                    {synthesis.priority_actions && synthesis.priority_actions.length > 0 ? (
                        <div className="space-y-3">
                            {synthesis.priority_actions.slice(0, 5).map((action: string, idx: number) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <span className="text-gray-700 text-sm">{action}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                            <p className="text-green-700 font-medium">✅ No critical actions required</p>
                        </div>
                    )}

                    {/* Cross-framework issues */}
                    {synthesis.cross_framework_gaps && synthesis.cross_framework_gaps.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">⚠️ Cross-Framework Issues</h4>
                            <div className="space-y-3">
                                {synthesis.cross_framework_gaps.map((gap: any, idx: number) => (
                                    <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="font-medium text-yellow-800">{gap.issue}</p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            <strong>Impacts:</strong> {Array.isArray(gap.impacts) ? gap.impacts.join(', ') : gap.impacts}
                                        </p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            <strong>Recommendation:</strong> {gap.recommendation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
