"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  FaArrowRight,
  FaPercent,
  FaTag,
  FaTags,
  FaXmark,
} from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { stripEmojis, type PublicPromotionItem } from "@/lib/promo-display";

interface PromoStartupModalProps {
  promotions: PublicPromotionItem[];
}

interface ConfettiPiece {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  scale: number;
  delay: number;
  duration: number;
  color: string;
  shape: "paper" | "ribbon" | "diamond";
}

const DEFAULT_PROMO_IMAGE = "/promo-3x2-oferta.jpg";

// Partículas de apertura en tonos Rojo Vivo, Carmesí y Blanco Puro
const OPENING_PARTICLES: readonly ConfettiPiece[] = Array.from(
  { length: 28 },
  (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const distance = 110 + ((i * 31) % 160);
    const colors = ["#EF233C", "#FF4D6D", "#FFFFFF", "#DC2626", "#FF8FA3"];
    const shapes: Array<"paper" | "ribbon" | "diamond"> = [
      "paper",
      "ribbon",
      "diamond",
    ];
    return {
      id: i,
      tx: Math.round(Math.cos(angle) * distance),
      ty: Math.round(Math.sin(angle) * distance - 20),
      rot: (i * 67) % 360,
      scale: 0.7 + (i % 4) * 0.18,
      delay: (i % 6) * 0.03,
      duration: 1.2 + (i % 5) * 0.18,
      color: colors[i % colors.length],
      shape: shapes[i % shapes.length],
    };
  },
);

// Explosión radial 3D al cerrar el popup
const EXPLODE_PARTICLES: readonly ConfettiPiece[] = Array.from(
  { length: 48 },
  (_, i) => {
    const angle = (i / 48) * Math.PI * 2;
    const distance = 160 + ((i * 53) % 280);
    const colors = [
      "#EF233C",
      "#FF4D6D",
      "#FFFFFF",
      "#DC2626",
      "#FF758F",
      "#B91C1C",
    ];
    const shapes: Array<"paper" | "ribbon" | "diamond"> = [
      "paper",
      "ribbon",
      "diamond",
    ];
    return {
      id: i,
      tx: Math.round(Math.cos(angle) * distance),
      ty: Math.round(Math.sin(angle) * distance),
      rot: (i * 97) % 720,
      scale: 0.85 + (i % 5) * 0.22,
      delay: (i % 5) * 0.015,
      duration: 0.65 + (i % 4) * 0.1,
      color: colors[i % colors.length],
      shape: shapes[i % shapes.length],
    };
  },
);

export function PromoStartupModal({ promotions }: PromoStartupModalProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosingExplode, setIsClosingExplode] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const closeTimerRef = useRef<number | null>(null);

  // Seguimiento 3D + ondas de luz roja viva que siguen el cursor
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 240,
    damping: 22,
  });
  const smoothRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-9, 9]), {
    stiffness: 240,
    damping: 22,
  });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [10, 90]), {
    stiffness: 180,
    damping: 24,
  });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, 90]), {
    stiffness: 180,
    damping: 24,
  });

  const auraBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 77, 109, 0.85) 0%, rgba(239, 35, 60, 0.48) 34%, rgba(138, 6, 14, 0) 70%)`,
  );

  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 48%)`,
  );

  const isAuthOrAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/mayorista/registro") ||
    pathname.startsWith("/recuperar-contrasena") ||
    pathname.startsWith("/restablecer-contrasena") ||
    pathname.startsWith("/verificar-correo");

  const popupPromos = promotions.filter((p) => p.showInPopup);
  const rawPromo = popupPromos[0] ?? null;
  const cleanTitle = rawPromo ? stripEmojis(rawPromo.name) : "";
  const promoImageSrc = rawPromo?.imageUrl?.trim() || DEFAULT_PROMO_IMAGE;

  const baseHref = rawPromo?.ctaHref || "/catalogo";
  const targetOfferHref = rawPromo
    ? baseHref.includes("oferta=")
      ? baseHref
      : baseHref.includes("?")
        ? `${baseHref}&oferta=${rawPromo.discountPercent}`
        : `${baseHref}?novedades=1&oferta=${rawPromo.discountPercent}`
    : "/catalogo";

  const triggerExplodeClose = () => {
    if (isClosingExplode) return;
    setIsClosingExplode(true);
    mouseX.set(0);
    mouseY.set(0);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosingExplode(false);
    }, 560);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthOrAdmin || !rawPromo) return;
    if (pathname === "/") {
      const timer = window.setTimeout(() => {
        setBurstKey((prev) => prev + 1);
        setIsClosingExplode(false);
        setIsOpen(true);
      }, 280);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, isAuthOrAdmin, rawPromo]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        triggerExplodeClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isClosingExplode]);

  if (isAuthOrAdmin) {
    return null;
  }

  const handleCardMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isClosingExplode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(nx);
    mouseY.set(ny);
  };

  const handleCardMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const whatsappNum = (siteConfig.contact.whatsapp ?? "51926922583").replace(
    /\D/g,
    "",
  );
  const whatsappDisplay = siteConfig.contact.phone ?? "926 922 583";

  return (
    <>
      {/* Botón flotante de Compras por WhatsApp */}
      <a
        href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(
          "Hola American Colt JEANS™, deseo información sobre prendas por menor / mayor.",
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compras por WhatsApp"
        className="fixed bottom-[3.85rem] left-2 z-40 flex items-center gap-1.5 rounded-full border border-white/90 bg-gradient-to-r from-white to-blue-50 py-1 pl-1 pr-2.5 shadow-lg transition-transform duration-300 hover:scale-105 sm:gap-2 sm:border-2 sm:py-1.5 sm:pl-1.5 sm:pr-4 lg:bottom-4 lg:left-4"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm sm:size-8">
          <SiWhatsapp className="size-3.5 sm:size-4" aria-hidden />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[0.55rem] font-extrabold text-[#0055FF] sm:text-[0.66rem]">
            WhatsApp
          </span>
          <span className="font-mono text-[0.52rem] font-bold text-slate-600 sm:text-[0.62rem]">
            {whatsappDisplay.replace("+51 ", "")}
          </span>
        </span>
      </a>

      {/* Pastilla flotante abajo a la derecha */}
      {rawPromo && !isOpen && (
        <button
          type="button"
          onClick={() => {
            setBurstKey((prev) => prev + 1);
            setIsClosingExplode(false);
            setIsOpen(true);
          }}
          aria-label="Ver oferta especial"
          className="bg-flow fixed bottom-[3.85rem] right-2 z-40 flex items-center gap-1 rounded-full border border-white/90 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2.5 py-1.5 text-white shadow-lg transition-all duration-300 hover:scale-105 sm:gap-2 sm:border-2 sm:px-4 sm:py-2 lg:bottom-4 lg:right-4"
        >
          <FaTags className="size-3 text-white sm:size-3.5" aria-hidden />
          <span className="text-[0.58rem] font-black uppercase tracking-wider sm:text-xs">
            Oferta 3x2 / -{rawPromo.discountPercent}%
          </span>
        </button>
      )}

      {/* POPUP EMERGENTE 3D ROJO VIVO CON OLAS DE SEDA Y SEGUIMIENTO DE CURSOR */}
      <AnimatePresence>
        {rawPromo && isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 [perspective:1200px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="startup-promo-title"
          >
            {/* Fondo desenfocado oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isClosingExplode ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={triggerExplodeClose}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
              aria-hidden
            />

            {/* Partículas suaves de bienvenida en rojo vivo y blanco */}
            {!isClosingExplode && (
              <div
                key={`open-burst-${burstKey}`}
                aria-hidden
                className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
              >
                {OPENING_PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 0.9 }}
                    animate={{
                      x: [0, p.tx, p.tx * 1.1],
                      y: [0, p.ty, p.ty + 110],
                      scale: [0, p.scale, p.scale * 0.8],
                      rotate: [0, p.rot, p.rot + 180],
                      opacity: [0.95, 0.85, 0],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute"
                  >
                    <span
                      className={
                        p.shape === "ribbon"
                          ? "block h-4 w-1.5 rounded-full"
                          : p.shape === "diamond"
                            ? "block size-2.5 rotate-45 rounded-[2px]"
                            : "block size-3 rounded-xs"
                      }
                      style={{ backgroundColor: p.color }}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Onda expansiva + Explosión 3D al hacer clic en Cerrar */}
            {isClosingExplode && (
              <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center overflow-hidden"
              >
                <motion.div
                  initial={{ scale: 0.4, opacity: 0.9 }}
                  animate={{ scale: 3.2, opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="absolute size-48 rounded-full border-4 border-white/85 shadow-[0_0_55px_rgba(239,35,60,0.95)]"
                />
                {EXPLODE_PARTICLES.map((p) => (
                  <motion.div
                    key={`exp-${p.id}`}
                    initial={{ x: 0, y: 0, scale: 0.4, rotate: 0, opacity: 1 }}
                    animate={{
                      x: p.tx * 1.35,
                      y: p.ty * 1.35,
                      scale: [0.6, p.scale * 1.5, 0],
                      rotate: p.rot,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute"
                  >
                    <span
                      className={
                        p.shape === "ribbon"
                          ? "block h-6 w-2 rounded-full shadow-md"
                          : p.shape === "diamond"
                            ? "block size-3.5 rotate-45 rounded-xs shadow-md"
                            : "block size-3.5 rounded-sm shadow-md"
                      }
                      style={{ backgroundColor: p.color }}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* TARJETA 3D ROJO VIVO CON BORDES LUMINOSOS Y MOVIMIENTO AL MOUSE */}
            <motion.div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={
                isClosingExplode
                  ? undefined
                  : {
                      rotateX: smoothRotateX,
                      rotateY: smoothRotateY,
                      transformStyle: "preserve-3d",
                    }
              }
              initial={{ opacity: 0, scale: 0.72, y: 40, rotateX: 14 }}
              animate={
                isClosingExplode
                  ? {
                      scale: [1, 1.07, 0.15],
                      y: [0, -16, -340],
                      rotateZ: [0, -8, 22],
                      rotateX: [0, 14, 42],
                      opacity: [1, 1, 0],
                    }
                  : { opacity: 1, scale: 1, y: 0, rotateX: 0 }
              }
              transition={
                isClosingExplode
                  ? { duration: 0.52, ease: [0.32, 0, 0.67, 0] }
                  : { type: "spring", stiffness: 260, damping: 20 }
              }
              className="group/card relative z-20 w-full max-w-[460px] rounded-[2rem] bg-gradient-to-br from-white via-[#FF4D6D] via-[#EF233C] to-white p-[2.5px] shadow-[0_32px_90px_-12px_rgba(220,38,38,0.85),0_0_52px_-8px_rgba(255,59,71,0.55)]"
            >
              {/* Interior Rojo Vivo Degradado en Movimiento + Olas de Seda Rojas */}
              <div className="bg-flow relative overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-[#8A060E] via-[#DC1422] to-[#EF233C] px-5 pb-6 pt-5 text-center text-white sm:px-7">
                {/* Capas de olas rojas fluidas en movimiento continuo */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                  <svg
                    viewBox="0 0 600 400"
                    preserveAspectRatio="none"
                    className="animate-silk-wave absolute -left-[15%] top-0 h-full w-[140%] opacity-75"
                  >
                    <defs>
                      <linearGradient
                        id="promoRedSilkDeep"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#7F060E" />
                        <stop offset="50%" stopColor="#D90429" />
                        <stop offset="100%" stopColor="#8E0710" />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#promoRedSilkDeep)"
                      d="M0,120 C140,240 310,40 460,160 C540,220 575,90 600,140 L600,400 L0,400 Z"
                    />
                  </svg>

                  <svg
                    viewBox="0 0 600 400"
                    preserveAspectRatio="none"
                    className="animate-silk-wave-reverse absolute -left-[12%] top-0 h-full w-[140%] opacity-70"
                  >
                    <defs>
                      <linearGradient
                        id="promoRedSilkVivid"
                        x1="100%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#A80814" />
                        <stop offset="50%" stopColor="#FF1E38" />
                        <stop offset="100%" stopColor="#9E0812" />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#promoRedSilkVivid)"
                      d="M0,250 C160,110 340,340 480,190 C545,120 580,220 600,175 L600,400 L0,400 Z"
                    />
                  </svg>

                  <svg
                    viewBox="0 0 600 400"
                    preserveAspectRatio="none"
                    className="animate-silk-ribbon absolute -left-[10%] top-0 h-full w-[135%] opacity-55 mix-blend-screen"
                  >
                    <defs>
                      <linearGradient
                        id="promoRedSilkLight"
                        x1="0%"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                      >
                        <stop offset="0%" stopColor="#990912" stopOpacity="0" />
                        <stop
                          offset="45%"
                          stopColor="#FF4D6D"
                          stopOpacity="0.65"
                        />
                        <stop
                          offset="70%"
                          stopColor="#EF233C"
                          stopOpacity="0.4"
                        />
                        <stop
                          offset="100%"
                          stopColor="#8A060E"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#promoRedSilkLight)"
                      d="M0,170 C180,290 360,50 600,210 L600,0 L0,0 Z"
                    />
                  </svg>
                </div>

                {/* Luz de color rojo neón + destello blanco que siguen el cursor en tiempo real */}
                <motion.div
                  aria-hidden
                  style={{ background: auraBackground }}
                  className="pointer-events-none absolute inset-0 z-10 opacity-85 transition-opacity duration-300 group-hover/card:opacity-100"
                />
                <motion.div
                  aria-hidden
                  style={{ background: glareBackground }}
                  className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
                />

                {/* Botón Cerrar (X) con animación giratoria */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={triggerExplodeClose}
                  aria-label="Cerrar oferta"
                  className="absolute right-4 top-4 z-30 flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-white/60 bg-black/20 text-white backdrop-blur-md shadow-md transition-colors hover:border-white hover:bg-white hover:text-[#DC2626]"
                >
                  <FaXmark className="size-4" aria-hidden />
                </motion.button>

                {/* Insignia izquierda blanca/carmesí */}
                <span
                  className="pointer-events-none absolute left-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full border border-white/45 bg-white/15 text-white backdrop-blur-md"
                  aria-hidden
                >
                  <FaPercent className="size-3.5" />
                </span>

                {/* Logo + Sello Blanco Puro con Letras Rojas */}
                <div className="relative z-20 flex flex-col items-center">
                  <Logo size="sm" />

                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-white bg-white px-4 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#C8101E] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)]"
                  >
                    <FaTag className="size-3 text-[#EF233C]" aria-hidden />
                    <span>HASTA -{rawPromo.discountPercent}% OFF</span>
                  </motion.div>
                </div>

                {/* Título nítido en blanco puro */}
                <h2
                  id="startup-promo-title"
                  className="relative z-20 mt-3.5 font-sans text-xl font-black uppercase leading-snug tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)] sm:text-2xl"
                >
                  {cleanTitle}
                </h2>

                {/* IMAGEN CENTRAL COMPACTA EN 3D CON BORDE BLANCO CRISTAL */}
                <Link
                  href={targetOfferHref}
                  onClick={() => setIsOpen(false)}
                  className="group/img relative z-20 mx-auto mt-4 block w-full max-w-[330px] overflow-hidden rounded-2xl border-2 border-white/85 bg-slate-950 shadow-[0_20px_42px_-10px_rgba(0,0,0,0.6),0_0_26px_rgba(255,77,109,0.45)] transition-transform duration-300 hover:scale-[1.03] hover:border-white"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promoImageSrc}
                      alt={cleanTitle || "Promoción American Colt JEANS"}
                      className="size-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    />
                    {/* Brillo diagonal animado al pasar el mouse */}
                    <span className="pointer-events-none absolute -left-full top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent transition-all duration-700 group-hover/img:left-[145%]" />
                  </div>
                </Link>

                {/* BOTÓN PRINCIPAL 3D EN BLANCO LUJOSO Y ROJO VIVO */}
                <div className="relative z-20 mt-5 flex flex-col gap-2.5">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={targetOfferHref}
                      onClick={() => setIsOpen(false)}
                      className="group/cta relative flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-r from-white via-rose-50 to-white px-5 text-xs font-black uppercase tracking-widest text-[#B91C1C] shadow-[0_6px_0_rgba(127,29,29,0.5),0_14px_26px_rgba(0,0,0,0.35)] transition-all hover:from-[#7F060E] hover:via-[#DC1422] hover:to-[#FF3B4E] hover:text-white"
                    >
                      <FaTags
                        className="size-4 text-[#EF233C] transition-colors group-hover/cta:text-white"
                        aria-hidden
                      />
                      <span>
                        Ver Productos con {rawPromo.discountPercent}% OFF
                      </span>
                      <FaArrowRight
                        className="size-3.5 transition-transform group-hover/cta:translate-x-1"
                        aria-hidden
                      />
                    </Link>
                  </motion.div>

                  <div className="flex items-center justify-between px-1 pt-1">
                    <Link
                      href="/mayorista"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-wider text-white/95 underline-offset-4 hover:text-white hover:underline"
                    >
                      <span>¿Mayorista B2B? Ver Lotes</span>
                      <FaArrowRight className="size-3" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={triggerExplodeClose}
                      className="cursor-pointer rounded-xl px-2.5 py-1 text-[0.72rem] font-extrabold text-white/90 transition hover:bg-white/20 hover:text-white"
                    >
                      Cerrar ventana
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
