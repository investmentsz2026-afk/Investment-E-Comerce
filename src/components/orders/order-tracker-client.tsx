"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  MapPin,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { trackPublicOrderAction } from "@/server/actions/orders";
import type {
  OrderStatus,
  PublicOrderTrackingResult,
} from "@/server/queries/orders";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/order-status-badge";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface RecentOrderChip {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
}

interface OrderTrackerClientProps {
  initialQuery: string;
  initialOrder: PublicOrderTrackingResult | null;
  initialNotFound: boolean;
  recentOrders: RecentOrderChip[];
}

const TRACKING_STAGES: readonly {
  id: string;
  label: string;
  sublabel: string;
  icon: typeof Clock;
}[] = [
  {
    id: "registered",
    label: "Recibido",
    sublabel: "Orden creada",
    icon: Clock,
  },
  {
    id: "paid",
    label: "Pago Aprobado",
    sublabel: "Validación OK",
    icon: CreditCard,
  },
  {
    id: "preparing",
    label: "Empacando",
    sublabel: "En almacén",
    icon: PackageOpen,
  },
  {
    id: "shipped",
    label: "En Camino",
    sublabel: "Con courier",
    icon: Truck,
  },
  {
    id: "delivered",
    label: "Entregado",
    sublabel: "Completado",
    icon: PackageCheck,
  },
];

function getTrackingStageIndex(status: OrderStatus): number {
  switch (status) {
    case "pending_payment":
    case "payment_processing":
      return 0;
    case "paid":
      return 1;
    case "preparing":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    default:
      return -1;
  }
}

function formatDateTimePE(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDatePE(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderTrackerClient({
  initialQuery,
  initialOrder,
  initialNotFound,
  recentOrders,
}: OrderTrackerClientProps) {
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [order, setOrder] = useState<PublicOrderTrackingResult | null>(initialOrder);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    initialNotFound && initialQuery
      ? `No encontramos ningún pedido con el código "${initialQuery.toUpperCase()}". Verifica el número en tu correo o historial de cuenta.`
      : null,
  );
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [lastRefreshedLabel, setLastRefreshedLabel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const whatsappClean = (siteConfig.contact.whatsapp ?? "51926922583").replace(/\D/g, "");

  const executeLookup = (rawCode: string, isRefresh = false) => {
    const trimmed = rawCode.trim().replace(/^#/, "");
    if (!trimmed) {
      setErrorMsg("Ingresa tu número de pedido (ej. ORD-2026-481920) o código de guía.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await trackPublicOrderAction(trimmed);
      if (!res.success || !res.data) {
        if (!isRefresh) {
          setOrder(null);
        }
        setErrorMsg(res.error ?? "No se pudo consultar el estado del pedido.");
        return;
      }

      setOrder(res.data);
      setQueryInput(res.data.orderNumber);
      setErrorMsg(null);

      if (typeof window !== "undefined") {
        const nextUrl = `/seguir-pedido?codigo=${encodeURIComponent(res.data.orderNumber)}`;
        window.history.replaceState(null, "", nextUrl);
      }

      if (isRefresh) {
        setLastRefreshedLabel(
          `Actualizado a las ${new Date().toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`,
        );
      } else {
        setLastRefreshedLabel(null);
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeLookup(queryInput);
  };

  const handleClear = () => {
    setQueryInput("");
    setOrder(null);
    setErrorMsg(null);
    setLastRefreshedLabel(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/seguir-pedido");
    }
  };

  const handleCopyTracking = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2200);
    } catch {
      // Silencio si el navegador bloquea el portapapeles
    }
  };

  const stageIndex = order ? getTrackingStageIndex(order.status) : -1;
  const isTerminalIssue =
    order?.status === "cancelled" ||
    order?.status === "refunded" ||
    order?.status === "payment_failed";

  return (
    <div className="space-y-8 font-sans">
      {/* 1. CABECERA HERO + BUSCADOR EN TIEMPO REAL */}
      <section className="relative overflow-hidden rounded-[2rem] border border-blue-900/20 bg-gradient-to-br from-[#091124] via-[#152C6B] to-[#0F172A] p-6 text-white shadow-[0_24px_60px_-18px_rgba(15,23,42,0.5)] sm:p-10">
        {/* Halos decorativos suaves */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[#2563EB]/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-[#EF233C]/20 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-amber-300 backdrop-blur-md">
            <Truck className="size-3.5" aria-hidden />
            <span>Rastreo Oficial en Tiempo Real · American Colt JEANS™</span>
          </div>

          <h1 className="mt-4 font-sans text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Sigue tu Pedido{" "}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent">
              al Instante
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-blue-100/90 sm:text-base">
            Ingresa tu número de pedido (ej.{" "}
            <span className="font-mono font-bold text-white">ORD-2026-481920</span>) o el código de guía del courier para consultar la etapa exacta de tu compra.
          </p>

          {/* Barra de búsqueda tipo tienda flagship */}
          <form onSubmit={handleSubmit} className="mt-7">
            <div className="relative flex flex-col gap-2 rounded-3xl border border-white/25 bg-white/95 p-2 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full">
              <div className="relative flex flex-1 items-center">
                <Search
                  className="pointer-events-none absolute left-4 size-5 text-slate-400"
                  aria-hidden
                />
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ej: ORD-2026-481920 o código de tracking..."
                  aria-label="Número de pedido o código de seguimiento"
                  data-testid="track-order-input"
                  className="h-12 w-full rounded-full bg-transparent pl-12 pr-10 font-mono text-sm font-bold uppercase tracking-wide text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 focus:outline-none sm:text-base"
                />
                {queryInput && (
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                data-testid="track-order-submit"
                className="bg-flow inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-7 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-full sm:text-sm"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" aria-hidden />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="size-4" aria-hidden />
                    <span>Rastrear Pedido</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Accesos rápidos a pedidos recientes si el usuario está autenticado */}
          {recentOrders.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-blue-200/90">
                Tus pedidos recientes:
              </span>
              {recentOrders.map((item) => {
                const isSelected = order?.orderNumber === item.orderNumber;
                return (
                  <button
                    key={item.orderNumber}
                    type="button"
                    onClick={() => executeLookup(item.orderNumber)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold transition",
                      isSelected
                        ? "border-amber-300 bg-amber-300 text-slate-950 shadow-md"
                        : "border-white/20 bg-white/10 text-white hover:border-white/50 hover:bg-white/20",
                    )}
                  >
                    <span>{item.orderNumber}</span>
                    <ArrowRight className="size-3 opacity-75" aria-hidden />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* MENSAJE DE ERROR SI NO SE ENCUENTRA */}
      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div
            key="track-error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-testid="track-order-error"
            className="mx-auto flex max-w-3xl items-start gap-3.5 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-950 shadow-sm"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden />
            <div className="flex-1 text-sm">
              <p className="font-extrabold text-rose-900">No pudimos localizar ese pedido</p>
              <p className="mt-1 text-xs leading-relaxed text-rose-800">{errorMsg}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/cuenta/pedidos"
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-900 transition hover:bg-rose-100"
                >
                  <span>Ir a Mis Pedidos</span>
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
                <a
                  href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
                    `Hola American Colt JEANS™, necesito ayuda para rastrear mi pedido.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  <SiWhatsapp className="size-3.5" aria-hidden />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. RESULTADO EN VIVO DEL PEDIDO ENCONTRADO */}
      <AnimatePresence mode="wait">
        {order ? (
          <motion.div
            key={order.orderNumber}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            data-testid="track-order-result"
            className="space-y-6"
          >
            {/* Tarjeta Superior: Resumen + Botón Actualizar + Stepper Animado */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_18px_45px_-18px_rgba(15,23,42,0.16)]">
              {/* Cabecera del Pedido */}
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[0.62rem] font-extrabold uppercase text-[#1E40AF]">
                      {order.orderMode === "wholesale" ? "Mayorista B2B" : "Tienda Online"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    Registrado el{" "}
                    <strong className="text-slate-700">{formatDateTimePE(order.createdAt)}</strong>{" "}
                    · Última actualización:{" "}
                    <strong className="text-slate-700">{formatShortDatePE(order.updatedAt)}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => executeLookup(order.orderNumber, true)}
                    disabled={isPending}
                    data-testid="track-order-refresh"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 shadow-xs transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-[#1E40AF] disabled:opacity-60"
                  >
                    <RefreshCw
                      className={cn("size-3.5", isPending && "animate-spin text-[#2563EB]")}
                      aria-hidden
                    />
                    <span>Actualizar Estado</span>
                  </button>

                  {order.isOwner && order.ownerOrderId && (
                    <Link
                      href={`/cuenta/pedidos/${order.ownerOrderId}`}
                      className="bg-flow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:scale-105"
                    >
                      <span>Ver Detalle y SUNAT</span>
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>

              {lastRefreshedLabel && (
                <div className="border-b border-emerald-100 bg-emerald-50/70 px-6 py-2 text-center font-mono text-[0.68rem] font-bold text-emerald-800">
                  Estado sincronizado en vivo ({lastRefreshedLabel})
                </div>
              )}

              {/* STEPPER VISUAL DE PROGRESO */}
              <div className="p-6 sm:p-8">
                {isTerminalIssue ? (
                  <div
                    className={cn(
                      "flex items-start gap-4 rounded-2xl border p-5",
                      order.status === "refunded"
                        ? "border-amber-200 bg-amber-50 text-amber-950"
                        : "border-rose-200 bg-rose-50 text-rose-950",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                        order.status === "refunded"
                          ? "bg-amber-200/70 text-amber-900"
                          : "bg-rose-200/70 text-rose-800",
                      )}
                    >
                      <XCircle className="size-6" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-black uppercase tracking-tight">
                        {order.status === "cancelled"
                          ? "Este pedido fue cancelado"
                          : order.status === "refunded"
                            ? "Pedido Reembolsado"
                            : "Incidencia con el Pago"}
                      </h2>
                      <p className="text-xs leading-relaxed opacity-90">
                        {order.cancellationReason
                          ? `Motivo registrado: ${order.cancellationReason}`
                          : order.status === "refunded"
                            ? "Tu compra fue reembolsada y el inventario fue liberado en nuestro almacén."
                            : "El pedido no se encuentra en ruta logística. Si necesitas asistencia o deseas realizar una nueva compra, contáctanos por WhatsApp."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Línea de progreso de fondo en escritorio */}
                    <div
                      aria-hidden
                      className="absolute left-[10%] right-[10%] top-6 hidden h-1.5 rounded-full bg-slate-100 md:block"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.max(0, Math.min(100, (stageIndex / (TRACKING_STAGES.length - 1)) * 100))}%`,
                        }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#EF233C]"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-2">
                      {TRACKING_STAGES.map((stage, idx) => {
                        const Icon = stage.icon;
                        const isDone = stageIndex > idx || (stageIndex === 4 && idx === 4);
                        const isCurrent = stageIndex === idx && stageIndex < 4;
                        const stepDate =
                          idx === 0
                            ? order.createdAt
                            : idx === 1
                              ? order.paidAt
                              : idx === 3
                                ? order.shippedAt
                                : idx === 4
                                  ? order.deliveredAt
                                  : null;

                        return (
                          <div
                            key={stage.id}
                            className={cn(
                              "relative flex items-center gap-3.5 rounded-2xl border p-3 transition-all md:flex-col md:border-transparent md:bg-transparent md:p-0 md:text-center",
                              isCurrent
                                ? "border-blue-200 bg-blue-50/50 md:bg-transparent"
                                : isDone
                                  ? "border-emerald-100 bg-emerald-50/30 md:bg-transparent"
                                  : "border-slate-100 bg-slate-50/40 md:bg-transparent",
                            )}
                          >
                            <div
                              className={cn(
                                "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-300",
                                isDone
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                  : isCurrent
                                    ? "border-[#2563EB] bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-lg shadow-blue-500/35 ring-4 ring-blue-100"
                                    : "border-slate-200 bg-white text-slate-400",
                              )}
                            >
                              {isDone ? (
                                <Check className="size-5 stroke-[2.75]" aria-hidden />
                              ) : (
                                <Icon className="size-5" aria-hidden />
                              )}
                              {isCurrent && (
                                <span
                                  aria-hidden
                                  className="absolute -right-1 -top-1 flex size-3.5"
                                >
                                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                  <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-amber-400" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-xs font-black uppercase tracking-wide",
                                  isCurrent
                                    ? "text-[#1E3A8A]"
                                    : isDone
                                      ? "text-slate-900"
                                      : "text-slate-400",
                                )}
                              >
                                {stage.label}
                              </p>
                              <p className="text-[0.7rem] font-semibold text-slate-500">
                                {stage.sublabel}
                              </p>
                              {stepDate && (isDone || isCurrent) && (
                                <p className="mt-0.5 font-mono text-[0.62rem] font-bold text-[#2563EB]">
                                  {formatShortDatePE(stepDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GRID INFERIOR: HISTORIAL + PRENDAS (IZQUIERDA) | COURIER + DESPACHO (DERECHA) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* COLUMNA IZQUIERDA (7 cols) */}
              <div className="space-y-6 lg:col-span-7">
                {/* Bitácora en Vivo */}
                <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                        <Sparkles className="size-4" aria-hidden />
                      </span>
                      <div>
                        <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                          Actualizaciones en Vivo
                        </h2>
                        <p className="text-xs font-medium text-slate-500">
                          Cada cambio de nuestro equipo y courier aparece aquí al instante
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[0.65rem] font-extrabold text-slate-700">
                      {order.events.length} {order.events.length === 1 ? "evento" : "eventos"}
                    </span>
                  </div>

                  <ol className="relative mt-5 ml-3 space-y-5 border-l-2 border-slate-100 pl-6">
                    {order.events.map((ev, index) => {
                      const isLatest = index === 0;
                      const dotColor =
                        ev.tone === "emerald"
                          ? "bg-emerald-500 ring-emerald-100"
                          : ev.tone === "purple"
                            ? "bg-purple-600 ring-purple-100"
                            : ev.tone === "indigo"
                              ? "bg-indigo-600 ring-indigo-100"
                              : ev.tone === "rose"
                                ? "bg-rose-600 ring-rose-100"
                                : ev.tone === "amber"
                                  ? "bg-amber-500 ring-amber-100"
                                  : "bg-[#2563EB] ring-blue-100";

                      return (
                        <li key={ev.id} className="relative">
                          <span
                            aria-hidden
                            className={cn(
                              "absolute -left-[31px] top-1 size-3.5 rounded-full ring-4",
                              dotColor,
                            )}
                          />
                          <div
                            className={cn(
                              "rounded-2xl border p-4 transition",
                              isLatest
                                ? "border-blue-200/80 bg-blue-50/40"
                                : "border-slate-100 bg-slate-50/50",
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-900 sm:text-sm">
                                {ev.title}
                              </p>
                              <span className="font-mono text-[0.65rem] font-bold text-slate-500">
                                {formatDateTimePE(ev.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {ev.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                {/* Prendas del Pedido */}
                <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-[#DC2626]">
                        <Box className="size-4" aria-hidden />
                      </span>
                      <div>
                        <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                          Prendas en tu Paquete
                        </h2>
                        <p className="text-xs font-medium text-slate-500">
                          Total de {order.totalUnits}{" "}
                          {order.totalUnits === 1 ? "prenda" : "prendas"} verificadas
                        </p>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-3.5 py-3.5 first:pt-1 last:pb-1">
                        <Link
                          href={`/producto/${item.productSlug}`}
                          className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="size-full object-cover object-top"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/producto/${item.productSlug}`}
                            className="line-clamp-1 text-xs font-extrabold text-slate-900 hover:text-[#DC2626] sm:text-sm"
                          >
                            {item.productName}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold text-slate-500">
                            {item.colorName && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                                {item.colorSwatch && (
                                  <span
                                    className="size-2.5 rounded-full border border-black/15"
                                    style={{ backgroundColor: item.colorSwatch }}
                                  />
                                )}
                                {item.colorName}
                              </span>
                            )}
                            {item.size && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                                Talla {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-black text-slate-900">
                          {item.quantity} {item.quantity === 1 ? "ud." : "uds."}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* COLUMNA DERECHA (5 cols) */}
              <div className="space-y-6 lg:col-span-5">
                {/* Tarjeta de Courier y Guía */}
                <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                      <Truck className="size-4" aria-hidden />
                    </span>
                    <div>
                      <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                        Despacho y Courier
                      </h2>
                      <p className="text-xs font-medium text-slate-500">
                        Datos de entrega registrados en sistema
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-[#DC2626]" aria-hidden />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-500 uppercase text-[0.65rem] tracking-wider">
                          Destino y Destinatario
                        </p>
                        <p className="text-sm font-extrabold text-slate-900">
                          {order.destinationSummary}
                        </p>
                        <p className="text-slate-600">
                          Recibe: <strong className="text-slate-900">{order.recipientDisplay}</strong>
                        </p>
                        <p className="font-mono text-[0.68rem] font-semibold text-[#1E40AF]">
                          {order.shippingZoneName} · {order.shippingEstimatedLabel}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                          Operador Logístico
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {order.carrierName || "Por asignar al despachar"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-blue-100/80 pt-2.5">
                        <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                          Código de Tracking / Guía
                        </span>
                        {order.trackingNumber ? (
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(order.trackingNumber!)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1 font-mono text-xs font-black text-[#1E40AF] shadow-2xs transition hover:border-blue-400"
                          >
                            <span>{order.trackingNumber}</span>
                            {copiedTracking ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                            ) : (
                              <Copy className="size-3.5 opacity-70" aria-hidden />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            Se habilitará al despachar
                          </span>
                        )}
                      </div>

                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#2563EB]"
                        >
                          <span>Rastrear en Web del Operador</span>
                          <ArrowUpRight className="size-3.5" aria-hidden />
                        </a>
                      )}
                    </div>
                  </div>
                </section>

                {/* Comprobante Fotográfico de Despacho / Entrega (si admin lo subió) */}
                {order.deliveryProofImageUrl && (
                  <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] font-extrabold uppercase tracking-wider text-emerald-800">
                        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                        Evidencia de Despacho / Entrega
                      </span>
                      <a
                        href={order.deliveryProofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Ampliar foto
                      </a>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.deliveryProofImageUrl}
                        alt={`Evidencia de entrega del pedido ${order.orderNumber}`}
                        className="max-h-64 w-full object-cover"
                      />
                    </div>
                  </section>
                )}

                {/* Ayuda WhatsApp */}
                <section className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 to-[#1E3A8A] p-6 text-white shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                      <SiWhatsapp className="size-5" aria-hidden />
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-wide">
                        ¿Dudas sobre tu entrega?
                      </h3>
                      <p className="text-xs leading-relaxed text-blue-100">
                        Escríbenos directamente indicando tu pedido{" "}
                        <strong className="font-mono text-white">{order.orderNumber}</strong> y te atendemos al instante.
                      </p>
                      <a
                        href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
                          `Hola American Colt JEANS™, consulto por el estado de mi pedido ${order.orderNumber}.`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-slate-900 shadow-sm transition hover:scale-105"
                      >
                        <span>Chatear con Soporte</span>
                        <ArrowRight className="size-3.5 text-emerald-600" aria-hidden />
                      </a>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        ) : !errorMsg ? (
          /* ESTADO INICIAL SIN BÚSQUEDA: Guía visual moderna de 3 pasos */
          <motion.div
            key="track-empty-guide"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                <Search className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">
                1. Ingresa tu Código
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Encuentra tu código <strong className="font-mono text-slate-800">ORD-2026-...</strong> en tu correo de confirmación o en la sección Mis Pedidos de tu cuenta.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-md">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
                <Truck className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">
                2. Avance en Tiempo Real
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Cada vez que nuestro almacén prepara, embala o despacha tu compra con el courier, la barra de progreso se actualiza al instante.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">
                3. Guía y Evidencia Oficial
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Consulta tu transportista asignado (Olva, Shalom o Motorizado Express), copia tu guía con un clic y revisa la foto de entrega.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
