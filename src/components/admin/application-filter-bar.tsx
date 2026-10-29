"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "under_review", label: "En evaluación" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "suspended", label: "Suspendidas" },
] as const;

export function ApplicationFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("estado") ?? "";
  const currentSearch = searchParams.get("q") ?? "";

  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [k, v] of Object.entries(newParams)) {
          if (v === null || v === "") params.delete(k);
          else params.set(k, v);
        }
        params.delete("pagina");
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-taupe-400" aria-hidden />
          <input
            type="search"
            placeholder="Buscar por Razón Social, RUC, Correo o Contacto..."
            defaultValue={currentSearch}
            onChange={(e) => updateParams({ q: e.target.value.trim() || null })}
            className="w-full border border-ink/20 bg-paper pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none"
          />
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-xs text-taupe-500">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Actualizando lista...</span>
          </div>
        )}
      </div>

      {/* Pestañas de estado */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-ink/10 pb-2">
        {STATUS_TABS.map((tab) => {
          const active = currentStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParams({ estado: tab.value || null })}
              className={`shrink-0 px-3.5 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] transition-colors rounded-none ${
                active
                  ? "bg-ink text-paper"
                  : "text-taupe-600 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
