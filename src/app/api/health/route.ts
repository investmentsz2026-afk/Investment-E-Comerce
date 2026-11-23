import { connection, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export async function GET() {
  await connection();
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json(
      { ok: true, status: "healthy", database: "connected" },
      { status: 200 },
    );
  } catch (err) {
    console.error("[health] Error verificando base de datos:", err);
    return NextResponse.json(
      { ok: false, status: "unhealthy", database: "disconnected" },
      { status: 503 },
    );
  }
}
