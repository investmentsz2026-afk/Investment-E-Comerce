import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Acceso denegado (403) | INVESTMENTS",
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell max-w-xl text-center py-16">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-cochinilla/10 text-cochinilla">
          <ShieldAlert className="size-7" aria-hidden />
        </div>

        <p className="eyebrow text-cochinilla mt-6">Código 403 · Restringido</p>
        <h1 className="mt-2 font-display text-display-md text-ink">
          Acceso no autorizado
        </h1>
        <p className="mt-3 text-sm text-taupe-600 leading-relaxed max-w-md mx-auto">
          No cuentas con los privilegios administrativos requeridos para acceder a este recurso. Esta acción ha sido registrada en el sistema de seguridad.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/cuenta"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
          >
            Ir a mi cuenta
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/catalogo"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-ink/30 px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
          >
            Explorar catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
