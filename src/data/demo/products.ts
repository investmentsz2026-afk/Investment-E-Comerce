/**
 * ⚠️ DATOS DE DEMOSTRACIÓN — NO SON PRODUCTOS REALES.
 * Sirven únicamente para presentar el diseño de la Fase 1.
 * En la Fase 2 serán reemplazados por consultas a Neon PostgreSQL
 * (ver src/server/db) manteniendo el mismo contrato de tipos (`Product`).
 */
import type { Product } from "@/types/catalog";

import casacaUtilitaria from "@/assets/images/products/casaca-utilitaria.jpg";
import camisaPopelina from "@/assets/images/products/camisa-popelina.jpg";
import poloPima from "@/assets/images/products/polo-pima.jpg";
import blazerCamel from "@/assets/images/products/blazer-camel.jpg";
import casacaDenim from "@/assets/images/products/casaca-denim.jpg";
import blusaLazo from "@/assets/images/products/blusa-lazo.jpg";
import casacaBiker from "@/assets/images/products/casaca-biker.jpg";
import conjuntoSastre from "@/assets/images/products/conjunto-sastre.jpg";

export const demoProducts = [
  {
    id: "demo-001",
    slug: "conjunto-sastre-negro",
    name: "Blazer sastre entallado",
    audience: "mujer",
    category: "Sastrería",
    price: 34900,
    colors: [
      { name: "Negro", swatch: "#141312" },
      { name: "Gris carbón", swatch: "#3b3a38" },
    ],
    sizes: ["XS", "S", "M", "L"],
    badge: "nuevo",
    image: { src: conjuntoSastre, alt: "Modelo con blazer sastre negro entallado y pantalón a juego en la calle" },
    wholesale: { minQuantity: 12, unitPrice: 27900 },
  },
  {
    id: "demo-002",
    slug: "polo-esencial-algodon",
    name: "Polo esencial de algodón",
    audience: "hombre",
    category: "Polos",
    price: 7900,
    colors: [
      { name: "Blanco", swatch: "#f4f2ed" },
      { name: "Negro", swatch: "#161514" },
      { name: "Arena", swatch: "#cdbfa8" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    badge: "esencial",
    image: { src: poloPima, alt: "Modelo con polo blanco de cuello redondo sobre fondo neutro" },
    wholesale: { minQuantity: 24, unitPrice: 5400 },
  },
  {
    id: "demo-003",
    slug: "blusa-lazo-satinada",
    name: "Blusa satinada con lazo",
    audience: "mujer",
    category: "Blusas",
    price: 15900,
    colors: [
      { name: "Marfil", swatch: "#efe9dc" },
      { name: "Negro", swatch: "#151413" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    image: { src: blusaLazo, alt: "Modelo con blusa marfil de manga larga y lazo negro al cuello" },
  },
  {
    id: "demo-004",
    slug: "blazer-camel-relajado",
    name: "Blazer camel de corte relajado",
    audience: "hombre",
    category: "Blazers",
    price: 32900,
    compareAtPrice: 38900,
    colors: [
      { name: "Camel", swatch: "#b8875a" },
      { name: "Grafito", swatch: "#3d3c3a" },
    ],
    sizes: ["S", "M", "L", "XL"],
    badge: "edicion-limitada",
    image: { src: blazerCamel, alt: "Modelo sentado con blazer camel, polo blanco y pantalón claro" },
  },
  {
    id: "demo-005",
    slug: "casaca-utilitaria-oliva",
    name: "Casaca utilitaria oversize",
    audience: "mujer",
    category: "Casacas",
    price: 27900,
    colors: [
      { name: "Oliva", swatch: "#5b5a3c" },
      { name: "Arena", swatch: "#cdbfa8" },
    ],
    sizes: ["S", "M", "L"],
    badge: "mayorista",
    image: { src: casacaUtilitaria, alt: "Modelo con casaca utilitaria verde oliva y gorro negro" },
    wholesale: { minQuantity: 12, unitPrice: 21900 },
  },
  {
    id: "demo-006",
    slug: "camisa-popelina-blanca",
    name: "Camisa de popelina",
    audience: "hombre",
    category: "Camisas",
    price: 13900,
    colors: [
      { name: "Blanco", swatch: "#f6f5f1" },
      { name: "Celeste", swatch: "#c9d6e3" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    badge: "mayorista",
    image: { src: camisaPopelina, alt: "Camisas blancas de popelina colgadas en una barra" },
    wholesale: { minQuantity: 24, unitPrice: 9900 },
  },
  {
    id: "demo-007",
    slug: "casaca-biker-negra",
    name: "Casaca biker acolchada",
    audience: "mujer",
    category: "Casacas",
    price: 39900,
    colors: [{ name: "Negro", swatch: "#121110" }],
    sizes: ["XS", "S", "M", "L"],
    badge: "nuevo",
    image: { src: casacaBiker, alt: "Casaca biker negra con cierres metálicos sobre tela blanca" },
  },
  {
    id: "demo-008",
    slug: "casaca-denim-indigo",
    name: "Casaca denim índigo",
    audience: "hombre",
    category: "Denim",
    price: 22900,
    colors: [
      { name: "Índigo", swatch: "#2b3a5c" },
      { name: "Negro lavado", swatch: "#2a2a2c" },
    ],
    sizes: ["S", "M", "L", "XL"],
    image: { src: casacaDenim, alt: "Casaca de denim índigo con cuello de pana colgada sobre fondo negro" },
    wholesale: { minQuantity: 12, unitPrice: 17400 },
  },
] as const satisfies readonly Product[];
