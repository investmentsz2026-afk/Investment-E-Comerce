"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CheckCircle2,
  FileText,
  Headset,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { FaBoxesStacked } from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import { MagicRings } from "@/components/ui/magic-rings";
import { WebThreads } from "@/components/ui/web-threads";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const WHOLESALE_BENEFITS = [
  {
    icon: Boxes,
    accent: "from-[#EF233C] to-rose-600",
    pill: "Mínimo Flexible",
    title: "Escalas acumulables por modelo",
    description:
      "Combina diferentes tallas y colores de un mismo producto en una sola orden para alcanzar automáticamente las escalas de precio mayorista.",
  },
  {
    icon: BadgePercent,
    accent: "from-[#2563EB] to-indigo-600",
    pill: "Margen Real",
    title: "Tarifas preferenciales de fábrica",
    description:
      "Márgenes comerciales atractivos para boutiques, distribuidores y tiendas de moda con precios escalonados desde 12 unidades.",
  },
  {
    icon: FileText,
    accent: "from-emerald-500 to-teal-600",
    pill: "Tributación Formal",
    title: "Facturación electrónica SUNAT",
    description:
      "Emisión formal de Factura electrónica con tu RUC de 11 dígitos, desglose de IGV y crédito fiscal conforme a la normativa peruana.",
  },
  {
    icon: Truck,
    accent: "from-sky-500 to-blue-600",
    pill: "Todo el Perú",
    title: "Despachos seguros a nivel nacional",
    description:
      "Cobertura logística para Lima Metropolitana y envíos consolidados a provincias vía Olva Courier, Shalom o agencias autorizadas.",
  },
  {
    icon: Headset,
    accent: "from-violet-500 to-purple-600",
    pill: "Atención 1 a 1",
    title: "Asesor comercial asignado",
    description:
      "Acompañamiento directo en la selección de lotes, cotizaciones a medida y reposición periódica para tu inventario.",
  },
  {
    icon: ShieldCheck,
    accent: "from-amber-500 to-orange-600",
    pill: "Confección Peruana",
    title: "Control de calidad garantizado",
    description:
      "Prendas confeccionadas con Denim Ring Spun, Drill Stretch y Algodón Peruano con estándares uniformes de fábrica.",
  },
] as const;

const VOLUME_TIERS = [
  {
    range: "1 a 11 unidades",
    title: "Compra Minorista",
    discount: "Precio de catálogo",
    description: "Ideal para compras personales, muestras de tela o evaluación inicial de prendas.",
    badge: "B2C",
    highlight: false,
  },
  {
    range: "12 a 49 unidades",
    title: "Escala Mayorista Base",
    discount: "15% a 20% de ahorro",
    description: "Para boutiques, tiendas locales y pedidos iniciales de temporada.",
    badge: "B2B Inicial",
    highlight: false,
  },
  {
    range: "50 a 199 unidades",
    title: "Volumen Comercial",
    discount: "25% a 30% de ahorro",
    description: "Tarifas preferenciales de fábrica para distribuidores, cadenas y compras por lote.",
    badge: "B2B Preferencial",
    highlight: true,
  },
  {
    range: "200+ unidades",
    title: "Proyecto Corporativo",
    discount: "Cotización a Medida",
    description: "Producción programada, uniformes empresariales y entregas parciales.",
    badge: "A Medida",
    highlight: false,
  },
] as const;

const REGISTRATION_STEPS = [
  {
    number: "01",
    title: "Registra tu empresa con RUC",
    description:
      "Ingresa tu RUC de 11 dígitos (RUC 10 con negocio o RUC 20), razón social y datos de contacto.",
  },
  {
    number: "02",
    title: "Validación y habilitación comercial",
    description:
      "Nuestro equipo valida tu ficha RUC ante SUNAT en 24 a 48 horas hábiles y activa tu cuenta B2B.",
  },
  {
    number: "03",
    title: "Cotiza o compra con tarifas B2B",
    description:
      "Visualiza precios mayoristas en todo el catálogo, arma lotes por talla y solicita propuestas formales.",
  },
  {
    number: "04",
    title: "Despacho y reposición continua",
    description:
      "Recibe tu mercadería embalada en tienda o agencia y solicita reposiciones rápidas en línea.",
  },
] as const;

function HeroInteractive3DCard() {
  const [selectedTierIdx, setSelectedTierIdx] = useState(2);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [9, -9]), {
    stiffness: 180,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-11, 11]), {
    stiffness: 180,
    damping: 22,
  });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(px);
    mouseY.set(py);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const tierStats = [
    { label: "12+ UDS.", save: "Hasta -20%", desc: "Boutiques y emprendedores" },
    { label: "50+ UDS.", save: "Hasta -30%", desc: "Distribuidores regionales" },
    { label: "200+ UDS.", save: "Tarifa Directa", desc: "Lotes corporativos y marcas" },
  ];

  const activeStat = tierStats[selectedTierIdx] ?? tierStats[2];

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto w-full max-w-md [perspective:1200px]"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-blue-950/85 p-6 shadow-2xl backdrop-blur-xl sm:p-7"
      >
        {/* Halo superior sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#EF233C]/25 blur-2xl"
        />

        <div
          style={{ transform: "translateZ(28px)" }}
          className="flex items-center justify-between gap-2"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Portal B2B Activo
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[0.68rem] font-bold text-slate-300">
            <TrendingUp className="size-3.5 text-[#EF233C]" aria-hidden />
            Fábrica Perú
          </span>
        </div>

        <div style={{ transform: "translateZ(40px)" }} className="mt-5">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-blue-300">
            Simulador Rápido de Volumen
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <h3 className="font-sans text-3xl font-black tracking-tight text-white">
              {activeStat.save}
            </h3>
            <span className="rounded-full bg-[#EF233C]/20 px-3 py-1 font-mono text-xs font-bold text-rose-200">
              {activeStat.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-300">{activeStat.desc}</p>
        </div>

        {/* Botones interactivos para alternar escala 3D */}
        <div
          style={{ transform: "translateZ(32px)" }}
          className="mt-5 grid grid-cols-3 gap-2"
        >
          {tierStats.map((item, idx) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSelectedTierIdx(idx)}
              className={cn(
                "rounded-xl border px-2.5 py-2 text-center font-mono text-[0.68rem] font-bold transition-all",
                selectedTierIdx === idx
                  ? "border-[#EF233C] bg-[#EF233C] text-white shadow-md shadow-red-600/25"
                  : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Chips de beneficios 3D flotantes */}
        <div
          style={{ transform: "translateZ(24px)" }}
          className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-5 text-xs"
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">
              Curva Completa
            </p>
            <p className="mt-0.5 font-extrabold text-white">Tallas 28 a 46</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">
              Comprobante
            </p>
            <p className="mt-0.5 font-extrabold text-white">Factura RUC</p>
          </div>
        </div>

        <div style={{ transform: "translateZ(36px)" }} className="mt-5">
          <Link
            href="/mayorista/cotizaciones"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg transition-all hover:bg-[#EF233C] hover:text-white"
          >
            <span>Armar Cotización Ahora</span>
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function WholesaleLanding3D({
  featuredProductsSlot,
}: {
  featuredProductsSlot: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-slate-50/90 via-white to-slate-50/80 pt-[7rem] pb-24 lg:pt-[11.25rem]">
      {/* HERO 3D CON ANILLOS WEBGL2 */}
      <section className="shell">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-[#070D18] p-6 text-white shadow-2xl sm:p-10 lg:p-14">
          {/* Fondo WebGL2 MagicRings en colores de marca */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-90">
            <MagicRings
              color="#EF233C"
              colorTwo="#2563EB"
              motion="pulse"
              ringCount={6}
              speed={0.85}
              lineThickness={1.8}
              glow={0.9}
              hoverScale={1.12}
              clickBurst={false}
              baseRadius={0.34}
              radiusStep={0.11}
              expansion={0.08}
              taper={1.4}
              opacity={0.95}
              followMouse
              mouseInfluence={0.22}
              parallax={0.06}
              theme="dark"
              intro
            />
          </div>

          {/* Contraste suave para legibilidad perfecta */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#070D18]/92 via-[#070D18]/72 to-[#070D18]/55"
          />

          <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-red-400/35 bg-[#EF233C]/15 px-4 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-red-200 backdrop-blur-sm">
                  <FaBoxesStacked className="size-3.5 text-[#EF233C]" aria-hidden />
                  Canal Mayorista &amp; Distribución B2B
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/35 bg-[#2563EB]/20 px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-blue-200 backdrop-blur-sm">
                  <Sparkles className="size-3.5" aria-hidden />
                  Colección 2026
                </span>
              </div>

              <h1 className="font-sans text-3xl font-black uppercase leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Vestimos el crecimiento de tu{" "}
                <span className="bg-gradient-to-r from-[#EF233C] via-rose-400 to-blue-400 bg-clip-text text-transparent">
                  negocio.
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Abastece tu boutique, tienda o empresa con confección textil peruana de alta rotación en Denim, Drill y Algodón Pima. Tarifas transparentes por escala, combinación de tallas/colores y facturación formal con RUC.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/mayorista/registro"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-8 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-red-600/25 transition-all hover:-translate-y-0.5 hover:bg-[#D90429]"
                >
                  Registrar mi empresa
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/mayorista/cotizaciones"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Solicitar cotización B2B
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroInteractive3DCard />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS EN TARJETAS 3D ELEVADAS */}
      <section className="shell mt-20 lg:mt-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#EF233C]">
              Propuesta de Valor Comercial
            </span>
            <h2 className="mt-2.5 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl">
              Ventajas pensadas para{" "}
              <span className="text-[#2563EB]">negocios textiles</span>
            </h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-slate-600 sm:text-sm">
            Optimizamos cada etapa del abastecimiento mayorista para que obtengas el mejor margen y formalidad tributaria sin fricciones.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHOLESALE_BENEFITS.map((b, idx) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-105",
                    b.accent,
                  )}
                >
                  <b.icon className="size-6" strokeWidth={1.8} aria-hidden />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-600">
                  {b.pill}
                </span>
              </div>
              <h3 className="mt-6 font-sans text-lg font-extrabold tracking-tight text-slate-900">
                {b.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {b.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ESCALAS DE VOLUMEN CON FONDO WEBTHREADS 3D */}
      <section id="escalas" className="shell mt-20 lg:mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-br from-[#C8D7F2] via-[#DBE6F8] to-[#BFCFEC] p-6 shadow-md sm:p-10 lg:p-14">
          {/* Hilos web animados en fondo claro */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-75">
            <WebThreads
              colors={["#1D4ED8", "#DC2626", "#2563EB"]}
              coreColor="#1E40AF"
              lightMode
              threadCount={5}
              spread={0.16}
              speed={0.18}
              frequency={4}
              taper={1}
              position={0.5}
              pinch={0.5}
              nodes={1}
              glow={0.01}
              falloff={0.45}
              thickness={1.0}
              brightness={0.65}
              opacity={0.7}
              grain={0.02}
              mouseInteraction
              mouseStrength={0.35}
            />
          </div>

          <div className="relative z-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#EF233C] shadow-xs backdrop-blur-xs">
                Escalas Comerciales B2B
              </span>
              <h2 className="mt-3 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl">
                Precios por volumen con{" "}
                <span className="text-[#1D4ED8]">reglas claras</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Nuestras escalas aplican sobre la suma de unidades de un mismo modelo: combina tallas (28 a 46 o S a XL) y colores sin perder el descuento de lote.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VOLUME_TIERS.map((tier) => (
                <motion.div
                  key={tier.range}
                  whileHover={{ y: -6, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={cn(
                    "flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition-shadow",
                    tier.highlight
                      ? "border-[#EF233C] bg-gradient-to-b from-[#0B1120] to-[#1E293B] text-white shadow-xl"
                      : "border-white/70 bg-white/90 text-slate-900 backdrop-blur-md hover:shadow-lg",
                  )}
                >
                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 font-mono text-[0.65rem] font-extrabold uppercase tracking-wider",
                        tier.highlight
                          ? "bg-[#EF233C] text-white"
                          : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {tier.badge}
                    </span>
                    <p
                      className={cn(
                        "mt-4 font-mono text-xs font-bold uppercase",
                        tier.highlight ? "text-blue-300" : "text-slate-500",
                      )}
                    >
                      {tier.range}
                    </p>
                    <h3
                      className={cn(
                        "mt-1 font-sans text-lg font-black tracking-tight",
                        tier.highlight ? "text-white" : "text-slate-900",
                      )}
                    >
                      {tier.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-3 font-sans text-xl font-black",
                        tier.highlight ? "text-rose-400" : "text-[#EF233C]",
                      )}
                    >
                      {tier.discount}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-xs leading-relaxed",
                        tier.highlight ? "text-slate-300" : "text-slate-600",
                      )}
                    >
                      {tier.description}
                    </p>
                  </div>

                  <Link
                    href="/mayorista/cotizaciones"
                    className={cn(
                      "mt-6 inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[0.68rem] font-extrabold uppercase tracking-wider transition-colors",
                      tier.highlight
                        ? "bg-white text-slate-950 hover:bg-[#EF233C] hover:text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-900",
                    )}
                  >
                    Cotizar esta escala
                    <ArrowRight className="size-3" aria-hidden />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REQUISITOS + PROCESO PASO A PASO */}
      <section className="shell mt-20 lg:mt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Requisitos */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0B1120] p-7 text-white shadow-xl lg:col-span-5 sm:p-9">
            <span className="inline-flex rounded-full bg-[#EF233C]/20 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-red-300">
              Requisitos de Acceso
            </span>
            <h2 className="mt-3 font-sans text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              ¿Qué necesitas para{" "}
              <span className="text-blue-400">registrarte?</span>
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
              Orientado a empresas y personas naturales con negocio formalmente constituidas en el Perú:
            </p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                <div className="text-xs leading-relaxed text-slate-200">
                  <strong className="block font-bold text-white">RUC 11 dígitos activo y habido:</strong>
                  RUC 10 con negocio o RUC 20 registrado ante la SUNAT.
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                <div className="text-xs leading-relaxed text-slate-200">
                  <strong className="block font-bold text-white">Razón social o nombre comercial:</strong>
                  Titularidad del negocio o representación acreditable.
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                <div className="text-xs leading-relaxed text-slate-200">
                  <strong className="block font-bold text-white">Datos de entrega y contacto:</strong>
                  Dirección fiscal o almacén para coordinar despacho.
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                <div className="text-xs leading-relaxed text-slate-200">
                  <strong className="block font-bold text-white">Apertura 100% gratuita:</strong>
                  Sin costo de afiliación ni membresías mensuales.
                </div>
              </li>
            </ul>

            <div className="mt-7">
              <Link
                href="/mayorista/registro"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#D90429]"
              >
                Comenzar registro de empresa
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Proceso en 4 pasos */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm lg:col-span-7 sm:p-9">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#2563EB]">
              Proceso Paso a Paso
            </span>
            <h2 className="mt-3 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              Cómo empezar a{" "}
              <span className="text-[#EF233C]">comprar por mayor</span>
            </h2>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {REGISTRATION_STEPS.map((step, i) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 transition-all hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-md"
                >
                  <span
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-xl font-mono text-xs font-black text-white shadow-xs",
                      i % 2 === 0 ? "bg-[#EF233C]" : "bg-[#2563EB]",
                    )}
                  >
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-sans text-base font-extrabold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRENDAS DESTACADAS MAYORISTAS (RENDERIZADAS DESDE SERVER) */}
      {featuredProductsSlot}

      {/* CTA FINAL 3D */}
      <section className="shell mt-20 lg:mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0B1120] via-[#172554] to-[#0F172A] p-8 text-center text-white shadow-2xl sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-1/4 h-56 w-56 rounded-full bg-[#EF233C]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 right-1/4 h-56 w-56 rounded-full bg-[#2563EB]/25 blur-3xl"
          />

          <div className="relative z-10 mx-auto max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-red-200">
              Atención Comercial Directa
            </span>
            <h2 className="mt-4 font-sans text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              ¿Listo para abastecer tu negocio con{" "}
              <span className="text-[#EF233C]">American Colt JEANS™</span>?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Regístrate hoy para desbloquear tarifas de fábrica o prepara tu cotización con las prendas, tallas y cantidades que necesitas.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <Link
                href="/mayorista/registro"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-8 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-[#D90429]"
              >
                Registrar mi empresa
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/mayorista/cotizaciones"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 text-xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-white/20"
              >
                Preparar cotización
              </Link>
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
                  "Hola, deseo información para compras por mayor B2B en American Colt JEANS™.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-6 text-xs font-extrabold uppercase tracking-wider text-emerald-200 transition-colors hover:bg-emerald-500/25"
              >
                <SiWhatsapp className="size-4" aria-hidden />
                WhatsApp B2B
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
