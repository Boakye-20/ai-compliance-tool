import { randomBytes, createHash } from 'crypto';
import { sql } from './client';

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

const DEFAULT_ORG_NAME = 'Default Organization';

export async function getOrCreateDefaultOrg(): Promise<string> {
    const existing = await sql.query<{ id: string }>(
        `SELECT id FROM organizations WHERE name = $1 LIMIT 1`,
        [DEFAULT_ORG_NAME],
    );
    if (existing.rows[0]) return existing.rows[0].id;

    const created = await sql.query<{ id: string }>(
        `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
        [DEFAULT_ORG_NAME],
    );
    return created.rows[0].id;
}

// ---------------------------------------------------------------------------
// Audit logs + AI inventory
// ---------------------------------------------------------------------------

export interface AuditRecord {
    id: string;
    orgId: string | null;
    source: string; // 'web' | 'ingest' | 'ci'
    score: number;
    criticalGaps: number;
    frameworks: string[];
    documentType: string | null;
    synthesis: unknown;
    extractedData: any;
}

function inventoryRows(extractedData: any): Array<[string, string, string]> {
    if (!extractedData) return [];
    const rows: Array<[string, string, string]> = [];
    (extractedData.foundation_models || []).forEach((m: string) => rows.push([m, 'Foundation Model', 'Detected model/vendor']));
    (extractedData.datasets || []).forEach((d: string) => rows.push([d, 'Dataset', 'Training / reference data']));
    (extractedData.pii_categories || []).forEach((p: string) => rows.push([p, 'PII / Personal Data', 'Personal / special-category data']));
    if (extractedData.region_residency && extractedData.region_residency !== 'Not specified') {
        rows.push([extractedData.region_residency, 'Data Residency', 'Where data is stored / processed']);
    }
    return rows;
}

export async function persistAudit(rec: AuditRecord): Promise<void> {
    await sql.query(
        `INSERT INTO audit_logs
            (id, org_id, source, uk_alignment_score, total_critical_gaps, frameworks, document_type, synthesis, extracted_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
            rec.id,
            rec.orgId,
            rec.source,
            rec.score,
            rec.criticalGaps,
            rec.frameworks,
            rec.documentType,
            JSON.stringify(rec.synthesis ?? null),
            JSON.stringify(rec.extractedData ?? null),
        ],
    );

    for (const [component, type, detail] of inventoryRows(rec.extractedData)) {
        await sql.query(
            `INSERT INTO ai_inventory (audit_id, component, type, detail) VALUES ($1, $2, $3, $4)`,
            [rec.id, component, type, detail],
        );
    }
}

export interface AuditSummary {
    id: string;
    source: string;
    score: number;
    criticalGaps: number;
    frameworks: string[];
    documentType: string | null;
    createdAt: string;
}

export async function listAudits(orgId: string | null, limit = 20): Promise<AuditSummary[]> {
    const result = await sql.query(
        `SELECT id, source, uk_alignment_score, total_critical_gaps, frameworks, document_type, created_at
         FROM audit_logs
         WHERE ($1::uuid IS NULL OR org_id = $1)
         ORDER BY created_at DESC
         LIMIT $2`,
        [orgId, limit],
    );
    return result.rows.map((r: any) => ({
        id: r.id,
        source: r.source,
        score: r.uk_alignment_score,
        criticalGaps: r.total_critical_gaps,
        frameworks: r.frameworks || [],
        documentType: r.document_type,
        createdAt: r.created_at,
    }));
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'cmp_';

function hashKey(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
}

export interface GeneratedKey {
    id: string;
    key: string; // full raw key — returned once, never stored
    prefix: string;
}

export async function generateApiKey(orgId: string, name: string): Promise<GeneratedKey> {
    const raw = KEY_PREFIX + randomBytes(24).toString('hex');
    const prefix = raw.slice(0, 12);
    const result = await sql.query<{ id: string }>(
        `INSERT INTO api_keys (org_id, name, key_hash, key_prefix) VALUES ($1, $2, $3, $4) RETURNING id`,
        [orgId, name, hashKey(raw), prefix],
    );
    return { id: result.rows[0].id, key: raw, prefix };
}

export interface ApiKeyInfo {
    id: string;
    name: string;
    prefix: string;
    created_at: string;
}

export async function listApiKeys(orgId: string): Promise<ApiKeyInfo[]> {
    const result = await sql.query(
        `SELECT id, name, key_prefix, created_at FROM api_keys
         WHERE org_id = $1 AND revoked = false ORDER BY created_at DESC`,
        [orgId],
    );
    return result.rows.map((r: any) => ({ id: r.id, name: r.name, prefix: r.key_prefix, created_at: r.created_at }));
}

export async function revokeApiKey(id: string): Promise<void> {
    await sql.query(`UPDATE api_keys SET revoked = true WHERE id = $1`, [id]);
}

// Returns the owning org id if the key is valid and active, else null.
export async function validateApiKey(rawKey: string): Promise<string | null> {
    if (!rawKey) return null;
    const result = await sql.query<{ org_id: string }>(
        `SELECT org_id FROM api_keys WHERE key_hash = $1 AND revoked = false LIMIT 1`,
        [hashKey(rawKey)],
    );
    if (!result.rows[0]) return null;
    await sql.query(`UPDATE api_keys SET last_used_at = now() WHERE key_hash = $1`, [hashKey(rawKey)]);
    return result.rows[0].org_id;
}
