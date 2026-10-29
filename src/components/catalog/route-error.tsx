"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
}

/** Pantalla de error recuperable para rutas del catálogo (no expone detalles técnicos al usuario). */
export function RouteError({
  error,
  reset,
  title = "No pudimos cargar esta página",
  message = "Ocurrió un problema al consultar el catálogo. Puedes intentarlo de nuevo o volver más tarde.",
}: RouteErrorProps) {
  useEffect(() => {
    console.error("[catalogo] Error de ruta:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell flex min-h-[50vh] flex-col items-center justify-center pb-24 text-center" role="alert">
        <p className="eyebrow text-taupe-500">Error</p>
        <h1 className="mt-4 font-display text-display-md text-ink">{title}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-taupe-600">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center gap-2 bg-ink px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reintentar
          </button>
          <Link
            href="/catalogo"
            className="inline-flex h-12 items-center border border-ink/20 px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
          >
            Ir al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
