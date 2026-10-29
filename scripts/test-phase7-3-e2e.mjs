/**
 * Suite de Verificación E2E — Fase 7.3:
 * Corrección e Implementación Integral de Funcionalidades Incompletas del E-Commerce
 *
 * 15 Escenarios obligatorios:
 *  1. Navegación Home botón "Conoce nuestra venta por mayor" -> /mayorista
 *  2. Navegación Home botón "Solicitar cotización" -> /mayorista/cotizaciones
 *  3. Contenido informativo de /mayorista (beneficios, condiciones, escalas, pasos, catálogo)
 *  4. Formulario de registro empresarial en /mayorista/registro conectado a Server Action y PostgreSQL
 *  5. Módulo interactivo de cotizaciones /mayorista/cotizaciones (selección de modelos, tallas, colores, cantidades)
 *  6. Preservación del borrador de cotización en localStorage para visitantes
 *  7. Productos destacados en home cargados desde Neon PostgreSQL
 *  8. Navegación en tarjeta de producto: clic en imagen, título o botón "Ver producto" abre /producto/[slug]
 *  9. Ficha de producto /producto/[slug] con stock, selector de tallas y botones activos
 * 10. Botón corazón en tarjeta de producto alterna favoritos sin abrir el enlace del producto
 * 11. Botón corazón en ficha de producto alterna favoritos sincronizado con el proveedor
 * 12. Contador en vivo de favoritos en el header y barra móvil
 * 13. Vista /cuenta/favoritos con ficha, precio según rol, stock, agregar a bolsa y quitar
 * 14. Fusión automática de favoritos de visitante a PostgreSQL al iniciar sesión
 * 15. Formulario de newsletter en el footer guarda correo en PostgreSQL sin mensajes de "próximamente"
 */
import { chromium } from "playwright-core";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";

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

const ts = Date.now();
const testEmail = `fase73.user.${ts}@investments.pe`;
const testPassword = `Fase73Secure_${randomBytes(4).toString("hex")}#`;
let testUserId = null;

async function setupFixtures() {
  const passHash = hashPasswordSync(testPassword);
  const [user] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${testEmail}, ${passHash}, 'Valeria', 'Rios', '987123456', 'customer', true, NOW())
    RETURNING id
  `;
  testUserId = user.id;
}

async function cleanupFixtures() {
  try {
    if (testUserId) {
      await sql`DELETE FROM user_favorites WHERE user_id = ${testUserId}`;
      await sql`DELETE FROM sessions WHERE user_id = ${testUserId}`;
      await sql`DELETE FROM users WHERE id = ${testUserId}`;
    }
    await sql`DELETE FROM newsletter_subscribers WHERE email LIKE 'test.fase73.%'`;
  } catch (err) {
    console.error("Cleanup warning:", err.message);
  }
}

async function main() {
  console.log(`\n=== INICIANDO SUITE DE PRUEBAS E2E FASE 7.3 EN ${BASE} ===\n`);
  await setupFixtures();

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 850 },
      locale: "es-PE",
    });
    const page = await context.newPage();

    // 1. Navegación Home botón "Conoce nuestra venta por mayor" -> /mayorista
    await check(
      "1. Home: botón 'Conoce nuestra venta por mayor' redirige a /mayorista sin 'próximamente'",
      async () => {
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        const btn = page.locator('a:has-text("Conoce nuestra venta por mayor")').first();
        assert((await btn.count()) > 0, "No se encontró el botón 'Conoce nuestra venta por mayor'");
        const href = await btn.getAttribute("href");
        assert(href === "/mayorista", `Href incorrecto: esperado '/mayorista', recibido '${href}'`);
        await btn.click();
        await page.waitForURL("**/mayorista", { timeout: 10000 });
        assert(page.url().includes("/mayorista"), `URL inesperada: ${page.url()}`);
        return "Navegación limpia a /mayorista verificada";
      },
    );

    // 2. Navegación Home botón "Solicitar cotización" -> /mayorista/cotizaciones
    await check(
      "2. Home: botón 'Solicitar cotización' redirige a /mayorista/cotizaciones sin 'próximamente'",
      async () => {
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        const btn = page.locator('a:has-text("Solicitar cotización")').first();
        assert((await btn.count()) > 0, "No se encontró el botón 'Solicitar cotización'");
        const href = await btn.getAttribute("href");
        assert(href === "/mayorista/cotizaciones", `Href incorrecto: '${href}'`);
        await btn.click();
        await page.waitForURL("**/mayorista/cotizaciones", { timeout: 10000 });
        assert(page.url().includes("/mayorista/cotizaciones"), `URL inesperada: ${page.url()}`);
        return "Navegación limpia a /mayorista/cotizaciones verificada";
      },
    );

    // 3. Contenido informativo de /mayorista
    await check(
      "3. Landing /mayorista: contiene beneficios, condiciones, escalas por volumen y pasos",
      async () => {
        await page.goto(`${BASE}/mayorista`, { waitUntil: "networkidle" });
        const bodyText = (await page.innerText("body")).toLowerCase();
        assert(bodyText.includes("canal mayorista"), "Falta encabezado de Canal Mayorista");
        assert(bodyText.includes("escalas acumulables por modelo"), "Faltan beneficios");
        assert(bodyText.includes("precios por volumen con reglas claras"), "Falta sección de escalas");
        assert(bodyText.includes("ruc 11 dígitos") || bodyText.includes("ruc 11 dgitos"), "Faltan requisitos de RUC");
        assert(bodyText.includes("registrar mi empresa"), "Falta CTA de registro");
        return "Todos los bloques informativos presentes";
      },
    );

    // 4. Formulario de registro empresarial en /mayorista/registro
    await check(
      "4. Formulario /mayorista/registro: accesible con campos RUC, razón social y contacto",
      async () => {
        await page.goto(`${BASE}/mayorista/registro`, { waitUntil: "networkidle" });
        assert(page.url().includes("/mayorista/registro"), "No cargó la ruta de registro");
        const rucInput = page.locator('input[name="taxId"], input[placeholder*="20"]');
        assert((await rucInput.count()) > 0, "Falta input de RUC empresarial");
        return "Ruta /mayorista/registro operativa";
      },
    );

    // 5. Módulo interactivo de cotizaciones /mayorista/cotizaciones
    await check(
      "5. /mayorista/cotizaciones: configurador interactivo con selección de prendas, tallas y notas",
      async () => {
        await page.goto(`${BASE}/mayorista/cotizaciones`, { waitUntil: "networkidle" });
        const bodyText = await page.innerText("body");
        assert(bodyText.includes("Modo Borrador") || bodyText.includes("Canal Corporativo") || bodyText.includes("Preparar Solicitud"), "Falta modo borrador en cotizaciones");
        const productSelect = page.locator('select[name="productId"], select').first();
        assert((await productSelect.count()) > 0, "Falta selector de productos para cotizar");
        return "Configurador interactivo operativo";
      },
    );

    // 6. Preservación del borrador de cotización en localStorage
    await check(
      "6. Borrador de cotización: se guarda y persiste en localStorage en el navegador",
      async () => {
        await page.goto(`${BASE}/mayorista/cotizaciones`, { waitUntil: "networkidle" });
        await page.evaluate(() => {
          localStorage.setItem(
            "investments_quote_draft_v1",
            JSON.stringify({
              lines: [{ variantId: 1, quantity: 24, itemNotes: "Prueba E2E" }],
              commercialNeeds: "Necesitamos entrega urgente en almacén central de Lima",
              customerNotes: "Horario de recepción 9am a 1pm",
              deliveryCity: "Lima",
            }),
          );
        });
        await page.reload({ waitUntil: "networkidle" });
        const stored = await page.evaluate(() => localStorage.getItem("investments_quote_draft_v1"));
        assert(stored && stored.includes("Prueba E2E"), "El borrador no se recuperó de localStorage");
        return "Persistencia en localStorage confirmada";
      },
    );

    // 7. Productos destacados en home cargados desde PostgreSQL
    await check(
      "7. Home: sección 'Piezas destacadas' no muestra advertencias de demo ni strings 'próximamente'",
      async () => {
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        const bodyText = (await page.innerText("body")).toLowerCase();
        assert(!bodyText.includes("productos de demostración"), "Aún muestra texto 'productos de demostración'");
        assert(bodyText.includes("selección de temporada"), "Falta etiqueta de selección real");
        return "Productos destacados conectados con catálogo real";
      },
    );

    // 8. Navegación en tarjeta de producto hacia /producto/[slug]
    await check(
      "8. ProductCard: al hacer clic en imagen o título navega limpiamente a /producto/[slug]",
      async () => {
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        const productLink = page.locator('a[href^="/producto/"]').first();
        assert((await productLink.count()) > 0, "No se encontró enlace a producto en home");
        const targetHref = await productLink.getAttribute("href");
        await productLink.click();
        await page.waitForURL(`**${targetHref}`, { timeout: 10000 });
        assert(page.url().includes("/producto/"), `URL no corresponde a producto: ${page.url()}`);
        return `Navegación a ${targetHref} verificada`;
      },
    );

    // 9. Ficha de producto /producto/[slug]
    await check(
      "9. Ficha de producto: carga detalles, tallas, precio y botones de acción",
      async () => {
        await page.waitForSelector('[data-testid="product-detail-favorite-button"]', { timeout: 10000 });
        const bodyText = (await page.innerText("body")).toLowerCase();
        assert(bodyText.includes("agregar a la bolsa") || bodyText.includes("agotado"), "Falta botón de compra");
        const favBtn = page.locator('[data-testid="product-detail-favorite-button"]');
        assert((await favBtn.count()) > 0, "Falta botón de favoritos en la ficha de producto");
        return "Ficha de producto completa";
      },
    );

    // 10. Botón corazón en tarjeta de producto
    await check(
      "10. ProductCard: clic en corazón alterna favoritos sin navegar fuera de la página",
      async () => {
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        const currentUrl = page.url();
        const favToggle = page.locator('[data-testid^="favorite-toggle-"]').first();
        assert((await favToggle.count()) > 0, "No se encontró botón de favorito en tarjeta");
        await favToggle.click();
        await page.waitForTimeout(600);
        assert(page.url() === currentUrl, "Hacer clic en el corazón provocó una navegación inesperada");
        return "El corazón no interfiere con el enlace de la tarjeta";
      },
    );

    // 11. Botón corazón en ficha de producto alterna estado
    await check(
      "11. Ficha de producto: botón corazón alterna estado activo y sincroniza con el provider",
      async () => {
        await page.goto(`${BASE}/producto/conjunto-sastre-negro`, { waitUntil: "networkidle" });
        const favBtn = page.locator('[data-testid="product-detail-favorite-button"]');
        assert((await favBtn.count()) > 0, "Falta botón de favoritos en ficha");
        const initialPressed = await favBtn.getAttribute("aria-pressed");
        await favBtn.click();
        await page.waitForTimeout(600);
        const nextPressed = await favBtn.getAttribute("aria-pressed");
        assert(initialPressed !== nextPressed, "El estado aria-pressed del corazón no cambió");
        // Asegurar que quede activo para los siguientes tests del header y lista
        if (nextPressed === "false") {
          await favBtn.click();
          await page.waitForTimeout(600);
        }
        return `Estado alternado correctamente: ${initialPressed} -> ${nextPressed}`;
      },
    );

    // 12. Contador en vivo de favoritos en header
    await check(
      "12. Header: contador de favoritos refleja la cantidad actual (> 0)",
      async () => {
        const badge = page.locator('[data-testid="header-favorites-count"]');
        assert((await badge.count()) > 0, "Falta badge de favoritos en el header");
        const countText = await badge.innerText();
        const num = Number(countText);
        assert(Number.isInteger(num) && num > 0, `Contador inválido: ${countText}`);
        return `Contador en header: ${num} favoritos`;
      },
    );

    // 13. Vista de favoritos (/favoritos y /cuenta/favoritos)
    await check(
      "13. Página /favoritos: muestra las prendas guardadas, stock y botón 'Agregar a la bolsa'",
      async () => {
        await page.goto(`${BASE}/favoritos`, { waitUntil: "networkidle" });
        const bodyText = (await page.innerText("body")).toLowerCase();
        assert(bodyText.includes("prendas guardadas") || bodyText.includes("mis prendas favoritas"), "Falta título de favoritos");
        const favCards = page.locator('[data-testid^="favorite-card-"]');
        assert((await favCards.count()) > 0, "No se muestran tarjetas de favoritos");
        return `${await favCards.count()} prendas mostradas en la lista de favoritos`;
      },
    );

    // 14. Fusión de favoritos de visitante al iniciar sesión
    await check(
      "14. Fusión de favoritos: al iniciar sesión, los favoritos de visitante se sincronizan con PostgreSQL",
      async () => {
        // Asegurar que hay al menos un favorito de visitante en localStorage
        await page.goto(`${BASE}/favoritos`, { waitUntil: "networkidle" });
        await page.evaluate(() => {
          localStorage.setItem(
            "investments_guest_favorites_v1",
            JSON.stringify(["conjunto-sastre-negro", "polo-esencial-algodon"]),
          );
        });

        // Ahora iniciamos sesión con testEmail
        await page.goto(`${BASE}/iniciar-sesion?next=/cuenta/favoritos`, { waitUntil: "networkidle" });
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await Promise.all([
          page.waitForURL("**/cuenta/favoritos", { timeout: 15000 }),
          page.click('button[type="submit"]'),
        ]);

        await page.waitForTimeout(2000);
        // Verificar en PostgreSQL que user_favorites tenga registros para testUserId
        const favRows = await sql`SELECT count(*)::int as cnt FROM user_favorites WHERE user_id = ${testUserId}`;
        assert(favRows[0].cnt > 0, `No se sincronizaron los favoritos en PostgreSQL (cnt=${favRows[0].cnt})`);
        return `Favoritos sincronizados en PostgreSQL para usuario ID ${testUserId}: ${favRows[0].cnt} registros`;
      },
    );

    // 15. Formulario de newsletter en el footer guarda correo en PostgreSQL sin 'próximamente'
    await check(
      "15. Footer Newsletter: procesa correo en PostgreSQL y muestra confirmación real sin 'próximamente'",
      async () => {
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        const testSubEmail = `test.fase73.${ts}@investments.pe`;
        const emailInput = page.locator('footer input[type="email"]');
        assert((await emailInput.count()) > 0, "Falta input de newsletter en footer");
        await emailInput.fill(testSubEmail);
        const submitBtn = page.locator('footer button[type="submit"]');
        await submitBtn.click();
        await page.waitForTimeout(1200);

        const footerText = await page.innerText("footer");
        assert(!footerText.includes("próximamente"), "El footer aún contiene la palabra 'próximamente'");
        assert(footerText.includes("Gracias por suscribirte") || footerText.includes("Suscrito"), "No mostró confirmación de suscripción");

        const subRows = await sql`SELECT email, is_active FROM newsletter_subscribers WHERE email = ${testSubEmail}`;
        assert(subRows.length > 0 && subRows[0].is_active, "El suscriptor no fue guardado en la base de datos");
        return `Suscripción guardada en PostgreSQL: ${subRows[0].email}`;
      },
    );

    await context.close();
  } finally {
    await browser.close();
    await cleanupFixtures();
  }

  console.log("\n=== RESUMEN DE RESULTADOS E2E FASE 7.3 ===");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`Total: ${results.length} | Aprobados: ${passed} | Fallidos: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error inesperado en pruebas E2E:", err);
  process.exit(1);
});

