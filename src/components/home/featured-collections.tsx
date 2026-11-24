"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Layers } from "lucide-react";
import { InfiniteCardSlider } from "@/components/ui/infinite-card-slider";

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
          <span className="bg-flow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] px-4 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-paper shadow-sm">
            <Layers className="size-3.5 text-amber-300" aria-hidden />
            <span>CATÁLOGO OFICIAL AMERICAN COLT JEANS™</span>
          </span>
          <h2
            id="colecciones-title"
            className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl"
          >
            ¡DESCUBRE NUESTRAS <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] bg-clip-text text-transparent">COLECCIONES!</span>
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
                  className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#1E3A8A]/25 to-transparent"
                />

                <span className="bg-flow absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2 py-0.5 font-mono text-[0.48rem] font-extrabold uppercase tracking-widest text-paper shadow-md sm:left-3.5 sm:top-3.5 sm:px-3 sm:py-1 sm:text-[0.6rem]">
                  {col.tag}
                </span>

                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5 sm:gap-3 sm:p-5">
                  <span className="min-w-0">
                    <span className="block font-sans text-xs font-black uppercase leading-tight tracking-tight text-paper drop-shadow-xs sm:text-lg">
                      {col.name}
                    </span>
                    <span className="mt-1 hidden line-clamp-2 text-xs leading-relaxed text-white/90 sm:block">
                      {col.description}
                    </span>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase tracking-wider text-amber-300 backdrop-blur-xs sm:mt-2.5 sm:px-2.5 sm:text-[0.63rem]">
                      Explorar Línea
                    </span>
                  </span>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-paper text-[#1E40AF] shadow-md transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-[#DC2626] group-hover:to-[#B91C1C] group-hover:text-paper sm:size-10 sm:rounded-2xl">
                    <ArrowUpRight className="size-3.5 sm:size-4" aria-hidden />
                  </span>
                </span>
              </Link>
            )}
          />
        </div>

      </div>
    </section>
  );
}
