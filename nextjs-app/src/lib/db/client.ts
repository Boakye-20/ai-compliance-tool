import { sql } from '@vercel/postgres';

// Normalise connection-string naming across providers. @vercel/postgres reads
// POSTGRES_URL by default, but Neon's Vercel integration may only expose
// DATABASE_URL / POSTGRES_URL_NON_POOLING. Alias whichever exists so the default
// `sql` client connects without extra config. @vercel/postgres reads the env var
// lazily at query time, so setting it here (module load) is early enough.
if (!process.env.POSTGRES_URL) {
    const fallback =
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL_UNPOOLED;
    if (fallback) process.env.POSTGRES_URL = fallback;
}

// Persistence is optional. When no Postgres connection is configured the app runs
// exactly as before (in-memory only). It becomes durable the moment a connection
// string is present.
export function isDbConfigured(): boolean {
    return Boolean(process.env.POSTGRES_URL);
}

export { sql };
