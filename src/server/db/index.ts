import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getServerEnv } from "@/server/env";
import * as schema from "./schema";

function isNeonUrl(url: string): boolean {
  return url.includes("neon.tech");
}

function resolveSslOption(url: string): boolean | { rejectUnauthorized: boolean } | undefined {
  if (
    url.includes("railway.internal") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("sslmode=disable")
  ) {
    return false;
  }
  if (url.includes("sslmode=require") || url.includes("rlwy.net")) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

/**
 * Cliente de base de datos compatible con Neon Serverless (HTTP) y PostgreSQL estándar (Railway, local, etc.).
 * - Solo puede importarse desde código de servidor ("server-only").
 * - Se crea de forma perezosa en el primer uso.
 */
function createDb() {
  const url = getServerEnv().DATABASE_URL;
  if (isNeonUrl(url)) {
    const sql = neon(url);
    return drizzleNeon({ client: sql, schema });
  }

  const pool = new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: resolveSslOption(url),
  });
  return drizzlePg({ client: pool, schema }) as unknown as ReturnType<
    typeof drizzleNeon<typeof schema>
  >;
}

export type Database = ReturnType<typeof drizzleNeon<typeof schema>>;

let db: Database | undefined;

export function getDb(): Database {
  db ??= createDb();
  return db;
}
