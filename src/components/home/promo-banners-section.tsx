"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaEye, FaPercent, FaTag, FaTags } from "react-icons/fa6";
import { InfiniteCardSlider } from "@/components/ui/infinite-card-slider";
import type { PublicPromotionItem } from "@/lib/promo-display";

interface PromoBannersSectionProps {
  promotions?: PublicPromotionItem[];
}

const VISUAL_CATEGORIES = [
  {
    id: "cat-drill",
    label: "Pantalones Drill",
    subtitle: "King 767 · Skinny Fit",
    badge: "Línea Drill",
    href: "/catalogo/pantalones?audiencia=hombre",
    imageSrc: "/catalogo-colt/pantalon-king-767-model.png",
    hoverImageSrc: "/catalogo-colt/pantalon-king-767-closeup.png",
    accent: "blue",
  },
  {
    id: "cat-jeans",
    label: "Jeans Denim",
    subtitle: "Relaxed 750 & Comfort 762",
    badge: "Catálogo 2026",
    href: "/catalogo/denim?audiencia=hombre",
    imageSrc: "/catalogo-colt/jean-relaxed-750-model.png",
    hoverImageSrc: "/catalogo-colt/jean-relaxed-750-closeup.png",
    accent: "red",
  },
  {
    id: "cat-camisas",
    label: "Camisas Denim",
    subtitle: "Camisa Zair · Slim Fit",
    badge: "Slim Fit",
    href: "/catalogo/camisas?audiencia=hombre",
    imageSrc: "/catalogo-colt/camisa-zair-model.png",
    hoverImageSrc: "/catalogo-colt/camisa-zair-closeup.png",
    accent: "blue",
  },
  {
    id: "cat-polos",
    label: "Polos Piqué Mark",
    subtitle: "Classic Fit · 10 Colores",
    badge: "Algodón Peruano",
    href: "/catalogo/polos?audiencia=hombre",
    imageSrc: "/catalogo-colt/polo-mark-model.png",
    hoverImageSrc: "/catalogo-colt/polo-mark-closeup.png",
    accent: "red",
  },
  {
    id: "cat-fendy",
    label: "Drill Fendy 769",
    subtitle: "Slim Fit · 9 Colores",
    badge: "Stretch",
    href: "/producto/pantalon-drill-fendy-769",
    imageSrc: "/catalogo-colt/pantalon-fendy-769-model.png",
    hoverImageSrc: "/catalogo-colt/pantalon-fendy-769-closeup.png",
    accent: "blue",
  },
  {
    id: "cat-bermudas",
    label: "Bermuda Balance 770",
    subtitle: "Drill Stretch · Tallas 28 a 46",
    badge: "Temporada",
    href: "/producto/bermuda-drill-balance-770",
    imageSrc: "/catalogo-colt/bermuda-balance-770-model.png",
    hoverImageSrc: "/catalogo-colt/bermuda-balance-770-closeup.png",
    accent: "red",
  },
  {
    id: "cat-rolex",
    label: "Drill Rolex 770",
    subtitle: "Straight Fit · Bota Recta",
    badge: "Confort",
    href: "/producto/pantalon-drill-rolex-770",
    imageSrc: "/catalogo-colt/pantalon-rolex-770-model.png",
    hoverImageSrc: "/catalogo-colt/pantalon-rolex-770-closeup.png",
    accent: "blue",
  },
  {
    id: "cat-kendall",
    label: "Camisa Kendall",
    subtitle: "Slim Fit · 8 Colores",
    badge: "Nuevo Ingreso",
    href: "/producto/camisa-clasica-kendall-slim-fit",
    imageSrc: "/catalogo-colt/camisa-kendall-model.png",
    hoverImageSrc: "/catalogo-colt/camisa-kendall-closeup.png",
    accent: "red",
  },
] as const;

const CAMPAIGN_BANNERS = [
  {
    id: "banner-hombre",
    tag: "CATÁLOGO HOMBRE 2026",
    discount: "3x2 / -50% OFF",
    title: "JEANS, PANTALONES DRILL & CAMISAS",
    subtitle: "King 767, Fendy 769, Rolex 770, Comfort 762, Relaxed 750 y Camisa Zair.",
    cta: "Ver Catálogo Hombre",
    href: "/catalogo?audiencia=hombre",
    imageSrc: "/catalogo-colt/16-portada-jeans-2026.png",
    tone: "blue",
  },
  {
    id: "banner-drill",
    tag: "LÍNEA DRILL PREMIUM",
    discount: "TALLAS 28 A 46",
    title: "LÍNEA DRILL & LÍNEA CLÁSICA AMERICAN COLT",
    subtitle: "Calce Skinny, Slim, Straight y Classic Fit con máxima durabilidad.",
    cta: "Explorar Pantalones",
    href: "/catalogo/pantalones?audiencia=hombre",
    imageSrc: "/catalogo-colt/08-linea-drill-premium.png",
    tone: "red",
  },
  {
    id: "banner-mayorista",
    tag: "NEGOCIOS Y TIENDAS",
    discount: "TARIFAS FÁBRICA",
    title: "VENTAS POR MAYOR B2B DESDE 12 UDS.",
    subtitle: "Surtido completo del catálogo oficial con factura electrónica RUC.",
    cta: "Ir a Ventas por Mayor",
    href: "/mayorista/cotizaciones",
    imageSrc: "/catalogo-colt/02-campana-bolsas.png",
    tone: "blue",
  },
] as const;

export function PromoBannersSection({ promotions = [] }: PromoBannersSectionProps) {
  const homePromos = promotions.filter((p) => p.showInHomeBanner);

  return (
    <section aria-label="Categorías en carrusel y promociones" className="bg-white py-8 lg:py-12">
      <div className="shell space-y-10">
        {/* 1. Carrusel Infinito 1 por 1 de Categorías (Al pasar el mouse cambia de Modelo -> Solo Prenda) */}
        <div>
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 font-mono text-[0.65rem] font-extrabold uppercase tracking-widest text-[#0055FF]">
              <FaEye className="size-3.5 text-[#EF233C]" aria-hidden />
              <span>PASA EL MOUSE PARA VER SOLO LA PRENDA DE CERCA</span>
            </span>
            <h2 className="mt-1.5 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              ¡EXPLORA NUESTRAS <span className="text-[#0055FF]">LÍNEAS!</span>
            </h2>
          </div>

          <div className="mt-5 px-2 sm:px-5">
            <InfiniteCardSlider
              items={VISUAL_CATEGORIES}
              desktopCols={4}
              autoPlayMs={2800}
              keyExtractor={(item) => item.id}
              renderItem={(cat) => (
                <Link
                  href={cat.href}
                  className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-blue-100 bg-slate-100 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0055FF] hover:shadow-[0_16px_38px_-10px_rgba(0,85,255,0.35)]"
                >
                  {/* Imagen 1: Modelo Completo */}
                  <Image
                    src={cat.imageSrc}
                    alt={cat.label}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-0"
                  />
                  {/* Imagen 2 (Hover): Solo la Prenda de Cerca */}
                  <Image
                    src={cat.hoverImageSrc}
                    alt={`Detalle cercano de ${cat.label}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="scale-105 object-cover opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100"
                  />
                  <div
                    aria-hidden
                    className={
                      cat.accent === "blue"
                        ? "absolute inset-0 bg-gradient-to-t from-[#0044CC]/90 via-slate-950/15 to-transparent"
                        : "absolute inset-0 bg-gradient-to-t from-[#91151B]/90 via-slate-950/15 to-transparent"
                    }
                  />

                  <span
                    className={
                      cat.accent === "blue"
                        ? "absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-3 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-white shadow-md"
                        : "absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#EF233C] to-[#B91C24] px-3 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-white shadow-md"
                    }
                  >
                    {cat.badge}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4 text-left text-white">
                    <h3 className="font-sans text-lg font-black uppercase leading-tight tracking-tight sm:text-xl">
                      {cat.label}
                    </h3>
                    <p className="mt-0.5 text-xs text-blue-100">{cat.subtitle}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[0.68rem] font-black uppercase tracking-wider text-[#0055FF] shadow-md transition-all duration-200 group-hover:translate-x-1 group-hover:bg-amber-300 group-hover:text-slate-950">
                      <span>Ver Prendas</span>
                      <FaArrowRight className="size-3" aria-hidden />
                    </span>
                  </div>
                </Link>
              )}
            />
          </div>
        </div>

        {/* 2. Promociones Activas desde el Panel de Admin (/admin/promociones) — Sin códigos, directo al filtro */}
        {homePromos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <FaTags className="size-3.5 text-[#EF233C]" aria-hidden />
              <h3 className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#0055FF]">
                Ofertas Especiales Activas — Toca para Filtrar Prendas con Descuento
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {homePromos.slice(0, 4).map((promo, i) => {
                const baseHref = promo.ctaHref || "/catalogo";
                const offerHref = baseHref.includes("?")
                  ? `${baseHref}&oferta=${promo.discountPercent}`
                  : `${baseHref}?novedades=1&oferta=${promo.discountPercent}`;
                return (
                  <Link
                    key={promo.id}
                    href={offerHref}
                    className={
                      i % 2 === 0
                        ? "group relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#2563EB] p-6 text-white shadow-xl transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-center"
                        : "group relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border-2 border-red-200 bg-gradient-to-r from-[#B91C24] via-[#EF233C] to-[#91151B] p-6 text-white shadow-xl transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-center"
                    }
                  >
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-0.5 font-mono text-[0.65rem] font-black uppercase text-[#0055FF] shadow-xs">
                        <FaPercent className="size-3 text-[#EF233C]" aria-hidden />
                        <span>OFERTA ACTIVA · HASTA -{promo.discountPercent}% OFF</span>
                      </div>
                      <h4 className="font-sans text-lg font-black uppercase tracking-tight sm:text-xl">
                        {promo.name}
                      </h4>
                      <p className="text-xs text-white/95 leading-relaxed">
                        {promo.cleanDescription}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0055FF] shadow-md transition-transform group-hover:scale-105 group-hover:bg-amber-300 group-hover:text-slate-950">
                      <span>Ver Productos</span>
                      <FaArrowRight className="size-3" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Mosaico de 3 Banners Interactivos Redondeados (`rounded-3xl`) y Relucientes */}
        <div className="grid gap-5 md:grid-cols-3">
          {CAMPAIGN_BANNERS.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-3xl border-2 border-blue-100 bg-[#0055FF] p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:min-h-[310px]"
            >
              <Image
                src={banner.imageSrc}
                alt={banner.title}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                aria-hidden
                className={
                  banner.tone === "blue"
                    ? "absolute inset-0 bg-gradient-to-t from-[#0044CC]/95 via-[#0055FF]/55 to-transparent"
                    : "absolute inset-0 bg-gradient-to-t from-[#91151B]/95 via-[#0055FF]/40 to-transparent"
                }
              />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white px-3 py-1 font-mono text-[0.6rem] font-black uppercase tracking-wider text-[#0055FF] shadow-xs">
                  {banner.tag}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#EF233C] to-[#B91C24] px-3 py-1 font-mono text-[0.65rem] font-black uppercase text-white shadow-md">
                  <FaTag className="size-3 text-white" aria-hidden />
                  {banner.discount}
                </span>
              </div>

              <div className="relative z-10 mt-auto pt-8">
                <h3 className="font-sans text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
                  {banner.title}
                </h3>
                <p className="mt-1.5 text-xs text-blue-100 line-clamp-2">
                  {banner.subtitle}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.7rem] font-black uppercase tracking-wider text-[#0055FF] shadow-md transition-all duration-200 group-hover:translate-x-1 group-hover:bg-amber-300 group-hover:text-slate-950">
                  <span>{banner.cta}</span>
                  <FaArrowRight className="size-3" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
