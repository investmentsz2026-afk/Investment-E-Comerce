import { chromium } from "playwright-core";
import path from "node:path";

const ARTIFACTS_DIR = "C:/Users/colch/.gemini/antigravity/brain/7f66a57c-dbd3-4398-98c8-7e0a7431ef02";

async function run() {
  console.log("Iniciando verificación visual y funcional de la Ficha de Producto...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // 1. Navegar al producto Pantalón Drill King 767
  console.log("Navegando a /producto/pantalon-drill-king-767 ...");
  await page.goto("http://localhost:3000/producto/pantalon-drill-king-767", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.waitForTimeout(1000);

  // Tomar captura inicial del producto moderno (idéntico al target mockup)
  const initialScreenshotPath = path.join(ARTIFACTS_DIR, "producto-king-767-moderno.png");
  await page.screenshot({ path: initialScreenshotPath, fullPage: false });
  console.log(`✓ Captura moderna inicial guardada en: ${initialScreenshotPath}`);

  // 2. Probar los tres desplegables debajo de "Agregar a la bolsa"
  console.log("Probando desplegables 1, 2 y 3...");

  // Desplegable 1: Descripción
  const descBtn = page.locator("#accordion-description-header");
  await descBtn.focus();
  await descBtn.click();
  await page.waitForTimeout(400);

  // Verificar texto real y especificaciones
  const descContent = await page.locator("#accordion-description-content").textContent();
  console.log("Contenido de Descripción:", descContent?.slice(0, 100));

  // Desplegable 2: Envíos y cambios
  const shippingBtn = page.locator("#accordion-shipping-header");
  await shippingBtn.focus();
  await shippingBtn.click();
  await page.waitForTimeout(400);

  const shippingContent = await page.locator("#accordion-shipping-content").textContent();
  console.log("Envíos y cambios contiene:", shippingContent?.slice(0, 100));

  // Verificar que NO muestra tarifas en el desplegable
  if (shippingContent?.includes("S/ 15.00") || shippingContent?.includes("S/ 25.00")) {
    console.error("ALERTA: Se encontraron tarifas en el desplegable de envíos!");
  } else {
    console.log("✓ Correcto: No se muestran tarifas en el desplegable.");
  }

  // Verificar que contiene el texto obligatorio
  if (shippingContent?.includes("El costo de envío se calcula cuando eliges tu destino al finalizar la compra")) {
    console.log("✓ Correcto: Contiene el texto «El costo de envío se calcula cuando eliges tu destino al finalizar la compra».");
  }

  // Desplegable 3: Disponible por mayor
  const wholesaleBtn = page.locator("#accordion-wholesale-header");
  if (await wholesaleBtn.isVisible()) {
    await wholesaleBtn.focus();
    await wholesaleBtn.click();
    await page.waitForTimeout(400);
    const wholesaleContent = await page.locator("#accordion-wholesale-content").textContent();
    console.log("Disponible por mayor contiene:", wholesaleContent?.slice(0, 100));
  }

  // Tomar captura con los desplegables abiertos
  const openScreenshotPath = path.join(ARTIFACTS_DIR, "producto-desplegables-abiertos.png");
  await page.screenshot({ path: openScreenshotPath, fullPage: false });
  console.log(`✓ Captura con desplegables abiertos guardada en: ${openScreenshotPath}`);

  // 3. Probar Guía de Tallas Modal
  console.log("Probando modal Guía de Tallas...");
  const sizeGuideBtn = page.locator("button:has-text('Guía de tallas')");
  if (await sizeGuideBtn.isVisible()) {
    await sizeGuideBtn.click();
    await page.waitForTimeout(500);
    const sizeGuideScreenshot = path.join(ARTIFACTS_DIR, "producto-guia-tallas-modal.png");
    await page.screenshot({ path: sizeGuideScreenshot, fullPage: false });
    console.log(`✓ Captura modal guía de tallas guardada en: ${sizeGuideScreenshot}`);
    // Cerrar modal
    await page.locator("button:has-text('Entendido')").click();
    await page.waitForTimeout(400);
  }

  // 4. Probar un segundo producto para verificar que la descripción y datos cambian dinámicamente
  console.log("Navegando a un segundo producto...");
  await page.goto("http://localhost:3000/producto/camisa-denim-zair-slim-fit", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(1000);

  const secondTitle = await page.locator("h1").textContent();
  console.log("Segundo producto título:", secondTitle);

  // Abrir descripción de la camisa
  const secondDescBtn = page.locator("#accordion-description-header");
  await secondDescBtn.click();
  await page.waitForTimeout(400);
  const secondDescContent = await page.locator("#accordion-description-content").textContent();
  console.log("Segundo producto descripción:", secondDescContent?.slice(0, 100));

  const secondProductScreenshot = path.join(ARTIFACTS_DIR, "producto-camisa-zair-dinamico.png");
  await page.screenshot({ path: secondProductScreenshot, fullPage: false });
  console.log(`✓ Captura segundo producto guardada en: ${secondProductScreenshot}`);

  await browser.close();
  console.log("Verificación visual y funcional completada con éxito!");
}

run().catch((err) => {
  console.error("Error durante verificación:", err);
  process.exit(1);
});
