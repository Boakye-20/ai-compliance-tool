import { sql } from '@vercel/postgres';

// Persistence is optional. When no Postgres connection is configured the app runs
// exactly as before (in-memory only). It becomes durable the moment the Vercel
// Postgres env vars are present.
export function isDbConfigured(): boolean {
    return Boolean(
        process.env.POSTGRES_URL ||
            process.env.POSTGRES_PRISMA_URL ||
            process.env.DATABASE_URL,
    );
}

export { sql };
