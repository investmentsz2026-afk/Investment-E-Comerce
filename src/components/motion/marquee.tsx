import { FaCircleCheck } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
  itemClassName?: string;
}

/** Cinta tipográfica en bucle infinito con icono oficial Font Awesome. */
export function Marquee({ items, className, itemClassName }: MarqueeProps) {
  const sequence = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className={cn("flex items-center whitespace-nowrap", itemClassName)}>
          <span>{item}</span>
          <span className="mx-4 inline-flex items-center text-white/90" aria-hidden>
            <FaCircleCheck className="size-3.5" />
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
