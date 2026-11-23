import { Marquee } from "@/components/motion/marquee";

const values = [
  "AMERICAN COLT JEANS™",
  "OFERTA 3X2 Y HASTA 50% OFF",
  "ENVÍO RÁPIDO 24HRS",
  "VENTA POR UNIDAD Y POR MAYOR B2B",
  "PAGOS SEGUROS CON YAPE, PLIN Y TARJETAS",
] as const;

/** Cinta promocional con degradado animado elegante en Índigo-Zafiro. */
export function BrandMarquee() {
  return (
    <div
      className="bg-flow bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] py-3 text-paper shadow-sm border-y border-white/10"
      aria-label="Valores de American Colt Jeans"
    >
      <Marquee
        items={values}
        itemClassName="font-sans text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-paper"
      />
    </div>
  );
}
