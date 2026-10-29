import type { QuoteStatus } from "@/server/queries/quotes";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; badgeClass: string; description: string }
> = {
  submitted: {
    label: "Enviada",
    badgeClass: "border-sky-300 bg-sky-50 text-sky-900",
    description: "Solicitud recibida por el departamento comercial de INVESTMENTS.",
  },
  under_review: {
    label: "En revisión",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-900",
    description: "Ejecutivo comercial evaluando disponibilidad de stock y tarifas por volumen.",
  },
  quoted: {
    label: "Cotización preparada",
    badgeClass: "border-emerald-400 bg-emerald-100 text-emerald-950 font-semibold",
    description: "Propuesta económica emitida y lista para tu revisión y decisión.",
  },
  accepted: {
    label: "Aceptada por cliente",
    badgeClass: "border-ink bg-ink text-paper",
    description: "Condiciones aceptadas. Lista para coordinación de facturación y despacho.",
  },
  rejected: {
    label: "Rechazada",
    badgeClass: "border-rose-300 bg-rose-50 text-rose-900",
    description: "La propuesta o solicitud fue desestimada.",
  },
  expired: {
    label: "Vencida",
    badgeClass: "border-taupe-300 bg-taupe-100 text-taupe-700",
    description: "La fecha límite de validez de la propuesta económica ha expirado.",
  },
  cancelled: {
    label: "Cancelada",
    badgeClass: "border-taupe-300 bg-taupe-100 text-taupe-600",
    description: "Solicitud cancelada por la empresa solicitante.",
  },
};

export function getQuoteStatusMeta(status: QuoteStatus) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;
}

export function QuoteStatusBadge({
  status,
  className,
}: {
  status: QuoteStatus;
  className?: string;
}) {
  const meta = getQuoteStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.14em]",
        meta.badgeClass,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

