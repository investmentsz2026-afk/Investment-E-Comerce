import type { QuoteStatus } from "@/server/queries/quotes";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; badgeClass: string; description: string }
> = {
  submitted: {
    label: "Enviada",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    description: "Solicitud recibida por el departamento comercial de American Colt JEANS™.",
  },
  under_review: {
    label: "En revisión",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    description: "Ejecutivo comercial evaluando disponibilidad de stock y tarifas por volumen.",
  },
  quoted: {
    label: "Cotización preparada",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    description: "Propuesta económica emitida y lista para tu revisión y decisión.",
  },
  accepted: {
    label: "Aceptada por cliente",
    badgeClass: "border-slate-900 bg-slate-900 text-white",
    description: "Condiciones aceptadas. Lista para coordinación de facturación y despacho.",
  },
  rejected: {
    label: "Rechazada",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    description: "La propuesta o solicitud fue desestimada.",
  },
  expired: {
    label: "Vencida",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
    description: "La fecha límite de validez de la propuesta económica ha expirado.",
  },
  cancelled: {
    label: "Cancelada",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-500",
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
        "inline-flex items-center rounded-full border px-3 py-1 font-sans text-[0.68rem] font-extrabold uppercase tracking-[0.08em] shadow-xs",
        meta.badgeClass,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
