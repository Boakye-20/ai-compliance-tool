"use client";

import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Filter } from 'lucide-react';

interface ComplianceMatrixViewProps {
  icoResult: any;
  dpaResult: any;
  euActResult: any;
  isoResult: any;
  selectedFrameworks: string[];
}

type AssessmentStatus = 'met' | 'partially_met' | 'not_met' | 'evidence_missing';

interface Assessment {
  id: string;
  code: string;
  title: string;
  category: string;
  status: AssessmentStatus;
  finding: string;
  evidenceQuote?: string;
  gapIdentified?: string;
  recommendation: string;
  severity: string;
}

function mapSeverity(status: string): string {
  const s = (status || '').toUpperCase();
  if (s === 'NOT_MET') return 'critical';
  if (s === 'PARTIALLY_MET') return 'medium';
  if (s === 'EVIDENCE_MISSING') return 'low';
  return 'low';
}

function normalizeAssessments(result: any, frameworkLabel: string): Assessment[] {
  if (!result) return [];
  const skip = new Set(['score', 'priority_actions', 'critical_gaps_count', 'risk_tier', 'obligations_if_high_risk', 'high_risk_category', 'applicable']);
  return Object.entries(result)
    .filter(([key]) => !skip.has(key) && typeof result[key] === 'object' && result[key] !== null && 'status' in result[key])
    .map(([key, val]: [string, any], idx) => ({
      id: `${frameworkLabel}-${idx}`,
      code: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 30),
      title: val.title || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      category: frameworkLabel,
      status: (val.status || 'evidence_missing').toLowerCase().replace(/ /g, '_') as any,
      finding: val.evidence || val.finding || 'No detailed finding available.',
      evidenceQuote: val.evidence_quote || val.quote || undefined,
      gapIdentified: val.gap || val.gap_identified || undefined,
      recommendation: val.recommendation || val.action || 'No recommendation provided.',
      severity: mapSeverity(val.status),
    }));
}

const StatusIcon = ({ status }: { status: AssessmentStatus }) => {
  switch (status) {
    case 'met': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'partially_met': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'not_met': return <XCircle className="w-5 h-5 text-rose-500" />;
    case 'evidence_missing':
    default:
      return <HelpCircle className="w-5 h-5 text-slate-400" />;
  }
};

const StatusLabel = ({ status }: { status: AssessmentStatus }) => {
  switch (status) {
    case 'met': return <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">MET</span>;
    case 'partially_met': return <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-medium">PARTIAL</span>;
    case 'not_met': return <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded text-xs font-medium">NOT MET</span>;
    case 'evidence_missing':
    default:
      return <span className="text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs font-medium">MISSING EVIDENCE</span>;
  }
};

export function ComplianceMatrixView({
  icoResult,
  dpaResult,
  euActResult,
  isoResult,
  selectedFrameworks
}: ComplianceMatrixViewProps) {
  
  const allTabs = useMemo(() => {
    const tabs: {id: string, label: string, data: Assessment[]}[] = [];
    if (icoResult) tabs.push({ id: 'ico', label: 'UK ICO', data: normalizeAssessments(icoResult, 'UK ICO') });
    if (dpaResult) tabs.push({ id: 'dpa', label: 'UK DPA/GDPR', data: normalizeAssessments(dpaResult, 'UK DPA/GDPR') });
    if (euActResult) tabs.push({ id: 'eu', label: 'EU AI Act', data: normalizeAssessments(euActResult, 'EU AI Act') });
    if (isoResult) tabs.push({ id: 'iso', label: 'ISO 42001', data: normalizeAssessments(isoResult, 'ISO 42001') });
    return tabs;
  }, [icoResult, dpaResult, euActResult, isoResult]);

  const availableTabs = useMemo(() => {
    const filtered = allTabs.filter(t => selectedFrameworks.some(sf => sf.includes(t.label) || t.label.includes(sf) || (t.id === 'dpa' && sf.includes('GDPR')) || (t.id === 'ico' && sf === 'ICO') || (t.id === 'eu' && sf === 'EU_AI_ACT') || (t.id === 'iso' && sf === 'ISO_42001') || (t.id === 'dpa' && sf === 'DPA')));
    return filtered.length > 0 ? filtered : allTabs;
  }, [allTabs, selectedFrameworks]);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const currentTabData = availableTabs.find(t => t.id === activeTab)?.data || [];

  const filteredData = currentTabData.filter(item => {
    const matchesSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.finding.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (availableTabs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Framework Breakdown & Compliance Matrix</h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search requirements..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select 
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="met">Met</option>
              <option value="partially_met">Partially Met</option>
              <option value="not_met">Not Met</option>
              <option value="evidence_missing">Evidence Missing</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 px-5 overflow-x-auto hide-scrollbar">
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Ref / Requirement</th>
              <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Status</th>
              <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Findings & Evidence</th>
              <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gap & Strategy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 align-top">
                  <td className="py-4 px-5">
                    <div className="font-mono text-xs text-indigo-600 font-medium mb-1">{item.code}</div>
                    <div className="text-sm font-medium text-slate-900">{item.title}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-2 items-start">
                      <StatusIcon status={item.status} />
                      <StatusLabel status={item.status} />
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-sm text-slate-700 mb-2">{item.finding}</p>
                    {item.evidenceQuote && (
                      <blockquote className="border-l-2 border-indigo-300 pl-3 py-1 bg-indigo-50/30 text-xs text-slate-600 italic">
                        &ldquo;{item.evidenceQuote}&rdquo;
                      </blockquote>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-2">
                      {item.status !== 'met' && item.gapIdentified && (
                        <div className="bg-rose-50 text-rose-800 p-2 rounded text-xs border border-rose-100">
                          <span className="font-semibold block mb-1">Gap:</span>
                          {item.gapIdentified}
                        </div>
                      )}
                      <div className="bg-blue-50 text-blue-800 p-2 rounded text-xs border border-blue-100">
                        <span className="font-semibold block mb-1">Strategy:</span>
                        {item.recommendation}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500">
                  No requirements match your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
