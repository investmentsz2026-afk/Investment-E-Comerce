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
          <span className="inline-block rounded-full bg-gradient-to-r from-[#0055FF] to-[#2563EB] px-4 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-paper shadow-sm">
            DOS MODALIDADES DE COMPRA EN UN SOLO LUGAR
          </span>
          <h2
            id="modalidades-title"
            className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl"
          >
            COMPRA POR <span className="text-[#0055FF]">UNIDAD</span> O POR{" "}
            <span className="text-cochinilla">MAYOR B2B</span>
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {modalities.map((modality) => {
            const isBlue = modality.tone === "blue";
            return (
              <article
                key={modality.id}
                className="group relative isolate flex min-h-[390px] flex-col justify-between overflow-hidden rounded-3xl bg-[#0055FF] p-6 text-paper shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:p-8"
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
                      ? "bg-gradient-to-t from-[#0055FF]/95 via-[#1D4ED8]/70 to-[#0055FF]/15"
                      : "bg-gradient-to-t from-[#91151B]/95 via-cochinilla/75 to-[#0055FF]/20",
                  )}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3.5 py-1 font-mono text-[0.65rem] font-extrabold uppercase tracking-wider text-[#0055FF] shadow-md">
                    {modality.id === "menor" ? (
                      <ShoppingBag className="size-3.5 text-cochinilla" aria-hidden />
                    ) : (
                      <Boxes className="size-3.5 text-cochinilla" aria-hidden />
                    )}
                    {modality.badge}
                  </span>
                  <span className="rounded-full bg-[#EF233C] px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-paper shadow-md">
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
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-paper text-[#0055FF]">
                          <Check className="size-3 stroke-[3]" aria-hidden />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href={modality.cta.href}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-paper px-6 text-xs font-extrabold uppercase tracking-wider text-[#0055FF] shadow-lg transition-transform hover:scale-105 hover:bg-[#EF233C] hover:text-paper"
                    >
                      <span>{modality.cta.label}</span>
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                    <Link
                      href={modality.secondaryCta.href}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border-2 border-paper bg-white/15 px-5 text-xs font-extrabold uppercase tracking-wider text-paper transition-colors hover:bg-paper hover:text-[#0055FF]"
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
