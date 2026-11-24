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

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-6">
          {modalities.map((modality) => {
            const isBlue = modality.tone === "blue";
            return (
              <article
                key={modality.id}
                className="group relative isolate flex min-h-[255px] flex-col justify-between overflow-hidden rounded-2xl bg-[#0F172A] p-3 text-paper shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:min-h-[390px] sm:rounded-3xl sm:p-8"
              >
                <Image
                  src={modality.image.src}
                  alt={modality.image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 50vw"
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

                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 font-mono text-[0.46rem] font-extrabold uppercase tracking-wider text-[#1E40AF] shadow-md sm:gap-1.5 sm:px-3.5 sm:py-1 sm:text-[0.65rem]">
                    {modality.id === "menor" ? (
                      <ShoppingBag className="size-2.5 text-[#DC2626] sm:size-3.5" aria-hidden />
                    ) : (
                      <Boxes className="size-2.5 text-[#DC2626] sm:size-3.5" aria-hidden />
                    )}
                    {modality.badge}
                  </span>
                  <span className="bg-flow hidden rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase text-paper shadow-md sm:inline-flex sm:px-3 sm:py-1 sm:text-[0.62rem]">
                    {modality.subtitle}
                  </span>
                </div>

                <div className="mt-4 sm:mt-8">
                  <h3 className="font-sans text-xs font-black uppercase leading-tight tracking-tight text-paper drop-shadow-xs sm:text-3xl">
                    {modality.title}
                  </h3>
                  <p className="mt-1 hidden max-w-lg text-xs leading-relaxed text-white/95 sm:mt-2 sm:block sm:text-sm">
                    {modality.description}
                  </p>

                  <ul className="mt-2 space-y-1 sm:mt-4 sm:space-y-1.5">
                    {modality.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5 text-[0.58rem] font-semibold leading-tight text-paper sm:items-center sm:gap-2 sm:text-xs">
                        <span className="mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-full bg-paper text-[#1E40AF] sm:mt-0 sm:size-4">
                          <Check className="size-2 stroke-[3] sm:size-3" aria-hidden />
                        </span>
                        <span className="line-clamp-2 sm:line-clamp-none">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-6 sm:gap-2.5">
                    <Link
                      href={modality.cta.href}
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-xl bg-paper px-2.5 text-[0.54rem] font-extrabold uppercase tracking-wider text-[#1E40AF] shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gradient-to-r hover:from-[#DC2626] hover:to-[#B91C1C] hover:text-paper sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-5 sm:text-xs"
                    >
                      <span>{modality.cta.label}</span>
                      <ArrowRight className="size-2.5 sm:size-4" aria-hidden />
                    </Link>
                    <Link
                      href={modality.secondaryCta.href}
                      className="inline-flex h-7 items-center justify-center rounded-xl border border-paper/80 bg-white/15 px-2.5 text-[0.54rem] font-extrabold uppercase tracking-wider text-paper transition-colors hover:bg-paper hover:text-[#1E40AF] sm:h-11 sm:rounded-2xl sm:border-2 sm:px-4 sm:text-xs"
                    >
                      {modality.secondaryCta.label}
                    </Link>
                    {modality.id === "mayor" && (
                      <Link
                        href="/catalogo?mayorista=1"
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-xl bg-[#EF233C] px-2.5 text-[0.54rem] font-extrabold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#D90429] sm:h-11 sm:gap-1.5 sm:rounded-2xl sm:px-4 sm:text-xs"
                      >
                        <span>Ver Mayoristas</span>
                        <ArrowRight className="size-2.5 sm:size-3.5" aria-hidden />
                      </Link>
                    )}
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
