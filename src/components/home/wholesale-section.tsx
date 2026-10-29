"use client";

import { motion } from "motion/react";
import { ArrowRight, BadgePercent, Boxes, FileText, Headset, Shirt, type LucideIcon } from "lucide-react";
import { media } from "@/config/media";
import { SectionHeading } from "@/components/ui/section-heading";
import { PendingButton } from "@/components/ui/pending-button";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { ease } from "@/lib/motion";

const benefits: readonly { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Boxes, title: "Compras por volumen", description: "Pedidos de múltiples unidades, tallas y colores en una sola orden." },
  { icon: BadgePercent, title: "Precios especiales", description: "Tarifas mayoristas exclusivas para cuentas empresariales aprobadas." },
  { icon: Headset, title: "Atención empresarial", description: "Un equipo comercial que acompaña cada pedido de principio a fin." },
  { icon: FileText, title: "Cotizaciones a medida", description: "Propuestas según volumen, prendas y plazos de tu negocio." },
  { icon: Shirt, title: "Variedad de prendas", description: "Polos, camisas, pantalones, casacas y más, en múltiples tallas." },
];

const tiers = [
  { range: "1 – 11", unit: "uds.", label: "Precio minorista", level: 0.28 },
  { range: "12 – 49", unit: "uds.", label: "Mayorista", level: 0.5 },
  { range: "50 – 199", unit: "uds.", label: "Volumen", level: 0.74 },
  { range: "200+", unit: "uds.", label: "Proyecto a medida", level: 1 },
] as const;

const steps = [
  { title: "Solicita tu cuenta empresarial", description: "Registra los datos de tu negocio o empresa." },
  { title: "Validación y aprobación", description: "Nuestro equipo revisa y habilita tu cuenta mayorista." },
  { title: "Cotiza y arma tu pedido", description: "Combina prendas, tallas y cantidades con precios por escala." },
  { title: "Recibe y vuelve a pedir", description: "Gestiona pedidos recurrentes desde tu cuenta." },
] as const;

const audiences = ["Boutiques y tiendas", "Distribuidores", "Revendedores", "Empresas y uniformes"] as const;

export function WholesaleSection() {
  return (
    <section id="mayorista" aria-labelledby="mayorista-title" className="grain overflow-hidden bg-ink py-24 text-paper lg:py-36">
      <div className="shell relative z-10">
        {/* Introducción */}
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-6">
          <div className="lg:col-span-6">
            <SectionHeading
              id="mayorista-title"
              tone="light"
              index="04"
              label="Venta por mayor · B2B"
              title={["Vestimos negocios", <span key="w">que <em className="text-cochinilla-bright">crecen.</em></span>]}
              stacked
            />
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-lg text-[0.95rem] leading-relaxed text-paper/70">
                Abastece tu tienda, equipa a tu empresa o amplía tu catálogo de distribución con prendas INVESTMENTS. Una
                experiencia pensada para compras de volumen, con precios escalonados y acompañamiento comercial.
              </p>
              <ul className="mt-8 flex flex-wrap gap-2" aria-label="Para quién es">
                {audiences.map((a) => (
                  <li key={a} className="rounded-full border border-paper/20 px-4 py-2 text-xs text-paper/80">
                    {a}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <PendingButton feature="business-signup" variant="accent" size="lg" icon={<ArrowRight className="size-4" />}>
                  Conoce nuestra venta por mayor
                </PendingButton>
                <PendingButton feature="quotes" variant="outline-light" size="lg">
                  Solicitar cotización
                </PendingButton>
              </div>
            </Reveal>
          </div>

          <Reveal className="relative lg:col-span-5 lg:col-start-8" y={50}>
            <ParallaxImage image={media.atelier} sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/5] bg-ink-muted" strength={9} />
            <div className="absolute -bottom-6 left-4 right-4 bg-paper p-5 text-ink sm:left-auto sm:right-[-1rem] sm:w-72 lg:-left-16 lg:right-auto">
              <p className="eyebrow text-cochinilla">Cuentas empresariales</p>
              <p className="mt-2 font-display text-2xl leading-tight">Un aliado textil para tu negocio</p>
            </div>
          </Reveal>
        </div>

        {/* Beneficios */}
        <ul className="mt-24 grid gap-px bg-paper/10 sm:grid-cols-2 lg:mt-32 lg:grid-cols-5">
          {benefits.map((benefit, i) => (
            <li key={benefit.title} className="bg-ink">
              <Reveal delay={i * 0.08} className="group/benefit relative h-full p-6 lg:p-8">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-cochinilla-bright transition-transform duration-700 ease-luxe group-hover/benefit:scale-x-100"
                />
                <div className="flex items-center justify-between">
                  <benefit.icon className="size-6 text-paper/85 transition-transform duration-500 ease-luxe group-hover/benefit:-translate-y-1" strokeWidth={1.4} aria-hidden />
                  <span className="font-mono text-[0.65rem] text-paper/35">0{i + 1}</span>
                </div>
                <h3 className="mt-10 font-display text-2xl leading-tight">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/60">{benefit.description}</p>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Escalas de precio y proceso */}
        <div className="mt-24 grid gap-16 lg:mt-32 lg:grid-cols-12 lg:gap-6">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow text-paper/50">Precios escalonados</p>
            <p className="mt-4 max-w-md font-display text-display-sm">Mientras más unidades, mejor precio por prenda.</p>
            <div className="mt-10 grid grid-cols-4 items-end gap-2 sm:gap-3" role="list" aria-label="Escalas de compra referenciales">
              {tiers.map((tier, i) => (
                <div key={tier.range} role="listitem" className="flex flex-col">
                  <div className="relative h-40 sm:h-48">
                    <motion.div
                      className={i === tiers.length - 1 ? "absolute inset-x-0 bottom-0 origin-bottom bg-cochinilla" : "absolute inset-x-0 bottom-0 origin-bottom bg-paper/15"}
                      style={{ height: `${tier.level * 100}%` }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 1.1, ease: ease.luxe, delay: 0.15 + i * 0.1 }}
                    />
                  </div>
                  <p className="mt-4 font-mono text-xs tabular-nums text-paper sm:text-sm">
                    {tier.range} <span className="text-paper/50">{tier.unit}</span>
                  </p>
                  <p className="mt-1 text-[0.7rem] leading-snug text-paper/60 sm:text-xs">{tier.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-paper/45">
              Escalas referenciales. Los rangos, precios y condiciones finales se definirán para cada cuenta empresarial.
            </p>
          </Reveal>

          <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.1}>
            <p className="eyebrow text-paper/50">Cómo funciona</p>
            <ol className="mt-6">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-6 border-t border-paper/10 py-6 last:border-b">
                  <span className="font-display text-3xl leading-none text-cochinilla-bright">{i + 1}</span>
                  <div>
                    <p className="text-[0.95rem] font-medium text-paper">{step.title}</p>
                    <p className="mt-1.5 text-sm text-paper/55">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-center gap-2 text-xs text-paper/45">
              <span className="size-1.5 rounded-full bg-cochinilla-bright" aria-hidden />
              El registro empresarial se habilitará próximamente.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
