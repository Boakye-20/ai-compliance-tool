import { sql } from './client';

// Relational schema for the continuous-compliance engine. Each statement runs
// idempotently (IF NOT EXISTS) so ensureSchema() is safe to call repeatedly.
export const SCHEMA_STATEMENTS: string[] = [
    `CREATE TABLE IF NOT EXISTS organizations (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS regulatory_frameworks (
        code        TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        weight      NUMERIC NOT NULL DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
        id                   UUID PRIMARY KEY,
        org_id               UUID REFERENCES organizations(id) ON DELETE SET NULL,
        source               TEXT NOT NULL DEFAULT 'web',
        uk_alignment_score   INTEGER NOT NULL DEFAULT 0,
        total_critical_gaps  INTEGER NOT NULL DEFAULT 0,
        frameworks           TEXT[] NOT NULL DEFAULT '{}',
        document_type        TEXT,
        synthesis            JSONB,
        extracted_data       JSONB,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs (org_id, created_at DESC)`,

    `CREATE TABLE IF NOT EXISTS ai_inventory (
        id          BIGSERIAL PRIMARY KEY,
        audit_id    UUID REFERENCES audit_logs(id) ON DELETE CASCADE,
        component   TEXT NOT NULL,
        type        TEXT NOT NULL,
        detail      TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_ai_inventory_audit ON ai_inventory (audit_id)`,

    `CREATE TABLE IF NOT EXISTS api_keys (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        key_hash    TEXT NOT NULL UNIQUE,
        key_prefix  TEXT NOT NULL,
        revoked     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_used_at TIMESTAMPTZ
    )`,
    `CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash) WHERE revoked = false`,
];

const FRAMEWORK_SEED: Array<[string, string, number]> = [
    ['ICO', 'UK ICO', 0.4],
    ['DPA', 'UK DPA / GDPR', 0.3],
    ['ISO_42001', 'ISO/IEC 42001', 0.2],
    ['EU_AI_ACT', 'EU AI Act', 0.1],
];

export async function ensureSchema(): Promise<void> {
    for (const stmt of SCHEMA_STATEMENTS) {
        await sql.query(stmt);
    }
    for (const [code, name, weight] of FRAMEWORK_SEED) {
        await sql.query(
            `INSERT INTO regulatory_frameworks (code, name, weight) VALUES ($1, $2, $3)
             ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, weight = EXCLUDED.weight`,
            [code, name, weight],
        );
    }
}
