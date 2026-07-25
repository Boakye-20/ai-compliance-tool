"use client";

import { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronRight, ListChecks } from 'lucide-react';

// A single normalized clause, flattened from the per-framework result objects.
interface Clause {
    framework: string;
    emoji: string;
    id: string;
    label: string;
    status: string;
    gap: string;
    evidence: string[];
    priority: string;
}

// Human-readable labels for each framework's clause keys.
const CLAUSE_LABELS: Record<string, Record<string, string>> = {
    ico_result: {
        principle_1_safety: 'Principle 1 · Safety, Security & Robustness',
        principle_2_fairness: 'Principle 2 · Fairness',
        principle_3_accountability: 'Principle 3 · Accountability & Governance',
        principle_4_contestability: 'Principle 4 · Contestability & Redress',
        principle_5_data_minimization: 'Principle 5 · Data Minimisation',
    },
    dpa_result: {
        article_5_fairness: 'Article 5 · Lawfulness & Fairness',
        article_13_transparency: 'Article 13 · Transparency',
        article_22_adm: 'Article 22 · Automated Decision-Making',
        article_35_dpia: 'Article 35 · DPIA',
    },
    iso_result: {
        governance: 'Clause · AI Governance',
        risk_management: 'Clause · Risk Management',
        data_lifecycle: 'Clause · Data Lifecycle',
        monitoring: 'Clause · Monitoring & Improvement',
    },
};

const FRAMEWORK_META = [
    { key: 'ico_result', name: 'UK ICO', emoji: '🇬🇧' },
    { key: 'dpa_result', name: 'UK DPA / GDPR', emoji: '🔒' },
    { key: 'eu_act_result', name: 'EU AI Act', emoji: '🇪🇺' },
    { key: 'iso_result', name: 'ISO 42001', emoji: '📋' },
];

const GAP_STATUSES = ['NOT_MET', 'EVIDENCE_MISSING'];

function statusVisual(status: string) {
    switch (status) {
        case 'MET':
            return { icon: CheckCircle2, color: 'text-green-600', label: 'Met' };
        case 'PARTIALLY_MET':
            return { icon: AlertTriangle, color: 'text-yellow-600', label: 'Partially met' };
        case 'NOT_MET':
            return { icon: XCircle, color: 'text-red-600', label: 'Not met' };
        case 'EVIDENCE_MISSING':
            return { icon: HelpCircle, color: 'text-orange-600', label: 'Evidence missing' };
        default:
            return { icon: HelpCircle, color: 'text-gray-400', label: status || 'N/A' };
    }
}

function labelize(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function collectClauses(results: Record<string, any>): Clause[] {
    const clauses: Clause[] = [];

    for (const meta of FRAMEWORK_META) {
        const result = results[meta.key];
        if (!result) continue;

        const pushClause = (id: string, label: string, item: any) => {
            if (!item || typeof item !== 'object') return;
            clauses.push({
                framework: meta.name,
                emoji: meta.emoji,
                id,
                label,
                status: item.status || 'N/A',
                gap: item.gap || '',
                evidence: Array.isArray(item.evidence_found) ? item.evidence_found : [],
                priority: item.priority || '',
            });
        };

        // Named clause keys (ICO principles, DPA articles, ISO pillars)
        const labelMap = CLAUSE_LABELS[meta.key];
        if (labelMap) {
            for (const [key, label] of Object.entries(labelMap)) {
                if (result[key]) pushClause(key, label, result[key]);
            }
        }

        // EU AI Act high-risk obligations live in a nested record
        if (meta.key === 'eu_act_result' && result.obligations_if_high_risk) {
            for (const [key, item] of Object.entries(result.obligations_if_high_risk as Record<string, any>)) {
                pushClause(key, `Obligation · ${labelize(key)}`, item);
            }
        }
    }

    return clauses;
}

interface GapChecklistProps {
    icoResult: any;
    dpaResult: any;
    euActResult: any;
    isoResult: any;
    initialGapsOnly?: boolean;
}

export function GapChecklist({ icoResult, dpaResult, euActResult, isoResult, initialGapsOnly = false }: GapChecklistProps) {
    const [gapsOnly, setGapsOnly] = useState(initialGapsOnly);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const clauses = useMemo(
        () => collectClauses({ ico_result: icoResult, dpa_result: dpaResult, eu_act_result: euActResult, iso_result: isoResult }),
        [icoResult, dpaResult, euActResult, isoResult],
    );

    const visible = gapsOnly ? clauses.filter((c) => GAP_STATUSES.includes(c.status)) : clauses;
    const gapCount = clauses.filter((c) => GAP_STATUSES.includes(c.status)).length;

    // Group by framework preserving FRAMEWORK_META order
    const grouped = FRAMEWORK_META.map((m) => ({
        name: m.name,
        emoji: m.emoji,
        clauses: visible.filter((c) => c.framework === m.name),
    })).filter((g) => g.clauses.length > 0);

    if (clauses.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                Run an analysis to see the clause-by-clause compliance breakdown.
            </div>
        );
    }

    const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Compliance Checklist</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {gapCount} non-compliant clauses
                    </span>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={gapsOnly}
                        onChange={(e) => setGapsOnly(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    Show gaps only
                </label>
            </div>

            <div className="space-y-6">
                {grouped.map((group) => (
                    <div key={group.name}>
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <span>{group.emoji}</span> {group.name}
                        </h4>
                        <div className="space-y-2">
                            {group.clauses.map((c) => {
                                const v = statusVisual(c.status);
                                const StatusIcon = v.icon;
                                const isOpen = !!expanded[`${group.name}-${c.id}`];
                                return (
                                    <div key={`${group.name}-${c.id}`} className="border border-gray-200 rounded-lg">
                                        <button
                                            onClick={() => toggle(`${group.name}-${c.id}`)}
                                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                                        >
                                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                            <StatusIcon className={`w-4 h-4 ${v.color} flex-shrink-0`} />
                                            <span className="flex-1 text-sm font-medium text-gray-900">{c.label}</span>
                                            <span className={`text-xs font-semibold ${v.color}`}>{v.label}</span>
                                        </button>
                                        {isOpen && (
                                            <div className="px-4 pb-4 pl-11 text-sm space-y-2">
                                                {c.gap && (
                                                    <p className="text-red-700">
                                                        <strong>Gap:</strong> {c.gap}
                                                    </p>
                                                )}
                                                {c.priority && (
                                                    <p className="text-gray-600">
                                                        <strong>Priority:</strong> {c.priority}
                                                    </p>
                                                )}
                                                {c.evidence.length > 0 ? (
                                                    <div className="text-gray-600">
                                                        <strong>Evidence found:</strong>
                                                        <ul className="mt-1 space-y-1 list-disc list-inside">
                                                            {c.evidence.slice(0, 3).map((e, i) => (
                                                                <li key={i} className="italic">
                                                                    {e.length > 200 ? `${e.slice(0, 200)}…` : e}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 italic">No supporting evidence located in the document.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {grouped.length === 0 && (
                    <p className="text-center text-green-700 py-6">✅ No non-compliant clauses — every evaluated clause is met.</p>
                )}
            </div>
        </div>
    );
}
