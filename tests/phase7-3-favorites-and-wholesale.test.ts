import test from "node:test";
import assert from "node:assert/strict";
import { validateEmail, normalizeEmail } from "../src/server/auth/validators";

test("Fase 7.3 — Suscripción a Newsletter: validación estricta de correo electrónico", () => {
  assert.equal(validateEmail("cliente@empresa.pe").valid, true);
  assert.equal(validateEmail("contacto.boutique@gmail.com").valid, true);
  assert.equal(validateEmail("").valid, false);
  assert.equal(validateEmail("correo-invalido").valid, false);
  assert.equal(validateEmail("correo@sin-tld").valid, false);

  assert.equal(normalizeEmail("  CLIENTE@Empresa.PE  "), "cliente@empresa.pe");
});

test("Fase 7.3 — Favoritos: saneamiento de identificadores slug de prendas", () => {
  function sanitizeSlugs(rawSlugs?: string[]): string[] {
    if (!Array.isArray(rawSlugs)) return [];
    const unique = new Set<string>();
    for (const s of rawSlugs) {
      if (typeof s === "string") {
        const clean = s.trim().toLowerCase().slice(0, 200);
        if (clean && /^[a-z0-9-]+$/.test(clean)) {
          unique.add(clean);
        }
      }
      if (unique.size >= 100) break;
    }
    return Array.from(unique);
  }

  const input = [
    "conjunto-sastre-negro",
    "  polo-esencial-algodon  ",
    "blazer-camel-relajado",
    "conjunto-sastre-negro", // duplicado
    "invalido!@#$%",
    "<script>alert(1)</script>",
    "SELECT * FROM products",
    "",
  ];

  const result = sanitizeSlugs(input);
  assert.deepEqual(result, [
    "conjunto-sastre-negro",
    "polo-esencial-algodon",
    "blazer-camel-relajado",
  ]);
});

test("Fase 7.3 — Cotizaciones B2B: validación de borrador local y cantidades", () => {
  function validateDraftLine(qty: number, notes?: string) {
    const cleanQty = Math.trunc(Number(qty));
    if (!Number.isFinite(cleanQty) || cleanQty < 1 || cleanQty > 50000) {
      return { valid: false, error: "Cantidad fuera de rango (1 - 50,000)" };
    }
    return {
      valid: true,
      quantity: cleanQty,
      notes: typeof notes === "string" ? notes.trim().slice(0, 500) : "",
    };
  }

  assert.equal(validateDraftLine(12).valid, true);
  assert.equal(validateDraftLine(12).quantity, 12);
  assert.equal(validateDraftLine(0).valid, false);
  assert.equal(validateDraftLine(-5).valid, false);
  assert.equal(validateDraftLine(100000).valid, false);
  assert.equal(validateDraftLine(25.8).quantity, 25);
});

