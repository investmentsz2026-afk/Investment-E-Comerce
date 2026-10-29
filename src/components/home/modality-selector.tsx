import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { media } from "@/config/media";
import type { ImageAsset } from "@/types/catalog";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { buttonClasses, ButtonContent } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Modality {
  id: "menor" | "mayor";
  index: string;
  tag: string;
  title: string;
  description: string;
  features: readonly string[];
  cta: { label: string; href: `#${string}` };
  image: ImageAsset;
  tone: "light" | "dark";
}

const modalities: readonly Modality[] = [
  {
    id: "menor",
    index: "01",
    tag: "B2C · Por menor",
    title: "Compra por menor",
    description: "Moda para clientes individuales: elige tus prendas favoritas, en tu talla y color, a precio minorista.",
    features: ["Colecciones de temporada", "Tallas y colores por prenda", "Compra individual"],
    cta: { label: "Comprar para mí", href: "#destacados" },
    image: media.retail,
    tone: "light",
  },
  {
    id: "mayor",
    index: "02",
    tag: "B2B · Por mayor",
    title: "Compra por mayor",
    description:
      "Soluciones textiles para negocios, empresas y distribuidores: precios especiales por volumen y atención dedicada.",
    features: ["Precios escalonados por cantidad", "Pedidos multi-talla", "Cotizaciones personalizadas"],
    cta: { label: "Soluciones para empresas", href: "#mayorista" },
    image: media.wholesale,
    tone: "dark",
  },
];

/** Selector visual de modalidad: comunica de inmediato que INVESTMENTS vende por menor y por mayor. */
export function ModalitySelector() {
  return (
    <section id="modalidades" aria-labelledby="modalidades-title" className="bg-paper py-24 lg:py-36">
      <div className="shell">
        <SectionHeading
          id="modalidades-title"
          index="01"
          label="Dos formas de comprar"
          title={["Una sola casa,", <span key="l2"><em>dos maneras</em> de vestir.</span>]}
          description="Ya sea que busques una prenda para ti o abastecer tu negocio, INVESTMENTS adapta la experiencia a tu forma de comprar."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:mt-20 lg:gap-6 [&:has(article:hover)_article:not(:hover)]:opacity-60">
          {modalities.map((modality, i) => (
            <Reveal key={modality.id} delay={i * 0.12} y={40}>
              <ModalityCard modality={modality} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModalityCard({ modality }: { modality: Modality }) {
  const isDark = modality.tone === "dark";
  return (
    <article className="group/card relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden bg-ink p-6 text-paper transition-opacity duration-700 ease-luxe sm:aspect-[5/6] sm:p-8 lg:aspect-[4/5] lg:p-10 xl:aspect-[5/6]">
      <Image
        src={modality.image.src}
        alt={modality.image.alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        placeholder={typeof modality.image.src === "string" ? "empty" : "blur"}
        className="-z-20 object-cover transition-transform duration-[1.6s] ease-luxe group-hover/card:scale-[1.06]"
      />
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 transition-opacity duration-700 ease-luxe",
          isDark
            ? "bg-gradient-to-t from-ink via-ink/60 to-ink/20 opacity-90 group-hover/card:opacity-100"
            : "bg-gradient-to-t from-ink/90 via-ink/30 to-transparent opacity-80 group-hover/card:opacity-100",
        )}
      />

      <div className="flex items-start justify-between">
        <span className="eyebrow rounded-full border border-paper/30 px-3 py-2 text-paper/85 backdrop-blur-[2px]">
          {modality.tag}
        </span>
        <span className="font-display text-5xl leading-none text-paper/40 lg:text-6xl" aria-hidden>
          {modality.index}
        </span>
      </div>

      <div>
        <h3 className="font-display text-display-md">{modality.title}</h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/75 lg:text-[0.95rem]">{modality.description}</p>

        {/* Beneficios con microdesplazamiento escalonado al pasar el cursor (solo transform) */}
        <ul className="mt-6 space-y-2.5">
          {modality.features.map((feature, i) => (
            <li
              key={feature}
              style={{ transitionDelay: `${i * 60}ms` }}
              className="flex items-center gap-3 text-sm text-paper/85 transition-transform duration-700 ease-luxe group-hover/card:translate-x-1.5"
            >
              <Check className={cn("size-4 shrink-0", isDark ? "text-cochinilla-bright" : "text-paper")} aria-hidden />
              {feature}
            </li>
          ))}
        </ul>

        <a
          href={modality.cta.href}
          className={buttonClasses({
            variant: isDark ? "accent" : "light",
            size: "lg",
            className: "mt-8 w-full sm:w-auto",
          })}
        >
          <ButtonContent icon={<ArrowRight className="size-4" />}>{modality.cta.label}</ButtonContent>
        </a>
      </div>
    </article>
  );
}
