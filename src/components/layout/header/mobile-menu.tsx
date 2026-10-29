"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Heart, UserRound, X } from "lucide-react";
import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { ActionLink } from "@/components/ui/action-link";
import { useNotice } from "@/components/feedback/notice-provider";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuTabs = mainNav.filter((item) => item.megaMenu);

/** Menú móvil a pantalla completa, diseñado como experiencia propia (no una versión reducida del escritorio). */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useLockBodyScroll(open);
  useEscapeKey(open, onClose);

  return <AnimatePresence>{open ? <MobileMenuSheet key="mobile-menu" onClose={onClose} /> : null}</AnimatePresence>;
}

function MobileMenuSheet({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = useState(menuTabs[0]?.id ?? "");
  const { announcePending } = useNotice();
  const active = menuTabs.find((t) => t.id === activeId) ?? menuTabs[0];
  const links = active?.megaMenu?.columns.flatMap((c) => c.links) ?? [];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal"
      className="fixed inset-0 z-[65] flex flex-col bg-paper lg:hidden"
      initial={{ y: "-100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.7, ease: ease.curtain }}
    >
      <div className="shell flex h-16 shrink-0 items-center justify-between border-b border-ink/10">
        <Logo className="text-ink" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="-mr-2 flex size-11 items-center justify-center text-ink"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="shell pt-6" role="tablist" aria-label="Secciones">
          <div className="flex gap-6 border-b border-ink/10">
            {menuTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={tab.id === activeId}
                onClick={() => setActiveId(tab.id)}
                className={cn(
                  "relative pb-3 text-sm font-medium uppercase tracking-[0.14em] transition-colors",
                  tab.id === activeId ? "text-ink" : "text-taupe-400",
                )}
              >
                {tab.label}
                {tab.id === activeId ? (
                  <motion.span layoutId="mobile-tab-indicator" className="absolute inset-x-0 -bottom-px h-0.5 bg-cochinilla" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <motion.ul
          key={activeId}
          className="shell mt-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } } }}
        >
          {links.map((link) => (
            <motion.li
              key={link.label}
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.luxe } } }}
              className="border-b border-ink/[0.07]"
            >
              <ActionLink
                target={link.target}
                onActivate={onClose}
                className="flex w-full items-center justify-between py-4 text-left font-display text-[1.9rem] leading-none text-ink"
              >
                {link.label}
                <ArrowRight className="size-4 text-taupe-400" aria-hidden />
              </ActionLink>
            </motion.li>
          ))}
        </motion.ul>

        <div className="shell mt-8 space-y-3 pb-10">
          <a
            href="#mayorista"
            onClick={onClose}
            className="group/w relative flex items-center justify-between overflow-hidden bg-ink px-6 py-6 text-paper"
          >
            <span>
              <span className="eyebrow block text-cochinilla-bright">B2B · Empresas</span>
              <span className="mt-2 block font-display text-2xl">Venta por mayor</span>
            </span>
            <ArrowRight className="size-5 transition-transform group-active/w:translate-x-1" aria-hidden />
          </a>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/cuenta"
              onClick={onClose}
              className="flex items-center gap-3 border border-ink/10 px-4 py-4 text-sm text-ink hover:border-ink transition-colors"
            >
              <UserRound className="size-4" aria-hidden /> Mi cuenta
            </Link>
            <button
              type="button"
              onClick={() => announcePending("favorites")}
              className="flex items-center gap-3 border border-ink/10 px-4 py-4 text-sm text-ink"
            >
              <Heart className="size-4" aria-hidden /> Favoritos
            </button>
          </div>
          <p className="eyebrow pt-4 text-center text-taupe-400">{siteConfig.season}</p>
        </div>
      </div>
    </motion.div>
  );
}
