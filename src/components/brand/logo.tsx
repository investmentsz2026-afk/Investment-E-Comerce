import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Muestra el descriptor bajo el logotipo. */
  withDescriptor?: boolean;
}

/**
 * Logotipo tipográfico INVESTMENTS.
 * Sans de peso medio con tracking amplio y un punto en color cochinilla como firma.
 */
export function Logo({ className, withDescriptor = false }: LogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span className="flex items-baseline font-sans text-[1.05rem] font-semibold tracking-[0.34em] sm:text-[1.15rem]">
        INVESTMENTS
        <span className="ml-[-0.2em] inline-block size-[0.32em] translate-y-[-0.05em] rounded-full bg-cochinilla" aria-hidden />
      </span>
      {withDescriptor ? (
        <span className="eyebrow mt-2 text-[0.55rem] tracking-[0.42em] opacity-60">Lima — Perú</span>
      ) : null}
    </span>
  );
}
