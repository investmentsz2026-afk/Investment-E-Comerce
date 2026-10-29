import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
  itemClassName?: string;
  /** Duplicamos el contenido para un bucle continuo con translate3d(-50%). */
  separator?: string;
}

/** Cinta tipográfica en bucle infinito, solo CSS (se detiene con prefers-reduced-motion). */
export function Marquee({ items, className, itemClassName, separator = "✦" }: MarqueeProps) {
  const sequence = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className={cn("flex items-center whitespace-nowrap", itemClassName)}>
          <span>{item}</span>
          <span className="mx-[0.9em] text-[0.45em] text-cochinilla" aria-hidden>
            {separator}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn("relative flex overflow-hidden", className)}>
      <div className="flex w-max animate-marquee will-change-transform">
        {sequence(false)}
        {sequence(true)}
      </div>
    </div>
  );
}
