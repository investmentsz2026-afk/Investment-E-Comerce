"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { adminManageOrderAction } from "@/server/actions/orders";
import type {
  getAdminOrdersList,
  OrderStatus,
} from "@/server/queries/orders";
import type { ShippingZoneRecord } from "@/server/shipping/service";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/order-status-badge";
import { AdminShippingZonesPanel } from "@/components/admin/admin-shipping-zones-panel";
import { formatPEN } from "@/lib/format";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Filter,
  ImagePlus,
  Layers,
  Loader2,
  MapPin,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";

type AdminOrderRow = Awaited<ReturnType<typeof getAdminOrdersList>>[number];

type SubmoduleTab =
  | "all"
  | "pending"
  | "preparing"
  | "shipped"
  | "delivered"
  | "closed"
  | "updater"
  | "shipping";

interface InitialFilters {
  search?: string;
  orderMode?: string;
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

const ALLOWED_NEXT_BY_CURRENT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [
    "pending_payment",
    "payment_processing",
    "paid",
    "cancelled",
    "payment_failed",
  ],
  payment_processing: [
    "payment_processing",
    "paid",
    "cancelled",
    "payment_failed",
  ],
  payment_failed: ["payment_failed", "paid", "cancelled"],
  paid: ["paid", "preparing", "shipped", "refunded"],
  preparing: ["preparing", "shipped", "refunded"],
  shipped: ["shipped", "delivered", "refunded"],
  delivered: ["delivered", "refunded"],
  cancelled: ["cancelled"],
  refunded: ["refunded"],
};

const PIPELINE_STEPS: {
  status: OrderStatus;
  title: string;
  subtitle: string;
}[] = [
  {
    status: "pending_payment",
    title: "Recibido",
    subtitle: "Esperando pago",
  },
  {
    status: "paid",
    title: "Pagado",
    subtitle: "Confirmado",
  },
  {
    status: "preparing",
    title: "Empacando",
    subtitle: "En proceso",
  },
  {
    status: "shipped",
    title: "Enviado",
    subtitle: "En ruta",
  },
  {
    status: "delivered",
    title: "Entregado",
    subtitle: "Completado",
  },
];

const STATUS_OPTIONS: {
  value: OrderStatus;
  label: string;
  description: string;
  tone: "emerald" | "indigo" | "amber" | "red" | "slate";
}[] = [
  {
    value: "pending_payment",
    label: "Recibido / Pendiente de Pago",
    description: "Pedido registrado con reserva temporal de stock.",
    tone: "amber",
  },
  {
    value: "payment_processing",
    label: "Pago en Verificación",
    description: "Esperando confirmación de pasarela o transferencia.",
    tone: "indigo",
  },
  {
    value: "paid",
    label: "Pagado (Confirmado)",
    description: "Descuenta stock definitivo y habilita SUNAT / empaque.",
    tone: "emerald",
  },
  {
    value: "preparing",
    label: "En Proceso / Empacando",
    description: "Almacén preparando y embalando las prendas del pedido.",
    tone: "indigo",
  },
  {
    value: "shipped",
    label: "Enviado / En Ruta",
    description: "Despachado con courier y código de seguimiento.",
    tone: "indigo",
  },
  {
    value: "delivered",
    label: "Entregado al Cliente",
    description: "Entrega completada (permite foto opcional con cliente).",
    tone: "emerald",
  },
  {
    value: "payment_failed",
    label: "Pago Fallido",
    description: "Cobro rechazado; se puede reintentar o cancelar.",
    tone: "red",
  },
  {
    value: "cancelled",
    label: "Cancelar Pedido",
    description: "Libera la reserva de inventario automáticamente.",
    tone: "slate",
  },
  {
    value: "refunded",
    label: "Reembolsar Pedido",
    description: "Repone el stock al almacén (requiere motivo mín. 5 chars).",
    tone: "red",
  },
];

const ORDERS_PER_PAGE = 10;

function matchesSubmoduleTab(
  status: OrderStatus,
  tab: SubmoduleTab,
): boolean {
  if (tab === "all" || tab === "updater" || tab === "shipping") return true;
  if (tab === "pending") {
    return (
      status === "pending_payment" ||
      status === "payment_processing" ||
      status === "payment_failed"
    );
  }
  if (tab === "preparing") {
    return status === "paid" || status === "preparing";
  }
  if (tab === "shipped") {
    return status === "shipped";
  }
  if (tab === "delivered") {
    return status === "delivered";
  }
  if (tab === "closed") {
    return status === "cancelled" || status === "refunded";
  }
  return true;
}

function getPipelineIndex(status: OrderStatus): number {
  if (status === "pending_payment" || status === "payment_processing") return 0;
  if (status === "paid") return 1;
  if (status === "preparing") return 2;
  if (status === "shipped") return 3;
  if (status === "delivered") return 4;
  return -1;
}

function formatOrderLocation(ord: AdminOrderRow): string {
  const parts = [
    ord.shippingDistrict,
    ord.shippingProvince,
    ord.shippingDepartment,
  ]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Recojo / Sin dirección";
}

function formatShortLocation(ord: AdminOrderRow): string {
  const parts = [ord.shippingDistrict, ord.shippingDepartment]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Recojo en tienda";
}

export function AdminOrdersWorkspace({
  orders,
  shippingZones,
  initialFilters,
}: {
  orders: AdminOrderRow[];
  shippingZones: ShippingZoneRecord[];
  initialFilters?: InitialFilters;
}) {
  const router = useRouter();
  const deliveryInputRef = useRef<HTMLInputElement | null>(null);
  const modalDeliveryInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<SubmoduleTab>(() => {
    const s = initialFilters?.status;
    if (s === "shipped") return "shipped";
    if (s === "delivered") return "delivered";
    if (s === "paid" || s === "preparing") return "preparing";
    if (
      s === "pending_payment" ||
      s === "payment_processing" ||
      s === "payment_failed"
    ) {
      return "pending";
    }
    if (s === "cancelled" || s === "refunded") return "closed";
    return "all";
  });

  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const [orderMode, setOrderMode] = useState(initialFilters?.orderMode ?? "");
  const [statusFilter, setStatusFilter] = useState(
    initialFilters?.status ?? "",
  );
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(
    initialFilters?.paymentStatus ?? "",
  );
  const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initialFilters?.dateTo ?? "");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para "Actualizador Rápido" y Modal rápido
  const [updaterSearch, setUpdaterSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    orders[0]?.id ?? null,
  );
  const [modalOrder, setModalOrder] = useState<AdminOrderRow | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    orderNumber: string;
  } | null>(null);

  const [nextStatus, setNextStatus] = useState<OrderStatus>(
    orders[0]?.status ?? "paid",
  );
  const [carrierName, setCarrierName] = useState(orders[0]?.carrierName ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    orders[0]?.trackingNumber ?? "",
  );
  const [trackingUrl, setTrackingUrl] = useState(orders[0]?.trackingUrl ?? "");
  const [deliveryProofImageUrl, setDeliveryProofImageUrl] = useState(
    orders[0]?.deliveryProofImageUrl ?? "",
  );
  const [uploadingProof, setUploadingProof] = useState(false);

  const [paymentReference, setPaymentReference] = useState(
    orders[0]?.paymentProviderReference ?? "",
  );
  const [reason, setReason] = useState("");
  const [adminNotes, setAdminNotes] = useState(orders[0]?.adminNotes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const selectedUpdaterOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId],
  );

  const selectOrderForUpdate = (ord: AdminOrderRow, openModal: boolean) => {
    setActionError(null);
    setActionFeedback(null);
    setNextStatus(ord.status);
    setCarrierName(ord.carrierName ?? "");
    setTrackingNumber(ord.trackingNumber ?? "");
    setTrackingUrl(ord.trackingUrl ?? "");
    setDeliveryProofImageUrl(ord.deliveryProofImageUrl ?? "");
    setPaymentReference(ord.paymentProviderReference ?? "");
    setAdminNotes(ord.adminNotes ?? "");
    setReason("");

    if (openModal) {
      setModalOrder(ord);
    } else {
      setSelectedOrderId(ord.id);
    }
  };

  const handleUploadDeliveryProof = async (file: File | undefined) => {
    if (!file) return;
    setActionError(null);
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.success || !json.url) {
        setActionError(
          json.error ?? "No se pudo subir la fotografía de entrega.",
        );
        return;
      }
      setDeliveryProofImageUrl(json.url);
    } catch {
      setActionError("Error de conexión al subir la imagen desde tu equipo.");
    } finally {
      setUploadingProof(false);
    }
  };

  // KPIs globales
  const kpis = useMemo(() => {
    let pendingCount = 0;
    let preparingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let closedCount = 0;
    let activeRevenue = 0;

    for (const o of orders) {
      if (
        o.status === "pending_payment" ||
        o.status === "payment_processing" ||
        o.status === "payment_failed"
      ) {
        pendingCount++;
      } else if (o.status === "paid" || o.status === "preparing") {
        preparingCount++;
      } else if (o.status === "shipped") {
        shippedCount++;
      } else if (o.status === "delivered") {
        deliveredCount++;
      } else if (o.status === "cancelled" || o.status === "refunded") {
        closedCount++;
      }

      if (
        o.paymentStatus === "approved" &&
        o.status !== "cancelled" &&
        o.status !== "refunded"
      ) {
        activeRevenue += o.totalAmount;
      }
    }

    return {
      total: orders.length,
      pendingCount,
      preparingCount,
      shippedCount,
      deliveredCount,
      closedCount,
      activeRevenue,
    };
  }, [orders]);

  // Filtrado de pedidos en lista principal
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = dateFrom
      ? new Date(`${dateFrom}T00:00:00.000-05:00`).getTime()
      : null;
    const toMs = dateTo
      ? new Date(`${dateTo}T23:59:59.999-05:00`).getTime()
      : null;

    return orders.filter((ord) => {
      if (!matchesSubmoduleTab(ord.status, activeTab)) return false;
      if (orderMode && ord.orderMode !== orderMode) return false;
      if (statusFilter && ord.status !== statusFilter) return false;
      if (paymentStatusFilter && ord.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      if (fromMs !== null && !Number.isNaN(fromMs)) {
        if (new Date(ord.createdAt).getTime() < fromMs) return false;
      }
      if (toMs !== null && !Number.isNaN(toMs)) {
        if (new Date(ord.createdAt).getTime() > toMs) return false;
      }

      if (q) {
        const haystack = [
          ord.orderNumber,
          ord.customerFirstNameSnapshot,
          ord.customerLastNameSnapshot,
          ord.customerEmailSnapshot,
          ord.billingCustomerName ?? "",
          ord.billingDocNumber ?? "",
          ord.trackingNumber ?? "",
          ord.shippingDistrict,
          ord.shippingProvince,
          ord.shippingDepartment,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    orders,
    activeTab,
    orderMode,
    statusFilter,
    paymentStatusFilter,
    dateFrom,
    dateTo,
    search,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, safePage]);

  // Lista filtrada para "Actualizador Rápido"
  const updaterMatchingOrders = useMemo(() => {
    const q = updaterSearch.trim().toLowerCase();
    if (!q) return orders.slice(0, 30);
    return orders.filter((ord) => {
      const haystack = [
        ord.orderNumber,
        ord.customerFirstNameSnapshot,
        ord.customerLastNameSnapshot,
        ord.customerEmailSnapshot,
        ord.billingCustomerName ?? "",
        ord.billingDocNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, updaterSearch]);

  const activeTargetOrder = modalOrder ?? selectedUpdaterOrder;

  const executeStatusUpdate = async () => {
    if (!activeTargetOrder) return;
    setActionError(null);
    setActionFeedback(null);
    setSubmitting(true);

    try {
      const res = await adminManageOrderAction({
        orderId: activeTargetOrder.id,
        nextStatus,
        carrierName,
        trackingNumber,
        trackingUrl,
        deliveryProofImageUrl,
        paymentReference,
        adminNotes,
        reason,
      });

      if (!res.success) {
        setActionError(
          res.error ?? "No se pudo actualizar el estado del pedido.",
        );
        return;
      }

      setActionFeedback(
        `Pedido ${activeTargetOrder.orderNumber} actualizado a "${STATUS_OPTIONS.find((s) => s.value === nextStatus)?.label ?? nextStatus}".`,
      );
      setConfirmDialogOpen(false);
      setModalOrder(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setOrderMode("");
    setStatusFilter("");
    setPaymentStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleTabChange = (tab: SubmoduleTab) => {
    setActiveTab(tab);
    setStatusFilter("");
    setCurrentPage(1);
    setActionError(null);
    setActionFeedback(null);
    if (tab === "updater" && selectedUpdaterOrder) {
      selectOrderForUpdate(selectedUpdaterOrder, false);
    }
  };

  const provinceShippingCount = useMemo(
    () =>
      shippingZones.filter((z) => {
        if (z.code.startsWith("AGENCIA_")) return false;
        const dept = z.department.trim().toLowerCase();
        const prov = (z.province ?? "*").trim().toLowerCase();
        if (dept === "callao") return false;
        if (dept === "lima" && prov === "lima") return false;
        return true;
      }).length,
    [shippingZones],
  );

  const tabs: {
    id: SubmoduleTab;
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "all", label: "Todos", count: kpis.total, icon: Layers },
    {
      id: "pending",
      label: "Pendientes",
      count: kpis.pendingCount,
      icon: Clock,
    },
    {
      id: "preparing",
      label: "Pagados / Empacando",
      count: kpis.preparingCount,
      icon: PackageOpen,
    },
    {
      id: "shipped",
      label: "Enviados",
      count: kpis.shippedCount,
      icon: Truck,
    },
    {
      id: "delivered",
      label: "Entregados",
      count: kpis.deliveredCount,
      icon: PackageCheck,
    },
    {
      id: "closed",
      label: "Cancelados / Reemb.",
      count: kpis.closedCount,
      icon: XCircle,
    },
    {
      id: "updater",
      label: "Actualizador Rápido",
      icon: RefreshCw,
    },
    {
      id: "shipping",
      label: "Tarifas Provincias",
      count: provinceShippingCount,
      icon: MapPin,
    },
  ];

  const allowedForTarget = activeTargetOrder
    ? ALLOWED_NEXT_BY_CURRENT[activeTargetOrder.status] ?? []
    : [];

  return (
    <div className="space-y-6 font-sans">
      {/* HERO HEADER 3D */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white shadow-[0_22px_50px_-14px_rgba(220,38,38,0.45)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-black/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>Centro Logístico, Pagos y SUNAT 3D</span>
            </div>
            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              Pedidos, Despachos y Estados en Tiempo Real
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              Supervisa órdenes B2C/B2B, avanza cada pedido paso a paso desde
              empaque hasta despacho con courier y evidencia fotográfica de
              entrega, y administra tarifas de envío por zona.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTabChange("updater")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:bg-red-50"
            >
              <RefreshCw className="size-4" />
              <span>Actualizar Estado de Pedido</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTabChange("shipping")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-4 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-all hover:bg-white/25"
            >
              <Truck className="size-4" />
              <span>Provincias ({provinceShippingCount})</span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* 5 TARJETAS KPI 3D INTERACTIVAS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => handleTabChange("all")}
          className={`group rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 ${
            activeTab === "all"
              ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Total Pedidos
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626] shadow-inner">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.total}
          </p>
          <p className="mt-1 text-xs font-extrabold tabular-nums text-emerald-700">
            {formatPEN(kpis.activeRevenue)} cobrados
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("pending")}
          className={`group rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 ${
            activeTab === "pending"
              ? "border-amber-500 ring-2 ring-amber-400/25"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
              Pendientes / Pago
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.pendingCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Por confirmar o verificar
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("preparing")}
          className={`group rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 ${
            activeTab === "preparing"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-blue-700">
              Pagados / Empacando
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-inner">
              <PackageOpen className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.preparingCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Listos para despacho en almacén
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("shipped")}
          className={`group rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 ${
            activeTab === "shipped"
              ? "border-indigo-600 ring-2 ring-indigo-500/20"
              : "border-slate-200/80 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-indigo-700">
              Enviados / En Ruta
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 shadow-inner">
              <Truck className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.shippedCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            En tránsito con courier
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("delivered")}
          className={`group rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 ${
            activeTab === "delivered"
              ? "border-emerald-600 ring-2 ring-emerald-500/20"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Entregados
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-inner">
              <PackageCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.deliveredCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Cancelados / Reemb.: {kpis.closedCount}
          </p>
        </button>
      </section>

      {/* BARRA DE SUB-MÓDULOS ANIMADA 3D */}
      <nav
        aria-label="Submódulos de pedidos"
        className="flex flex-wrap items-center gap-2 rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-[0_12px_30px_-14px_rgba(15,23,42,0.15)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-colors ${
                isActive
                  ? "text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="ordersSubmodulePill"
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className={`absolute inset-0 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.22),0_10px_20px_rgba(15,23,42,0.2)] ${
                    tab.id === "updater"
                      ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]"
                      : tab.id === "shipping"
                        ? "bg-gradient-to-r from-slate-800 to-slate-950"
                        : tab.id === "closed"
                          ? "bg-gradient-to-r from-slate-700 via-red-800 to-[#DC2626]"
                          : "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
                  }`}
                />
              )}
              <Icon className="relative z-10 size-3.5" />
              <span className="relative z-10">{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`relative z-10 rounded-full px-2 py-0.5 text-[0.68rem] font-black tabular-nums ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* FEEDBACK GLOBAL */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-950 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <span>{actionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUB-MÓDULO: TARIFAS Y ZONAS DE ENVÍO */}
      {activeTab === "shipping" && (
        <AdminShippingZonesPanel zones={shippingZones} />
      )}

      {/* SUB-MÓDULO: ACTUALIZADOR RÁPIDO DE ESTADO (CON CAMPOS CONTEXTUALES PASO A PASO) */}
      {activeTab === "updater" && (
        <motion.section
          key="updater-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          {/* PANEL IZQUIERDO: BUSCADOR DE PEDIDO */}
          <div className="flex flex-col rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)] lg:col-span-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-blue-700">
                  Paso 1 · Seleccionar Pedido
                </span>
                <h2 className="mt-1 font-sans text-xl font-extrabold tracking-tight text-slate-900">
                  Buscar Pedido por Número o Cliente
                </h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black tabular-nums text-blue-700">
                {updaterMatchingOrders.length}
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={updaterSearch}
                onChange={(e) => setUpdaterSearch(e.target.value)}
                placeholder="Escribe ORD-2026..., cliente, DNI/RUC o correo..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="max-h-[580px] flex-1 space-y-2.5 overflow-y-auto pr-1">
              {updaterMatchingOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
                  No se encontraron pedidos con ese criterio.
                </div>
              ) : (
                updaterMatchingOrders.map((ord) => {
                  const isSelected = selectedUpdaterOrder?.id === ord.id;
                  return (
                    <motion.button
                      key={ord.id}
                      type="button"
                      whileHover={{ x: 2 }}
                      onClick={() => selectOrderForUpdate(ord, false)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-[#DC2626] bg-red-50/50 shadow-[0_8px_20px_-8px_rgba(220,38,38,0.35)] ring-2 ring-[#DC2626]/20"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-sm font-black tracking-tight text-slate-900">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`rounded-lg px-2 py-0.5 text-[0.62rem] font-extrabold uppercase ${
                                ord.orderMode === "wholesale"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {ord.orderMode === "wholesale" ? "B2B" : "B2C"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-bold text-slate-800">
                            {ord.customerFirstNameSnapshot}{" "}
                            {ord.customerLastNameSnapshot}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">
                            {formatShortLocation(ord)} ·{" "}
                            <strong className="font-bold text-slate-700">
                              {ord.totalUnits} uds.
                            </strong>
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-sm font-black tabular-nums text-slate-900">
                            {formatPEN(ord.totalAmount)}
                          </span>
                          <OrderStatusBadge status={ord.status} />
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* PANEL DERECHO: PIPELINE Y ACTUALIZACIÓN CONTEXTUAL */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)] lg:col-span-7">
            {!selectedUpdaterOrder ? (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm font-bold text-slate-500">
                Selecciona un pedido en el listado de la izquierda para
                actualizar su estado.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="inline-block rounded-full bg-red-50 px-3 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#DC2626]">
                      Paso 2 · Control de Estado Logístico
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                      <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900">
                        {selectedUpdaterOrder.orderNumber}
                      </h2>
                      <OrderStatusBadge status={selectedUpdaterOrder.status} />
                      <PaymentStatusBadge
                        status={selectedUpdaterOrder.paymentStatus}
                      />
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Cliente:{" "}
                      <strong className="font-extrabold text-slate-900">
                        {selectedUpdaterOrder.customerFirstNameSnapshot}{" "}
                        {selectedUpdaterOrder.customerLastNameSnapshot}
                      </strong>{" "}
                      ({selectedUpdaterOrder.customerEmailSnapshot}) · Total:{" "}
                      <strong className="font-extrabold tabular-nums text-slate-900">
                        {formatPEN(selectedUpdaterOrder.totalAmount)}
                      </strong>
                    </p>
                  </div>

                  <Link
                    href={`/admin/pedidos/${selectedUpdaterOrder.id}`}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:bg-red-50 hover:text-[#DC2626]"
                  >
                    <span>Ver Ficha Completa</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                {/* VISUAL PIPELINE STEPPER */}
                <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
                  <p className="mb-3 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                    Progreso actual del pedido
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const currentIdx = getPipelineIndex(
                        selectedUpdaterOrder.status,
                      );
                      const isReached = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;
                      const isAllowedNext = allowedForTarget.includes(
                        step.status,
                      );

                      return (
                        <button
                          key={step.status}
                          type="button"
                          disabled={!isAllowedNext}
                          onClick={() => setNextStatus(step.status)}
                          className={`relative rounded-2xl border p-3 text-left transition-all ${
                            nextStatus === step.status
                              ? "border-[#DC2626] bg-red-50/80 shadow-md ring-2 ring-[#DC2626]/25"
                              : isCurrent
                                ? "border-emerald-400 bg-emerald-50/70"
                                : isReached
                                  ? "border-emerald-200 bg-emerald-50/30"
                                  : isAllowedNext
                                    ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
                                    : "cursor-not-allowed border-slate-100 bg-slate-50/60 opacity-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`flex size-7 items-center justify-center rounded-xl text-xs font-black tabular-nums ${
                                isReached
                                  ? "bg-emerald-600 text-white"
                                  : nextStatus === step.status
                                    ? "bg-[#DC2626] text-white"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase text-emerald-800">
                                Actual
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs font-extrabold text-slate-900">
                            {step.title}
                          </p>
                          <p className="text-[0.68rem] font-medium text-slate-500">
                            {step.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SELECTOR COMPLETO DE NUEVO ESTADO */}
                <div>
                  <label className="mb-2.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-slate-700">
                    Elige a qué estado deseas avanzar este pedido *
                  </label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const allowed = allowedForTarget.includes(opt.value);
                      const isChosen = nextStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!allowed}
                          onClick={() => setNextStatus(opt.value)}
                          className={`rounded-2xl border p-3.5 text-left transition-all ${
                            isChosen
                              ? "border-[#DC2626] bg-red-50/70 shadow-md ring-2 ring-[#DC2626]/20"
                              : allowed
                                ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                                : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-45"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-900">
                              {opt.label}
                            </span>
                            {selectedUpdaterOrder.status === opt.value && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.6rem] font-extrabold text-slate-700">
                                ACTUAL
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[0.7rem] font-medium leading-snug text-slate-500">
                            {opt.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CAMPOS CONTEXTUALES SEGÚN EL ESTADO ELEGIDO */}
                <AnimatePresence mode="wait">
                  {nextStatus === "paid" && (
                    <motion.div
                      key="fields-paid"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3"
                    >
                      <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Confirmación de Pago (Opcional)
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                            N° Operación / Ref. Bancaria (Opcional)
                          </label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) =>
                              setPaymentReference(e.target.value)
                            }
                            placeholder="Ej. ID Mercado Pago o N° BCP..."
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                            Nota Interna (Opcional)
                          </label>
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej. Pago verificado en cuenta..."
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {nextStatus === "preparing" && (
                    <motion.div
                      key="fields-preparing"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-3xl border border-blue-200 bg-blue-50/40 p-5 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-800">
                        <PackageOpen className="size-4" />
                        <span>Empaque en Almacén</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600">
                        Aquí solo confirmas que el pedido está siendo empacado.
                        Los datos del courier se solicitarán en el siguiente
                        paso cuando lo marques como{" "}
                        <strong className="font-extrabold text-slate-900">
                          Enviado / En Ruta
                        </strong>
                        .
                      </p>
                      <div>
                        <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                          Observación de empaque (Opcional)
                        </label>
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Ej. Prendas revisadas, embolsadas y listas para despacho..."
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </motion.div>
                  )}

                  {nextStatus === "shipped" && (
                    <motion.div
                      key="fields-shipped"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-3xl border border-indigo-200 bg-indigo-50/45 p-5 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-800">
                        <Truck className="size-4" />
                        <span>Datos de Despacho y Courier</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                            Transportista / Courier
                          </label>
                          <input
                            type="text"
                            value={carrierName}
                            onChange={(e) => setCarrierName(e.target.value)}
                            placeholder="Olva Courier, Shalom, Urbano, Motorizado..."
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                            Código de Guía / Tracking
                          </label>
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Ej. OLV-9981274"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                            Link de Rastreo (Opcional)
                          </label>
                          <input
                            type="url"
                            value={trackingUrl}
                            onChange={(e) => setTrackingUrl(e.target.value)}
                            placeholder="https://..."
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                            Nota de Despacho (Opcional)
                          </label>
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej. Entregado en agencia Lima..."
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {nextStatus === "delivered" && (
                    <motion.div
                      key="fields-delivered"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-3xl border border-emerald-200 bg-emerald-50/45 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                          <Camera className="size-4" />
                          <span>Foto de Entrega con el Cliente (Opcional)</span>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-emerald-800">
                          Opcional · No obligatorio
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-600">
                        Si deseas dejar constancia visual de que el paquete fue
                        entregado al cliente, selecciona o toma una foto desde
                        tu celular o PC. Si no la tienes, puedes guardar
                        directamente como entregado.
                      </p>

                      <input
                        ref={deliveryInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          void handleUploadDeliveryProof(e.target.files?.[0])
                        }
                        className="sr-only"
                      />

                      {deliveryProofImageUrl ? (
                        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-300 bg-white p-3.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: deliveryProofImageUrl,
                                orderNumber: selectedUpdaterOrder.orderNumber,
                              })
                            }
                            className="group relative size-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={deliveryProofImageUrl}
                              alt="Evidencia de entrega"
                              className="size-full object-cover transition group-hover:scale-105"
                            />
                          </button>

                          <div className="flex-1 space-y-2">
                            <p className="text-xs font-extrabold text-emerald-800">
                              Evidencia fotográfica lista para guardar
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={uploadingProof}
                                onClick={() => deliveryInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                              >
                                <Camera className="size-3.5" />
                                <span>Cambiar foto</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeliveryProofImageUrl("")}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-[#DC2626] hover:bg-red-100"
                              >
                                <Trash2 className="size-3.5" />
                                <span>Quitar</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={uploadingProof}
                          onClick={() => deliveryInputRef.current?.click()}
                          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-white/80 px-4 py-5 text-sm font-extrabold text-emerald-800 transition hover:border-emerald-500 hover:bg-white disabled:opacity-60"
                        >
                          {uploadingProof ? (
                            <>
                              <Loader2 className="size-5 animate-spin" />
                              <span>Subiendo foto desde tu dispositivo...</span>
                            </>
                          ) : (
                            <>
                              <ImagePlus className="size-5" />
                              <span>
                                Subir Foto de Entrega desde Celular o PC
                                (Opcional)
                              </span>
                            </>
                          )}
                        </button>
                      )}

                      <div>
                        <label className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                          Comentario de Entrega (Opcional)
                        </label>
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Ej. Recibido conforme por el titular..."
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </motion.div>
                  )}

                  {(nextStatus === "cancelled" || nextStatus === "refunded") && (
                    <motion.div
                      key="fields-closed"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-3xl border border-red-300 bg-red-50/70 p-5 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#991B1B]">
                        <XCircle className="size-4" />
                        <span>
                          {nextStatus === "refunded"
                            ? "Motivo de Reembolso y Reposición de Stock (Obligatorio)"
                            : "Motivo de Cancelación (Opcional)"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={
                          nextStatus === "refunded"
                            ? "Mínimo 5 caracteres. Ej: Devolución solicitada por talla..."
                            : "Ej: Cliente solicitó anulación antes de pagar..."
                        }
                        className="h-11 w-full rounded-2xl border border-red-200 bg-white px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {actionError && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-bold text-red-900">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={submitting || uploadingProof}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-7 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_5px_0_#7F1D1D,0_12px_24px_rgba(220,38,38,0.3)] transition-all hover:brightness-110 disabled:opacity-50"
                  >
                    <Send className="size-4" />
                    <span>
                      {nextStatus === "preparing"
                        ? "Guardar como Empacando"
                        : nextStatus === "shipped"
                          ? "Guardar como Enviado / En Ruta"
                          : nextStatus === "delivered"
                            ? "Confirmar Pedido Entregado"
                            : "Aplicar Actualización de Estado"}
                    </span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* SUB-MÓDULOS DE LISTADO Y FILTROS */}
      {activeTab !== "shipping" && activeTab !== "updater" && (
        <>
          {/* BARRA DE FILTROS 3D */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_30px_-15px_rgba(15,23,42,0.14)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-700">
                <Filter className="size-4 text-[#DC2626]" />
                <span>Filtros en Tiempo Real</span>
              </div>
              {(search ||
                orderMode ||
                statusFilter ||
                paymentStatusFilter ||
                dateFrom ||
                dateTo) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-200"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="relative md:col-span-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="N° ORD-..., cliente, DNI/RUC, correo, tracking..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
                />
              </div>

              <div className="md:col-span-2">
                <select
                  aria-label="Canal de venta"
                  value={orderMode}
                  onChange={(e) => {
                    setOrderMode(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#DC2626] focus:bg-white"
                >
                  <option value="">Canal: Todos</option>
                  <option value="retail">Minorista B2C</option>
                  <option value="wholesale">Mayorista B2B</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  aria-label="Estado de pago"
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#DC2626] focus:bg-white"
                >
                  <option value="">Pago: Todos</option>
                  <option value="approved">Aprobado</option>
                  <option value="pending">Pendiente</option>
                  <option value="processing">En verificación</option>
                  <option value="rejected">Rechazado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>

              <div className="relative md:col-span-2">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  aria-label="Desde fecha"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-9 pr-2.5 text-xs font-bold tabular-nums text-slate-800 outline-none focus:border-[#DC2626] focus:bg-white"
                />
              </div>

              <div className="relative md:col-span-2">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  aria-label="Hasta fecha"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-9 pr-2.5 text-xs font-bold tabular-nums text-slate-800 outline-none focus:border-[#DC2626] focus:bg-white"
                />
              </div>
            </div>
          </section>

          {/* VISTA ESPECIAL 3D DE TARJETAS PARA CANCELADOS / REEMBOLSADOS */}
          {activeTab === "closed" ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
                    <XCircle className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-sans text-lg font-extrabold text-slate-900">
                      Pedidos Cancelados y Reembolsados ({filteredOrders.length})
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      Auditoría de motivos, liberación de reservas y reposición
                      de stock en almacén.
                    </p>
                  </div>
                </div>
              </div>

              {paginatedOrders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm font-bold text-slate-500">
                  No hay pedidos cancelados o reembolsados con estos filtros.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {paginatedOrders.map((ord) => {
                    const isRefunded = ord.status === "refunded";
                    return (
                      <motion.div
                        key={ord.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -3 }}
                        className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.16)]"
                      >
                        <div
                          className={`absolute inset-x-0 top-0 h-1.5 ${
                            isRefunded
                              ? "bg-gradient-to-r from-amber-500 to-orange-600"
                              : "bg-gradient-to-r from-slate-600 to-[#DC2626]"
                          }`}
                        />

                        <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black tracking-tight text-slate-900">
                                {ord.orderNumber}
                              </span>
                              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.62rem] font-extrabold uppercase text-slate-700">
                                {ord.orderMode === "wholesale" ? "B2B" : "B2C"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {ord.customerFirstNameSnapshot}{" "}
                              {ord.customerLastNameSnapshot}
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                              {ord.customerEmailSnapshot} · {ord.totalUnits} uds.
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-black tabular-nums text-slate-900">
                              {formatPEN(ord.totalAmount)}
                            </p>
                            <div className="mt-1 flex justify-end">
                              <OrderStatusBadge status={ord.status} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs">
                          <p className="font-extrabold uppercase tracking-wider text-slate-500">
                            Motivo Registrado en Auditoría:
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {ord.cancellationReason ||
                              (isRefunded
                                ? "Reembolso procesado por administración"
                                : "Reserva vencida o cancelación administrativa")}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-extrabold ${
                              isRefunded
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <CheckCircle2 className="size-3.5" />
                            {isRefunded
                              ? "Stock repuesto al Kardex"
                              : "Reserva de stock liberada"}
                          </span>

                          <Link
                            href={`/admin/pedidos/${ord.id}`}
                            data-testid={`admin-manage-order-${ord.orderNumber}`}
                            className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition hover:-translate-y-0.5 hover:brightness-110"
                          >
                            <span>Ver Expediente</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            /* TABLA MODERNA 3D DE PEDIDOS */
            <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="size-3 rounded-full bg-[#DC2626] shadow-sm" />
                  <h2 className="font-sans text-sm font-extrabold text-slate-900">
                    Mostrando {paginatedOrders.length} de{" "}
                    {filteredOrders.length} pedidos
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Página {safePage} de {totalPages}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-600">
                      <th className="px-5 py-3.5">Pedido / Fecha</th>
                      <th className="px-4 py-3.5">Cliente / Comprobante</th>
                      <th className="px-4 py-3.5">Destino y Despacho</th>
                      <th className="px-4 py-3.5">Estado Logístico</th>
                      <th className="px-4 py-3.5">Pago y SUNAT</th>
                      <th className="px-4 py-3.5 text-right">Total</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-16 text-center text-sm font-bold text-slate-500"
                        >
                          No hay pedidos en esta vista que coincidan con tus
                          filtros.
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((ord) => (
                        <tr
                          key={ord.id}
                          className="group transition-colors hover:bg-red-50/35"
                        >
                          <td className="px-5 py-4 align-top">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black tracking-tight text-slate-900">
                                {ord.orderNumber}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[0.62rem] font-extrabold uppercase ${
                                  ord.orderMode === "wholesale"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {ord.orderMode === "wholesale" ? (
                                  <Building2 className="size-2.5" />
                                ) : (
                                  <User className="size-2.5" />
                                )}
                                {ord.orderMode === "wholesale" ? "B2B" : "B2C"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {new Date(ord.createdAt).toLocaleString("es-PE", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-slate-600">
                              {ord.lineCount} ítems · {ord.totalUnits} uds.
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-extrabold text-slate-900">
                              {ord.customerFirstNameSnapshot}{" "}
                              {ord.customerLastNameSnapshot}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-600">
                              {ord.billingDocType === "factura"
                                ? "FACTURA"
                                : "BOLETA"}{" "}
                              ·{" "}
                              {ord.billingDocNumber || ord.customerEmailSnapshot}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                              {ord.customerEmailSnapshot}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-bold text-slate-800">
                              {formatOrderLocation(ord)}
                            </p>
                            {ord.carrierName && (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-0.5 text-[0.68rem] font-bold text-blue-800">
                                <Truck className="size-3" />
                                {ord.carrierName}
                                {ord.trackingNumber
                                  ? ` · ${ord.trackingNumber}`
                                  : ""}
                              </span>
                            )}
                            {ord.deliveryProofImageUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxImage({
                                    url: ord.deliveryProofImageUrl!,
                                    orderNumber: ord.orderNumber,
                                  })
                                }
                                className="mt-1.5 ml-1 inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-extrabold text-emerald-800 hover:bg-emerald-100"
                              >
                                <Eye className="size-3" />
                                Ver Foto Entrega
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <OrderStatusBadge status={ord.status} />
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col items-start gap-1.5">
                              <PaymentStatusBadge status={ord.paymentStatus} />
                              <div className="flex flex-wrap items-center gap-1.5 text-[0.65rem] font-extrabold uppercase text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                  <CreditCard className="size-3" />
                                  {ord.paymentProvider}
                                </span>
                                {ord.taxDocument && (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-extrabold ${
                                      ord.taxDocument.status === "issued"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-800"
                                    }`}
                                  >
                                    <FileText className="size-2.5" />
                                    {ord.taxDocument.series &&
                                    ord.taxDocument.correlativeNumber
                                      ? `${ord.taxDocument.series}-${ord.taxDocument.correlativeNumber}`
                                      : ord.taxDocument.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-right align-top">
                            <span className="text-sm font-black tabular-nums text-slate-900">
                              {formatPEN(ord.totalAmount)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right align-top">
                            <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => selectOrderForUpdate(ord, true)}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-[0.7rem] font-extrabold uppercase tracking-wider text-blue-800 shadow-[0_2px_0_rgba(30,64,175,0.18)] transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-100"
                              >
                                <RefreshCw className="size-3.5" />
                                <span>Estado</span>
                              </button>

                              <Link
                                href={`/admin/pedidos/${ord.id}`}
                                data-testid={`admin-manage-order-${ord.orderNumber}`}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-4 py-2 text-[0.7rem] font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition hover:-translate-y-0.5 hover:brightness-110"
                              >
                                <span>Gestionar</span>
                                <ArrowRight className="size-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <p className="text-xs font-bold text-slate-600">
                    Página {safePage} de {totalPages} · {filteredOrders.length}{" "}
                    resultados
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`inline-flex size-9 items-center justify-center rounded-xl text-xs font-extrabold tabular-nums transition ${
                            pageNum === safePage
                              ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* MODAL RÁPIDO DE ACTUALIZACIÓN CONTEXTUAL DE ESTADO */}
      <AnimatePresence>
        {modalOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626]">
                    <ShieldCheck className="size-3.5" />
                    Actualización Rápida de Pedido
                  </span>
                  <h3 className="mt-2 font-sans text-xl font-black tracking-tight text-slate-900">
                    {modalOrder.orderNumber} ·{" "}
                    {modalOrder.customerFirstNameSnapshot}{" "}
                    {modalOrder.customerLastNameSnapshot}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      Estado actual:
                    </span>
                    <OrderStatusBadge status={modalOrder.status} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOrder(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Seleccionar Nuevo Estado Logístico
                  </label>
                  <select
                    value={nextStatus}
                    onChange={(e) =>
                      setNextStatus(e.target.value as OrderStatus)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={!allowedForTarget.includes(opt.value)}
                      >
                        {opt.label}
                        {!allowedForTarget.includes(opt.value)
                          ? " (Requiere paso previo)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CAMPOS CONTEXTUALES DENTRO DEL MODAL */}
                {nextStatus === "shipped" && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/45 p-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                        Transportista / Courier
                      </label>
                      <input
                        type="text"
                        value={carrierName}
                        onChange={(e) => setCarrierName(e.target.value)}
                        placeholder="Olva Courier, Shalom..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                        Código Tracking / Guía
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Ej. OLV-9981274"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {nextStatus === "delivered" && (
                  <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/45 p-4">
                    <p className="text-xs font-extrabold text-emerald-800">
                      Foto de Entrega con el Cliente (Opcional)
                    </p>
                    <input
                      ref={modalDeliveryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        void handleUploadDeliveryProof(e.target.files?.[0])
                      }
                      className="sr-only"
                    />
                    {deliveryProofImageUrl ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={deliveryProofImageUrl}
                          alt="Evidencia entrega"
                          className="size-16 rounded-xl border border-emerald-300 object-cover"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              modalDeliveryInputRef.current?.click()
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                          >
                            Cambiar foto
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryProofImageUrl("")}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-[#DC2626]"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={uploadingProof}
                        onClick={() => modalDeliveryInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-white px-4 py-3 text-xs font-extrabold text-emerald-800 hover:border-emerald-500"
                      >
                        {uploadingProof ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ImagePlus className="size-4" />
                        )}
                        <span>
                          {uploadingProof
                            ? "Subiendo foto..."
                            : "Seleccionar foto desde celular / PC (Opcional)"}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                    Motivo / Comentario de Auditoría{" "}
                    {nextStatus === "refunded" ? "* (Obligatorio)" : "(Opcional)"}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Detalle del avance de preparación, envío o devolución..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {actionError && (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-900">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <Link
                    href={`/admin/pedidos/${modalOrder.id}`}
                    className="text-xs font-extrabold text-blue-700 hover:underline"
                  >
                    Abrir ficha completa SUNAT/Kardex →
                  </Link>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModalOrder(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={submitting || uploadingProof}
                      onClick={() => setConfirmDialogOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Confirmar Cambio</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN CRÍTICA ANTES DE APLICAR TRANSICIÓN */}
      <AnimatePresence>
        {confirmDialogOpen && activeTargetOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                    nextStatus === "cancelled" || nextStatus === "refunded"
                      ? "bg-red-100 text-[#DC2626]"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h4 className="font-sans text-lg font-extrabold text-slate-900">
                    Confirmar Cambio de Estado
                  </h4>
                  <p className="text-xs font-bold text-slate-500">
                    Pedido {activeTargetOrder.orderNumber}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                ¿Deseas actualizar el estado del pedido de{" "}
                <strong className="font-extrabold text-slate-900">
                  {STATUS_OPTIONS.find(
                    (s) => s.value === activeTargetOrder.status,
                  )?.label ?? activeTargetOrder.status}
                </strong>{" "}
                a{" "}
                <strong className="font-extrabold text-[#DC2626]">
                  {STATUS_OPTIONS.find((s) => s.value === nextStatus)?.label ??
                    nextStatus}
                </strong>
                ?
              </p>

              {(nextStatus === "cancelled" || nextStatus === "refunded") && (
                <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-950">
                  Esta acción impactará el inventario automáticamente (
                  {nextStatus === "cancelled"
                    ? "liberará reservas"
                    : "repondrá stock en Kardex"}
                  ) y quedará registrada en auditoría.
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setConfirmDialogOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void executeStatusUpdate()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  <span>Aceptar y Guardar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX PARA FOTO DE EVIDENCIA DE ENTREGA */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between gap-4 px-2">
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-700">
                    Evidencia Fotográfica de Entrega
                  </p>
                  <p className="font-sans text-base font-black text-slate-900">
                    Pedido {lightboxImage.orderNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                >
                  <X className="size-5" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.url}
                alt={`Evidencia entrega ${lightboxImage.orderNumber}`}
                className="max-h-[70vh] w-full rounded-2xl object-contain bg-slate-100"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
