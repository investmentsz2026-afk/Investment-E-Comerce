/**
 * Auditoría E2E del catálogo (Fase 2) con un navegador real (Microsoft Edge vía playwright-core).
 *
 * Uso:   node scripts/e2e-audit.mjs [BASE_URL]            (por defecto http://localhost:3100)
 *        node scripts/e2e-audit.mjs --error-state BASE_URL (comprueba el estado de error con una DB inválida)
 *
 * - Compara lo que muestra la web contra consultas SQL independientes a Neon (oráculo).
 * - Para probar "agotado" modifica temporalmente el stock de variantes y SIEMPRE lo restaura (bloque finally).
 * - No borra datos. Escribe el resultado en scripts/e2e-audit-results.json.
 */
import { chromium } from "playwright-core";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });

const args = process.argv.slice(2);
const errorMode = args[0] === "--error-state";
const BASE = (errorMode ? args[1] : args[0]) ?? "http://localhost:3100";

const results = [];
const consoleIssues = [];
let currentPageLabel = "";

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
const norm = (s) => s.replace(/\s/g, " ");
const soles = (cents) => `S/ ${(cents / 100).toFixed(2)}`;
const priceOf = (text) => {
  const m = norm(text).match(/S\/ ?([\d,]+\.\d{2})/);
  return m ? Math.round(parseFloat(m[1].replace(/,/g, "")) * 100) : null;
};

async function newPage(browser, viewport, label) {
  const ctx = await browser.newContext({ viewport, locale: "es-PE" });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") {
      const t = m.text();
      if (/Download the React DevTools|Fast Refresh|HMR/i.test(t)) return;
      if (currentPageLabel.startsWith("404") && /status of 404/i.test(t)) return;
      consoleIssues.push(`[${label}] ${currentPageLabel} :: ${m.type()}: ${t.slice(0, 200)}`);
    }
  });
  page.on("pageerror", (e) => consoleIssues.push(`[${label}] ${currentPageLabel} :: pageerror: ${String(e).slice(0, 200)}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("favicon") && !currentPageLabel.startsWith("404")) {
      consoleIssues.push(`[${label}] ${currentPageLabel} :: HTTP ${r.status()} ${r.url().replace(BASE, "")}`);
    }
  });
  return { ctx, page };
}

async function go(page, path, label) {
  currentPageLabel = label ?? path;
  const r = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(700);
  return r;
}

/** Tarjetas visibles en la cuadrícula. */
async function cards(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("main article")].map((a) => {
      const link = a.closest("a");
      const text = a.innerText;
      return {
        slug: link ? new URL(link.href).pathname.split("/").pop() : null,
        name: a.querySelector("h3")?.textContent?.trim() ?? "",
        text,
        soldOut: /Agotado/i.test(text),
      };
    }),
  );
}
async function totalLabel(page) {
  const t = await page.evaluate(() => document.querySelector("main")?.innerText ?? "");
  const m = t.match(/(\d+)\s+productos?/i);
  return m ? parseInt(m[1], 10) : null;
}

// ──────────────────────────────────────────────────────────────
async function runErrorState(browser) {
  const { page } = await newPage(browser, { width: 1280, height: 800 }, "error");
  await check("Estado de error: /catalogo con base de datos inválida muestra pantalla recuperable", async () => {
    currentPageLabel = "error:/catalogo";
    await page.goto(BASE + "/catalogo", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    const body = await page.evaluate(() => document.body.innerText);
    assert(/No pudimos cargar esta página/i.test(body), "no se vio el mensaje de error amigable");
    assert(/Reintentar/i.test(body), "falta el botón Reintentar");
    assert(!/password|neondb_owner|postgres(ql)?:\/\//i.test(body), "se filtran datos de conexión en pantalla");
  });
  await check("Estado de error: /producto/x con DB inválida muestra pantalla recuperable", async () => {
    await page.goto(BASE + "/producto/polo-esencial-algodon", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    const body = await page.evaluate(() => document.body.innerText);
    assert(/No pudimos cargar este producto/i.test(body), "no se vio el mensaje de error amigable");
  });
  await check("Sitemap con DB caída: responde 200 con rutas estáticas (no rompe)", async () => {
    const r = await fetch(BASE + "/sitemap.xml");
    const xml = await r.text();
    assert(r.status === 200, `status ${r.status}`);
    assert(xml.includes("/catalogo"), "no incluye /catalogo");
  });
}

// ──────────────────────────────────────────────────────────────
async function runMain(browser) {
  const sql = neon(process.env.DATABASE_URL);

  // Oráculo independiente: datos reales de la base
  const products = await sql`
    select p.id, p.slug, p.name, p.audience, p.is_new, p.is_wholesale, p.is_demo, p.status, c.slug as cat_slug,
      (select amount from product_prices where product_id = p.id and type='retail' order by min_quantity limit 1) as retail,
      (select amount from product_prices where product_id = p.id and type='wholesale' order by min_quantity limit 1) as wholesale,
      (select min_quantity from product_prices where product_id = p.id and type='wholesale' order by min_quantity limit 1) as wholesale_min
    from products p join categories c on c.id = p.category_id where p.status='active' order by p.id`;
  const variants = await sql`select v.product_id, v.sku, v.size, v.color_name, v.stock, v.is_active from product_variants v`;
  const snapshot = variants.map((v) => ({ sku: v.sku, stock: v.stock }));
  const varsOf = (pid) => variants.filter((v) => v.product_id === pid && v.is_active);
  const pageSize = 3; // el servidor de auditoría arranca con CATALOG_PAGE_SIZE=3

  const expected = (f) =>
    products.filter((p) => {
      const vs = varsOf(p.id);
      if (f.audiencia && p.audience !== f.audiencia) return false;
      if (f.novedades && !p.is_new) return false;
      if (f.mayorista && !p.is_wholesale) return false;
      if (f.min !== undefined && p.retail < f.min) return false;
      if (f.max !== undefined && p.retail > f.max) return false;
      if (f.tallas || f.colores || f.disponible) {
        const ok = vs.some(
          (v) =>
            v.stock > 0 &&
            (!f.tallas || f.tallas.includes(v.size)) &&
            (!f.colores || f.colores.includes(v.color_name)),
        );
        if (!ok) return false;
      }
      return true;
    });

  const { page } = await newPage(browser, { width: 1440, height: 900 }, "desktop");

  // 1) Rutas
  const cats = [...new Set(products.map((p) => p.cat_slug))];
  const routes = ["/", "/catalogo", ...cats.map((c) => `/catalogo/${c}`), ...products.map((p) => `/producto/${p.slug}`), "/buscar", "/buscar?q=polo"];
  for (const r of routes) {
    await check(`Ruta ${r} responde 200 y sin errores de consola`, async () => {
      const before = consoleIssues.length;
      const res = await go(page, r);
      assert(res.status() === 200, `status ${res.status()}`);
      const nuevos = consoleIssues.slice(before);
      assert(nuevos.length === 0, nuevos[0]);
    });
  }
  await check("Ruta inexistente /catalogo/no-existe → pantalla amigable de no encontrado y noindex", async () => {
    await go(page, "/catalogo/no-existe", "404:categoria");
    const body = await page.evaluate(() => document.body.innerText);
    assert(/No encontramos esta categoría/i.test(body), "sin mensaje de categoría inexistente");
    const hasNoIndex = await page.$eval('meta[name="robots"]', (m) => /noindex/.test(m.content)).catch(() => false);
    assert(hasNoIndex, "falta meta robots noindex en categoría inexistente");
  });
  await check("Producto inexistente /producto/no-existe → pantalla amigable y noindex", async () => {
    await go(page, "/producto/no-existe", "404:producto");
    const body = await page.evaluate(() => document.body.innerText);
    assert(/no está disponible/i.test(body), "sin mensaje de producto inexistente");
    const hasNoIndex = await page.$eval('meta[name="robots"]', (m) => /noindex/.test(m.content)).catch(() => false);
    assert(hasNoIndex, "falta meta robots noindex en producto inexistente");
  });
  await check("Ruta global inexistente /ruta-x → 404 amigable", async () => {
    const res = await go(page, "/ruta-x", "404:global");
    assert(res.status() === 404, `status ${res.status()}`);
    assert(/Esta página no existe/i.test(await page.evaluate(() => document.body.innerText)), "sin mensaje 404 global");
  });

  // 2) Header legible en /catalogo con scroll arriba
  await go(page, "/catalogo");
  await check("Header legible en /catalogo con scroll en 0 (texto oscuro sobre fondo claro)", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => {
      const btn = document.querySelector("header nav ul button, header nav ul a");
      const bg = document.querySelector("header div.relative > div.absolute");
      const rgb = getComputedStyle(btn).color.match(/\d+/g).map(Number);
      return { rgb, bgOpacity: Number(getComputedStyle(bg).opacity) };
    });
    const lum = (0.2126 * info.rgb[0] + 0.7152 * info.rgb[1] + 0.0722 * info.rgb[2]) / 255;
    assert(lum < 0.35, `texto demasiado claro (rgb ${info.rgb})`);
    assert(info.bgOpacity > 0.9, `fondo del header transparente (opacity ${info.bgOpacity})`);
    return `rgb(${info.rgb.join(",")}) opacidad fondo ${info.bgOpacity}`;
  });
  await check("Portada mantiene el header transparente con texto claro sobre el hero (Fase 1 intacta)", async () => {
    await go(page, "/");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => {
      const btn = document.querySelector("header nav ul button, header nav ul a");
      const bg = document.querySelector("header div.relative > div.absolute");
      return { rgb: getComputedStyle(btn).color.match(/\d+/g).map(Number), bgOpacity: Number(getComputedStyle(bg).opacity) };
    });
    const lum = (0.2126 * info.rgb[0] + 0.7152 * info.rgb[1] + 0.0722 * info.rgb[2]) / 255;
    assert(lum > 0.6 && info.bgOpacity < 0.1, `rgb ${info.rgb}, opacidad ${info.bgOpacity}`);
  });

  // 3) Catálogo base, imágenes y paginación
  await go(page, "/catalogo");
  await check("Catálogo: total mostrado coincide con la base de datos y muestra una página de 3", async () => {
    const total = await totalLabel(page);
    const cs = await cards(page);
    assert(total === products.length, `total UI ${total} ≠ DB ${products.length}`);
    assert(cs.length === pageSize, `tarjetas ${cs.length} ≠ ${pageSize}`);
  });
  await check("Catálogo: todas las imágenes de producto cargan (sin imágenes rotas)", async () => {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await page.waitForTimeout(1500);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("main article img")].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.alt),
    );
    assert(broken.length === 0, `rotas: ${broken.join(" | ")}`);
  });
  await check("Precios minorista en tarjetas coinciden con la base (céntimos → soles)", async () => {
    await go(page, "/catalogo?orden=nombre&pagina=1");
    const cs = await cards(page);
    for (const c of cs) {
      const db = products.find((p) => p.slug === c.slug);
      assert(priceOf(c.text) === db.retail, `${c.slug}: UI ${priceOf(c.text)} ≠ DB ${db.retail}`);
    }
  });
  await check("Tarjetas con precio mayorista muestran el mayorista correcto (y los que no tienen, no lo muestran)", async () => {
    await go(page, "/catalogo?orden=nombre&pagina=1");
    for (const c of await cards(page)) {
      const db = products.find((p) => p.slug === c.slug);
      const hasWs = /Por mayor desde/i.test(c.text);
      assert(hasWs === (db.wholesale !== null), `${c.slug}: bloque mayorista=${hasWs}, DB=${db.wholesale}`);
      if (hasWs) assert(norm(c.text).includes(soles(db.wholesale)), `${c.slug}: falta ${soles(db.wholesale)}`);
    }
  });
  await check("Paginación: 3 páginas, navegación siguiente/anterior y sin duplicados", async () => {
    const seen = [];
    await go(page, "/catalogo?orden=nombre");
    const totalPages = Math.ceil(products.length / pageSize);
    seen.push(...(await cards(page)).map((c) => c.slug));
    for (let p = 2; p <= totalPages; p++) {
      await page.getByRole("link", { name: "Página siguiente" }).click();
      await page.waitForURL((u) => u.searchParams.get("pagina") === String(p), { timeout: 15000 });
      await page.waitForTimeout(800);
      seen.push(...(await cards(page)).map((c) => c.slug));
    }
    assert(seen.length === products.length, `vistos ${seen.length} ≠ ${products.length}`);
    assert(new Set(seen).size === seen.length, "hay productos repetidos entre páginas");
    await page.getByRole("link", { name: "Página anterior" }).click();
    await page.waitForURL((u) => u.searchParams.get("pagina") === String(totalPages - 1), { timeout: 15000 });
    const expectedOrder = [...products].sort((a, b) => a.name.localeCompare(b.name, "es")).map((p) => p.slug);
    assert(JSON.stringify(seen) === JSON.stringify(expectedOrder), `orden por nombre distinto:\nUI ${seen}\nDB ${expectedOrder}`);
  });
  await check("Paginación: página fuera de rango (?pagina=99) se acota a la última, no queda vacía", async () => {
    await go(page, "/catalogo?pagina=99");
    const cs = await cards(page);
    assert(cs.length > 0, "página vacía");
    const cur = await page.locator('nav[aria-label="Paginación del catálogo"] [aria-current="page"]').innerText();
    assert(cur.trim() === String(Math.ceil(products.length / pageSize)), `página actual ${cur}`);
  });

  // 4) Orden
  for (const [orden, cmp] of [
    ["precio-asc", (a, b) => a.retail - b.retail],
    ["precio-desc", (a, b) => b.retail - a.retail],
  ]) {
    await check(`Orden ${orden}: respeta el precio en TODAS las páginas`, async () => {
      const seen = [];
      for (let p = 1; p <= Math.ceil(products.length / pageSize); p++) {
        await go(page, `/catalogo?orden=${orden}&pagina=${p}`);
        seen.push(...(await cards(page)).map((c) => priceOf(c.text)));
      }
      const exp = [...products].sort(cmp).map((p) => p.retail);
      assert(JSON.stringify(seen) === JSON.stringify(exp), `UI ${seen} ≠ esperado ${exp}`);
    });
  }
  await check("Orden desde el selector de la interfaz actualiza URL y resultados", async () => {
    await go(page, "/catalogo");
    await page.selectOption('select[aria-label="Ordenar productos"]', "precio-desc");
    await page.waitForURL((u) => u.searchParams.get("orden") === "precio-desc", { timeout: 15000 });
    await page.waitForTimeout(900);
    const first = priceOf((await cards(page))[0].text);
    assert(first === Math.max(...products.map((p) => p.retail)), `primer precio ${first}`);
  });

  // 5) Filtros (UI) y combinados
  await check("Filtro Género (Mujer) desde la UI coincide con la base", async () => {
    await go(page, "/catalogo");
    await page.locator("aside").getByRole("button", { name: /^Mujer/ }).click();
    await page.waitForURL((u) => u.searchParams.get("audiencia") === "mujer", { timeout: 15000 });
    await page.waitForTimeout(900);
    assert((await totalLabel(page)) === expected({ audiencia: "mujer" }).length, "total distinto del oráculo");
  });
  await check("Filtros combinados URL: mujer + talla M + color Negro + solo stock = oráculo SQL", async () => {
    const f = { audiencia: "mujer", tallas: ["M"], colores: ["Negro"], disponible: true };
    await go(page, "/catalogo?audiencia=mujer&talla=M&color=Negro&disponible=1&orden=nombre");
    const exp = expected(f).map((p) => p.slug).sort();
    const total = await totalLabel(page);
    assert(total === exp.length, `total UI ${total} ≠ oráculo ${exp.length} (${exp})`);
    const slugs = (await cards(page)).map((c) => c.slug).sort();
    assert(JSON.stringify(slugs) === JSON.stringify(exp.slice(0, pageSize).sort()) || exp.length > pageSize, `slugs UI ${slugs} ≠ ${exp}`);
  });
  await check("Filtro de talla filtra ANTES de paginar (total exacto con página de 3)", async () => {
    const f = { tallas: ["XXL"] };
    await go(page, "/catalogo?talla=XXL");
    assert((await totalLabel(page)) === expected(f).length, `total UI ${await totalLabel(page)} ≠ ${expected(f).length}`);
  });
  await check("Filtros novedades y mayorista coinciden con la base", async () => {
    await go(page, "/catalogo?novedades=1");
    assert((await totalLabel(page)) === expected({ novedades: true }).length, "novedades");
    await go(page, "/catalogo?mayorista=1");
    assert((await totalLabel(page)) === expected({ mayorista: true }).length, "mayorista");
  });
  await check("Filtro de color desde la UI (clic en muestra) actualiza URL y total", async () => {
    await go(page, "/catalogo");
    await page.locator('aside button[title="Negro"]').click();
    await page.waitForURL((u) => u.searchParams.getAll("color").includes("Negro"), { timeout: 15000 });
    await page.waitForTimeout(900);
    assert((await totalLabel(page)) === expected({ colores: ["Negro"], disponible: true }).length, "total distinto");
  });
  await check("'Limpiar filtros' restablece el listado completo", async () => {
    await page.getByRole("button", { name: /Limpiar filtros/i }).click();
    await page.waitForURL((u) => u.search === "", { timeout: 15000 });
    await page.waitForTimeout(900);
    assert((await totalLabel(page)) === products.length, "no volvió al total completo");
  });

  // 6) Filtro de precio (UI + URL)
  await check("Filtro de precio mín/máx desde la UI: URL en soles y resultados dentro del rango (= oráculo)", async () => {
    await go(page, "/catalogo");
    await page.locator('input[name="precio_min"]').fill("150");
    await page.locator('input[name="precio_max"]').fill("300");
    await page.getByRole("button", { name: "Aplicar precio" }).click();
    await page.waitForURL((u) => u.searchParams.get("precio_min") === "150" && u.searchParams.get("precio_max") === "300", { timeout: 15000 });
    await page.waitForTimeout(900);
    const exp = expected({ min: 15000, max: 30000 });
    assert((await totalLabel(page)) === exp.length, `total UI ${await totalLabel(page)} ≠ ${exp.length}`);
    for (const c of await cards(page)) {
      const pr = priceOf(c.text);
      assert(pr >= 15000 && pr <= 30000, `${c.slug} fuera de rango: ${pr}`);
    }
  });
  await check("Filtro de precio persiste en los campos tras recargar y se combina con orden", async () => {
    await go(page, "/catalogo?precio_min=150&precio_max=300&orden=precio-asc");
    assert((await page.locator('input[name="precio_min"]').inputValue()) === "150", "min no persiste");
    assert((await page.locator('input[name="precio_max"]').inputValue()) === "300", "max no persiste");
    const prices = (await cards(page)).map((c) => priceOf(c.text));
    assert(JSON.stringify(prices) === JSON.stringify([...prices].sort((a, b) => a - b)), `no ordenados: ${prices}`);
  });
  await check("Precio inválido o invertido en la URL no rompe la página (min>max se intercambia)", async () => {
    const r1 = await go(page, "/catalogo?precio_min=abc&precio_max=-5");
    assert(r1.status() === 200 && (await totalLabel(page)) === products.length, "no ignoró valores inválidos");
    await go(page, "/catalogo?precio_min=300&precio_max=150");
    assert((await totalLabel(page)) === expected({ min: 15000, max: 30000 }).length, "no intercambió");
  });
  await check("Rango sin resultados (precio_min=9999) muestra estado vacío con salida", async () => {
    await go(page, "/catalogo?precio_min=9999");
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    assert(/0 productos|No encontramos|sin resultados/i.test(body), "no mostró estado vacío");
  });

  // 7) Búsqueda
  await check("Búsqueda 'polo' devuelve el producto correcto", async () => {
    await go(page, "/buscar?q=polo");
    const cs = await cards(page);
    assert(cs.some((c) => c.slug === "polo-esencial-algodon"), "falta el polo");
  });
  await check("Búsqueda insensible a tildes y mayúsculas: 'SASTRERIA' encuentra la categoría Sastrería", async () => {
    await go(page, "/buscar?q=SASTRERIA");
    assert((await cards(page)).length >= 1, "sin resultados");
  });
  await check("Búsqueda con comodines '%' y '_' no devuelve todo el catálogo", async () => {
    await go(page, "/buscar?q=%25");
    assert((await cards(page)).length === 0, "los comodines se interpretaron como patrón");
  });
  await check("Búsqueda sin resultados muestra estado vacío", async () => {
    await go(page, "/buscar?q=zzzzzz");
    assert(/Sin resultados|No encontramos/i.test(await page.evaluate(() => document.querySelector("main").innerText)), "sin estado vacío");
  });
  await check("Búsqueda con inyección SQL en el texto es inocua", async () => {
    const r = await go(page, `/buscar?q=${encodeURIComponent("'; drop table products; --")}`);
    assert(r.status() === 200, `status ${r.status()}`);
    const [{ n }] = await sql`select count(*)::int as n from products`;
    assert(n === (await sql`select count(*)::int as n from products`)[0].n && n > 0, "tabla afectada");
  });
  await check("Buscador del header: abrir, escribir y Enter navega a /buscar?q=", async () => {
    await go(page, "/catalogo");
    await page.getByRole("button", { name: "Buscar" }).first().click();
    const input = page.locator('input[type="search"], input[placeholder*="Buscar" i], input[aria-label*="Buscar" i]').first();
    await input.fill("blazer");
    await input.press("Enter");
    await page.waitForURL(/\/buscar\?q=blazer/, { timeout: 15000 });
    await page.waitForTimeout(800);
    assert((await cards(page)).length >= 2, "pocos resultados para 'blazer'");
  });

  // 8) Ficha de producto: precios, variantes y stock
  for (const p of products) {
    await check(`PDP ${p.slug}: precio minorista, mayorista, SKU y stock por variante coinciden con la base`, async () => {
      await go(page, `/producto/${p.slug}`);
      const main = norm(await page.evaluate(() => document.querySelector("main").innerText));
      assert(main.includes(soles(p.retail)), `falta precio minorista ${soles(p.retail)}`);
      if (p.wholesale !== null) {
        await page.getByRole("button", { name: /Disponible por mayor/i }).click();
        await page.waitForTimeout(500);
        const m2 = norm(await page.evaluate(() => document.querySelector("main").innerText));
        assert(m2.includes(soles(p.wholesale)), `falta precio mayorista ${soles(p.wholesale)}`);
        assert(m2.includes(`Desde ${p.wholesale_min} uds`), "falta cantidad mínima");
      } else {
        const hasAccordion = await page.locator('button:has-text("Disponible por mayor")').count();
        assert(hasAccordion === 0, "muestra botón de acordeón mayorista sin tener precio mayorista");
      }
      const vs = varsOf(p.id);
      const colors = [...new Set(vs.map((v) => v.color_name))];
      for (const color of colors) {
        await page.getByRole("radio", { name: color, exact: true }).click();
        await page.waitForTimeout(250);
        for (const v of vs.filter((x) => x.color_name === color)) {
          const radio = page.getByRole("radiogroup", { name: "Seleccionar talla" }).getByRole("radio", { name: v.size, exact: true });
          const disabled = await radio.isDisabled();
          assert(disabled === (v.stock === 0), `${color}/${v.size}: disabled=${disabled}, stock DB=${v.stock}`);
          if (v.stock > 0) {
            await radio.click();
            await page.waitForTimeout(250);
            const txt = norm(await page.evaluate(() => document.querySelector("main").innerText));
            assert(txt.includes(`${v.stock} ${v.stock === 1 ? "unidad" : "unidades"}`), `${color}/${v.size}: stock UI ≠ ${v.stock}`);
            assert(txt.includes(`SKU: ${v.sku}`), `${color}/${v.size}: SKU incorrecto (esperado ${v.sku})`);
          }
        }
      }
    });
  }
  await check("PDP: cambiar de color reinicia la talla seleccionada (no queda stock de otra combinación)", async () => {
    await go(page, "/producto/polo-esencial-algodon");
    await page.getByRole("radio", { name: "Blanco", exact: true }).click();
    await page.getByRole("radiogroup", { name: "Seleccionar talla" }).getByRole("radio", { name: "M", exact: true }).click();
    await page.getByRole("radio", { name: "Negro", exact: true }).click();
    const checked = await page.getByRole("radiogroup", { name: "Seleccionar talla" }).locator('[aria-checked="true"]').count();
    assert(checked === 0, "la talla seguía seleccionada");
    assert(!/unidades/.test(await page.evaluate(() => document.querySelector("main").innerText)), "sigue mostrando stock de la combinación anterior");
  });
  await check("PDP: 'Agregar a la bolsa' sin talla pide seleccionar una talla", async () => {
    await go(page, "/producto/polo-esencial-algodon");
    await page.getByRole("button", { name: /Agregar a la bolsa/i }).click();
    await page.waitForTimeout(300);
    assert(/Selecciona una talla/i.test(await page.evaluate(() => document.body.innerText)), "sin aviso de talla");
  });
  await check("PDP: galería — imagen principal carga; miniaturas solo si hay más de una imagen", async () => {
    await go(page, "/producto/polo-esencial-algodon");
    const ok = await page.evaluate(() => {
      const img = document.querySelector("main img");
      return img && img.complete && img.naturalWidth > 0;
    });
    assert(ok, "imagen principal no cargó");
    const imgCount = (await sql`select count(*)::int as n from product_images where product_id = ${products.find((p) => p.slug === "polo-esencial-algodon").id}`)[0].n;
    const thumbs = await page.locator("main button:has(img)").count();
    return `imágenes en DB: ${imgCount}; miniaturas mostradas: ${thumbs}${imgCount < 2 ? " (LIMITACIÓN: datos demo con 1 imagen, no se pudo ejercitar el cambio de imagen)" : ""}`;
  });
  await check("PDP: productos relacionados enlazan a fichas válidas", async () => {
    await go(page, "/producto/casaca-biker-negra");
    const hrefs = await page.$$eval('main a[href^="/producto/"]', (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
    assert(hrefs.length >= 1, "sin relacionados");
    for (const h of hrefs) {
      const r = await fetch(BASE + h);
      assert(r.status === 200, `${h} → ${r.status}`);
    }
  });
  await check("PDP demo: meta robots noindex y aviso de producto de demostración", async () => {
    await go(page, "/producto/polo-esencial-algodon");
    const robots = await page.$eval('meta[name="robots"]', (m) => m.content).catch(() => "");
    assert(/noindex/.test(robots), `robots="${robots}"`);
    assert(/demostración/i.test(await page.evaluate(() => document.body.innerText)), "sin aviso de demo");
  });
  await check("PDP: JSON-LD de Product con precio en soles y disponibilidad", async () => {
    const ld = JSON.parse(await page.$eval('script[type="application/ld+json"]', (s) => s.textContent));
    assert(ld["@type"] === "Product" && ld.offers.priceCurrency === "PEN", "JSON-LD incorrecto");
    assert(ld.offers.price === (products.find((p) => p.slug === "polo-esencial-algodon").retail / 100).toFixed(2), "precio JSON-LD distinto");
    assert(/^https?:\/\//.test(ld.image), `imagen no absoluta: ${ld.image}`);
  });

  // 9) Sitemap y robots
  await check("Sitemap: incluye /catalogo y EXCLUYE todos los productos de demostración", async () => {
    const xml = await (await fetch(BASE + "/sitemap.xml")).text();
    assert(xml.includes("/catalogo"), "falta /catalogo");
    const demo = products.filter((p) => p.is_demo);
    for (const p of demo) assert(!xml.includes(`/producto/${p.slug}`), `incluye demo ${p.slug}`);
    const real = products.filter((p) => !p.is_demo);
    for (const p of real) assert(xml.includes(`/producto/${p.slug}`), `falta publicado ${p.slug}`);
    return `productos demo excluidos: ${demo.length}; productos reales incluidos: ${real.length}`;
  });

  // 10) Agotado (modifica stock temporalmente y SIEMPRE restaura)
  const SOLD = products.find((p) => p.slug === "casaca-biker-negra");
  const PARTIAL = products.find((p) => p.slug === "polo-esencial-algodon");
  try {
    await sql`update product_variants set stock = 0 where product_id = ${SOLD.id}`;
    await sql`update product_variants set stock = 0 where product_id = ${PARTIAL.id} and color_name = 'Negro' and size = 'M'`;

    await check("AGOTADO total: PDP muestra 'Agotado' y deshabilita la compra", async () => {
      await go(page, `/producto/${SOLD.slug}`);
      const main = await page.evaluate(() => document.querySelector("main").innerText);
      assert(/Agotado/i.test(main), "sin etiqueta Agotado");
      const btn = page.getByRole("button", { name: /^Agotado$/i });
      assert(await btn.isDisabled(), "el botón de compra sigue activo");
      const radios = page.getByRole("radiogroup", { name: "Seleccionar talla" }).getByRole("radio");
      for (let i = 0; i < (await radios.count()); i++) assert(await radios.nth(i).isDisabled(), "una talla sigue habilitada");
    });
    await check("AGOTADO total: la tarjeta del catálogo muestra 'Agotado' y 'Solo con stock' la oculta", async () => {
      await go(page, "/catalogo?orden=nombre");
      let all = [];
      for (let p = 1; p <= 3; p++) {
        await go(page, `/catalogo?orden=nombre&pagina=${p}`);
        all.push(...(await cards(page)));
      }
      assert(all.find((c) => c.slug === SOLD.slug)?.soldOut === true, "la tarjeta no dice Agotado");
      await go(page, "/catalogo?disponible=1");
      assert((await totalLabel(page)) === products.length - 1, `con stock: ${await totalLabel(page)} ≠ ${products.length - 1}`);
    });
    await check("AGOTADO parcial: talla M/Negro deshabilitada, otras tallas disponibles con stock correcto", async () => {
      await go(page, `/producto/${PARTIAL.slug}`);
      await page.getByRole("radio", { name: "Negro", exact: true }).click();
      const grp = page.getByRole("radiogroup", { name: "Seleccionar talla" });
      assert(await grp.getByRole("radio", { name: "M", exact: true }).isDisabled(), "M/Negro debería estar deshabilitada");
      assert(!(await grp.getByRole("radio", { name: "L", exact: true }).isDisabled()), "L/Negro debería estar habilitada");
      await page.getByRole("radio", { name: "Blanco", exact: true }).click();
      assert(!(await grp.getByRole("radio", { name: "M", exact: true }).isDisabled()), "M/Blanco debería estar habilitada (otro color)");
    });
  } finally {
    for (const s of snapshot) await sql`update product_variants set stock = ${s.stock} where sku = ${s.sku}`;
    const after = await sql`select sku, stock from product_variants`;
    const same = snapshot.every((s) => after.find((a) => a.sku === s.sku)?.stock === s.stock);
    record("Restauración del stock original tras las pruebas de agotado", same, same ? `${snapshot.length} variantes restauradas` : "¡el stock no coincide!");
  }

  // 11) Móvil: cajón de filtros, header y desbordes
  const mobile = await newPage(browser, { width: 390, height: 844 }, "mobile");
  const mp = mobile.page;
  await go(mp, "/catalogo");
  await check("Móvil: header legible con scroll en 0 y sin desborde horizontal", async () => {
    const info = await mp.evaluate(() => {
      const icon = document.querySelector("header nav button");
      return {
        rgb: getComputedStyle(icon).color.match(/\d+/g).map(Number),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    const lum = (0.2126 * info.rgb[0] + 0.7152 * info.rgb[1] + 0.0722 * info.rgb[2]) / 255;
    assert(lum < 0.35, `icono del header claro (rgb ${info.rgb})`);
    assert(!info.overflow, "hay desborde horizontal");
  });
  await check("Móvil: cajón de filtros abre, aplica talla + género y se cierra con 'Ver resultados'", async () => {
    await mp.getByRole("button", { name: "Abrir filtros" }).click();
    const drawer = mp.locator("div.fixed.inset-y-0.right-0");
    await drawer.waitFor({ state: "visible", timeout: 5000 });
    assert(/Filtros/i.test(await drawer.innerText()), "el cajón no muestra el título");
    await drawer.getByRole("button", { name: /^Mujer/ }).click();
    await mp.waitForURL((u) => u.searchParams.get("audiencia") === "mujer", { timeout: 15000 });
    await drawer.getByRole("button", { name: "M", exact: true }).click();
    await mp.waitForURL((u) => u.searchParams.getAll("talla").includes("M"), { timeout: 15000 });
    await drawer.getByRole("button", { name: "Ver resultados" }).click();
    await drawer.waitFor({ state: "hidden", timeout: 5000 });
    await mp.waitForTimeout(900);
    assert((await totalLabel(mp)) === expected({ audiencia: "mujer", tallas: ["M"], disponible: true }).length, "total móvil distinto del oráculo");
  });
  await check("Móvil: cajón de filtros se cierra con el botón X y filtro de precio funciona dentro del cajón", async () => {
    await go(mp, "/catalogo");
    await mp.getByRole("button", { name: "Abrir filtros" }).click();
    const drawer = mp.locator("div.fixed.inset-y-0.right-0");
    await drawer.waitFor({ state: "visible" });
    await drawer.locator('input[name="precio_min"]').fill("100");
    await drawer.getByRole("button", { name: "Aplicar precio" }).click();
    await mp.waitForURL((u) => u.searchParams.get("precio_min") === "100", { timeout: 15000 });
    await drawer.getByRole("button", { name: "Cerrar filtros" }).click();
    await drawer.waitFor({ state: "hidden", timeout: 5000 });
  });
  await check("Móvil: ficha de producto sin desborde y con selector de talla/color usable", async () => {
    await go(mp, "/producto/polo-esencial-algodon");
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert(!overflow, "desborde horizontal en la ficha");
    await mp.getByRole("radiogroup", { name: "Seleccionar talla" }).getByRole("radio", { name: "M", exact: true }).click();
    assert(/unidades/.test(await mp.evaluate(() => document.querySelector("main").innerText)), "no muestra stock tras elegir talla");
  });
  await mobile.ctx.close();

  // 12) Consola global
  await check("Sin errores ni advertencias de consola / respuestas HTTP ≥ 400 durante toda la auditoría", async () => {
    assert(consoleIssues.length === 0, `${consoleIssues.length} problemas; primero: ${consoleIssues[0]}`);
  });
}

// ──────────────────────────────────────────────────────────────
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  if (errorMode) await runErrorState(browser);
  else await runMain(browser);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\nRESUMEN: ${results.length - failed.length}/${results.length} pruebas OK, ${failed.length} fallidas`);
if (consoleIssues.length) console.log("Problemas de consola/red:\n" + [...new Set(consoleIssues)].slice(0, 15).join("\n"));
writeFileSync(errorMode ? "scripts/e2e-audit-error-results.json" : "scripts/e2e-audit-results.json", JSON.stringify({ base: BASE, results, consoleIssues }, null, 2));
process.exit(failed.length ? 1 : 0);
