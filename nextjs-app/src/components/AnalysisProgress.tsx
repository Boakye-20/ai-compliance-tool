"use client";

import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { FrameworkKey } from '@/app/page';

interface AnalysisProgressProps {
    selectedFrameworks: FrameworkKey[];
    currentStep: number;
    isAnalyzing: boolean;
}

export function AnalysisProgress({ selectedFrameworks, currentStep, isAnalyzing }: AnalysisProgressProps) {
    if (!isAnalyzing) return null;

    const steps = [
        { id: 0, name: 'Extracting Document', description: 'Reading and parsing PDF content' },
        { id: 1, name: 'Routing Frameworks', description: 'Determining analysis approach' },
    ];

    // Add framework-specific steps
    const frameworkSteps = selectedFrameworks.map((fw, idx) => {
        const frameworkNames: Record<FrameworkKey, string> = {
            'ICO': 'UK ICO Analysis',
            'DPA': 'UK DPA/GDPR Analysis',
            'EU_AI_ACT': 'EU AI Act Analysis',
            'ISO_42001': 'ISO 42001 Analysis',
        };

        return {
            id: 2 + idx,
            name: frameworkNames[fw],
            description: `Analyzing compliance against ${frameworkNames[fw]}`
        };
    });

    const finalSteps = [
        {
            id: 2 + selectedFrameworks.length,
            name: 'Synthesizing Results',
            description: 'Cross-framework analysis and scoring'
        },
        {
            id: 3 + selectedFrameworks.length,
            name: 'Generating Report',
            description: 'Creating PDF compliance report'
        },
    ];

    const allSteps = [...steps, ...frameworkSteps, ...finalSteps];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Progress</h3>

            <div className="space-y-4">
                {allSteps.map((step, idx) => {
                    const isComplete = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    const isPending = currentStep < step.id;

                    return (
                        <div key={step.id} className="flex items-center gap-4">
                            {/* Step indicator */}
                            <div className="flex-shrink-0">
                                {isComplete ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-300" />
                                )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${isComplete ? 'text-green-700' :
                                        isCurrent ? 'text-blue-700' :
                                            'text-gray-400'
                                    }`}>
                                    {step.name}
                                </div>
                                <div className={`text-xs ${isComplete ? 'text-green-600' :
                                        isCurrent ? 'text-blue-600' :
                                            'text-gray-400'
                                    }`}>
                                    {step.description}
                                </div>
                            </div>

                            {/* Progress line */}
                            {idx < allSteps.length - 1 && (
                                <div className={`absolute left-11 w-0.5 h-8 mt-6 ${isComplete ? 'bg-green-200' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Overall progress bar */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round((currentStep / allSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / allSteps.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
