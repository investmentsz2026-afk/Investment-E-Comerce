"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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

const DEFAULT_POPUP_PROMO: PublicPromotionItem = {
  id: 0,
  code: "OFERTA50",
  name: "¡GRAN OFERTA 3x2 Y HASTA 50% DE DESCUENTO!",
  description: null,
  cleanDescription:
    "Lleva tus Jeans Denim, Pantalones Drill, Bermudas, Camisas y Polos American Colt JEANS™ con promoción 3x2 y descuentos de hasta 50% OFF en prendas seleccionadas. Haz clic aquí para ver todas las prendas en oferta.",
  discountPercent: 50,
  channelTarget: "retail",
  placement: "all",
  ctaHref: "/catalogo?novedades=1&oferta=50",
  showInTopBar: true,
  showInPopup: true,
  showInHomeBanner: true,
  endsAtIso: new Date(Date.now() + 7 * 86400000).toISOString(),
};

interface ConfettiPiece {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  scale: number;
  delay: number;
  duration: number;
  color: string;
  shape: "paper" | "ribbon";
}

// Partículas geométricas de papel (sin iconos de estrellas ni emojis)
const CONFETTI_PARTICLES: readonly ConfettiPiece[] = Array.from({ length: 44 }, (_, i) => {
  const angle = (i / 44) * Math.PI * 2;
  const distance = 120 + ((i * 37) % 190);
  const tx = Math.round(Math.cos(angle) * distance);
  const ty = Math.round(Math.sin(angle) * distance - 30);
  const colors = [
    "#0077FF", // Azul eléctrico
    "#EF233C", // Rojo reluciente
    "#FFFFFF", // Blanco puro
    "#38BDF8", // Celeste brillante
    "#1D4ED8", // Azul real
  ];
  const shapes: Array<"paper" | "ribbon"> = ["paper", "ribbon"];
  return {
    id: i,
    tx,
    ty,
    rot: (i * 73) % 360,
    scale: 0.75 + ((i % 5) * 0.16),
    delay: (i % 8) * 0.035,
    duration: 1.4 + ((i % 6) * 0.22),
    color: colors[i % colors.length],
    shape: shapes[i % shapes.length],
  };
});

export function PromoStartupModal({ promotions }: PromoStartupModalProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const isAuthOrAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/mayorista/registro") ||
    pathname.startsWith("/recuperar-contrasena") ||
    pathname.startsWith("/restablecer-contrasena") ||
    pathname.startsWith("/verificar-correo");

  const popupPromos = promotions.filter((p) => p.showInPopup);
  const rawPromo = popupPromos[0] ?? promotions[0] ?? DEFAULT_POPUP_PROMO;
  const cleanTitle = stripEmojis(rawPromo.name);

  // Asegurar que el enlace lleve siempre a los productos filtrados con ese descuento
  const baseHref = rawPromo.ctaHref || "/catalogo";
  const targetOfferHref = baseHref.includes("?")
    ? `${baseHref}&oferta=${rawPromo.discountPercent}`
    : `${baseHref}?novedades=1&oferta=${rawPromo.discountPercent}`;

  // Se abre en cada carga o recarga de la página de inicio
  useEffect(() => {
    if (isAuthOrAdmin) return;
    if (pathname === "/") {
      const timer = window.setTimeout(() => {
        setBurstKey((prev) => prev + 1);
        setIsOpen(true);
      }, 280);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, isAuthOrAdmin]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (isAuthOrAdmin) {
    return null;
  }

  const whatsappNum = (siteConfig.contact.whatsapp ?? "51926922583").replace(/\D/g, "");
  const whatsappDisplay = siteConfig.contact.phone ?? "926 922 583";

  return (
    <>
      {/* Botón flotante de Compras por WhatsApp con icono oficial Simple Icons */}
      <a
        href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(
          "Hola American Colt JEANS™, deseo información sobre prendas por menor / mayor.",
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compras por WhatsApp"
        className="fixed bottom-16 left-3 z-40 flex items-center gap-2 rounded-full border-2 border-white bg-gradient-to-r from-white to-blue-50 py-1.5 pl-1.5 pr-4 shadow-xl transition-transform duration-300 hover:scale-105 lg:bottom-4 lg:left-4"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md">
          <SiWhatsapp className="size-4" aria-hidden />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[0.66rem] font-extrabold text-[#0055FF]">Compras por WhatsApp</span>
          <span className="font-mono text-[0.62rem] font-bold text-slate-600">
            {whatsappDisplay.replace("+51 ", "")}
          </span>
        </span>
      </a>

      {/* Pastilla flotante abajo a la derecha con icono Font Awesome FaTags (sin icono de regalo/sorpresa) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setBurstKey((prev) => prev + 1);
            setIsOpen(true);
          }}
          aria-label="Ver oferta especial"
          className="fixed bottom-16 right-3 z-40 flex items-center gap-2 rounded-full border-2 border-white bg-gradient-to-r from-[#0066FF] via-[#2563EB] to-[#EF233C] px-4 py-2 text-white shadow-xl transition-all duration-300 hover:scale-105 lg:bottom-4 lg:right-4"
        >
          <FaTags className="size-3.5 text-white" aria-hidden />
          <span className="text-xs font-black uppercase tracking-wider">
            Oferta 3x2 / -{rawPromo.discountPercent}%
          </span>
        </button>
      )}

      {/* BANNER EMERGENTE DE OFERTA CON ICONOS FONT AWESOME (CERO EMOJIS / CERO ESTRELLITAS) */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="false"
            aria-labelledby="startup-promo-title"
          >
            {/* Fondo nublado alrededor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
              aria-hidden
            />

            {/* Explosión de Confeti Geométrico (Cintas y Papelitos sin estrellitas) */}
            <div
              key={`burst-${burstKey}`}
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
            >
              {CONFETTI_PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: [0, p.tx, p.tx * 1.15],
                    y: [0, p.ty, p.ty + 170],
                    scale: [0, p.scale * 1.2, p.scale],
                    rotate: [0, p.rot, p.rot + 240],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: [0.16, 1, 0.3, 1],
                    repeat: Infinity,
                    repeatDelay: 1.2,
                  }}
                  className="absolute"
                >
                  {p.shape === "ribbon" ? (
                    <span
                      className="block h-5 w-2 rounded-full shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                  ) : (
                    <span
                      className="block h-3.5 w-3.5 rounded-xs shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Tarjeta Principal Redondeada y Reluciente */}
            <motion.div
              initial={{ opacity: 0, scale: 0.72, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="pointer-events-auto relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-[#0055FF] via-[#1D4ED8] to-[#B91C24] p-1 shadow-[0_25px_70px_-10px_rgba(0,102,255,0.65)]"
            >
              {/* Botón Cerrar (X) con Font Awesome */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar oferta"
                className="absolute right-4 top-4 z-30 flex size-9 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-white hover:text-[#B91C24]"
              >
                <FaXmark className="size-4" aria-hidden />
              </button>

              {/* Insignia corporativa limpia en esquina superior izquierda con Font Awesome */}
              <span
                className="pointer-events-none absolute left-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white backdrop-blur-md"
                aria-hidden
              >
                <FaPercent className="size-3.5" />
              </span>

              {/* Interior Reluciente Cliqueable */}
              <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-b from-[#0055FF]/95 via-[#1E40AF]/95 to-[#91151B]/95 px-6 pb-7 pt-7 text-center text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-white/25 blur-2xl"
                />

                <div className="relative z-10 flex justify-center">
                  <Logo size="md" />
                </div>

                {/* Sello de Oferta con Iconos Font Awesome (FaTag y FaPercent) */}
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-gradient-to-r from-[#EF233C] via-[#D90429] to-[#EF233C] px-5 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg"
                >
                  <FaTag className="size-3.5 text-white" aria-hidden />
                  <span>PROMOCIÓN 3x2 Y HASTA {rawPromo.discountPercent}% DSCTO</span>
                  <FaPercent className="size-3 text-white" aria-hidden />
                </motion.div>

                {/* Título Grande de la Oferta */}
                <Link
                  href={targetOfferHref}
                  onClick={() => setIsOpen(false)}
                  className="group relative z-10 mt-4 block focus-visible:outline-none"
                >
                  <h2
                    id="startup-promo-title"
                    className="font-sans text-2xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-md sm:text-3xl"
                  >
                    {cleanTitle}
                  </h2>

                  {/* Gran Burbuja Visual 3x2 / -50% OFF */}
                  <div className="my-4 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border-2 border-white/40 bg-white/15 px-6 py-3 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                    <div className="text-center">
                      <span className="block font-mono text-[0.65rem] font-extrabold uppercase tracking-widest text-cyan-200">
                        LLEVA MÁS PAGANDO MENOS
                      </span>
                      <span className="font-sans text-3xl font-black tracking-tight text-white sm:text-4xl">
                        3x2 <span className="text-amber-300">- {rawPromo.discountPercent}% de descuento</span>
                      </span>
                    </div>
                  </div>

                  <p className="mx-auto max-w-md text-xs font-medium leading-relaxed text-blue-50 sm:text-sm">
                    {rawPromo.cleanDescription}
                  </p>
                </Link>

                {/* Botón Principal con Iconos Font Awesome (FaTags y FaArrowRight) */}
                <div className="relative z-10 mt-6 flex flex-col gap-2.5">
                  <Link
                    href={targetOfferHref}
                    onClick={() => setIsOpen(false)}
                    className="group/cta flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-white bg-white px-6 text-xs font-black uppercase tracking-widest text-[#0055FF] shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-[#0055FF] hover:text-white sm:text-sm"
                  >
                    <FaTags className="size-4 text-[#EF233C] group-hover/cta:text-white" aria-hidden />
                    <span>Ver Productos con {rawPromo.discountPercent}% de Descuento</span>
                    <FaArrowRight className="size-3.5 transition-transform group-hover/cta:translate-x-1" aria-hidden />
                  </Link>

                  <div className="flex items-center justify-between px-2 pt-1">
                    <Link
                      href="/mayorista"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-wider text-cyan-200 underline-offset-4 hover:underline"
                    >
                      <span>¿Compras por Mayor B2B? Ver Lotes</span>
                      <FaArrowRight className="size-3" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-[0.72rem] font-bold text-blue-100 hover:text-white"
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
