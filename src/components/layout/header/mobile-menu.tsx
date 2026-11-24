"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  Headphones,
  Heart,
  MapPin,
  Percent,
  Truck,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";
import { DRAWER_CATEGORIES } from "./header-categories";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/** Menú lateral izquierdo moderno para móvil que desliza de izquierda a derecha con acordeones hacia abajo. */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useLockBodyScroll(open);
  useEscapeKey(open, onClose);

  return (
    <AnimatePresence>
      {open ? <MobileMenuSheet key="mobile-menu" onClose={onClose} /> : null}
    </AnimatePresence>
  );
}

function MobileMenuSheet({ onClose }: { onClose: () => void }) {
  const [expandedCatId, setExpandedCatId] = useState<string | null>(DRAWER_CATEGORIES[0]?.id ?? null);
  const { count: favoritesCount, snapshot: favSnapshot } = useFavorites();
  const favoritesHref = favSnapshot.isAuthenticated ? "/cuenta/favoritos" : "/favoritos";

  const toggleCategory = (id: string) => {
    setExpandedCatId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal móvil"
      className="fixed inset-0 z-[75] lg:hidden"
    >
      {/* Fondo difuminado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
        aria-hidden
      />

      {/* Cajón lateral deslizable desde la izquierda hacia la derecha */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed inset-y-0 left-0 z-10 flex w-[85vw] max-w-[330px] flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl"
      >
        {/* Cabecera Roja Compacta */}
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#9E0812] via-[#DC1422] to-[#A80A14] px-4 py-3 text-white">
          <Link href="/" onClick={onClose} className="inline-flex items-center">
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex size-8 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition-colors hover:bg-white hover:text-[#DC2626]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {/* Lista de Categorías del Header con Acordeones hacia abajo */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/atencion-al-cliente"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-2.5 py-2 text-[0.68rem] font-extrabold text-[#C8101E]"
            >
              <Headphones className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">Atención Cliente</span>
            </Link>
            <Link
              href="/mayorista/cotizaciones"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#EF233C] px-2.5 py-2 text-[0.68rem] font-extrabold text-white shadow-xs"
            >
              <Warehouse className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">Mayorista B2B</span>
            </Link>
          </div>

          <div className="space-y-1.5 pt-1">
            {DRAWER_CATEGORIES.map((cat) => {
              const isOpen = expandedCatId === cat.id;
              const allLinks = cat.groups.flatMap((g) => g.items);

              return (
                <div
                  key={cat.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border transition-colors",
                    isOpen ? "border-red-200 bg-red-50/25" : "border-slate-200/80 bg-white",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
                  >
                    <div className="min-w-0 pr-2">
                      <span
                        className={cn(
                          "block text-xs font-extrabold uppercase tracking-tight",
                          cat.highlight || isOpen ? "text-[#C8101E]" : "text-slate-900",
                        )}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-slate-400 transition-transform duration-200",
                        isOpen && "rotate-180 text-[#DC2626]",
                      )}
                      aria-hidden
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden border-t border-slate-100 bg-white/90"
                      >
                        <ul className="divide-y divide-slate-100 px-2 py-1">
                          {allLinks.map((sub) => (
                            <li key={`${cat.id}-${sub.label}`}>
                              <Link
                                href={sub.href}
                                onClick={onClose}
                                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[0.72rem] font-semibold text-slate-700 hover:bg-red-50 hover:text-[#C8101E]"
                              >
                                <span className="truncate">{sub.label}</span>
                                <span className="flex shrink-0 items-center gap-1.5">
                                  {sub.tag && (
                                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[0.58rem] font-bold text-slate-600">
                                      {sub.tag}
                                    </span>
                                  )}
                                  <ArrowRight className="size-3 text-slate-400" aria-hidden />
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <div className="p-2 pt-1">
                          <Link
                            href={cat.allHref}
                            onClick={onClose}
                            className="flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-slate-900 text-[0.65rem] font-extrabold uppercase tracking-wider text-white hover:bg-[#DC2626]"
                          >
                            <span>Ver todo {cat.label}</span>
                            <ArrowRight className="size-3" aria-hidden />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Accesos rápidos */}
          <div className="space-y-1.5 pt-2">
            <Link
              href="/catalogo?novedades=1&oferta=50"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-3.5 py-2.5 text-xs font-extrabold text-white"
            >
              <span className="flex items-center gap-2">
                <Percent className="size-3.5" aria-hidden />
                Liquidación 3x2 / -50%
              </span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href="/seguir-pedido"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs font-bold text-[#1E3A8A]"
            >
              <span className="flex items-center gap-2">
                <Truck className="size-3.5 text-[#2563EB]" aria-hidden />
                Seguir mi Pedido
              </span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href="/tiendas"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800"
            >
              <span className="flex items-center gap-2">
                <MapPin className="size-3.5 text-[#DC2626]" aria-hidden />
                Nuestras Tiendas (Mapa)
              </span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Pie compacto del Cajón */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2.5">
          <Link
            href="/cuenta"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[0.7rem] font-bold text-slate-800"
          >
            <UserRound className="size-3.5 text-[#2563EB]" aria-hidden />
            <span>Mi cuenta</span>
          </Link>
          <Link
            href={favoritesHref}
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[0.7rem] font-bold text-slate-800"
          >
            <Heart className={cn("size-3.5", favoritesCount > 0 && "fill-[#DC2626] text-[#DC2626]")} aria-hidden />
            <span>Favoritos ({favoritesCount})</span>
          </Link>
        </div>
      </motion.aside>
    </div>
  );
}
