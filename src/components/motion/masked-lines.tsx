"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { maskUp, stagger } from "@/lib/motion";

type HeadingTag = "h1" | "h2" | "h3" | "p" | "div";

interface MaskedLinesProps {
  lines: readonly ReactNode[];
  as?: HeadingTag;
  id?: string;
  className?: string;
  lineClassName?: string;
  delay?: number;
  staggerDelay?: number;
  /** "mount" anima al cargar (hero); "inView" al entrar en pantalla. */
  trigger?: "mount" | "inView";
}

/**
 * Titular editorial: cada línea emerge desde una máscara con un escalonado suave.
 * Solo anima transform, por lo que no provoca recálculos de layout.
 */
export function MaskedLines({
  lines,
  as: Tag = "h2",
  id,
  className,
  lineClassName,
  delay = 0,
  staggerDelay = 0.09,
  trigger = "inView",
}: MaskedLinesProps) {
  const animation =
    trigger === "mount"
      ? { animate: "show" as const }
      : { whileInView: "show" as const, viewport: { once: true, amount: 0.5 } };

  return (
    <Tag id={id} className={className}>
      <motion.span className="block" variants={stagger(staggerDelay, delay)} initial="hidden" {...animation}>
        {lines.map((line, i) => (
          <span key={i} className="-mb-[0.1em] block overflow-hidden pb-[0.1em] pr-[0.08em]">
            <motion.span className={cn("block will-change-transform", lineClassName)} variants={maskUp}>
              {line}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
