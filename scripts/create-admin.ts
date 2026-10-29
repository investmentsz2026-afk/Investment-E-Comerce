/**
 * Script seguro para aprovisionar la primera cuenta de administrador de INVESTMENTS.
 *
 * Uso mediante variables de entorno (.env.local o entorno de despliegue):
 *   ADMIN_EMAIL="tu-correo@empresa.pe" ADMIN_PASSWORD="<contraseña-segura-unica>" npm run db:create-admin
 *
 * Uso mediante argumentos de línea de comandos:
 *   npx tsx scripts/create-admin.ts <email> <password> [nombre] [apellido]
 *
 * Seguridad:
 * - No existen credenciales predeterminadas.
 * - Rechaza contraseñas débiles, comunes o de ejemplo.
 * - Almacena la contraseña con scrypt + sal aleatoria de 32 bytes.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth/crypto";
import { validateEmail, validatePassword, normalizeEmail } from "../src/server/auth/validators";

config({ path: ".env.local" });

const FORBIDDEN_DEFAULT_PASSWORDS = new Set([
  "admin",
  "admin123",
  "admin123*",
  "adminperu2026*",
  "password",
  "password123",
  "12345678",
  "investments",
  "investments2026",
  "changeme",
  "root1234",
]);

export function isForbiddenDefaultPassword(password: string): boolean {
  const normalized = password.trim().toLowerCase();
  return FORBIDDEN_DEFAULT_PASSWORDS.has(normalized);
}

async function main() {
  const args = process.argv.slice(2);
  const emailRaw = args[0] ?? process.env.ADMIN_EMAIL;
  const password = args[1] ?? process.env.ADMIN_PASSWORD;
  const firstName = args[2] ?? process.env.ADMIN_FIRST_NAME ?? "Administrador";
  const lastName = args[3] ?? process.env.ADMIN_LAST_NAME ?? "INVESTMENTS";

  if (!emailRaw || !password) {
    console.error("❌ Faltan credenciales para aprovisionar el administrador.");
    console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno o pásalos como argumentos:");
    console.error("  npx tsx scripts/create-admin.ts <email> <password> [nombre] [apellido]");
    process.exit(1);
  }

  const emailVal = validateEmail(emailRaw);
  if (!emailVal.valid) {
    console.error(`❌ Error en correo: ${emailVal.error}`);
    process.exit(1);
  }

  const passVal = validatePassword(password);
  if (!passVal.valid) {
    console.error(`❌ Error en contraseña: ${passVal.error}`);
    process.exit(1);
  }

  if (isForbiddenDefaultPassword(password)) {
    console.error(
      "❌ Seguridad: La contraseña proporcionada figura en la lista de credenciales predeterminadas o de ejemplo prohibidas. Usa una contraseña única y secreta.",
    );
    process.exit(1);
  }

  const email = normalizeEmail(emailRaw);
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ Falta DATABASE_URL en .env.local");
    process.exit(1);
  }

  const sql = neon(dbUrl);
  const db = drizzle({ client: sql, schema });

  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  const passwordHash = await hashPassword(password);
  const now = new Date();

  if (existing.length > 0) {
    const user = existing[0];
    await db
      .update(schema.users)
      .set({
        role: "admin",
        passwordHash,
        emailVerifiedAt: now,
        isActive: true,
        updatedAt: now,
      })
      .where(eq(schema.users.id, user.id));

    await db.insert(schema.auditLogs).values({
      actorId: user.id,
      action: "role_change",
      targetType: "user",
      targetId: user.id,
      details: "Usuario promovido a rol 'admin' mediante script seguro de aprovisionamiento",
    });

    console.log(`✅ Usuario existente '${email}' actualizado y promovido al rol 'admin'.`);
  } else {
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        role: "admin",
        emailVerifiedAt: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(schema.auditLogs).values({
      actorId: newUser.id,
      action: "role_change",
      targetType: "user",
      targetId: newUser.id,
      details: "Cuenta de administrador inicial creada mediante script seguro de aprovisionamiento",
    });

    console.log(`✅ Administrador '${email}' creado exitosamente (ID: ${newUser.id}).`);
  }

  process.exit(0);
}

// Ejecutar solo si es invocado directamente por CLI
if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/create-admin.ts")) {
  main().catch((e) => {
    console.error("❌ Error inesperado:", e);
    process.exit(1);
  });
}
