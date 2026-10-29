import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampPage,
  escapeLike,
  foldText,
  parseCatalogParams,
  parseSolesToCents,
  resolvePageSize,
} from "../src/lib/catalog-params";

test("parseSolesToCents convierte soles a céntimos enteros", () => {
  assert.equal(parseSolesToCents("100"), 10000);
  assert.equal(parseSolesToCents("79.90"), 7990);
  assert.equal(parseSolesToCents("79,9"), 7990);
  assert.equal(parseSolesToCents("0.1"), 10); // sin errores de coma flotante
});

test("parseSolesToCents rechaza valores inválidos", () => {
  for (const bad of ["", "abc", "-5", "1e3", "10.999", "99999999", undefined]) {
    assert.equal(parseSolesToCents(bad), undefined, `debería rechazar ${String(bad)}`);
  }
});

test("parseCatalogParams: filtros combinados, saneo y límites", () => {
  const f = parseCatalogParams({
    audiencia: "mujer",
    talla: ["M", "L", "M", ""],
    color: "Negro",
    novedades: "1",
    mayorista: "0",
    disponible: "1",
    precio_min: "50",
    precio_max: "300",
    orden: "precio-asc",
    pagina: "2",
    q: "  polo  ",
  });
  assert.equal(f.audiencia, "mujer");
  assert.deepEqual(f.tallas, ["M", "L"]);
  assert.deepEqual(f.colores, ["Negro"]);
  assert.equal(f.novedades, true);
  assert.equal(f.mayorista, false);
  assert.equal(f.disponible, true);
  assert.equal(f.precioMin, 5000);
  assert.equal(f.precioMax, 30000);
  assert.equal(f.orden, "precio-asc");
  assert.equal(f.pagina, 2);
  assert.equal(f.busqueda, "polo");
});

test("parseCatalogParams ignora valores no permitidos", () => {
  const f = parseCatalogParams({ audiencia: "robot", orden: "drop table", pagina: "-3", q: "   " });
  assert.equal(f.audiencia, undefined);
  assert.equal(f.orden, undefined);
  assert.equal(f.pagina, undefined);
  assert.equal(f.busqueda, undefined);
});

test("parseCatalogParams intercambia mínimo y máximo invertidos", () => {
  const f = parseCatalogParams({ precio_min: "300", precio_max: "50" });
  assert.equal(f.precioMin, 5000);
  assert.equal(f.precioMax, 30000);
});

test("parseCatalogParams respeta la categoría base", () => {
  assert.equal(parseCatalogParams({}, { categoria: "polos" }).categoria, "polos");
});

test("escapeLike neutraliza comodines", () => {
  assert.equal(escapeLike("100%_a\\b"), "100\\%\\_a\\\\b");
});

test("foldText ignora tildes y mayúsculas", () => {
  assert.equal(foldText("Sastrería ÍNDIGO"), "sastreria indigo");
});

test("resolvePageSize usa 12 por defecto y acota el máximo", () => {
  assert.equal(resolvePageSize(undefined), 12);
  assert.equal(resolvePageSize("abc"), 12);
  assert.equal(resolvePageSize("0"), 12);
  assert.equal(resolvePageSize("3"), 3);
  assert.equal(resolvePageSize("500"), 48);
});

test("clampPage nunca devuelve una página fuera de rango", () => {
  assert.equal(clampPage(undefined, 5), 1);
  assert.equal(clampPage(9, 3), 3);
  assert.equal(clampPage(2, 0), 1);
  assert.equal(clampPage(0, 3), 1);
});