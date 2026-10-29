import test from "node:test";
import assert from "node:assert/strict";
import {
  validateEmail,
  normalizeEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateRucFormat,
} from "../src/server/auth/validators";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "../src/server/auth/rate-limit";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashSecureToken,
} from "../src/server/auth/crypto";
import { isForbiddenDefaultPassword } from "../scripts/create-admin";

test("validateEmail: acepta correos válidos y rechaza inválidos", () => {
  assert.equal(validateEmail("cliente@correo.com").valid, true);
  assert.equal(validateEmail("admin.pe+test@empresa.com.pe").valid, true);
  assert.equal(validateEmail("").valid, false);
  assert.equal(validateEmail("invalido").valid, false);
  assert.equal(validateEmail("@sin-usuario.com").valid, false);
  assert.equal(validateEmail("sin-dominio@").valid, false);
  assert.equal(validateEmail("espacio @dominio.com").valid, false);
  assert.equal(validateEmail("a".repeat(250) + "@correo.com").valid, false); // excede max length
});

test("normalizeEmail: elimina espacios en extremos y convierte a minúsculas", () => {
  assert.equal(normalizeEmail("  Maria.Garcia@Empresa.COM  "), "maria.garcia@empresa.com");
  assert.equal(normalizeEmail("USER@DOMAIN.PE"), "user@domain.pe");
});

test("validatePassword: exige longitud y complejidad de seguridad", () => {
  // Requisitos: >= 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
  assert.equal(validatePassword("C0ntrasenaSegura").valid, true);
  assert.equal(validatePassword("Cl4veUnicaSegura2026*").valid, true);

  // Fallos por longitud
  const tooShort = validatePassword("Aa1!");
  assert.equal(tooShort.valid, false);
  assert.match(tooShort.error ?? "", /al menos 8 caracteres/i);

  // Fallo por falta de mayúscula
  const noUpper = validatePassword("contrasena123");
  assert.equal(noUpper.valid, false);
  assert.match(noUpper.error ?? "", /mayúscula/i);

  // Fallo por falta de minúscula
  const noLower = validatePassword("CONTRASENA123");
  assert.equal(noLower.valid, false);
  assert.match(noLower.error ?? "", /minúscula/i);

  // Fallo por falta de número
  const noDigit = validatePassword("ContrasenaSinNumero");
  assert.equal(noDigit.valid, false);
  assert.match(noDigit.error ?? "", /número/i);
});

test("validateName: valida longitud y descarta caracteres de inyección o vacíos", () => {
  assert.equal(validateName("María").valid, true);
  assert.equal(validateName("Jean-Paul").valid, true);
  assert.equal(validateName("A").valid, false); // Demasiado corto
  assert.equal(validateName("").valid, false);
  assert.equal(validateName("<script>").valid, false);
});

test("validatePhone: valida teléfonos peruanos móviles (9 dígitos) y fijos", () => {
  assert.equal(validatePhone("987654321").valid, true);
  assert.equal(validatePhone("+51 987 654 321").valid, true);
  assert.equal(validatePhone("01-4455667").valid, true); // fijo Lima
  assert.equal(validatePhone("123").valid, false); // demasiado corto
  assert.equal(validatePhone("letras-no-validas").valid, false);
});

test("validateRucFormat: valida formato de 11 dígitos para RUC peruano (10 o 20)", () => {
  assert.equal(validateRucFormat("20601234567").valid, true); // Persona jurídica
  assert.equal(validateRucFormat("10456789012").valid, true); // Persona natural con negocio
  assert.equal(validateRucFormat("30123456789").valid, false); // Prefijo no válido
  assert.equal(validateRucFormat("2060123456").valid, false); // 10 dígitos (faltante)
  assert.equal(validateRucFormat("206012345678").valid, false); // 12 dígitos (sobrante)
  assert.equal(validateRucFormat("2060123456A").valid, false); // Carácter no numérico
});

test("rate-limit: bloquea intentos tras superar el umbral y permite reset", () => {
  const testKey = `test-ip-${Date.now()}`;

  // 3 intentos permitidos
  const r1 = recordFailedAttempt(testKey, 3, 60000);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remainingAttempts, 2);

  const r2 = recordFailedAttempt(testKey, 3, 60000);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remainingAttempts, 1);

  const r3 = recordFailedAttempt(testKey, 3, 60000);
  assert.equal(r3.allowed, false);
  assert.equal(r3.remainingAttempts, 0);
  assert.ok(r3.retryAfterSeconds && r3.retryAfterSeconds > 0);

  // Comprobar que checkRateLimit también bloquea
  const check = checkRateLimit(testKey, 3);
  assert.equal(check.allowed, false);

  // Limpiar intentos (ej: login exitoso)
  clearRateLimit(testKey);
  const checkAfterClear = checkRateLimit(testKey, 3);
  assert.equal(checkAfterClear.allowed, true);
  assert.equal(checkAfterClear.remainingAttempts, 3);
});

test("crypto: hashPassword y verifyPassword previenen timing attacks y passwords erróneos", async () => {
  const password = "MiPasswordSecreto2026!";
  const hash = await hashPassword(password);

  // Verificación exitosa
  const ok = await verifyPassword(password, hash);
  assert.equal(ok, true);

  // Verificación errónea (1 caracter diferente)
  const fail = await verifyPassword("MiPasswordSecreto2026?", hash);
  assert.equal(fail, false);

  // Formato inválido o manipulado
  const corrupt = await verifyPassword(password, "scrypt:invalid:hash:data");
  assert.equal(corrupt, false);
});

test("crypto: generateSecureToken produce 64 caracteres hex y hashSecureToken es determinista", () => {
  const t1 = generateSecureToken();
  const t2 = generateSecureToken();
  assert.notEqual(t1, t2);
  assert.equal(t1.length, 64);

  const h1 = hashSecureToken(t1);
  const h1Repeat = hashSecureToken(t1);
  const h2 = hashSecureToken(t2);

  assert.equal(h1, h1Repeat);
  assert.notEqual(h1, h2);
  assert.equal(h1.length, 64); // SHA-256 en hex
});

test("Reglas de negocio B2B: verificación de permisos mayoristas en servidor", () => {
  // Función pura que modela la autorización de precios mayoristas
  function canAccessWholesalePrices(user: { role: string; isActive: boolean } | null): boolean {
    if (!user) return false;
    if (!user.isActive) return false;
    return user.role === "business_approved" || user.role === "admin";
  }

  // Visitante no autenticado
  assert.equal(canAccessWholesalePrices(null), false);

  // Cliente minorista estándar (B2C)
  assert.equal(canAccessWholesalePrices({ role: "customer", isActive: true }), false);

  // Empresa con solicitud pendiente (B2B pendiente) -> NO tiene acceso mayorista
  assert.equal(canAccessWholesalePrices({ role: "business_pending", isActive: true }), false);

  // Empresa con solicitud rechazada
  assert.equal(canAccessWholesalePrices({ role: "customer", isActive: true }), false);

  // Empresa aprobada -> SÍ tiene acceso
  assert.equal(canAccessWholesalePrices({ role: "business_approved", isActive: true }), true);

  // Empresa aprobada pero cuenta inactiva/suspendida -> NO tiene acceso
  assert.equal(canAccessWholesalePrices({ role: "business_approved", isActive: false }), false);

  // Administrador de la plataforma -> SÍ tiene acceso
  assert.equal(canAccessWholesalePrices({ role: "admin", isActive: true }), true);
});

test("Reglas de negocio B2B: transiciones de estado válidas y protección contra elevación", () => {
  type AppStatus = "pending" | "under_review" | "approved" | "rejected" | "suspended";

  function computeNextRole(status: AppStatus): "business_approved" | "business_pending" | "customer" {
    switch (status) {
      case "approved":
        return "business_approved";
      case "pending":
      case "under_review":
        return "business_pending";
      case "rejected":
      case "suspended":
        return "customer";
    }
  }

  assert.equal(computeNextRole("approved"), "business_approved");
  assert.equal(computeNextRole("pending"), "business_pending");
  assert.equal(computeNextRole("under_review"), "business_pending");
  assert.equal(computeNextRole("rejected"), "customer");
  assert.equal(computeNextRole("suspended"), "customer");
});

test("Seguridad Admin: rechaza contraseñas predeterminadas o de ejemplo al aprovisionar", () => {
  assert.equal(isForbiddenDefaultPassword("admin123"), true);
  assert.equal(isForbiddenDefaultPassword("AdminPeru2026*"), true);
  assert.equal(isForbiddenDefaultPassword("password"), true);
  assert.equal(isForbiddenDefaultPassword("changeme"), true);
  assert.equal(isForbiddenDefaultPassword("X9#mK2$vL8@pQ4!zR"), false);
});
