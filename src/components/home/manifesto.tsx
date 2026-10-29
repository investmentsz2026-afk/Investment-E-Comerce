"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { media } from "@/config/media";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const MANIFESTO =
  "Creemos que cada prenda es una inversión: en calidad, en estilo y en la seguridad con la que sales cada día.";
const EMPHASIS = new Set(["inversión:"]);

/** Manifiesto de marca: las palabras se iluminan progresivamente al desplazarse (solo opacidad). */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.4"] });
  const words = MANIFESTO.split(" ");

  return (
    <section aria-labelledby="manifiesto-title" className="bg-paper py-24 lg:py-40">
      <div className="shell grid items-center gap-12 lg:grid-cols-12 lg:gap-6">
        <Reveal className="order-2 lg:order-1 lg:col-span-4" y={40}>
          <figure>
            <ParallaxImage image={media.manifesto} sizes="(min-width: 1024px) 33vw, 100vw" className="aspect-[4/5] bg-taupe-200" strength={10} />
            <figcaption className="eyebrow mt-4 flex justify-between text-taupe-500">
              <span>Detalle</span>
              <span>Confección y caída</span>
            </figcaption>
          </figure>
        </Reveal>

        <div className="order-1 lg:order-2 lg:col-span-7 lg:col-start-6">
          <h2 id="manifiesto-title" className="eyebrow flex items-center gap-3 text-taupe-500">
            <span className="text-cochinilla">—</span> Manifiesto
          </h2>
          <p ref={ref} className="mt-8 font-display text-display-md text-ink lg:mt-10">
            {words.map((word, i) => (
              <Word
                key={`${word}-${i}`}
                progress={scrollYProgress}
                range={[i / words.length, (i + 1) / words.length]}
                emphasis={EMPHASIS.has(word)}
              >
                {word}
              </Word>
            ))}
          </p>
          <Reveal delay={0.1}>
            <p className="mt-10 flex items-center gap-4 text-sm text-taupe-500">
              <span className="h-px w-12 bg-ink/20" aria-hidden />
              La filosofía detrás de cada colección INVESTMENTS
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
  emphasis,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  emphasis: boolean;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className={cn("inline-block", emphasis && "italic text-cochinilla")}>
        {children}
      </motion.span>{" "}
    </>
  );
}
