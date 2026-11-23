"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaEye, FaPercent, FaTag, FaTags } from "react-icons/fa6";
import { InfiniteCardSlider } from "@/components/ui/infinite-card-slider";
import type { PublicPromotionItem } from "@/lib/promo-display";
import type { HomeLineItem } from "@/server/queries/lookbook";

interface PromoBannersSectionProps {
  promotions?: PublicPromotionItem[];
  lines?: HomeLineItem[];
}

const DEFAULT_VISUAL_CATEGORIES: readonly HomeLineItem[] = [
  {
    id: 1,
    title: "Pantalones Drill",
    subtitle: "King 767 · Skinny Fit",
    badge: "Línea Drill",
    linkHref: "/catalogo/pantalones?audiencia=hombre",
    imageUrl: "/catalogo-colt/pantalon-king-767-model.png",
    hoverImageUrl: "/catalogo-colt/pantalon-king-767-closeup.png",
    accent: "blue",
    sortOrder: 1,
    isActive: true,
  },
];

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

export function PromoBannersSection({
  promotions = [],
  lines,
}: PromoBannersSectionProps) {
  const homePromos = promotions.filter((p) => p.showInHomeBanner);
  const displayLines = lines !== undefined ? lines : DEFAULT_VISUAL_CATEGORIES;

  return (
    <section
      id="lineas-catalogo"
      aria-label="Categorías en carrusel y promociones"
      className="bg-white py-8 lg:py-12"
    >
      <div className="shell space-y-10">
        {/* 1. Carrusel Infinito 1 por 1 de Categorías (Al pasar el mouse cambia de Modelo -> Solo Prenda) */}
        <div>
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50/80 px-3.5 py-1 font-mono text-[0.65rem] font-extrabold uppercase tracking-widest text-[#1E40AF]">
              <FaEye className="size-3.5 text-[#DC2626]" aria-hidden />
              <span>PASA EL MOUSE PARA VER SOLO LA PRENDA DE CERCA</span>
            </span>
            <h2 className="mt-1.5 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              ¡EXPLORA NUESTRAS <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] bg-clip-text text-transparent">LÍNEAS!</span>
            </h2>
          </div>

          <div className="mt-5 px-2 sm:px-5">
            <InfiniteCardSlider
              items={displayLines}
              desktopCols={4}
              autoPlayMs={2800}
              keyExtractor={(item) => String(item.id)}
              renderItem={(cat) => (
                <Link
                  href={cat.linkHref || "/catalogo"}
                  className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-slate-200/80 bg-slate-100 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-400 hover:shadow-[0_16px_38px_-10px_rgba(37,99,235,0.3)]"
                >
                  {/* Imagen 1: Modelo Completo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.imageUrl}
                    alt={cat.title}
                    className="size-full object-cover object-top transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-0"
                  />
                  {/* Imagen 2 (Hover): Solo la Prenda de Cerca */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.hoverImageUrl || cat.imageUrl}
                    alt={`Detalle cercano de ${cat.title}`}
                    className="absolute inset-0 size-full scale-105 object-cover object-top opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100"
                  />
                  <div
                    aria-hidden
                    className={
                      cat.accent === "blue"
                        ? "absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#1E3A8A]/35 to-transparent"
                        : "absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#1E293B]/35 to-transparent"
                    }
                  />

                  <span
                    className={
                      cat.accent === "blue"
                        ? "bg-flow absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-3 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-white shadow-md"
                        : "bg-flow absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-white shadow-md"
                    }
                  >
                    {cat.badge}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4 text-left text-white">
                    <h3 className="font-sans text-lg font-black uppercase leading-tight tracking-tight sm:text-xl">
                      {cat.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-blue-100">{cat.subtitle}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[0.68rem] font-black uppercase tracking-wider text-[#1E40AF] shadow-md transition-all duration-200 group-hover:translate-x-1 group-hover:bg-gradient-to-r group-hover:from-[#DC2626] group-hover:to-[#B91C1C] group-hover:text-white">
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
              <FaTags className="size-3.5 text-[#DC2626]" aria-hidden />
              <h3 className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#1E40AF]">
                Ofertas Especiales Activas — Toca para Filtrar Prendas con Descuento
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {homePromos.slice(0, 4).map((promo, i) => {
                const baseHref = promo.ctaHref || "/catalogo";
                const offerHref = baseHref.includes("oferta=")
                  ? baseHref
                  : baseHref.includes("?")
                    ? `${baseHref}&oferta=${promo.discountPercent}`
                    : `${baseHref}?novedades=1&oferta=${promo.discountPercent}`;
                return (
                  <Link
                    key={promo.id}
                    href={offerHref}
                    className={
                      i % 2 === 0
                        ? "bg-flow group relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-blue-300/40 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] p-6 text-white shadow-xl transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-center"
                        : "bg-flow group relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-rose-300/40 bg-gradient-to-r from-[#1E293B] via-[#DC2626] to-[#B91C1C] p-6 text-white shadow-xl transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-center"
                    }
                  >
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-0.5 font-mono text-[0.65rem] font-black uppercase text-[#1E40AF] shadow-xs">
                        <FaPercent className="size-3 text-[#DC2626]" aria-hidden />
                        <span>OFERTA ACTIVA · HASTA -{promo.discountPercent}% OFF</span>
                      </div>
                      <h4 className="font-sans text-lg font-black uppercase tracking-tight sm:text-xl">
                        {promo.name}
                      </h4>
                      <p className="text-xs text-white/95 leading-relaxed">
                        {promo.cleanDescription}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#1E40AF] shadow-md transition-transform group-hover:scale-105 group-hover:bg-amber-300 group-hover:text-slate-950">
                      <span>Ver Productos</span>
                      <FaArrowRight className="size-3" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Mosaico de 3 Banners Interactivos Redondeados (`rounded-3xl`) con Degradado Moderno */}
        <div className="grid gap-5 md:grid-cols-3">
          {CAMPAIGN_BANNERS.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-[#0F172A] p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:min-h-[310px]"
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
                    ? "absolute inset-0 bg-gradient-to-t from-[#0F172A]/95 via-[#1E3A8A]/55 to-transparent"
                    : "absolute inset-0 bg-gradient-to-t from-[#0F172A]/95 via-[#1E293B]/60 to-transparent"
                }
              />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1 font-mono text-[0.6rem] font-black uppercase tracking-wider text-[#1E40AF] shadow-xs">
                  {banner.tag}
                </span>
                <span className="bg-flow inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3 py-1 font-mono text-[0.65rem] font-black uppercase text-white shadow-md">
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
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.7rem] font-black uppercase tracking-wider text-[#1E40AF] shadow-md transition-all duration-200 group-hover:translate-x-1 group-hover:bg-gradient-to-r group-hover:from-[#DC2626] group-hover:to-[#B91C1C] group-hover:text-white">
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
