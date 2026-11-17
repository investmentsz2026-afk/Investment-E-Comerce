import { Marquee } from "@/components/motion/marquee";

const values = [
  "AMERICAN COLT JEANS™",
  "OFERTA 3X2 Y HASTA 50% OFF",
  "ENVÍO RÁPIDO 24HRS",
  "VENTA POR UNIDAD Y POR MAYOR B2B",
  "PAGOS SEGUROS CON YAPE, PLIN Y TARJETAS",
] as const;

/** Cinta promocional reluciente en Azul Eléctrico Oficial (#0055FF) con estrellas. */
export function BrandMarquee() {
  return (
    <div
      className="bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#0055FF] py-3 text-paper shadow-sm"
      aria-label="Valores de American Colt Jeans"
    >
      <Marquee
        items={values}
        itemClassName="font-sans text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-paper"
      />
    </div>
  );
}
