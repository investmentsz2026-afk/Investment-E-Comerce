"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { demoProducts } from "@/data/demo/products";
import type { Audience, CatalogProduct, Product } from "@/types/catalog";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

type Filter = "todo" | Exclude<Audience, "unisex">;

const filters: readonly { id: Filter; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "mujer", label: "Mujer" },
  { id: "hombre", label: "Hombre" },
];

interface FeaturedProductsProps {
  products?: CatalogProduct[];
}

export function FeaturedProducts({ products: initialProducts }: FeaturedProductsProps = {}) {
  const [filter, setFilter] = useState<Filter>("todo");
  const products: readonly (Product | CatalogProduct)[] =
    initialProducts && initialProducts.length > 0 ? initialProducts : demoProducts;

  const visible = filter === "todo" ? products : products.filter((p) => p.audience === filter);

  return (
    <section id="destacados" aria-labelledby="destacados-title" className="bg-paper py-24 lg:py-36">
      <div className="shell">
        <SectionHeading
          id="destacados-title"
          index="03"
          label="Selección"
          title={["Piezas", <em key="d">destacadas.</em>]}
          description="Una primera mirada a la temporada: prendas versátiles confeccionadas con materias primas nobles, con disponibilidad minorista y tarifas preferenciales por volumen."
        />

        <Reveal className="mt-12 flex flex-col gap-5 border-b border-ink/10 sm:flex-row sm:items-end sm:justify-between lg:mt-16">
          <LayoutGroup id="product-filters">
            <div role="tablist" aria-label="Filtrar productos" className="flex gap-8">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  aria-controls="destacados-grid"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "relative pb-4 text-[0.72rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300",
                    filter === f.id ? "text-ink" : "text-taupe-400 hover:text-ink",
                  )}
                >
                  {f.label}
                  {filter === f.id ? (
                    <motion.span
                      layoutId="filter-indicator"
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-ink"
                      transition={{ duration: 0.5, ease: ease.luxe }}
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </LayoutGroup>
          <p className="eyebrow pb-4 text-taupe-400">Selección de temporada · Compra minorista y mayorista</p>
        </Reveal>

        <motion.ul
          id="destacados-grid"
          role="tabpanel"
          layout
          className="mt-10 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 md:grid-cols-3 lg:mt-14 lg:gap-x-6 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((product, i) => (
              <motion.li
                key={product.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.3 } }}
                transition={{ duration: 0.9, ease: ease.luxe, delay: (i % 4) * 0.07 }}
              >
                <ProductCard product={product as Product} eager={i < 2} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        <Reveal className="mt-16 flex flex-col items-center gap-4 text-center lg:mt-20">
          <Button href="/catalogo" variant="primary" size="lg" icon={<ArrowUpRight className="size-4" />}>
            Ver todo el catálogo
          </Button>
          <p className="max-w-sm text-xs leading-relaxed text-taupe-500">
            Explora nuestra colección completa con filtros por talla, color, categoría y modalidad comercial.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
