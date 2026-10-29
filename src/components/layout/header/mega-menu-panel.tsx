"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { MainNavItem } from "@/types/navigation";
import { ActionLink } from "@/components/ui/action-link";
import { ease, stagger } from "@/lib/motion";

interface MegaMenuPanelProps {
  item: MainNavItem;
  onNavigate: () => void;
}

const column = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease.luxe } },
};

/** Panel editorial del mega menú: columnas de enlaces + pieza destacada con fotografía. */
export function MegaMenuPanel({ item, onNavigate }: MegaMenuPanelProps) {
  const menu = item.megaMenu;
  if (!menu) return null;

  return (
    <motion.div
      key={item.id}
      variants={stagger(0.06, 0.05)}
      initial="hidden"
      animate="show"
      className="shell grid grid-cols-12 gap-10 py-12"
    >
      <motion.div variants={column} className="col-span-3 flex flex-col justify-between border-r border-ink/10 pr-10">
        <div>
          <p className="eyebrow text-taupe-500">Explorar</p>
          <p className="mt-4 font-display text-display-md text-ink">{item.label}</p>
        </div>
        <p className="max-w-[15rem] text-xs leading-relaxed text-taupe-500">
          Vista previa de la navegación. El catálogo completo se habilitará próximamente.
        </p>
      </motion.div>

      {menu.columns.map((col) => (
        <motion.div key={col.title} variants={column} className="col-span-2">
          <p className="eyebrow text-taupe-500">{col.title}</p>
          <ul className="mt-6 space-y-3.5">
            {col.links.map((link) => (
              <li key={link.label}>
                <ActionLink
                  target={link.target}
                  onActivate={onNavigate}
                  className="group/link relative inline-flex items-center text-[0.95rem] text-ink/80 transition-colors hover:text-ink"
                >
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-cochinilla transition-transform duration-500 ease-luxe group-hover/link:scale-x-100" />
                  </span>
                </ActionLink>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}

      <motion.div variants={column} className="col-span-5 col-start-8">
        <ActionLink
          target={menu.feature.target}
          onActivate={onNavigate}
          className="group/feature relative block aspect-[16/10] w-full overflow-hidden bg-taupe-100 text-left"
        >
          <Image
            src={menu.feature.image.src}
            alt={menu.feature.image.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 0px"
            placeholder={typeof menu.feature.image.src === "string" ? "empty" : "blur"}
            className="object-cover transition-transform duration-[1.4s] ease-luxe group-hover/feature:scale-[1.04]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 text-paper">
            <span>
              <span className="eyebrow block text-paper/70">{menu.feature.eyebrow}</span>
              <span className="mt-3 block font-display text-display-sm">{menu.feature.title}</span>
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-paper/40 transition-transform duration-500 ease-luxe group-hover/feature:rotate-45">
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </span>
        </ActionLink>
      </motion.div>
    </motion.div>
  );
}
