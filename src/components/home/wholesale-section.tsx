"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CheckCircle2,
  FileText,
  Headset,
  Shirt,
  TrendingUp,
} from "lucide-react";
import { FaBoxesStacked } from "react-icons/fa6";
import { media } from "@/config/media";
import { demoCollections } from "@/data/demo/collections";
import { InfiniteCardSlider } from "@/components/ui/infinite-card-slider";
import { cn } from "@/lib/utils";

const WHOLESALE_CARDS = [
  {
    id: "w-1",
    badge: "BENEFICIO 01",
    title: "Compras por Volumen",
    subtitle: "Combina tallas y colores en una sola orden mayorista.",
    cta: "Armar Pedido →",
    href: "/mayorista/cotizaciones",
    image: media.wholesale,
    icon: Boxes,
  },
  {
    id: "w-2",
    badge: "BENEFICIO 02",
    title: "Precios de Fábrica",
    subtitle: "Tarifas escalonadas exclusivas para negocios con RUC.",
    cta: "Ver Escalas →",
    href: "/mayorista",
    image: demoCollections[2]?.image ?? media.heroMain,
    icon: BadgePercent,
  },
  {
    id: "w-3",
    badge: "BENEFICIO 03",
    title: "Cotizaciones a Medida",
    subtitle: "Recibe atención personalizada de nuestro equipo B2B.",
    cta: "Solicitar Cotización →",
    href: "/mayorista/cotizaciones",
    image: media.atelier,
    icon: FileText,
  },
  {
    id: "w-4",
    badge: "BENEFICIO 04",
    title: "Surtido Completo",
    subtitle: "Jeans, polos, camisas y casacas de alta rotación comercial.",
    cta: "Ver Catálogo Mayorista →",
    href: "/catalogo?mayorista=1",
    image: demoCollections[0]?.image ?? media.heroMain,
    icon: Shirt,
  },
  {
    id: "w-5",
    badge: "BENEFICIO 05",
    title: "Despacho Nacional",
    subtitle: "Envíos asegurados a Lima y todas las provincias del Perú.",
    cta: "Registrar Empresa →",
    href: "/mayorista/registro",
    image: media.retail,
    icon: Headset,
  },
] as const;

const INTERACTIVE_TIERS = [
  {
    id: "tier-retail",
    range: "1 – 11",
    unit: "uds.",
    label: "Precio Minorista",
    badge: "Compra Unidad",
    savingText: "Precio regular de tienda online con envío 24Hrs",
    marginPercent: 25,
    ctaLabel: "Comprar por Unidad",
    ctaHref: "/catalogo",
  },
  {
    id: "tier-bronce",
    range: "12 – 49",
    unit: "uds.",
    label: "Mayorista Inicial",
    badge: "Escala Bronce",
    savingText: "Ideal para boutiques, revendedores y emprendedores textiles",
    marginPercent: 55,
    ctaLabel: "Cotizar Escala 12+ uds.",
    ctaHref: "/mayorista/cotizaciones",
  },
  {
    id: "tier-plata",
    range: "50 – 199",
    unit: "uds.",
    label: "Volumen Comercial",
    badge: "Escala Plata",
    savingText: "Para tiendas de ropa establecidas con reposición mensual",
    marginPercent: 78,
    ctaLabel: "Cotizar Escala 50+ uds.",
    ctaHref: "/mayorista/cotizaciones",
  },
  {
    id: "tier-oro",
    range: "200+",
    unit: "uds.",
    label: "Distribuidor Oficial",
    badge: "Escala Oro",
    savingText: "Máximo descuento de fábrica y atención ejecutiva prioritaria",
    marginPercent: 100,
    ctaLabel: "Cotizar Lote 200+ uds.",
    ctaHref: "/mayorista/cotizaciones",
  },
] as const;

const audiences = [
  "Boutiques y tiendas",
  "Distribuidores",
  "Revendedores",
  "Empresas y uniformes",
] as const;

export function WholesaleSection() {
  const [selectedTierIdx, setSelectedTierIdx] = useState(1);
  const currentTier = INTERACTIVE_TIERS[selectedTierIdx] ?? INTERACTIVE_TIERS[1];

  return (
    <section
      id="mayorista"
      aria-labelledby="mayorista-title"
      className="overflow-hidden bg-gradient-to-b from-bone via-paper to-bone py-14 text-ink lg:py-20"
    >
      <div className="shell space-y-12">
        {/* Cabecera Reluciente en Azul Eléctrico (#0055FF) + Blanco + Rojo American Colt con esquinas redondeadas */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0055FF] via-[#1D4ED8] to-[#2563EB] p-6 text-paper shadow-2xl sm:p-10 lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-[#EF233C]/35 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-cyan-300/25 blur-3xl"
          />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-cochinilla shadow-md">
                <FaBoxesStacked className="size-3.5" aria-hidden />
                <span>PROGRAMA MAYORISTA B2B · AMERICAN COLT JEANS™</span>
              </div>

              <h2
                id="mayorista-title"
                className="mt-4 font-sans text-3xl font-black uppercase leading-tight tracking-tight text-paper sm:text-4xl lg:text-5xl"
              >
                Vestimos negocios que{" "}
                <span className="inline-block rounded-xl bg-[#EF233C] px-3.5 py-0.5 text-paper shadow-md">
                  crecen.
                </span>
              </h2>

              <p className="mt-4 max-w-xl text-xs leading-relaxed text-white/95 sm:text-sm lg:text-base">
                Abastece tu tienda, equipa a tu empresa o amplía tu catálogo de distribución con prendas{" "}
                <strong>American Colt JEANS™</strong>. Precios escalonados automáticos, stock en vivo y facturación SUNAT.
              </p>

              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Para quién es">
                {audiences.map((a) => (
                  <li
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-xs font-bold text-paper backdrop-blur-xs"
                  >
                    <CheckCircle2 className="size-3.5 text-amber-300" aria-hidden />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/mayorista"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#EF233C] px-7 text-xs font-extrabold uppercase tracking-widest text-paper shadow-lg transition-transform hover:scale-105 hover:bg-paper hover:text-cochinilla"
                >
                  <span>Conoce nuestra venta por mayor</span>
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/mayorista/cotizaciones"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-paper bg-white/15 px-7 text-xs font-extrabold uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-[#0055FF]"
                >
                  <span>Solicitar cotización</span>
                </Link>
              </div>
            </div>

            {/* Simulador Interactivo de Escalas por Volumen */}
            <div className="rounded-2xl bg-paper p-5 text-ink shadow-2xl sm:p-6 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <span className="flex items-center gap-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-[#0055FF]">
                  <TrendingUp className="size-4 text-cochinilla" aria-hidden />
                  Simulador de Escalas Mayoristas
                </span>
                <span className="rounded-full bg-[#EF233C]/10 px-2.5 py-0.5 font-mono text-[0.62rem] font-extrabold uppercase text-[#EF233C]">
                  Interactivo
                </span>
              </div>

              <p className="mt-2.5 text-xs text-slate-600">
                Haz clic en una escala de unidades para ver el nivel de beneficio B2B:
              </p>

              <div
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
                role="list"
                aria-label="Escalas de compra referenciales"
              >
                {INTERACTIVE_TIERS.map((tier, idx) => {
                  const active = idx === selectedTierIdx;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="listitem"
                      onClick={() => setSelectedTierIdx(idx)}
                      className={cn(
                        "flex flex-col items-center rounded-xl border p-2.5 text-center transition-all duration-200",
                        active
                          ? "border-[#EF233C] bg-gradient-to-r from-cochinilla to-[#EF233C] text-paper shadow-md scale-105"
                          : "border-blue-100 bg-bone text-[#0055FF] hover:border-[#0055FF]",
                      )}
                    >
                      <span className="font-mono text-xs font-black tabular-nums">
                        {tier.range} <span className="text-[0.6rem] font-normal">{tier.unit}</span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 text-[0.62rem] font-bold uppercase",
                          active ? "text-paper" : "text-slate-500",
                        )}
                      >
                        {tier.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Barra animada del nivel seleccionado */}
              <div className="mt-4 rounded-xl border border-blue-100 bg-bone p-4">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm font-black uppercase text-[#0055FF]">
                    {currentTier.label} ({currentTier.range} {currentTier.unit})
                  </span>
                  <span className="rounded-full bg-[#0055FF] px-2.5 py-0.5 font-mono text-[0.62rem] font-extrabold text-paper">
                    {currentTier.badge}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{currentTier.savingText}</p>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-blue-100">
                  <motion.div
                    key={currentTier.id}
                    initial={{ width: "15%" }}
                    animate={{ width: `${currentTier.marginPercent}%` }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#0055FF] to-[#EF233C]"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={currentTier.ctaHref}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0055FF] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-paper shadow-sm transition-colors hover:bg-cochinilla"
                  >
                    <span>{currentTier.ctaLabel}</span>
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  <Link
                    href="/mayorista/registro"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cochinilla hover:underline"
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    <span>Registra tu empresa aquí →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carrusel 1 por 1 de Tarjetas Redondeadas con Fotos de Ventajas Mayoristas */}
        <div>
          <div className="flex flex-col items-center text-center">
            <span className="inline-block rounded-full bg-gradient-to-r from-[#0055FF] to-[#2563EB] px-4 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-paper shadow-sm">
              SOLUCIONES TEXTILES CON IMÁGENES EN MOVIMIENTO
            </span>
            <h3 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              ¿POR QUÉ COMPRAR POR MAYOR EN{" "}
              <span className="text-[#0055FF]">AMERICAN COLT?</span>
            </h3>
          </div>

          <div className="mt-5 px-2 sm:px-5">
            <InfiniteCardSlider
              items={WHOLESALE_CARDS}
              desktopCols={4}
              autoPlayMs={3300}
              keyExtractor={(item) => item.id}
              renderItem={(card) => (
                <Link
                  href={card.href}
                  className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-blue-100 bg-[#0055FF] shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                >
                  <Image
                    src={card.image.src}
                    alt={card.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    placeholder={typeof card.image.src === "string" ? "empty" : "blur"}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#0055FF]/90 via-[#1D4ED8]/40 to-transparent"
                  />

                  <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#EF233C] px-3 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-paper shadow-md">
                    <card.icon className="size-3" aria-hidden />
                    {card.badge}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-5 text-left text-paper">
                    <h4 className="font-sans text-lg font-black uppercase leading-tight drop-shadow-xs">
                      {card.title}
                    </h4>
                    <p className="mt-1 text-xs text-white/90 line-clamp-2">{card.subtitle}</p>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-xl bg-paper px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-[#0055FF] shadow-md transition-colors group-hover:bg-[#EF233C] group-hover:text-paper">
                      {card.cta}
                    </span>
                  </div>
                </Link>
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
