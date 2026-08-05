"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Bot, GitFork, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

interface AnalysisStepperProps {
  isAnalyzing: boolean;
  selectedFrameworks: string[];
}

export function AnalysisStepper({ isAnalyzing, selectedFrameworks }: AnalysisStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 3) return 3;
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const steps = [
    {
      id: 0,
      icon: Bot,
      title: 'Supervisor & Extractor Agent',
      desc: 'Extracting AI metadata'
    },
    {
      id: 1,
      icon: GitFork,
      title: 'Parallel Framework Assessors',
      desc: `Evaluating ${selectedFrameworks.length > 0 ? selectedFrameworks.join(', ') : 'selected frameworks'}`
    },
    {
      id: 2,
      icon: ShieldAlert,
      title: 'Cross-Framework Synthesizer',
      desc: 'Identifying root-cause gaps'
    },
    {
      id: 3,
      icon: FileText,
      title: 'Report Generator',
      desc: 'Computing weighted scores'
    }
  ];

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden mb-8">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <h2 className="text-white font-medium">Multi-Agent Pipeline Executing...</h2>
        </div>
        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          Agent State: Active
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                  ${isCompleted ? 'bg-slate-800 border-2 border-emerald-500/50 text-emerald-400' : ''}
                  ${isCurrent ? 'bg-blue-900/50 border-2 border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.4)]' : ''}
                  ${isFuture ? 'bg-slate-800 border-2 border-slate-700 text-slate-500' : ''}
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : isCurrent ? (
                    <div className="relative">
                      <Icon className="w-6 h-6 relative z-10" />
                      <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-20" />
                    </div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className={`text-sm font-semibold mb-1 transition-colors ${
                    isCurrent ? 'text-blue-100' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs transition-colors ${
                    isCurrent ? 'text-blue-300/80' : isCompleted ? 'text-slate-500' : 'text-slate-600'
                  }`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
