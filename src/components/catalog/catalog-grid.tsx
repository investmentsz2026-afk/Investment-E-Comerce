"use client";

import { motion, AnimatePresence } from "motion/react";
import type { CatalogProduct } from "@/types/catalog";
import { ProductCard } from "@/components/product/product-card";
import { ease } from "@/lib/motion";

interface CatalogGridProps {
  products: CatalogProduct[];
  /** Propiedad preservada por compatibilidad; ProductCard gestiona sus propios enlaces de navegación. */
  linkToProduct?: boolean;
}

/** Cuadrícula adaptable de productos con animaciones de aparición progresiva. */
export function CatalogGrid({ products }: CatalogGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <motion.ul
      layout
      className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {products.map((product, i) => (
          <motion.li
            key={product.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.3 } }}
            transition={{ duration: 0.9, ease: ease.luxe, delay: (i % 4) * 0.06 }}
          >
            <ProductCard product={product} eager={i < 4} />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
