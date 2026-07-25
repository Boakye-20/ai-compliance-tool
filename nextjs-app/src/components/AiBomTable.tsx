"use client";

import { useMemo, useState } from 'react';
import { Boxes, Cpu, Database, ShieldAlert, Globe, Search } from 'lucide-react';

// One flattened inventory row derived from the extractor's BOM fields.
interface BomRow {
    component: string;
    type: 'Foundation Model' | 'Dataset' | 'PII / Personal Data' | 'Data Residency';
    detail: string;
}

type BomFilter = 'ALL' | BomRow['type'];

const TYPE_META: Record<BomRow['type'], { icon: typeof Cpu; badge: string }> = {
    'Foundation Model': { icon: Cpu, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    'Dataset': { icon: Database, badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    'PII / Personal Data': { icon: ShieldAlert, badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    'Data Residency': { icon: Globe, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

interface AiBomTableProps {
    // extracted_data from the analysis response (loosely typed to match page.tsx)
    extractedData: any;
}

export function AiBomTable({ extractedData }: AiBomTableProps) {
    const [filter, setFilter] = useState<BomFilter>('ALL');
    const [query, setQuery] = useState('');

    const rows = useMemo<BomRow[]>(() => {
        if (!extractedData) return [];
        const out: BomRow[] = [];
        const systemType: string = extractedData.system_type || 'AI system';

        (extractedData.foundation_models || []).forEach((m: string) =>
            out.push({ component: m, type: 'Foundation Model', detail: `Used by ${systemType}` }),
        );
        (extractedData.datasets || []).forEach((d: string) =>
            out.push({ component: d, type: 'Dataset', detail: 'Training / reference data' }),
        );
        (extractedData.pii_categories || []).forEach((p: string) =>
            out.push({ component: p, type: 'PII / Personal Data', detail: 'Personal / special-category data' }),
        );
        if (extractedData.region_residency && extractedData.region_residency !== 'Not specified') {
            out.push({ component: extractedData.region_residency, type: 'Data Residency', detail: 'Where data is stored / processed' });
        }
        return out;
    }, [extractedData]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((r) => {
            if (filter !== 'ALL' && r.type !== filter) return false;
            if (q && !(`${r.component} ${r.detail}`.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [rows, filter, query]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: rows.length };
        rows.forEach((r) => { c[r.type] = (c[r.type] || 0) + 1; });
        return c;
    }, [rows]);

    if (!extractedData) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                Run an analysis to generate the AI Bill of Materials.
            </div>
        );
    }

    const filterTabs: BomFilter[] = ['ALL', 'Foundation Model', 'Dataset', 'PII / Personal Data', 'Data Residency'];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
                <Boxes className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Bill of Materials</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {rows.length} components detected
                </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Foundation models, datasets, PII exposure and data residency detected in this document.
            </p>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {filterTabs.map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            filter === t
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {t === 'ALL' ? 'All' : t} {counts[t] ? `(${counts[t]})` : '(0)'}
                    </button>
                ))}
                <div className="relative ml-auto">
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filter components…"
                        className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-52"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                            <th className="py-2 pr-4 font-medium">Component</th>
                            <th className="py-2 pr-4 font-medium">Type</th>
                            <th className="py-2 font-medium">Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-6 text-center text-gray-400">
                                    No components match this filter.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r, idx) => {
                                const meta = TYPE_META[r.type];
                                const Icon = meta.icon;
                                return (
                                    <tr key={`${r.type}-${r.component}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 pr-4 font-medium text-gray-900">{r.component}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${meta.badge}`}>
                                                <Icon className="w-3 h-3" />
                                                {r.type}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-600">{r.detail}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
