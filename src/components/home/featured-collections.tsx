"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Layers } from "lucide-react";
import { InfiniteCardSlider } from "@/components/ui/infinite-card-slider";

const categoryLinks = [
  { label: "Jeans Denim", href: "/catalogo/denim?audiencia=hombre" },
  { label: "Pantalones Drill", href: "/catalogo/pantalones?audiencia=hombre" },
  { label: "Bermuda Balance 770", href: "/producto/bermuda-drill-balance-770" },
  { label: "Camisas Zair & Kendall", href: "/catalogo/camisas?audiencia=hombre" },
  { label: "Polos Piqué Mark", href: "/catalogo/polos?audiencia=hombre" },
  { label: "Ventas por Mayor B2B", href: "/mayorista" },
] as const;

const COLLECTIONS_SLIDER = [
  {
    id: "col-denim",
    name: "Jeans & Denim 2026",
    description: "Relaxed 750, Comfort 762, Bull Denim 750 y Parker 769.",
    href: "/catalogo/denim?audiencia=hombre",
    tag: "COLECCIÓN ESTRELLA",
    imageSrc: "/catalogo-colt/jean-comfort-762-model.png",
    hoverImageSrc: "/catalogo-colt/jean-comfort-762-closeup.png",
  },
  {
    id: "col-drill-premium",
    name: "Línea Drill Premium",
    description: "Pantalones King 767, Fendy 769 y Rolex 770 en tela Stretch.",
    href: "/catalogo/pantalones?audiencia=hombre",
    tag: "DRILL STRETCH",
    imageSrc: "/catalogo-colt/pantalon-king-767-model.png",
    hoverImageSrc: "/catalogo-colt/pantalon-king-767-closeup.png",
  },
  {
    id: "col-camisas-hombre",
    name: "Camisas Zair & Kendall",
    description: "Camisas Denim Zair y Camisa Clásica Kendall Slim Fit.",
    href: "/catalogo/camisas?audiencia=hombre",
    tag: "SLIM FIT",
    imageSrc: "/catalogo-colt/camisa-zair-model.png",
    hoverImageSrc: "/catalogo-colt/camisa-zair-closeup.png",
  },
  {
    id: "col-polos-pima",
    name: "Polos Piqué Mark",
    description: "Polos clásicos cuello camisero en 100% algodón peruano.",
    href: "/catalogo/polos?audiencia=hombre",
    tag: "10 COLORES",
    imageSrc: "/catalogo-colt/polo-mark-model.png",
    hoverImageSrc: "/catalogo-colt/polo-mark-closeup.png",
  },
  {
    id: "col-bermudas",
    name: "Bermuda Balance 770",
    description: "Entalle recto Straight Fit en tela Drill Stretch fresca.",
    href: "/producto/bermuda-drill-balance-770",
    tag: "TEMPORADA",
    imageSrc: "/catalogo-colt/bermuda-balance-770-model.png",
    hoverImageSrc: "/catalogo-colt/bermuda-balance-770-closeup.png",
  },
  {
    id: "col-linea-clasica",
    name: "Jean Bull Denim 750",
    description: "Calce tradicional en tela rígida hasta la talla 46.",
    href: "/producto/jean-bull-denim-750",
    tag: "LÍNEA CLÁSICA",
    imageSrc: "/catalogo-colt/jean-bull-denim-750-model.png",
    hoverImageSrc: "/catalogo-colt/jean-bull-denim-750-closeup.png",
  },
] as const;

export function FeaturedCollections() {
  return (
    <section id="colecciones" aria-labelledby="colecciones-title" className="overflow-hidden bg-paper py-10 lg:py-14">
      <div className="shell">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0055FF] to-[#2563EB] px-4 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-paper shadow-sm">
            <Layers className="size-3.5 text-amber-300" aria-hidden />
            <span>CATÁLOGO OFICIAL AMERICAN COLT JEANS™</span>
          </span>
          <h2
            id="colecciones-title"
            className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl"
          >
            ¡DESCUBRE NUESTRAS <span className="text-[#0055FF]">COLECCIONES!</span>
          </h2>
        </div>

        {/* Carrusel 1x1 de Colecciones con cambio de Modelo -> Solo Prenda al pasar el mouse */}
        <div className="mt-5 px-2 sm:px-5">
          <InfiniteCardSlider
            items={COLLECTIONS_SLIDER}
            desktopCols={4}
            autoPlayMs={3500}
            keyExtractor={(item) => item.id}
            renderItem={(col) => (
              <Link
                href={col.href}
                aria-label={`${col.name}: ${col.description}`}
                className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-slate-100 text-left text-paper shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <Image
                  src={col.imageSrc}
                  alt={col.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-0"
                />
                <Image
                  src={col.hoverImageSrc}
                  alt={`Vista cercana de ${col.name}`}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="scale-105 object-cover opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#0055FF]/90 via-slate-950/20 to-transparent"
                />

                <span className="absolute left-3.5 top-3.5 rounded-full bg-[#EF233C] px-3 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-widest text-paper shadow-md">
                  {col.tag}
                </span>

                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <span className="min-w-0">
                    <span className="block font-sans text-lg font-black uppercase leading-tight tracking-tight text-paper drop-shadow-xs">
                      {col.name}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-white/90">
                      {col.description}
                    </span>
                    <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-[0.63rem] font-extrabold uppercase tracking-wider text-amber-300 backdrop-blur-xs">
                      Explorar Línea
                    </span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-paper text-[#0055FF] shadow-md transition-all duration-300 group-hover:bg-[#EF233C] group-hover:text-paper">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </span>
              </Link>
            )}
          />
        </div>

        {/* Botones rápidos de nuestras categorías reales */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-bone p-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#0055FF] shrink-0">
              Ir directo a categoría:
            </p>
            <ul className="flex flex-wrap gap-2">
              {categoryLinks.map((cat) => (
                <li key={cat.label}>
                  <Link
                    href={cat.href}
                    className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-paper px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0055FF] shadow-2xs transition-all hover:border-cochinilla hover:bg-cochinilla hover:text-paper"
                  >
                    <span>{cat.label}</span>
                    <ArrowRight className="size-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
