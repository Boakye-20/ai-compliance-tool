// Curated remediation kits. These are the deterministic, offline-safe fallback
// artefacts served when the LLM route is unavailable or as a baseline the LLM
// output augments. Each kit maps a common compliance gap to plug-and-play code.

export interface RemediationFile {
    filename: string;
    language: string; // for syntax highlighting hints
    content: string;
}

export interface RemediationKit {
    id: string;
    title: string;
    clause: string; // regulatory anchor, e.g. "EU AI Act · Article 12"
    description: string;
    files: RemediationFile[];
}

// Keyword patterns used to match a flagged gap to a kit (case-insensitive).
const KIT_MATCHERS: Array<{ patterns: RegExp[]; kitId: string }> = [
    { kitId: 'eu-art12-logging', patterns: [/logging/i, /record[- ]?keeping/i, /article\s*12/i, /audit\s*trail/i, /traceab/i] },
    { kitId: 'human-oversight', patterns: [/human\s*oversight/i, /article\s*22/i, /automated\s*decision/i, /contestab/i, /redress/i, /appeal/i] },
    { kitId: 'dpia', patterns: [/dpia/i, /article\s*35/i, /impact\s*assessment/i, /data\s*minimi/i] },
];

export const REMEDIATION_KITS: Record<string, RemediationKit> = {
    'eu-art12-logging': {
        id: 'eu-art12-logging',
        title: 'Article 12 Logging & Traceability Kit',
        clause: 'EU AI Act · Article 12 (Record-keeping)',
        description:
            'High-risk AI systems must automatically record events (logs) over their lifetime. Drop-in Postgres schema plus a JSON event template for engineers to emit from the model-serving layer.',
        files: [
            {
                filename: 'ai_event_log.sql',
                language: 'sql',
                content: `-- EU AI Act Article 12 — automatic event logging schema (Postgres)
CREATE TABLE ai_event_log (
    id              BIGSERIAL PRIMARY KEY,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    system_id       TEXT        NOT NULL,          -- which AI system / model version
    model_version   TEXT        NOT NULL,
    event_type      TEXT        NOT NULL,          -- inference | override | flag | error
    input_ref       TEXT,                          -- hashed/anonymised reference to input
    output_summary  JSONB,                         -- decision, score, confidence
    human_reviewer  TEXT,                          -- set when a human overrides/confirms
    reference_period TSTZRANGE,                    -- Art. 12(2) reference situation window
    data_subject_ref TEXT,                         -- pseudonymised subject id (never raw PII)
    metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Retention & tamper-evidence
CREATE INDEX idx_ai_event_log_system_time ON ai_event_log (system_id, occurred_at);
CREATE INDEX idx_ai_event_log_event_type  ON ai_event_log (event_type);

-- Art. 12 requires logs be kept appropriate to intended purpose (min. 6 months
-- under Art. 19 unless national law requires longer). Enforce append-only:
REVOKE UPDATE, DELETE ON ai_event_log FROM PUBLIC;
`,
            },
            {
                filename: 'ai_event.template.json',
                language: 'json',
                content: `{
  "occurred_at": "2026-07-25T09:31:00Z",
  "system_id": "credit-scoring-v3",
  "model_version": "3.2.1",
  "event_type": "inference",
  "input_ref": "sha256:<hash-of-input>",
  "output_summary": { "decision": "REFER", "score": 0.42, "confidence": 0.88 },
  "human_reviewer": null,
  "reference_period": ["2026-07-25T00:00:00Z", "2026-07-25T23:59:59Z"],
  "data_subject_ref": "subj_9f2a...",
  "metadata": { "channel": "api", "region": "uk-south" }
}`,
            },
        ],
    },
    'human-oversight': {
        id: 'human-oversight',
        title: 'Human Oversight & Review Kit',
        clause: 'EU AI Act Art. 14 / UK GDPR Art. 22',
        description:
            'Establish human-in-the-loop review and an appeal/redress path for automated decisions. Includes a review-queue schema and a decision-override event contract.',
        files: [
            {
                filename: 'human_review.sql',
                language: 'sql',
                content: `-- Human oversight of automated decisions (UK GDPR Art. 22 / EU AI Act Art. 14)
CREATE TABLE decision_review (
    id             BIGSERIAL PRIMARY KEY,
    decision_id    TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    status         TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | UPHELD | OVERTURNED
    requested_by   TEXT,                             -- data subject or auto-flag
    reviewer       TEXT,
    reviewed_at    TIMESTAMPTZ,
    rationale      TEXT,                             -- human's documented reasoning
    original_output JSONB NOT NULL,
    final_output    JSONB
);
CREATE INDEX idx_decision_review_status ON decision_review (status);
`,
            },
            {
                filename: 'override_event.template.json',
                language: 'json',
                content: `{
  "decision_id": "dec_20260725_0042",
  "action": "OVERTURNED",
  "reviewer": "caseworker_17",
  "rationale": "Applicant provided additional documentation not available to the model.",
  "original_output": { "decision": "DECLINE" },
  "final_output": { "decision": "APPROVE" },
  "reviewed_at": "2026-07-25T11:05:00Z"
}`,
            },
        ],
    },
    'dpia': {
        id: 'dpia',
        title: 'DPIA Record Kit',
        clause: 'UK GDPR · Article 35 (DPIA)',
        description:
            'A structured DPIA record template so the assessment is documented, versioned and auditable, plus a minimal storage schema.',
        files: [
            {
                filename: 'dpia_record.template.json',
                language: 'json',
                content: `{
  "system_id": "<system>",
  "assessed_on": "2026-07-25",
  "processing_purpose": "",
  "necessity_and_proportionality": "",
  "data_categories": [],
  "special_category_data": false,
  "risks": [
    { "risk": "", "likelihood": "LOW|MED|HIGH", "severity": "LOW|MED|HIGH", "mitigation": "" }
  ],
  "residual_risk": "",
  "dpo_sign_off": { "name": "", "date": "" }
}`,
            },
        ],
    },
};

// Best-effort match of a free-text gap to a curated kit id.
export function matchKit(gapText: string): RemediationKit | null {
    for (const matcher of KIT_MATCHERS) {
        if (matcher.patterns.some((p) => p.test(gapText))) {
            return REMEDIATION_KITS[matcher.kitId] || null;
        }
    }
    return null;
}
