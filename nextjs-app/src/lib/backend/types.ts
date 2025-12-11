export type FrameworkCode = 'ICO' | 'DPA' | 'EU_AI_ACT' | 'ISO_42001';

export type DocumentType = 'GUIDANCE' | 'SYSTEM_SPEC' | 'STRATEGY' | 'ASSESSMENT' | 'UNKNOWN';

export type ComplianceStatus = 'MET' | 'PARTIALLY_MET' | 'NOT_MET' | 'EVIDENCE_MISSING' | 'N/A';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PrincipleResult {
    status: ComplianceStatus;
    evidence_found: string[];
    sections_relevant: string[];
    gap: string;
    priority: PriorityLevel;
}

export interface ExtractedData {
    document_type: DocumentType;
    use_case: string;
    system_type: string;
    data_types: string[];
    has_personal_data: boolean;
    has_biometric_data: boolean;
    has_human_oversight: boolean;
    deployment_context: string;
    risk_indicators: string[];
    compliance_topics_covered: string[];
    keywords: string[];
    full_text: string;
}

export interface FrameworkResult {
    framework: string;
    score: number;
    critical_gaps_count: number;
    critical_gaps: string[];
    priority_actions: string[];
    strengths: string[];
    compliance_summary: string;
    document_type_detected?: DocumentType;
    [key: string]: unknown;
}

export interface ICOResult extends FrameworkResult {
    principle_1_safety?: PrincipleResult;
    principle_2_fairness?: PrincipleResult;
    principle_3_accountability?: PrincipleResult;
    principle_4_contestability?: PrincipleResult;
    principle_5_data_minimization?: PrincipleResult;
}

export interface DPAResult extends FrameworkResult {
    article_22_adm?: PrincipleResult;
    article_5_fairness?: PrincipleResult;
    article_13_transparency?: PrincipleResult;
    article_35_dpia?: PrincipleResult;
}

export interface EUActResult extends FrameworkResult {
    risk_tier: 'PROHIBITED' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK' | 'N/A_GUIDANCE' | 'UNKNOWN';
    risk_justification: string;
    eu_act_coverage?: {
        risk_classification_discussed: boolean;
        high_risk_obligations_discussed: boolean;
        transparency_requirements_discussed: boolean;
        prohibited_practices_discussed: boolean;
    };
    obligations_if_high_risk?: Record<string, PrincipleResult>;
}

export interface ISOResult extends FrameworkResult {
    governance?: PrincipleResult;
    risk_management?: PrincipleResult;
    data_lifecycle?: PrincipleResult;
    monitoring?: PrincipleResult;
}

export interface CrossFrameworkGap {
    issue: string;
    impacts: string[];
    recommendation: string;
}

export interface Synthesis {
    uk_alignment_score: number;
    framework_scores: Record<string, number>;
    frameworks_analyzed: string[];
    total_critical_gaps: number;
    cross_framework_gaps: CrossFrameworkGap[];
    priority_actions: string[];
    summary: string;
}

export interface ComplianceState {
    pdf_path: string;
    extracted_data: ExtractedData | null;
    selected_frameworks: FrameworkCode[];
    ico_result: ICOResult | null;
    eu_act_result: EUActResult | null;
    dpa_result: DPAResult | null;
    iso_result: ISOResult | null;
    synthesis: Synthesis | null;
    report_bytes: Uint8Array | null;
    status_messages: string[];
}

export interface AnalysisJob {
    id: string;
    state: ComplianceState;
    report_bytes: Uint8Array | null;
    created_at: string;
}
