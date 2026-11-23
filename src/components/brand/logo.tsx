import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Muestra el descriptor bajo el logotipo. */
  withDescriptor?: boolean;
  /** Tamaño del logo visual */
  size?: "sm" | "md" | "lg";
}

/**
 * Logotipo oficial American Colt JEANS™.
 * Utiliza la imagen oficial subida por la marca (`/logo-american-colt.png`)
 * con respaldo accesible para lectores de pantalla.
 */
export function Logo({ className, withDescriptor = false, size = "md" }: LogoProps) {
  const dimensions =
    size === "sm"
      ? "h-9 w-[124px] sm:h-10 sm:w-[138px]"
      : size === "lg"
        ? "h-12 w-[168px] sm:h-14 sm:w-[196px]"
        : "h-10 w-[136px] sm:h-12 sm:w-[164px]";

  return (
    <span className={cn("inline-flex flex-col items-center leading-none select-none", className)}>
      <span
        className={cn(
          "relative inline-block overflow-hidden rounded-lg bg-[#91151B] shadow-md ring-1 ring-white/40",
          dimensions,
        )}
      >
        <Image
          src="/logo-american-colt.png"
          alt="American Colt JEANS™"
          fill
          sizes="200px"
          priority
          className="object-contain"
        />
        <span className="sr-only">American Colt JEANS</span>
      </span>
      {withDescriptor ? (
        <span className="eyebrow mt-2 text-[0.55rem] tracking-[0.36em] opacity-75">
          Jeans &amp; Moda · Lima — Perú
        </span>
      ) : null}
    </span>
  );
}
