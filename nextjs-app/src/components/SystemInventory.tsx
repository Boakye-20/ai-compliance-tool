"use client";

import React from 'react';
import { Cpu } from 'lucide-react';

interface SystemInventoryProps {
  extractedData: {
    use_case?: string;
    system_type?: string;
    data_types?: string[];
    has_personal_data?: boolean;
    has_biometric_data?: boolean;
    has_human_oversight?: boolean;
    deployment_context?: string;
    risk_indicators?: string[];
    foundation_models?: string[];
    datasets?: string[];
    pii_categories?: string[];
    region_residency?: string;
    document_type?: string;
  } | null;
}

export function SystemInventory({ extractedData }: SystemInventoryProps) {
  if (!extractedData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-slate-900">No AI Inventory Data</h3>
        <p className="text-sm text-slate-500 mt-1">Extraction results are not available yet.</p>
      </div>
    );
  }

  const riskCount = (extractedData.risk_indicators || []).length;
  let riskTier = 'Low Risk';
  let riskColors = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (riskCount >= 3) {
    riskTier = 'High Risk';
    riskColors = 'bg-rose-100 text-rose-800 border-rose-200';
  } else if (riskCount > 0) {
    riskTier = 'Medium Risk';
    riskColors = 'bg-amber-100 text-amber-800 border-amber-200';
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Detected AI Component Inventory</h2>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${riskColors}`}>
          {riskTier}
        </span>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">System & Purpose</span>
            <div className="text-sm text-slate-900 font-medium mb-1">{extractedData.system_type || 'Unknown System Type'}</div>
            <div className="text-sm text-slate-600">{extractedData.use_case || 'No use case specified'}</div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Detected Models</span>
            {extractedData.foundation_models && extractedData.foundation_models.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {extractedData.foundation_models.map((m, i) => (
                  <span key={i} className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400 italic">None detected</span>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Special Category Flags</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Personal Data</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${extractedData.has_personal_data ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                  {extractedData.has_personal_data ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Biometric Data</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${extractedData.has_biometric_data ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>
                  {extractedData.has_biometric_data ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Training & Eval Datasets</span>
            {extractedData.datasets && extractedData.datasets.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-slate-700 font-mono space-y-1">
                {extractedData.datasets.map((d, i) => (
                  <li key={i} className="truncate" title={d}>{d}</li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-slate-400 italic">No datasets identified</span>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Data Categories</span>
            {extractedData.data_types && extractedData.data_types.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {extractedData.data_types.map((dt, i) => (
                  <span key={i} className="text-xs bg-white text-slate-700 px-2 py-1 rounded border border-slate-200">
                    {dt}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400 italic">None specified</span>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Deployment Context</span>
            <div className="text-sm text-slate-700">
              {extractedData.deployment_context || <span className="text-slate-400 italic">Unknown context</span>}
            </div>
            {extractedData.region_residency && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Region:</span>
                <span className="text-xs font-medium text-slate-800">{extractedData.region_residency}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
