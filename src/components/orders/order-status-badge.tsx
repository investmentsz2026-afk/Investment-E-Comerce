import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/server/queries/orders";

const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending_payment: {
    label: "Pendiente de Pago",
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  payment_processing: {
    label: "Pago en Proceso",
    className: "border-sky-300 bg-sky-50 text-sky-950",
  },
  paid: {
    label: "Pagado",
    className: "border-emerald-300 bg-emerald-50 text-emerald-950",
  },
  preparing: {
    label: "Preparando Pedido",
    className: "border-indigo-300 bg-indigo-50 text-indigo-950",
  },
  shipped: {
    label: "Enviado / En Ruta",
    className: "border-purple-300 bg-purple-50 text-purple-950",
  },
  delivered: {
    label: "Entregado",
    className: "border-emerald-500 bg-emerald-100 text-emerald-950",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-taupe-300 bg-taupe-100 text-taupe-700",
  },
  payment_failed: {
    label: "Pago Fallido",
    className: "border-rose-300 bg-rose-50 text-rose-950",
  },
  refunded: {
    label: "Reembolsado",
    className: "border-amber-400 bg-amber-100 text-amber-950",
  },
};

const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pago Pendiente",
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  processing: {
    label: "En Verificación",
    className: "border-sky-300 bg-sky-50 text-sky-900",
  },
  approved: {
    label: "Pago Aprobado",
    className: "border-emerald-400 bg-emerald-50 text-emerald-950",
  },
  rejected: {
    label: "Pago Rechazado",
    className: "border-rose-300 bg-rose-50 text-rose-950",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-taupe-300 bg-taupe-100 text-taupe-700",
  },
  refunded: {
    label: "Importe Reembolsado",
    className: "border-amber-400 bg-amber-100 text-amber-950",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status] ?? {
    label: status,
    className: "border-ink/20 bg-paper text-ink",
  };
  return (
    <span
      data-testid={`order-status-badge-${status}`}
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em]",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status] ?? {
    label: status,
    className: "border-ink/20 bg-paper text-ink",
  };
  return (
    <span
      data-testid={`payment-status-badge-${status}`}
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em]",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

