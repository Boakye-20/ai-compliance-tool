"use client";

import { AnalysisResponse } from '@/app/page';
import { BarChart3, Shield, FileCheck } from 'lucide-react';

interface StatsCardsProps {
    analysis: AnalysisResponse | null;
    selectedCount: number;
}

export function StatsCards({ analysis, selectedCount }: StatsCardsProps) {
    const synthesis = analysis?.analysis?.synthesis || {};
    const score = synthesis.uk_alignment_score || 0;
    const gaps = synthesis.total_critical_gaps || 0;
    const frameworksAnalyzed = synthesis.frameworks_analyzed?.length || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="stat-card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">UK Alignment Score</p>
                        <p className="text-2xl font-bold text-gray-900">{score}%</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>

            <div className="stat-card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Critical Gaps</p>
                        <p className="text-2xl font-bold text-gray-900">{gaps}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {gaps > 0 ? '⚠️ needs attention' : '✓ none found'}
                        </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                </div>
            </div>

            <div className="stat-card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Frameworks</p>
                        <p className="text-2xl font-bold text-gray-900">{frameworksAnalyzed}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedCount} selected</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <FileCheck className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </div>
        </div>
    );
}
