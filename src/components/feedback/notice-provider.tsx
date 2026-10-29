"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Clock3, X } from "lucide-react";
import { roadmap, type FeatureKey } from "@/config/roadmap";
import { ease } from "@/lib/motion";

interface Notice {
  id: number;
  title: string;
  description: string;
}

interface NoticeContextValue {
  /** Muestra un aviso genérico. */
  notify: (notice: Omit<Notice, "id">) => void;
  /** Comunica que una funcionalidad pertenece a una fase futura. */
  announcePending: (feature: FeatureKey) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

const AUTO_DISMISS_MS = 4800;
let nextId = 0;

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);

  const dismiss = useCallback((id: number) => {
    setNotices((current) => current.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((notice: Omit<Notice, "id">) => {
    nextId += 1;
    const id = nextId;
    // Máximo 2 avisos simultáneos para no saturar la interfaz.
    setNotices((current) => [...current.slice(-1), { ...notice, id }]);
  }, []);

  const announcePending = useCallback(
    (feature: FeatureKey) => {
      notify({
        title: "Próximamente",
        description: `${roadmap[feature].label} estará disponible muy pronto. Estamos preparando cada detalle.`,
      });
    },
    [notify],
  );

  const value = useMemo(() => ({ notify, announcePending }), [notify, announcePending]);

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-8"
      >
        <AnimatePresence initial={false}>
          {notices.map((notice) => (
            <NoticeToast key={notice.id} notice={notice} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </NoticeContext.Provider>
  );
}

function NoticeToast({ notice, onDismiss }: { notice: Notice; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(notice.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice.id, onDismiss]);

  return (
    <motion.div
      layout
      role="status"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.25 } }}
      transition={{ duration: 0.55, ease: ease.luxe }}
      className="pointer-events-auto flex w-full max-w-md items-start gap-4 bg-ink px-5 py-4 text-paper shadow-[0_24px_60px_-20px_rgba(13,12,11,0.55)]"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-paper/15 text-cochinilla-bright">
        <Clock3 className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-paper/60">{notice.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-paper/90">{notice.description}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(notice.id)}
        className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center text-paper/50 transition-colors hover:text-paper"
        aria-label="Cerrar aviso"
      >
        <X className="size-4" aria-hidden />
      </button>
    </motion.div>
  );
}

export function useNotice(): NoticeContextValue {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotice debe usarse dentro de <NoticeProvider>.");
  return ctx;
}
