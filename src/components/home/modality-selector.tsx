import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShoppingBag, Boxes } from "lucide-react";
import { media } from "@/config/media";
import type { ImageAsset } from "@/types/catalog";
import { cn } from "@/lib/utils";

interface Modality {
  id: "menor" | "mayor";
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  features: readonly string[];
  cta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: ImageAsset;
  tone: "blue" | "red";
}

const modalities: readonly Modality[] = [
  {
    id: "menor",
    badge: "VENTAS POR UNIDAD · B2C",
    title: "COMPRA POR UNIDAD",
    subtitle: "Desde 1 prenda · Envío 24Hrs",
    description:
      "Elige tus Jeans, Casacas, Polos y Camisas favoritas en tu talla y color con descuentos exclusivos online y entrega rápida en casa.",
    features: [
      "Compra individual sin mínimo de unidades",
      "Envío rápido 24Hrs en Lima y despachos a provincias",
      "Cambios de talla garantizados y Boleta SUNAT",
    ],
    cta: { label: "Comprar por Unidad", href: "/catalogo" },
    secondaryCta: { label: "Ofertas 3x2 / -50%", href: "/catalogo?novedades=1&oferta=50" },
    image: media.retail,
    tone: "blue",
  },
  {
    id: "mayor",
    badge: "VENTAS POR MAYOR · B2B",
    title: "COMPRA POR MAYOR",
    subtitle: "Lotes desde 12 uds. · Tarifas de Fábrica",
    description:
      "Soluciones textiles para tiendas, boutiques, distribuidores y emprendedores: precios escalonados por volumen y atención comercial directa.",
    features: [
      "Precios escalonados (12+, 50+, 200+ unidades)",
      "Pedidos surtidos multi-talla y multi-color",
      "Facturación electrónica RUC 20 / RUC 10 inmediata",
    ],
    cta: { label: "Ir a Ventas por Mayor", href: "/mayorista" },
    secondaryCta: { label: "Cotizar Lote Ahora", href: "/mayorista/cotizaciones" },
    image: media.wholesale,
    tone: "red",
  },
];

export function ModalitySelector() {
  return (
    <section id="modalidades" aria-labelledby="modalidades-title" className="bg-bone py-10 lg:py-14">
      <div className="shell">
        <div className="flex flex-col items-center text-center">
          <span className="bg-flow inline-block rounded-full bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] px-4 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-paper shadow-sm">
            DOS MODALIDADES DE COMPRA EN UN SOLO LUGAR
          </span>
          <h2
            id="modalidades-title"
            className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl"
          >
            COMPRA POR <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] bg-clip-text text-transparent">UNIDAD</span> O POR{" "}
            <span className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] bg-clip-text text-transparent">MAYOR B2B</span>
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {modalities.map((modality) => {
            const isBlue = modality.tone === "blue";
            return (
              <article
                key={modality.id}
                className="group relative isolate flex min-h-[390px] flex-col justify-between overflow-hidden rounded-3xl bg-[#0F172A] p-6 text-paper shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:p-8"
              >
                <Image
                  src={modality.image.src}
                  alt={modality.image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  placeholder={typeof modality.image.src === "string" ? "empty" : "blur"}
                  className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-0 -z-10",
                    isBlue
                      ? "bg-gradient-to-t from-[#0F172A]/95 via-[#1E3A8A]/75 to-[#1E3A8A]/15"
                      : "bg-gradient-to-t from-[#0F172A]/95 via-[#1E293B]/80 to-[#DC2626]/15",
                  )}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3.5 py-1 font-mono text-[0.65rem] font-extrabold uppercase tracking-wider text-[#1E40AF] shadow-md">
                    {modality.id === "menor" ? (
                      <ShoppingBag className="size-3.5 text-[#DC2626]" aria-hidden />
                    ) : (
                      <Boxes className="size-3.5 text-[#DC2626]" aria-hidden />
                    )}
                    {modality.badge}
                  </span>
                  <span className="bg-flow rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-paper shadow-md">
                    {modality.subtitle}
                  </span>
                </div>

                <div className="mt-8">
                  <h3 className="font-sans text-2xl font-black uppercase tracking-tight text-paper drop-shadow-xs sm:text-3xl">
                    {modality.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/95 sm:text-sm">
                    {modality.description}
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {modality.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs font-semibold text-paper">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-paper text-[#1E40AF]">
                          <Check className="size-3 stroke-[3]" aria-hidden />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href={modality.cta.href}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-paper px-6 text-xs font-extrabold uppercase tracking-wider text-[#1E40AF] shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gradient-to-r hover:from-[#DC2626] hover:to-[#B91C1C] hover:text-paper"
                    >
                      <span>{modality.cta.label}</span>
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                    <Link
                      href={modality.secondaryCta.href}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border-2 border-paper bg-white/15 px-5 text-xs font-extrabold uppercase tracking-wider text-paper transition-colors hover:bg-paper hover:text-[#1E40AF]"
                    >
                      {modality.secondaryCta.label}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
