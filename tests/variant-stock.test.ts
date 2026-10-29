import { test } from "node:test";
import assert from "node:assert/strict";
import { colorInStock, findVariant, isSoldOut, sizeInStock, totalStock } from "../src/lib/variant-stock";
import { formatPEN } from "../src/lib/format";

const variants = [
  { size: "S", colorName: "Negro", stock: 5, isActive: true },
  { size: "M", colorName: "Negro", stock: 0, isActive: true },
  { size: "S", colorName: "Arena", stock: 3, isActive: true },
  { size: "L", colorName: "Arena", stock: 99, isActive: false }, // inactiva: no cuenta
];

test("totalStock suma solo variantes activas", () => {
  assert.equal(totalStock(variants), 8);
});

test("isSoldOut detecta producto agotado", () => {
  assert.equal(isSoldOut(variants), false);
  assert.equal(isSoldOut(variants.map((v) => ({ ...v, stock: 0 }))), true);
  assert.equal(isSoldOut([]), true);
});

test("findVariant devuelve el stock de la combinación exacta", () => {
  assert.equal(findVariant(variants, "Negro", "S")?.stock, 5);
  assert.equal(findVariant(variants, "Arena", "S")?.stock, 3);
  assert.equal(findVariant(variants, "Negro", "M")?.stock, 0);
});

test("findVariant ignora variantes inactivas o inexistentes", () => {
  assert.equal(findVariant(variants, "Arena", "L"), null);
  assert.equal(findVariant(variants, "Rojo", "S"), null);
  assert.equal(findVariant(variants, null, "S"), null);
  assert.equal(findVariant(variants, "Negro", null), null);
});

test("sizeInStock depende del color elegido", () => {
  assert.equal(sizeInStock(variants, "Negro", "S"), true);
  assert.equal(sizeInStock(variants, "Negro", "M"), false); // M agotada en Negro
  assert.equal(sizeInStock(variants, "Arena", "L"), false); // variante inactiva
});

test("colorInStock", () => {
  assert.equal(colorInStock(variants, "Negro"), true);
  assert.equal(colorInStock(variants.map((v) => ({ ...v, stock: 0 })), "Negro"), false);
});

test("los precios se guardan en céntimos y se formatean en soles (minorista y mayorista por separado)", () => {
  const norm = (s: string) => s.replace(/\s/g, " ");
  assert.equal(norm(formatPEN(7900)), "S/ 79.00");
  assert.equal(norm(formatPEN(5400)), "S/ 54.00");
  assert.equal(norm(formatPEN(34900)), "S/ 349.00");
});