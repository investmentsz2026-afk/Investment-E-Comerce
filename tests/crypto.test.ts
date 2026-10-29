import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, generateSecureToken, hashSecureToken } from "../src/server/auth/crypto";

test("hashPassword genera hashes con formato scrypt válido y sales únicas", async () => {
  const hash1 = await hashPassword("MiPasswordSeguro123!");
  const hash2 = await hashPassword("MiPasswordSeguro123!");

  assert(hash1.startsWith("scrypt$"));
  assert(hash2.startsWith("scrypt$"));
  assert.notEqual(hash1, hash2, "Dos hashes con la misma contraseña deben tener sales distintas");
});

test("verifyPassword valida contraseñas correctas y rechaza incorrectas", async () => {
  const pwd = "InvestmentsTextil2026*";
  const hash = await hashPassword(pwd);

  assert.equal(await verifyPassword(pwd, hash), true, "Debe validar la contraseña correcta");
  assert.equal(await verifyPassword("PasswordEquivocado!", hash), false, "Debe rechazar contraseña incorrecta");
  assert.equal(await verifyPassword("", hash), false, "Debe rechazar contraseña vacía");
  assert.equal(await verifyPassword(pwd, "hash_invalido"), false, "Debe manejar hash corrupto sin lanzar excepción");
});

test("generateSecureToken y hashSecureToken producen valores consistentes y de alta entropía", () => {
  const t1 = generateSecureToken(32);
  const t2 = generateSecureToken(32);

  assert.equal(t1.length, 64, "Token de 32 bytes debe medir 64 caracteres hex");
  assert.notEqual(t1, t2);

  const h1 = hashSecureToken(t1);
  const h2 = hashSecureToken(t1);
  assert.equal(h1, h2, "El hash del mismo token debe ser determinista");
  assert.equal(h1.length, 64, "SHA-256 debe medir 64 caracteres hex");
});
