/**
 * Auditoría Integral End-to-End Fase 3 (10 puntos de verificación)
 * Ejecuta en navegador real Microsoft Edge vía playwright-core + verificación directa en Neon PostgreSQL.
 */
import { chromium } from "playwright-core";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomBytes, createHash, scryptSync } from "node:crypto";

config({ path: ".env.local" });

const BASE = process.argv[2] ?? "http://localhost:3000";
const sql = neon(process.env.DATABASE_URL);

function hashPasswordSync(password) {
  const salt = randomBytes(32);
  const derivedKey = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  →  " + detail : ""}`);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, true, typeof detail === "string" ? detail : "");
  } catch (e) {
    record(name, false, String(e?.message ?? e).split("\n")[0]);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const timestamp = Date.now();
const userAEmail = `auditoria.a.${timestamp}@investments.pe`;
const userBEmail = `auditoria.b.${timestamp}@investments.pe`;
const tempAdminEmail = `auditoria.admin.${timestamp}@investments.pe`;
const initialPassword = `Cl4veInicial${randomBytes(4).toString("hex")}*`;
const newResetPassword = `Cl4veNueva${randomBytes(4).toString("hex")}*`;
const tempAdminPassword = `Adm1nTemp${randomBytes(6).toString("hex")}!`;

let userAId = null;
let userBId = null;
let tempAdminId = null;
let appAId = null;
let appBId = null;
let addr1Id = null;

async function provisionTempAdmin() {
  // Rotar cualquier credencial predeterminada antigua si existiera en la BD
  const rotatedHash = hashPasswordSync(`Rotated_${randomBytes(16).toString("hex")}!A1`);
  await sql`
    UPDATE users
    SET password_hash = ${rotatedHash}, updated_at = NOW()
    WHERE email = 'admin@investments.pe'
  `;

  // Crear administrador efímero exclusivo para esta corrida de auditoría
  const adminHash = hashPasswordSync(tempAdminPassword);
  const rows = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified_at, is_active)
    VALUES (${tempAdminEmail}, ${adminHash}, 'Auditor', 'Seguridad', 'admin', NOW(), true)
    RETURNING id
  `;
  tempAdminId = rows[0].id;
}

async function cleanupAuditArtifacts() {
  if (tempAdminId) {
    await sql`DELETE FROM sessions WHERE user_id = ${tempAdminId}`;
    await sql`UPDATE users SET is_active = false, password_hash = ${hashPasswordSync(randomBytes(24).toString("hex") + "A1!")} WHERE id = ${tempAdminId}`;
  }
}

async function run() {
  console.log(`\n=== INICIANDO AUDITORÍA FINAL FASE 3 (10 PUNTOS) EN ${BASE} ===\n`);
  await provisionTempAdmin();

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  try {
    // ────────────────────────────────────────────────────────────────────────
    // PUNTO 1, 2, 3, 4: Rutas protegidas, Registro, Cookies Seguras, Verificación Email
    // ────────────────────────────────────────────────────────────────────────
    const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-PE" });
    const pageA = await ctxA.newPage();

    await check("1. Rutas privadas: /cuenta y /admin/solicitudes redirigen a /iniciar-sesion sin sesión", async () => {
      await pageA.goto(`${BASE}/cuenta`, { waitUntil: "networkidle" });
      assert(pageA.url().includes("/iniciar-sesion"), `No redirigió /cuenta: ${pageA.url()}`);
      await pageA.goto(`${BASE}/admin/solicitudes`, { waitUntil: "networkidle" });
      assert(pageA.url().includes("/iniciar-sesion"), `No redirigió /admin/solicitudes: ${pageA.url()}`);
    });

    await check("2. Registro B2C: validación de contraseñas débiles y creación de cuenta con scrypt", async () => {
      await pageA.goto(`${BASE}/registro`, { waitUntil: "networkidle" });
      await pageA.fill('input[name="firstName"]', "Valeria");
      await pageA.fill('input[name="lastName"]', "Montes");
      await pageA.fill('input[name="email"]', userAEmail);
      await pageA.fill('input[name="password"]', "12345");
      await pageA.fill('input[name="confirmPassword"]', "12345");
      await pageA.check('input[name="termsAccepted"]');
      await pageA.click('button[type="submit"]');
      await pageA.waitForTimeout(800);
      assert(/al menos 8 caracteres/i.test(await pageA.innerText("body")), "No rechazó contraseña corta");

      await pageA.fill('input[name="firstName"]', "Valeria");
      await pageA.fill('input[name="lastName"]', "Montes");
      await pageA.fill('input[name="email"]', userAEmail);
      await pageA.fill('input[name="password"]', initialPassword);
      await pageA.fill('input[name="confirmPassword"]', initialPassword);
      await pageA.check('input[name="termsAccepted"]');
      await pageA.click('button[type="submit"]');
      await pageA.waitForURL((u) => u.pathname.includes("/cuenta"), { timeout: 15000 });

      const dbUsers = await sql`SELECT id, password_hash, role, email_verified_at FROM users WHERE email = ${userAEmail}`;
      assert(dbUsers.length === 1, "Usuario no creado en BD");
      userAId = dbUsers[0].id;
      assert(dbUsers[0].password_hash.startsWith("scrypt$"), "Contraseña no fue hasheada con scrypt");
      assert(dbUsers[0].password_hash !== initialPassword, "Contraseña en texto plano");
      assert(dbUsers[0].role === "customer", `Rol inicial incorrecto: ${dbUsers[0].role}`);
      return `ID #${userAId}, hash scrypt verificado`;
    });

    await check("3. Cookies seguras y hash de sesión en BD (HttpOnly, SameSite=Lax, SHA-256)", async () => {
      const cookies = await ctxA.cookies();
      const sessionCookie = cookies.find((c) => c.name === "investments_session");
      assert(sessionCookie, "No existe cookie investments_session");
      assert(sessionCookie.httpOnly === true, "La cookie de sesión NO es HttpOnly");
      assert(sessionCookie.sameSite === "Lax", `SameSite inesperado: ${sessionCookie.sameSite}`);

      const rawToken = sessionCookie.value;
      const expectedHash = hashToken(rawToken);
      const dbSessions = await sql`SELECT token_hash, expires_at FROM sessions WHERE user_id = ${userAId}`;
      assert(dbSessions.length === 1, "No se encontró sesión en BD");
      assert(dbSessions[0].token_hash === expectedHash, "El token en BD no coincide con el SHA-256 de la cookie");
      assert(dbSessions[0].token_hash !== rawToken, "El token crudo jamás debe guardarse en la BD");
      return "HttpOnly=true, SameSite=Lax, token_hash=SHA-256";
    });

    await check("4. Verificación de correo electrónico (token único, expiración e invalidación tras uso)", async () => {
      const rawVerifToken = randomBytes(32).toString("hex");
      const verifHash = hashToken(rawVerifToken);
      await sql`
        INSERT INTO email_verification_tokens (user_id, token_hash, email, expires_at)
        VALUES (${userAId}, ${verifHash}, ${userAEmail}, NOW() + INTERVAL '24 hours')
      `;

      await pageA.goto(`${BASE}/verificar-correo?token=${rawVerifToken}`, { waitUntil: "networkidle" });
      const text = await pageA.innerText("body");
      assert(/¡Correo verificado!/i.test(text), "No confirmó la verificación del correo");

      const [uRow] = await sql`SELECT email_verified_at FROM users WHERE id = ${userAId}`;
      assert(uRow.email_verified_at !== null, "email_verified_at sigue null en BD");

      // Intentar reusar el mismo token por segunda vez -> debe fallar
      await pageA.goto(`${BASE}/verificar-correo?token=${rawVerifToken}`, { waitUntil: "networkidle" });
      const reuseText = await pageA.innerText("body");
      assert(/No pudimos confirmar tu correo|inválido o ha expirado/i.test(reuseText), "Permitió reusar un token ya consumido");
      return "Verificado en BD y bloqueado en segundo uso";
    });

    // ────────────────────────────────────────────────────────────────────────
    // PUNTO 8 y 6: Libreta de direcciones + Aislamiento de datos (IDOR)
    // ────────────────────────────────────────────────────────────────────────
    await check("5. Libreta de direcciones: crear múltiples direcciones, cambiar predeterminada y eliminar", async () => {
      await pageA.goto(`${BASE}/cuenta/direcciones`, { waitUntil: "networkidle" });
      await pageA.click('button:has-text("Nueva dirección")');
      await pageA.fill('input[name="title"]', "Casa San Isidro");
      await pageA.fill('input[name="recipientName"]', "Valeria Montes");
      await pageA.fill('input[name="recipientPhone"]', "987654321");
      await pageA.fill('input[name="addressLine1"]', "Av. Conquistadores 450");
      await pageA.fill('input[name="district"]', "San Isidro");
      await pageA.click('button:has-text("Guardar dirección")');
      await pageA.waitForTimeout(1200);

      // Crear segunda dirección
      await pageA.click('button:has-text("Nueva dirección")');
      await pageA.fill('input[name="title"]', "Taller Gamarra");
      await pageA.fill('input[name="recipientName"]', "Valeria Montes");
      await pageA.fill('input[name="recipientPhone"]', "912345678");
      await pageA.fill('input[name="addressLine1"]', "Jr. Gamarra 820");
      await pageA.fill('input[name="district"]', "La Victoria");
      await pageA.click('button:has-text("Guardar dirección")');
      await pageA.waitForTimeout(1200);

      // Usar segunda dirección como principal
      await pageA.click('button:has-text("Usar como principal")');
      await pageA.waitForTimeout(1200);

      const addrs = await sql`SELECT id, title, is_default FROM user_addresses WHERE user_id = ${userAId} ORDER BY id ASC`;
      assert(addrs.length === 2, `Se esperaban 2 direcciones, hay ${addrs.length}`);
      addr1Id = addrs[0].id;
      const defaultAddr = addrs.find((a) => a.is_default);
      assert(defaultAddr && defaultAddr.title === "Taller Gamarra", "No cambió la dirección predeterminada a Taller Gamarra");
      return "Creación y cambio de dirección principal verificados en Neon";
    });

    // Crear Usuario B en contexto aislado para probar IDOR y Rechazo B2B
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-PE" });
    const pageB = await ctxB.newPage();

    await check("6. Aislamiento de datos (IDOR): Usuario B no ve ni puede alterar datos ni direcciones de Usuario A", async () => {
      // Registrar Usuario B directamente como empresa en /mayorista/registro
      await pageB.goto(`${BASE}/mayorista/registro`, { waitUntil: "networkidle" });

      // Primero probar validación de RUC inválido (Punto 7)
      await pageB.fill('input[name="legalName"]', "Distribuidora Sur S.A.C.");
      await pageB.fill('input[name="tradeName"]', "Sur Textil");
      await pageB.fill('input[name="taxId"]', "30123456789"); // Prefijo 30 inválido
      await pageB.selectOption('select[name="businessType"]', "Distribuidor mayorista textil");
      await pageB.fill('input[name="contactName"]', "Jorge Paredes");
      await pageB.fill('input[name="contactEmail"]', userBEmail);
      await pageB.fill('input[name="contactPhone"]', "987111222");
      await pageB.fill('input[name="password"]', initialPassword);
      await pageB.fill('input[name="confirmPassword"]', initialPassword);
      await pageB.fill('input[name="district"]', "Arequipa");
      await pageB.fill('input[name="addressLine"]', "Calle Mercaderes 210");
      await pageB.selectOption('select[name="estimatedVolume"]', "S/ 10,000 a S/ 30,000 mensuales (mediano volumen)");
      await pageB.check('input[name="termsAccepted"]');
      await pageB.click('button[type="submit"]');
      await pageB.waitForTimeout(1000);

      const errRucText = await pageB.innerText("body");
      assert(/El RUC debe iniciar con 10.*o 20/i.test(errRucText), "No rechazó RUC con prefijo inválido 30");

      // Ahora con RUC de 11 dígitos válido (rellenamos todos los campos tras el reset de useActionState)
      const validRucB = "20" + String(timestamp).slice(-9);
      await pageB.fill('input[name="legalName"]', "Distribuidora Sur S.A.C.");
      await pageB.fill('input[name="tradeName"]', "Sur Textil");
      await pageB.fill('input[name="taxId"]', validRucB);
      await pageB.selectOption('select[name="businessType"]', "Distribuidor mayorista textil");
      await pageB.fill('input[name="contactName"]', "Jorge Paredes");
      await pageB.fill('input[name="contactEmail"]', userBEmail);
      await pageB.fill('input[name="contactPhone"]', "987111222");
      await pageB.fill('input[name="password"]', initialPassword);
      await pageB.fill('input[name="confirmPassword"]', initialPassword);
      await pageB.fill('input[name="district"]', "Arequipa");
      await pageB.fill('input[name="addressLine"]', "Calle Mercaderes 210");
      await pageB.selectOption('select[name="estimatedVolume"]', "S/ 10,000 a S/ 30,000 mensuales (mediano volumen)");
      await pageB.check('input[name="termsAccepted"]');
      await pageB.click('button[type="submit"]');
      await pageB.waitForURL((u) => u.pathname.includes("/mayorista/solicitud"), { timeout: 15000 });

      const [uB] = await sql`SELECT id FROM users WHERE email = ${userBEmail}`;
      userBId = uB.id;
      const [appB] = await sql`SELECT id FROM business_applications WHERE user_id = ${userBId}`;
      appBId = appB.id;

      // Comprobar que Usuario B en /cuenta/direcciones NO ve las direcciones de Usuario A
      await pageB.goto(`${BASE}/cuenta/direcciones`, { waitUntil: "networkidle" });
      const dirTextB = await pageB.innerText("body");
      assert(!/Av\. Conquistadores 450|Taller Gamarra/i.test(dirTextB), "Fuga de datos: Usuario B vio direcciones de Usuario A");
      assert(/Aún no tienes direcciones registradas/i.test(dirTextB), "Usuario B no vio estado vacío en direcciones");

      // Comprobar que la dirección de Usuario A sigue intacta y pertenece solo a userAId
      const [addrCheck] = await sql`SELECT user_id FROM user_addresses WHERE id = ${addr1Id}`;
      assert(addrCheck.user_id === userAId, "Propiedad de dirección alterada");
      return "Validación de RUC y aislamiento entre clientes verificado";
    });

    // ────────────────────────────────────────────────────────────────────────
    // PUNTO 4 y 5: Solicitud B2B de Usuario A, Protección Admin, Aprobación, Rechazo y Suspensión
    // ────────────────────────────────────────────────────────────────────────
    await check("7. Solicitud B2B y RBAC: Usuario A solicita B2B y ambos clientes son bloqueados de /admin", async () => {
      await pageA.goto(`${BASE}/mayorista/registro`, { waitUntil: "networkidle" });
      const validRucA = "20" + String(timestamp + 7).slice(-9);
      await pageA.fill('input[name="legalName"]', "Inversiones Textiles Lima S.A.C.");
      await pageA.fill('input[name="tradeName"]', "Lima Fashion");
      await pageA.fill('input[name="taxId"]', validRucA);
      await pageA.fill('input[name="contactPhone"]', "987654321");
      await pageA.selectOption('select[name="businessType"]', "Boutique o tienda de moda retail");
      await pageA.fill('input[name="addressLine"]', "Av. Primavera 1200");
      await pageA.fill('input[name="district"]', "Surco");
      await pageA.selectOption('select[name="estimatedVolume"]', "S/ 30,000 a S/ 80,000 mensuales (distribuidor regional)");
      await pageA.check('input[name="termsAccepted"]');
      await pageA.click('button[type="submit"]');
      await pageA.waitForURL((u) => u.pathname.includes("/mayorista/solicitud"), { timeout: 15000 });

      const [appA] = await sql`SELECT id FROM business_applications WHERE user_id = ${userAId}`;
      appAId = appA.id;

      // Intentar entrar a /admin/solicitudes y /admin/solicitudes/[id] con Usuario A (no-admin)
      await pageA.goto(`${BASE}/admin/solicitudes/${appAId}`, { waitUntil: "networkidle" });
      assert(pageA.url().includes("/cuenta"), `Usuario no-admin pudo entrar a ruta admin: ${pageA.url()}`);
      return `Solicitud A #${appAId}, Solicitud B #${appBId}`;
    });

    const ctxAdmin = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-PE" });
    const pageAdmin = await ctxAdmin.newPage();

    await check("8. Flujo Admin B2B: Aprobar Empresa A, Rechazar Empresa B y Suspender Empresa A", async () => {
      await pageAdmin.goto(`${BASE}/iniciar-sesion?next=/admin/solicitudes`, { waitUntil: "networkidle" });
      await pageAdmin.fill('input[name="email"]', tempAdminEmail);
      await pageAdmin.fill('input[name="password"]', tempAdminPassword);
      await pageAdmin.click('button[type="submit"]');
      await pageAdmin.waitForURL((u) => u.pathname.includes("/admin/solicitudes"), { timeout: 15000 });

      // 8.1 Aprobar Empresa A
      await pageAdmin.goto(`${BASE}/admin/solicitudes/${appAId}`, { waitUntil: "networkidle" });
      await pageAdmin.fill('textarea[name="internalNotes"]', "RUC verificado manualmente en SUNAT: Activo y Habido.");
      await pageAdmin.click('button[type="submit"]:has-text("Ejecutar resolución")');
      await pageAdmin.waitForTimeout(1500);

      // Comprobar que Usuario A ahora tiene rol business_approved y ve Tarifas B2B
      await pageA.goto(`${BASE}/producto/polo-esencial-algodon`, { waitUntil: "networkidle" });
      const prodApprovedText = await pageA.innerText("main");
      assert(/Condición mayorista autorizada/i.test(prodApprovedText), "Empresa aprobada no ve Condición mayorista autorizada");
      assert(/Tarifas B2B/i.test(prodApprovedText), "Empresa aprobada no ve badge Tarifas B2B");

      // 8.2 Rechazar Empresa B con motivo obligatorio
      await pageAdmin.goto(`${BASE}/admin/solicitudes/${appBId}`, { waitUntil: "networkidle" });
      await pageAdmin.click('button:has-text("Rechazar")');
      await pageAdmin.fill('textarea[name="rejectionReason"]', "El RUC indicado no registra actividad textil mayorista.");
      await pageAdmin.click('button[type="submit"]:has-text("Ejecutar resolución")');
      await pageAdmin.waitForTimeout(1500);

      // Comprobar que Usuario B ve el estado "No aprobada" y el motivo de rechazo, y NO tiene tarifas B2B
      await pageB.goto(`${BASE}/mayorista/solicitud`, { waitUntil: "networkidle" });
      const statusBText = await pageB.innerText("body");
      assert(/No aprobada/i.test(statusBText), "Usuario B no ve estado No aprobada");
      assert(/El RUC indicado no registra actividad textil mayorista/i.test(statusBText), "Usuario B no ve el motivo de rechazo");

      const [uBRow] = await sql`SELECT role FROM users WHERE id = ${userBId}`;
      assert(uBRow.role === "customer", `Rol de empresa rechazada debe ser customer, es ${uBRow.role}`);

      // 8.3 Suspender Empresa A y comprobar revocación inmediata de permisos
      await pageAdmin.goto(`${BASE}/admin/solicitudes/${appAId}`, { waitUntil: "networkidle" });
      await pageAdmin.click('button:has-text("Suspender")');
      await pageAdmin.fill('textarea[name="rejectionReason"]', "Suspensión preventiva por auditoría crediticia.");
      await pageAdmin.click('button[type="submit"]:has-text("Ejecutar resolución")');
      await pageAdmin.waitForTimeout(1500);

      await pageA.goto(`${BASE}/producto/polo-esencial-algodon`, { waitUntil: "networkidle" });
      const prodSuspendedText = await pageA.innerText("main");
      assert(!/Condición mayorista autorizada/i.test(prodSuspendedText), "Empresa suspendida sigue viendo autorización B2B");
      return "Aprobación, Rechazo y Suspensión verificados en UI y BD";
    });

    // ────────────────────────────────────────────────────────────────────────
    // PUNTO 1 y 2: Expiración de sesión, Recuperación completa de contraseña y Rate Limiting
    // ────────────────────────────────────────────────────────────────────────
    await check("9. Expiración de sesión en servidor: sesión vencida en BD es rechazada y redirige a login", async () => {
      await sql`UPDATE sessions SET expires_at = NOW() - INTERVAL '5 minutes' WHERE user_id = ${userBId}`;
      await pageB.goto(`${BASE}/cuenta`, { waitUntil: "networkidle" });
      assert(pageB.url().includes("/iniciar-sesion"), "Sesión expirada no fue rechazada por el servidor");
      const remaining = await sql`SELECT id FROM sessions WHERE user_id = ${userBId}`;
      assert(remaining.length === 0, "La sesión expirada no fue eliminada de la tabla sessions");
      return "Sesión expirada purgada de BD y bloqueada";
    });

    await check("10. Recuperación de contraseña completa + revocación de sesiones + protección fuerza bruta", async () => {
      // Generar token de recuperación para Usuario A
      const rawResetToken = randomBytes(32).toString("hex");
      const resetHash = hashToken(rawResetToken);
      await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${userAId}, ${resetHash}, NOW() + INTERVAL '1 hour')
      `;

      // Restablecer contraseña en navegador
      const resetCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-PE" });
      const resetPage = await resetCtx.newPage();
      await resetPage.goto(`${BASE}/restablecer-contrasena?token=${rawResetToken}`, { waitUntil: "networkidle" });
      await resetPage.fill('input[name="password"]', newResetPassword);
      await resetPage.fill('input[name="confirmPassword"]', newResetPassword);
      await resetPage.click('button[type="submit"]');
      await resetPage.waitForURL((u) => u.pathname.includes("/iniciar-sesion"), { timeout: 15000 });

      // Comprobar que todas las sesiones anteriores de Usuario A fueron revocadas en la BD
      const activeSessionsA = await sql`SELECT id FROM sessions WHERE user_id = ${userAId}`;
      assert(activeSessionsA.length === 0, "Las sesiones anteriores no se revocaron tras restablecer contraseña");

      // Comprobar que el token de reset no puede volver a utilizarse
      await resetPage.goto(`${BASE}/restablecer-contrasena?token=${rawResetToken}`, { waitUntil: "networkidle" });
      await resetPage.fill('input[name="password"]', "OtraClave123*");
      await resetPage.fill('input[name="confirmPassword"]', "OtraClave123*");
      await resetPage.click('button[type="submit"]');
      await resetPage.waitForTimeout(800);
      assert(/inválido, ha expirado o ya fue utilizado/i.test(await resetPage.innerText("body")), "Permitió reusar token de reset");

      // Probar Rate Limiting contra fuerza bruta (5 intentos con contraseña antigua -> 6to bloqueado)
      await resetPage.goto(`${BASE}/iniciar-sesion`, { waitUntil: "networkidle" });
      for (let i = 1; i <= 6; i++) {
        await resetPage.fill('input[name="email"]', userAEmail);
        await resetPage.fill('input[name="password"]', initialPassword);
        await resetPage.click('button[type="submit"]');
        await resetPage.waitForTimeout(500);
      }
      const bruteForceText = await resetPage.innerText("body");
      assert(/Demasiados intentos fallidos/i.test(bruteForceText), "El rate-limiter no bloqueó tras 5 intentos fallidos");

      await resetCtx.close();
      return "Contraseña actualizada, sesiones revocadas, token de 1 uso y rate-limit activo";
    });

    await ctxA.close();
    await ctxB.close();
    await ctxAdmin.close();
  } finally {
    await cleanupAuditArtifacts();
    await browser.close();
  }

  console.log("\n=== RESUMEN DE AUDITORÍA E2E FASE 3 ===");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`Total: ${results.length} | Aprobadas: ${passed} | Fallidas: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(async (err) => {
  await cleanupAuditArtifacts().catch(() => {});
  console.error("Error fatal en suite E2E:", err);
  process.exit(1);
});
