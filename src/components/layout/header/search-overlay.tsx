"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search, X } from "lucide-react";
import { trendingSearches } from "@/config/navigation";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";
import { ease } from "@/lib/motion";

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
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en INVESTMENTS"
      initial="hidden"
      animate="show"
      exit="hidden"
    >
      <motion.button
        type="button"
        aria-label="Cerrar búsqueda"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        className="relative bg-paper pb-10 pt-6 shadow-[0_40px_80px_-40px_rgba(13,12,11,0.5)] lg:pb-14 lg:pt-8"
        variants={{ hidden: { y: "-100%" }, show: { y: "0%" } }}
        transition={{ duration: 0.75, ease: ease.luxe }}
      >
        <div className="shell">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-taupe-500">Buscar</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-11 items-center justify-center rounded-full border border-ink/10 text-ink transition-colors hover:border-ink"
              aria-label="Cerrar búsqueda"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <form onSubmit={submit} role="search" className="mt-6 flex items-center gap-4 border-b border-ink/20 pb-4 focus-within:border-ink">
            <Search className="size-6 shrink-0 text-taupe-500" aria-hidden />
            <label htmlFor="site-search" className="sr-only">
              ¿Qué estás buscando?
            </label>
            <input
              id="site-search"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-display text-display-sm text-ink outline-none placeholder:text-taupe-300 focus-visible:outline-none"
            />
            <button
              type="submit"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-cochinilla"
              aria-label="Buscar"
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </form>

          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="eyebrow text-taupe-500">Búsquedas frecuentes</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => searchTerm(term)}
                      className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/80 transition-colors hover:border-ink hover:text-ink"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-taupe-500 lg:col-span-4 lg:text-right">
              Busca por nombre de prenda, categoría o material. Los resultados se muestran al instante.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
