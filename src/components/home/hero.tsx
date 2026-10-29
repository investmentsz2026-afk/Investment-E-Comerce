"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { media } from "@/config/media";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { MaskedLines } from "@/components/motion/masked-lines";
import { ease } from "@/lib/motion";

/**
 * Hero cinematográfico: composición asimétrica, cortina de revelado,
 * titular enmascarado y parallax de salida ligado al scroll.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const delayed = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, ease: ease.luxe, delay },
  });

  return (
    <section
      id="inicio"
      ref={ref}
      aria-labelledby="hero-title"
      className="grain relative min-h-[100svh] overflow-hidden bg-ink text-paper"
    >
      {/* Fotografía */}
      <div className="absolute inset-0 lg:left-[38%]">
        <motion.div className="absolute inset-0" style={reduceMotion ? undefined : { y: imageY, scale: imageScale }}>
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.16 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.4, ease: ease.luxe, delay: 0.1 }}
          >
            <Image
              src={media.heroMain.src}
              alt={media.heroMain.alt}
              fill
              preload
              sizes="(min-width: 1024px) 62vw, 100vw"
              placeholder="blur"
              className="object-cover object-[64%_28%] lg:object-[58%_30%]"
            />
          </motion.div>
        </motion.div>

        {/* Cortina de revelado */}
        <motion.div
          aria-hidden
          className="absolute inset-0 origin-top bg-ink"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 1.5, ease: ease.curtain, delay: 0.15 }}
        />

        {/* Integración con el texto y la navegación */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10 lg:bg-gradient-to-r lg:from-ink lg:via-ink/15 lg:to-transparent"
        />
        <div aria-hidden className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-ink/70 to-transparent" />
      </div>

      {/* Contenido */}
      <motion.div
        className="shell relative z-10 flex min-h-[100svh] flex-col justify-end pb-32 pt-36 lg:justify-center lg:pb-20 lg:pt-40"
        style={reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-[22rem] sm:max-w-xl lg:max-w-[60%]">
          <motion.p {...delayed(0.55)} className="eyebrow flex items-center gap-3 text-paper/70">
            <span className="text-cochinilla-bright">N°01</span>
            <span className="h-px w-10 bg-paper/30" aria-hidden />
            {siteConfig.season} · Lima
          </motion.p>

          <MaskedLines
            as="h1"
            id="hero-title"
            trigger="mount"
            delay={0.7}
            staggerDelay={0.12}
            className="mt-6 font-display text-display-2xl text-paper lg:mt-8"
            lines={[
              "Viste con",
              <em key="intencion" className="text-paper">
                intención<span className="text-cochinilla-bright">.</span>
              </em>,
            ]}
          />

          <motion.p
            {...delayed(1.1)}
            className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-paper/75 lg:mt-8 lg:text-base"
          >
            Siluetas atemporales, tejidos seleccionados y una confección pensada para durar. Moda para ti y
            soluciones textiles para tu negocio, en un solo lugar.
          </motion.p>

          <motion.div {...delayed(1.25)} className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-10">
            <Button href="#colecciones" variant="light" size="lg" icon={<ArrowRight className="size-4" />}>
              Explorar colecciones
            </Button>
            <Button href="#mayorista" variant="outline-light" size="lg">
              Venta por mayor
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.div
        {...delayed(1.6)}
        className="absolute bottom-8 left-[clamp(1.25rem,4vw,3.5rem)] z-10 hidden items-center gap-4 lg:flex"
        aria-hidden
      >
        <span className="relative block h-12 w-px overflow-hidden bg-paper/15">
          <span className="absolute inset-0 block animate-scroll-cue bg-paper" />
        </span>
        <span className="eyebrow text-paper/60">Desliza</span>
      </motion.div>

      {/* Tarjeta "Ver el look" */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: ease.luxe, delay: 1.7 }}
        className="absolute bottom-8 right-[clamp(1.25rem,4vw,3.5rem)] z-10 hidden lg:block"
      >
        <Link
          href="/catalogo/sastreria"
          className="group/look flex items-center gap-5 bg-ink/75 p-3 pr-6 text-left backdrop-blur-sm transition-colors duration-500 hover:bg-ink"
        >
          <span className="relative block h-24 w-[4.5rem] overflow-hidden">
            <Image
              src={media.heroDetail.src}
              alt=""
              fill
              sizes="72px"
              placeholder="blur"
              className="object-cover transition-transform duration-700 ease-luxe group-hover/look:scale-110"
            />
          </span>
          <span>
            <span className="eyebrow block text-paper/55">Look 01</span>
            <span className="mt-2 block font-display text-xl leading-tight text-paper">Abrigo largo de lana</span>
            <span className="mt-1 block text-xs text-paper/60">Cuello alto de punto · Pantalón sastre</span>
          </span>
          <span className="ml-2 flex size-9 items-center justify-center rounded-full border border-paper/30 text-paper transition-transform duration-500 ease-luxe group-hover/look:rotate-45">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </Link>
      </motion.div>

      {/* Firma vertical */}
      <p
        aria-hidden
        className="eyebrow absolute right-[clamp(1.25rem,4vw,3.5rem)] top-1/2 z-10 hidden origin-right -translate-y-1/2 translate-x-1/2 rotate-90 text-paper/45 2xl:block"
      >
        INVESTMENTS — Colección {siteConfig.season.replace("Temporada ", "")}
      </p>
    </section>
  );
}
