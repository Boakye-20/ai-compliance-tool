import {
    ICOResult,
    DPAResult,
    EUActResult,
    ISOResult,
    Synthesis,
    CrossFrameworkGap,
    FrameworkCode,
} from '../backend/types';

// UK Alignment Score weights
const WEIGHTS: Record<string, number> = {
    'UK ICO': 0.4,
    'UK DPA / GDPR': 0.3,
    'ISO/IEC 42001': 0.2,
    'EU AI Act': 0.1,
};

interface CrossFrameworkPattern {
    issue: string;
    checks: Array<{
        framework: 'ico' | 'dpa' | 'eu_act' | 'iso';
        key: string;
    }>;
    recommendation: string;
}

const CROSS_FRAMEWORK_PATTERNS: CrossFrameworkPattern[] = [
    {
        issue: 'Bias and Fairness Gap',
        checks: [
            { framework: 'ico', key: 'principle_2_fairness' },
            { framework: 'eu_act', key: 'data_governance' },
        ],
        recommendation: 'Implement comprehensive bias testing across training data and model outputs.',
    },
    {
        issue: 'Human Oversight Gap',
        checks: [
            { framework: 'ico', key: 'principle_4_contestability' },
            { framework: 'eu_act', key: 'human_oversight' },
            { framework: 'dpa', key: 'article_22_adm' },
        ],
        recommendation: 'Establish clear human review processes and appeal mechanisms for AI decisions.',
    },
    {
        issue: 'Transparency Gap',
        checks: [
            { framework: 'ico', key: 'principle_2_fairness' },
            { framework: 'dpa', key: 'article_13_transparency' },
            { framework: 'eu_act', key: 'transparency' },
        ],
        recommendation: 'Develop explainability documentation and user-facing AI disclosure notices.',
    },
    {
        issue: 'Risk Management Gap',
        checks: [
            { framework: 'ico', key: 'principle_1_safety' },
            { framework: 'iso', key: 'risk_management' },
            { framework: 'eu_act', key: 'risk_management_system' },
        ],
        recommendation: 'Implement formal AI risk assessment and treatment processes.',
    },
    {
        issue: 'Data Protection Impact Assessment Gap',
        checks: [
            { framework: 'dpa', key: 'article_35_dpia' },
            { framework: 'ico', key: 'principle_5_data_minimization' },
        ],
        recommendation: 'Complete or update DPIA covering all AI processing activities.',
    },
];

export function synthesizeGaps(
    icoResult: ICOResult | null,
    euActResult: EUActResult | null,
    dpaResult: DPAResult | null,
    isoResult: ISOResult | null,
    selectedFrameworks: FrameworkCode[],
): Synthesis {
    const results: Record<string, { framework: string; result: Record<string, unknown> } | null> = {
        ico: icoResult ? { framework: 'UK ICO', result: icoResult } : null,
        dpa: dpaResult ? { framework: 'UK DPA / GDPR', result: dpaResult } : null,
        eu_act: euActResult ? { framework: 'EU AI Act', result: euActResult } : null,
        iso: isoResult ? { framework: 'ISO/IEC 42001', result: isoResult } : null,
    };

    // Framework scores
    const frameworkScores: Record<string, number> = {};
    const analyzedFrameworks: string[] = [];

    for (const data of Object.values(results)) {
        if (data && data.result) {
            const score = (data.result as { score?: number }).score || 0;
            frameworkScores[data.framework] = score;
            analyzedFrameworks.push(data.framework);
        }
    }

    // UK Alignment Score
    let ukAlignmentScore = 0;
    let totalWeight = 0;
    for (const [framework, score] of Object.entries(frameworkScores)) {
        const weight = WEIGHTS[framework] || 0;
        ukAlignmentScore += score * weight;
        totalWeight += weight;
    }
    if (totalWeight > 0) {
        ukAlignmentScore = Math.round(ukAlignmentScore / totalWeight);
    }

    // Cross-framework gaps
    const crossFrameworkGaps: CrossFrameworkGap[] = [];
    for (const pattern of CROSS_FRAMEWORK_PATTERNS) {
        const failingFrameworks: string[] = [];
        for (const check of pattern.checks) {
            const data = results[check.framework];
            if (data && data.result) {
                const checkResult = (data.result as any)[check.key] as { status?: string } | undefined;
                if (checkResult && ['NOT_MET', 'EVIDENCE_MISSING'].includes(checkResult.status || '')) {
                    failingFrameworks.push(data.framework);
                }
            }
        }
        if (failingFrameworks.length >= 2) {
            crossFrameworkGaps.push({
                issue: pattern.issue,
                impacts: failingFrameworks,
                recommendation: pattern.recommendation,
            });
        }
    }

    // Total critical gaps
    const totalCriticalGaps =
        (icoResult?.critical_gaps_count || 0) +
        (dpaResult?.critical_gaps_count || 0) +
        (euActResult?.critical_gaps_count || 0) +
        (isoResult?.critical_gaps_count || 0);

    // Priority actions (dedup)
    const allActions = new Set<string>();
    for (const data of Object.values(results)) {
        if (data && data.result) {
            const actions = (data.result as { priority_actions?: string[] }).priority_actions || [];
            actions.forEach((a) => allActions.add(a));
        }
    }

    let summary: string;
    if (ukAlignmentScore >= 70) {
        summary = `Good compliance posture with UK AI governance frameworks (UK Alignment Score: ${ukAlignmentScore}%). ${totalCriticalGaps > 0 ? `${totalCriticalGaps} gaps require attention.` : 'No critical gaps identified.'
            }`;
    } else if (ukAlignmentScore >= 50) {
        summary = `Partial compliance with UK AI governance frameworks (UK Alignment Score: ${ukAlignmentScore}%). ${totalCriticalGaps} critical gaps require remediation.`;
    } else {
        summary = `Critical compliance gaps with UK AI governance frameworks (UK Alignment Score: ${ukAlignmentScore}%). ${totalCriticalGaps} critical gaps require immediate attention.`;
    }

    return {
        uk_alignment_score: ukAlignmentScore,
        framework_scores: frameworkScores,
        frameworks_analyzed: analyzedFrameworks,
        total_critical_gaps: totalCriticalGaps,
        cross_framework_gaps: crossFrameworkGaps,
        priority_actions: Array.from(allActions).slice(0, 10),
        summary,
    };
}
