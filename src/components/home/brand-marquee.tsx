import { Marquee } from "@/components/motion/marquee";

const values = [
  "Siluetas atemporales",
  "Tejidos seleccionados",
  "Por menor y por mayor",
  "Confección cuidada",
  "Diseñado para el día a día",
] as const;

/** Transición editorial entre el hero y el contenido: cinta tipográfica serif. */
export function BrandMarquee() {
  return (
    <div className="border-y border-ink/10 bg-paper py-6 lg:py-8" aria-label="Valores de la marca">
      <Marquee items={values} itemClassName="font-display text-3xl italic text-ink lg:text-5xl" separator="✦" />
    </div>
  );
}
