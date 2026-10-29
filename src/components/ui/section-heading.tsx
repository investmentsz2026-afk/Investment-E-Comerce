import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MaskedLines } from "@/components/motion/masked-lines";
import { Reveal } from "@/components/motion/reveal";

interface SectionHeadingProps {
  index: string;
  label: string;
  /** Cada elemento es una línea del título con revelado enmascarado. */
  title: readonly ReactNode[];
  description?: ReactNode;
  aside?: ReactNode;
  tone?: "dark" | "light";
  /** Apila título y texto (útil dentro de columnas estrechas). */
  stacked?: boolean;
  className?: string;
  id?: string;
}

/** Encabezado editorial de sección: índice, etiqueta, título serif y texto de apoyo. */
export function SectionHeading({
  index,
  label,
  title,
  description,
  aside,
  tone = "dark",
  stacked = false,
  className,
  id,
}: SectionHeadingProps) {
  const isLight = tone === "light";
  return (
    <div className={cn("grid gap-8", !stacked && "lg:grid-cols-12 lg:items-end", className)}>
      <div className={stacked ? undefined : "lg:col-span-7"}>
        <Reveal y={12}>
          <p className={cn("eyebrow flex items-center gap-3", isLight ? "text-paper/60" : "text-taupe-500")}>
            <span className={isLight ? "text-cochinilla-bright" : "text-cochinilla"}>{index}</span>
            <span className={cn("h-px w-8", isLight ? "bg-paper/30" : "bg-ink/20")} aria-hidden />
            {label}
          </p>
        </Reveal>
        <MaskedLines
          as="h2"
          id={id}
          lines={title}
          className={cn("mt-6 font-display text-display-lg", isLight ? "text-paper" : "text-ink")}
        />
      </div>
      {description || aside ? (
        <Reveal delay={0.15} className={cn("flex flex-col gap-6", !stacked && "lg:col-span-4 lg:col-start-9 lg:pb-3")}>
          {description ? (
            <p className={cn("max-w-md text-[0.95rem] leading-relaxed", isLight ? "text-paper/70" : "text-taupe-600")}>
              {description}
            </p>
          ) : null}
          {aside}
        </Reveal>
      ) : null}
    </div>
  );
}
