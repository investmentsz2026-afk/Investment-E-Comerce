"use client";

import { useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaPercent, FaTag } from "react-icons/fa6";
import { demoProducts } from "@/data/demo/products";
import type { CatalogProduct, Product } from "@/types/catalog";
import { ProductCard } from "@/components/product/product-card";
import { InfiniteCardSlider } from "@/components/ui/infinite-card-slider";
import { cn } from "@/lib/utils";

type Filter = "todo" | "denim" | "pantalones" | "camisas-polos" | "mayorista";

const filters: readonly { id: Filter; label: string }[] = [
  { id: "todo", label: "¡Todo el Catálogo!" },
  { id: "denim", label: "Jeans Denim" },
  { id: "pantalones", label: "Pantalones & Bermudas Drill" },
  { id: "camisas-polos", label: "Camisas & Polos" },
  { id: "mayorista", label: "Lotes por Mayor" },
];

interface FeaturedProductsProps {
  products?: CatalogProduct[];
}

export function FeaturedProducts({ products: initialProducts }: FeaturedProductsProps = {}) {
  const [filter, setFilter] = useState<Filter>("todo");
  const officialDemoProducts = demoProducts.filter((p) => p.id.startsWith("colt-"));
  const baseProducts: readonly (Product | CatalogProduct)[] =
    initialProducts && initialProducts.length > 0 ? initialProducts : officialDemoProducts;

  const allProducts: readonly (Product | CatalogProduct)[] =
    baseProducts.length >= 6 ? baseProducts : [...baseProducts, ...officialDemoProducts].slice(0, 11);

  const visible = allProducts.filter((p) => {
    if (filter === "todo") return true;
    if (filter === "mayorista") return Boolean(p.wholesale);
    const cat = p.category.toLowerCase();
    if (filter === "denim") return cat.includes("denim") || cat.includes("jean");
    if (filter === "pantalones") return cat.includes("pantalon") || cat.includes("pantalón");
    if (filter === "camisas-polos") return cat.includes("camisa") || cat.includes("polo");
    return true;
  });

  const sliderItems = visible.length > 0 ? visible : allProducts;

  return (
    <section id="destacados" aria-labelledby="destacados-title" className="bg-white py-10 lg:py-14">
      <div className="shell space-y-12">
        {/* BLOQUE 1: Carrusel Infinito 1 por 1 "¡LO MÁS NUEVO!" */}
        <div>
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-4 py-1 font-mono text-[0.65rem] font-extrabold uppercase tracking-widest text-white shadow-md">
              <FaTag className="size-3 text-white" aria-hidden />
              <span>COLECCIÓN AMERICAN COLT JEANS™ · PASA EL MOUSE PARA VER SOLO LA PRENDA</span>
            </span>

            <h2
              id="destacados-title"
              className="mt-2.5 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              ¡LO MÁS <span className="text-[#0055FF]">NUEVO!</span>
            </h2>

            {/* Pestañas centradas enfocadas en nuestro catálogo oficial */}
            <div
              role="tablist"
              aria-label="Filtrar productos"
              className="mt-4 flex flex-wrap items-center justify-center gap-2"
            >
              {filters.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-[#EF233C] to-[#B91C24] text-white shadow-md scale-105"
                        : "border border-blue-100 bg-blue-50/70 text-[#0055FF] hover:border-[#0055FF] hover:bg-[#0055FF] hover:text-white",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider 1x1 Infinito con flechas < y > a los costados */}
          <div className="mt-6 px-2 sm:px-5">
            <InfiniteCardSlider
              key={filter}
              items={sliderItems}
              desktopCols={4}
              autoPlayMs={3100}
              keyExtractor={(item) => String(item.id)}
              renderItem={(product, idx) => (
                <ProductCard product={product as Product} eager={idx < 4} />
              )}
            />
          </div>
        </div>

        {/* BLOQUE 2: Segundo Carrusel 1x1 Redondeado (`rounded-3xl`) y Reluciente */}
        <div className="rounded-3xl border-2 border-blue-100 bg-gradient-to-b from-blue-50/80 via-white to-blue-50/60 p-5 shadow-lg sm:p-7 lg:p-8">
          <div className="flex flex-col items-start justify-between gap-3 border-b border-blue-100 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EF233C] to-[#B91C24] text-white shadow-md">
                <FaPercent className="size-4 text-white" aria-hidden />
              </span>
              <div>
                <h3 className="font-sans text-lg font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
                  ¡OFERTAS 3x2 Y <span className="text-[#0055FF]">MÁS VENDIDOS!</span>
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Pasa el cursor sobre cualquier tarjeta para ver el detalle cercano de la prenda sola
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/catalogo?novedades=1&oferta=50"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
              >
                <span>Ver Todas las Ofertas</span>
                <FaArrowRight className="size-3" aria-hidden />
              </Link>
              <Link
                href="/mayorista/cotizaciones"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#EF233C] to-[#B91C24] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
              >
                <span>Cotizar por Mayor</span>
              </Link>
            </div>
          </div>

          <div className="mt-5 px-2 sm:px-4">
            <InfiniteCardSlider
              items={[...allProducts].reverse()}
              desktopCols={4}
              autoPlayMs={3600}
              keyExtractor={(item) => `top-${item.id}`}
              renderItem={(product) => (
                <ProductCard product={product as Product} />
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
