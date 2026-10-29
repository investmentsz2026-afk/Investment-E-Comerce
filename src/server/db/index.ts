import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getServerEnv } from "@/server/env";
import * as schema from "./schema";

/**
 * Cliente de base de datos (Neon PostgreSQL + Drizzle ORM).
 * - Solo puede importarse desde código de servidor ("server-only").
 * - Se crea de forma perezosa en el primer uso.
 * Aún no se usa en la Fase 1: los modelos se definirán en la Fase 2.
 */
function createDb() {
  const sql = neon(getServerEnv().DATABASE_URL);
  return drizzle({ client: sql, schema });
}

export type Database = ReturnType<typeof createDb>;

let db: Database | undefined;

export function getDb(): Database {
  db ??= createDb();
  return db;
}
