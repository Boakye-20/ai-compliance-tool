"use client";

import React from 'react';
import { ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

interface CrossFrameworkGapsProps {
  gaps: Array<{
    id?: string;
    title?: string;
    issue?: string; // legacy field, use as fallback for title
    description?: string;
    affected_frameworks?: string[];
    impacts?: string[]; // legacy field, use as fallback for affected_frameworks
    affected_requirements?: string[];
    impact_score?: number;
    suggested_fix?: string;
    recommendation?: string; // legacy field, use as fallback for suggested_fix
    severity: string;
  }>;
}

export function CrossFrameworkGaps({ gaps }: CrossFrameworkGapsProps) {
  if (!gaps || gaps.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Cross-Framework Gap Correlations</h2>
        </div>
        <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
          {gaps.length} {gaps.length === 1 ? 'Gap' : 'Gaps'} Found
        </span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaps.map((gap, index) => {
            const title = gap.title || gap.issue || 'Unnamed Gap';
            const frameworks = gap.affected_frameworks || gap.impacts || [];
            const fix = gap.suggested_fix || gap.recommendation || 'No remediation provided.';
            
            let severityColors = 'bg-slate-100 text-slate-700';
            const severity = (gap.severity || '').toLowerCase();
            if (severity === 'critical') severityColors = 'bg-rose-100 text-rose-700 border-rose-200';
            else if (severity === 'high') severityColors = 'bg-rose-50 text-rose-600 border-rose-100';
            else if (severity === 'medium') severityColors = 'bg-amber-100 text-amber-700 border-amber-200';
            else if (severity === 'low') severityColors = 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div key={gap.id || index} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug">{title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${severityColors}`}>
                    {severity || 'Unknown'}
                  </span>
                </div>
                
                {gap.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {gap.description}
                  </p>
                )}

                {frameworks.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 mb-1.5 block">Triggers:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {frameworks.map((fw, fwIdx) => (
                        <span key={fwIdx} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-slate-100">
                  <div className="bg-indigo-50/50 rounded-md p-3 border border-indigo-100/50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-semibold text-indigo-900">Unified Remediation:</span>
                    </div>
                    <p className="text-sm text-indigo-800/80 leading-relaxed">
                      {fix}
                    </p>
                  </div>
                </div>
                
                {gap.impact_score !== undefined && (
                  <div className="text-right mt-1">
                     <span className="text-xs text-slate-500">Impact Score: <span className="font-semibold text-slate-700">{gap.impact_score}/10</span></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
