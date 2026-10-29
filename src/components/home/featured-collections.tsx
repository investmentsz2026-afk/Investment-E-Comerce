"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { demoCollections } from "@/data/demo/collections";
import type { Collection } from "@/types/catalog";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** Composición editorial asimétrica en escritorio; carrusel con snap en móvil. */
const layout = [
  "lg:col-span-7 lg:aspect-[5/4]",
  "lg:col-span-5 lg:aspect-[4/5] lg:-mt-10",
  "lg:col-span-5 lg:aspect-[4/5]",
  "lg:col-span-7 lg:aspect-[5/4] lg:-mt-10",
] as const;

const categoryLinks = [
  { label: "Polos", slug: "polos" },
  { label: "Camisas", slug: "camisas" },
  { label: "Blusas", slug: "blusas" },
  { label: "Pantalones", slug: "pantalones" },
  { label: "Casacas", slug: "casacas" },
  { label: "Blazers", slug: "blazers" },
  { label: "Vestidos", slug: "vestidos" },
  { label: "Denim", slug: "denim" },
  { label: "Tejidos de punto", slug: "tejidos-de-punto" },
] as const;

/** Mapa de colección demo → slug de categoría para enlazar. */
const collectionSlugMap: Record<string, string> = {
  "col-sastreria": "sastreria",
  "col-esenciales": "polos",
  "col-denim": "denim",
  "col-punto": "tejidos-de-punto",
};

export function FeaturedCollections() {
  return (
    <section id="colecciones" aria-labelledby="colecciones-title" className="overflow-hidden bg-bone py-24 lg:py-36">
      <div className="shell">
        <SectionHeading
          id="colecciones-title"
          index="02"
          label="Colecciones"
          title={["Colecciones con", <em key="c">carácter.</em>]}
          description="Cada colección nace de una idea: piezas que se combinan entre sí y acompañan distintos momentos de tu semana."
          aside={
            <Button href="/catalogo" variant="outline" className="self-start" icon={<ArrowUpRight className="size-4" />}>
              Ver todas
            </Button>
          }
        />
      </div>

      <div className="shell mt-14 lg:mt-20">
        <ul className="no-scrollbar -mx-[clamp(1.25rem,4vw,3.5rem)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(1.25rem,4vw,3.5rem)] lg:mx-0 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0 lg:overflow-visible lg:px-0">
          {demoCollections.map((collection, i) => (
            <li key={collection.id} className={cn("aspect-[3/4] w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-auto", layout[i])}>
              <Reveal y={50} delay={(i % 2) * 0.1} className="h-full">
                <CollectionCard collection={collection} index={i + 1} slug={collectionSlugMap[collection.id] ?? "sastreria"} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      <div className="shell mt-16 lg:mt-28">
        <Reveal className="flex flex-col gap-5 border-t border-ink/10 pt-8 lg:flex-row lg:items-center lg:gap-10">
          <p className="eyebrow shrink-0 text-taupe-500">Comprar por categoría</p>
          <ul className="no-scrollbar -mx-[clamp(1.25rem,4vw,3.5rem)] flex gap-2 overflow-x-auto px-[clamp(1.25rem,4vw,3.5rem)] lg:mx-0 lg:flex-wrap lg:px-0">
            {categoryLinks.map((cat) => (
              <li key={cat.slug} className="shrink-0">
                <Link
                  href={`/catalogo/${cat.slug}`}
                  className="rounded-full border border-ink/15 px-5 py-2.5 text-sm text-ink/80 transition-[background-color,color,border-color] duration-300 hover:border-ink hover:bg-ink hover:text-paper"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function CollectionCard({ collection, index, slug }: { collection: Collection; index: number; slug: string }) {
  return (
    <Link
      href={`/catalogo/${slug}`}
      aria-label={`${collection.name}: ${collection.description}`}
      className="group/col relative block h-full w-full overflow-hidden bg-taupe-200 text-left text-paper"
    >
      <ParallaxImage
        image={collection.image}
        sizes="(min-width: 1024px) 50vw, 80vw"
        strength={7}
        className="absolute inset-0"
        imageClassName="transition-transform duration-[1.6s] ease-luxe group-hover/col:scale-[1.05]"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent transition-opacity duration-700 group-hover/col:opacity-90" />

      <span className="absolute left-5 top-5 font-mono text-[0.65rem] tracking-[0.2em] text-paper/80 lg:left-7 lg:top-7">
        N°{String(index).padStart(2, "0")}
      </span>

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 lg:p-7">
        <span className="min-w-0">
          <span className="block font-display text-[2rem] leading-none lg:text-display-sm">{collection.name}</span>
          <span className="mt-3 block max-w-xs text-xs leading-relaxed text-paper/75 lg:text-sm">{collection.description}</span>
        </span>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-paper/40 transition-[transform,background-color,color] duration-500 ease-luxe group-hover/col:rotate-45 group-hover/col:bg-paper group-hover/col:text-ink">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </span>
    </Link>
  );
}
