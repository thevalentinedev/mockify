import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL
  );
}

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
}

export function isDbEnabled(): boolean {
  return Boolean(getDatabaseUrl());
}
