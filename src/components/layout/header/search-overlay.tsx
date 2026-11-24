"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search, X } from "lucide-react";
import { trendingSearches } from "@/config/navigation";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Buscador visual funcional.
 * Navega a /buscar?q=... al enviar el formulario.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  useLockBodyScroll(open);
  useEscapeKey(open, onClose);

  return (
    <AnimatePresence>
      {open ? <SearchPanel key="search" onClose={onClose} /> : null}
    </AnimatePresence>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
  };

  const searchTerm = (term: string) => {
    onClose();
    router.push(`/buscar?q=${encodeURIComponent(term)}`);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-start justify-center px-2.5 pt-2.5 sm:px-4 sm:pt-4"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en American Colt JEANS"
      initial="hidden"
      animate="show"
      exit="hidden"
    >
      <motion.button
        type="button"
        aria-label="Cerrar búsqueda"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default bg-slate-950/45 backdrop-blur-xs"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-[0_24px_54px_-16px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-3xl sm:p-6"
        variants={{
          hidden: { opacity: 0, y: -26, scale: 0.96 },
          show: { opacity: 1, y: 0, scale: 1 },
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-widest text-[#DC2626] sm:text-[0.65rem]">
            <Search className="size-3" aria-hidden />
            Buscador Rápido
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626] sm:size-9"
            aria-label="Cerrar búsqueda"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form
          onSubmit={submit}
          role="search"
          className="mt-2.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 shadow-inner focus-within:border-[#2563EB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2563EB]/15 sm:mt-4 sm:p-2"
        >
          <Search className="ml-2 size-4 shrink-0 text-slate-400 sm:ml-2.5 sm:size-5" aria-hidden />
          <label htmlFor="site-search" className="sr-only">
            ¿Qué prenda buscas?
          </label>
          <input
            id="site-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: King 767, Camisa Zair, Comfort..."
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-1 font-sans text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar texto"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
          <button
            type="submit"
            className="bg-flow flex h-8 shrink-0 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-white shadow-sm transition-transform hover:scale-[1.03] sm:h-9 sm:px-4 sm:text-xs"
            aria-label="Buscar"
          >
            <span className="hidden sm:inline">Buscar</span>
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </form>

        <div className="mt-3 sm:mt-4">
          <p className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-slate-400 sm:text-[0.64rem]">
            Búsquedas frecuentes
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {trendingSearches.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  onClick={() => searchTerm(term)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.66rem] font-bold text-slate-700 transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626] sm:px-3.5 sm:py-1.5 sm:text-xs"
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
