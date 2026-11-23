"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SiWhatsapp } from "react-icons/si";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  ImageIcon,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Ruler,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  updateProductReturnStatusAction,
  deleteProductReturnAction,
} from "@/server/actions/returns";

export interface ExchangeRecord {
  id: number;
  ticketNumber: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber: string;
  taxDocNumber: string | null;
  requestType: string;
  reason: string;
  currentProductDetails: string;
  requestedProductDetails: string;
  customerNotes: string | null;
  images: string[];
  status: string;
  adminNotes: string | null;
  createdAtIso: string;
  updatedAtIso: string;
}

interface AdminExchangesManagerProps {
  exchanges: ExchangeRecord[];
}

type ViewMode = "cards" | "table";
type FilterTab =
  | "all"
  | "pending"
  | "in_review"
  | "approved"
  | "completed"
  | "rejected";

const STATUS_META: Record<
  string,
  {
    label: string;
    description: string;
    badgeClass: string;
    topBarClass: string;
  }
> = {
  pending: {
    label: "Pendiente",
    description: "Solicitud recibida, esperando evaluación del equipo.",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-900",
    topBarClass: "from-amber-400 to-amber-600",
  },
  in_review: {
    label: "En Revisión",
    description: "Validando boleta, fotos y stock disponible de la talla.",
    badgeClass: "border-blue-300 bg-blue-50 text-blue-900",
    topBarClass: "from-blue-500 to-indigo-600",
  },
  approved: {
    label: "Aprobado",
    description: "Cambio autorizado; coordinando entrega o recojo por WhatsApp.",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-900",
    topBarClass: "from-emerald-500 to-teal-600",
  },
  completed: {
    label: "Completado",
    description: "Prenda entregada/cambiada satisfactoriamente.",
    badgeClass: "border-emerald-500 bg-emerald-100 text-emerald-950",
    topBarClass: "from-emerald-600 to-green-700",
  },
  rejected: {
    label: "Rechazado",
    description: "No procede cambio según política o fuera de plazo.",
    badgeClass: "border-red-300 bg-red-50 text-red-900",
    topBarClass: "from-[#991B1B] to-[#DC2626]",
  },
};

const ITEMS_PER_PAGE = 10;

function buildWhatsAppUrl(item: ExchangeRecord): string | null {
  const cleanPhone = item.customerPhone.replace(/\D/g, "");
  if (!cleanPhone) return null;
  const normalized = cleanPhone.startsWith("51")
    ? cleanPhone
    : `51${cleanPhone}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(
    `Hola ${item.customerName}, te escribimos de American Colt JEANS™ respecto a tu solicitud de cambio #${item.ticketNumber} para el pedido ${item.orderNumber}.`,
  )}`;
}

export function AdminExchangesManager({
  exchanges,
}: AdminExchangesManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [currentPage, setCurrentPage] = useState(1);

  // Modales modernos
  const [manageTarget, setManageTarget] = useState<ExchangeRecord | null>(null);
  const [draftStatus, setDraftStatus] = useState<string>("pending");
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [confirmSaveModalOpen, setConfirmSaveModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ExchangeRecord | null>(null);
  const [lightboxState, setLightboxState] = useState<{
    images: string[];
    index: number;
    ticketNumber: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const kpis = useMemo(() => {
    let pending = 0;
    let inReview = 0;
    let approved = 0;
    let completed = 0;
    let rejected = 0;

    for (const item of exchanges) {
      if (item.status === "pending") pending++;
      else if (item.status === "in_review") inReview++;
      else if (item.status === "approved") approved++;
      else if (item.status === "completed") completed++;
      else if (item.status === "rejected") rejected++;
    }

    return {
      total: exchanges.length,
      pending,
      inReview,
      approved,
      completed,
      rejected,
    };
  }, [exchanges]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exchanges.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return [
        item.ticketNumber,
        item.customerName,
        item.orderNumber,
        item.customerPhone,
        item.customerEmail,
        item.currentProductDetails,
        item.requestedProductDetails,
        item.reason,
        item.taxDocNumber ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [exchanges, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  const openManageModal = (item: ExchangeRecord) => {
    setFeedback(null);
    setManageTarget(item);
    setDraftStatus(item.status);
    setDraftNotes(item.adminNotes ?? "");
    setConfirmSaveModalOpen(false);
  };

  const executeSaveResolution = () => {
    if (!manageTarget) return;
    const target = manageTarget;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateProductReturnStatusAction({
        id: target.id,
        status: draftStatus,
        adminNotes: draftNotes,
      });

      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Ticket #${target.ticketNumber} actualizado correctamente a "${STATUS_META[draftStatus]?.label ?? draftStatus}".`,
        });
        setConfirmSaveModalOpen(false);
        setManageTarget(null);
        router.refresh();
      } else {
        setFeedback({
          type: "err",
          text: res.error ?? "No se pudo actualizar la solicitud.",
        });
      }
    });
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteProductReturnAction({ id: target.id });
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Solicitud #${target.ticketNumber} eliminada del historial.`,
        });
        setDeleteTarget(null);
        router.refresh();
      } else {
        setFeedback({
          type: "err",
          text: res.error ?? "No se pudo eliminar la solicitud.",
        });
      }
    });
  };

  const filterTabs: {
    id: FilterTab;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "all", label: "Todos", count: kpis.total, icon: Layers },
    { id: "pending", label: "Pendientes", count: kpis.pending, icon: Clock },
    {
      id: "in_review",
      label: "En Revisión",
      count: kpis.inReview,
      icon: Search,
    },
    {
      id: "approved",
      label: "Aprobados",
      count: kpis.approved,
      icon: CheckCircle2,
    },
    {
      id: "completed",
      label: "Completados",
      count: kpis.completed,
      icon: Ruler,
    },
    {
      id: "rejected",
      label: "Rechazados",
      count: kpis.rejected,
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* HERO HEADER 3D */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white shadow-[0_22px_50px_-14px_rgba(220,38,38,0.45)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-60 rounded-full bg-black/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>Post-Venta y Atención al Cliente 3D</span>
            </div>
            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              Cambios de Talla y Devoluciones
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              Evalúa solicitudes de cambio por talla o modelo, inspecciona fotos
              de sustento en alta resolución, coordina por WhatsApp y actualiza
              resoluciones con confirmación segura.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:bg-red-50"
            >
              <Clock className="size-4" />
              <span>Ver Pendientes ({kpis.pending})</span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* 5 TARJETAS KPI 3D INTERACTIVAS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "all"
              ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Total Tickets
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <RefreshCw className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.total}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Solicitudes registradas
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("pending");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "pending"
              ? "border-amber-500 ring-2 ring-amber-400/25"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
              Pendientes
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.pending}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Requieren atención rápida
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("in_review");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "in_review"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-blue-700">
              En Revisión
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Search className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.inReview}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Validando prenda y talla
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("approved");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "approved"
              ? "border-emerald-600 ring-2 ring-emerald-500/20"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Aprobados / En Curso
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Ruler className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.approved}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Completados: {kpis.completed}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("rejected");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "rejected"
              ? "border-red-600 ring-2 ring-red-500/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#DC2626]">
              Rechazados
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <XCircle className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.rejected}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Fuera de política o plazo
          </p>
        </button>
      </section>

      {/* PESTAÑAS ANIMADAS + SWITCH TARJETAS / TABLA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.15)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`relative flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-extrabold transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="exchangesFilterPill"
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] shadow-md"
                  />
                )}
                <Icon className="relative z-10 size-3.5" />
                <span className="relative z-10">{tab.label}</span>
                <span
                  className={`relative z-10 rounded-full px-2 py-0.5 text-[0.65rem] font-black tabular-nums ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              viewMode === "cards"
                ? "bg-white text-[#DC2626] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="size-3.5" />
            <span>Tarjetas 3D</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              viewMode === "table"
                ? "bg-white text-[#DC2626] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="size-3.5" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK ANIMADO */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 text-sm font-bold shadow-sm ${
              feedback.type === "ok"
                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                : "border-red-300 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "ok" ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-[#DC2626]" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-lg p-1 hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUSCADOR */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por ticket #CAMB-..., cliente, pedido #ORD-..., teléfono, talla o motivo..."
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
          />
        </div>
      </div>

      {/* LISTADO: TARJETAS 3D O TABLA */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-red-50 text-[#DC2626]">
            <RefreshCw className="size-7" />
          </div>
          <p className="mt-4 font-sans text-xl font-black text-slate-900">
            No se encontraron solicitudes de cambio
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs font-medium text-slate-500">
            Cuando un cliente registre un cambio de talla o modelo desde la
            tienda web, aparecerá aquí con sus fotos, pedido y WhatsApp directo.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {paginated.map((item, idx) => {
            const meta = STATUS_META[item.status] ?? STATUS_META.pending;
            const waUrl = buildWhatsAppUrl(item);

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ y: -3 }}
                className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.16)] transition-all hover:border-red-300/70"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${meta.topBarClass}`}
                />

                {/* Cabecera del Ticket */}
                <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-xl bg-slate-900 px-2.5 py-1 text-xs font-black tracking-tight text-white">
                        #{item.ticketNumber}
                      </span>
                      <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-[0.68rem] font-extrabold text-slate-700">
                        Pedido {item.orderNumber}
                      </span>
                    </div>
                    <h3 className="mt-2 font-sans text-lg font-black text-slate-900">
                      {item.customerName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {new Date(item.createdAtIso).toLocaleString("es-PE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {item.taxDocNumber ? ` · Boleta/Fact: ${item.taxDocNumber}` : ""}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider ${meta.badgeClass}`}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Comparación Prenda Actual vs Solicitada */}
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
                    <span className="block text-[0.62rem] font-extrabold uppercase tracking-wider text-slate-500">
                      Prenda Recibida (Actual)
                    </span>
                    <p className="mt-1 text-xs font-extrabold text-slate-900">
                      {item.currentProductDetails}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-red-200/80 bg-red-50/60 p-3">
                    <span className="block text-[0.62rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                      Solicita Cambiar Por
                    </span>
                    <p className="mt-1 text-xs font-extrabold text-[#991B1B]">
                      {item.requestedProductDetails}
                    </p>
                  </div>
                </div>

                {/* Motivo y Fotos */}
                <div className="mt-3 space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-xs">
                  <p className="font-medium text-slate-700">
                    <strong className="font-extrabold text-slate-900">
                      Motivo:
                    </strong>{" "}
                    {item.reason}
                  </p>
                  {item.customerNotes && (
                    <p className="text-slate-500 italic">
                      &ldquo;{item.customerNotes}&rdquo;
                    </p>
                  )}
                  {item.adminNotes && (
                    <p className="rounded-xl bg-blue-50/70 px-3 py-2 text-xs font-bold text-blue-900">
                      Nota Admin: {item.adminNotes}
                    </p>
                  )}
                </div>

                {/* Contacto + Fotos + Botones 3D */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-[#25D366] px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:-translate-y-0.5 hover:brightness-105"
                      >
                        <SiWhatsapp className="size-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {item.images.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxState({
                            images: item.images,
                            index: 0,
                            ticketNumber: item.ticketNumber,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100"
                      >
                        <ImageIcon className="size-3.5 text-[#DC2626]" />
                        <span>Ver Fotos ({item.images.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => openManageModal(item)}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_#1E3A8A] transition hover:brightness-110"
                    >
                      <span>Gestionar</span>
                      <ArrowRight className="size-3.5" />
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-[#DC2626] hover:bg-red-100"
                      title="Eliminar ticket"
                    >
                      <Trash2 className="size-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-4">Ticket / Fecha</th>
                  <th className="px-4 py-4">Cliente / Contacto</th>
                  <th className="px-4 py-4">Pedido / Doc</th>
                  <th className="px-4 py-4">Cambio Solicitado</th>
                  <th className="px-4 py-4">Fotos</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((item) => {
                  const meta = STATUS_META[item.status] ?? STATUS_META.pending;
                  const waUrl = buildWhatsAppUrl(item);

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-red-50/30"
                    >
                      <td className="px-5 py-4 align-top">
                        <span className="text-sm font-black text-blue-700">
                          #{item.ticketNumber}
                        </span>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {new Date(item.createdAtIso).toLocaleString("es-PE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="text-xs font-extrabold text-slate-900">
                          {item.customerName}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {item.customerEmail}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {item.customerPhone}
                          </span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2 py-0.5 text-[0.6rem] font-extrabold text-white"
                            >
                              <SiWhatsapp className="size-2.5" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-900">
                          {item.orderNumber}
                        </span>
                        {item.taxDocNumber && (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Doc: {item.taxDocNumber}
                          </p>
                        )}
                      </td>

                      <td className="max-w-xs px-4 py-4 align-top text-xs">
                        <p className="font-bold text-slate-800">
                          Actual: {item.currentProductDetails}
                        </p>
                        <p className="mt-0.5 font-extrabold text-[#DC2626]">
                          Desea: {item.requestedProductDetails}
                        </p>
                        <p className="mt-1 font-medium text-slate-500">
                          Motivo: {item.reason}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        {item.images.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxState({
                                images: item.images,
                                index: 0,
                                ticketNumber: item.ticketNumber,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-extrabold text-slate-800 hover:bg-slate-100"
                          >
                            <Eye className="size-3.5 text-[#DC2626]" />
                            <span>{item.images.length}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            Sin fotos
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-block rounded-full border px-3 py-1 text-[0.65rem] font-extrabold uppercase ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right align-top">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openManageModal(item)}
                            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-[0.68rem] font-extrabold uppercase text-white shadow-xs hover:bg-blue-700"
                          >
                            <span>Gestionar</span>
                            <ArrowRight className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-xl border border-red-200 bg-red-50 p-2 text-[#DC2626] hover:bg-red-100"
                            title="Eliminar"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs font-bold text-slate-600">
            Página {safePage} de {totalPages} · {filtered.length} solicitudes
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL MODERNO 3D: GESTIONAR RESOLUCIÓN DEL CAMBIO */}
      <AnimatePresence>
        {manageTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                    <Ruler className="size-3.5" />
                    Expediente de Cambio #{manageTarget.ticketNumber}
                  </span>
                  <h2 className="mt-2 font-sans text-2xl font-black tracking-tight text-slate-900">
                    {manageTarget.customerName} · Pedido{" "}
                    {manageTarget.orderNumber}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5 text-slate-400" />
                      {manageTarget.customerEmail}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5 text-slate-400" />
                      {manageTarget.customerPhone}
                    </span>
                    {manageTarget.taxDocNumber && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3.5 text-slate-400" />
                        Doc: {manageTarget.taxDocNumber}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManageTarget(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {/* Detalles solicitados */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                      Prenda / Talla Recibida
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {manageTarget.currentProductDetails}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                      Nueva Talla / Modelo Solicitado
                    </p>
                    <p className="mt-1 text-sm font-black text-[#991B1B]">
                      {manageTarget.requestedProductDetails}
                    </p>
                  </div>
                </div>

                {/* Motivo + Fotos */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-700">
                    <strong className="font-extrabold text-slate-900">
                      Motivo del cliente:
                    </strong>{" "}
                    {manageTarget.reason}
                  </p>
                  {manageTarget.customerNotes && (
                    <p className="text-xs text-slate-500 italic">
                      Comentario adicional: &ldquo;{manageTarget.customerNotes}
                      &rdquo;
                    </p>
                  )}
                  {manageTarget.images.length > 0 && (
                    <div className="pt-1">
                      <p className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                        Fotos de Sustento ({manageTarget.images.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {manageTarget.images.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setLightboxState({
                                images: manageTarget.images,
                                index: i,
                                ticketNumber: manageTarget.ticketNumber,
                              })
                            }
                            className="group relative size-16 overflow-hidden rounded-2xl border border-slate-200 shadow-xs hover:border-[#DC2626]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img}
                              alt={`Sustento ${i + 1}`}
                              className="size-full object-cover transition group-hover:scale-110"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selección visual 3D de estado */}
                <div>
                  <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Seleccionar Resolución del Ticket *
                  </label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {(
                      [
                        "pending",
                        "in_review",
                        "approved",
                        "completed",
                        "rejected",
                      ] as const
                    ).map((stKey) => {
                      const info = STATUS_META[stKey];
                      const chosen = draftStatus === stKey;
                      return (
                        <button
                          key={stKey}
                          type="button"
                          onClick={() => setDraftStatus(stKey)}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            chosen
                              ? "border-[#DC2626] bg-red-50/70 shadow-sm ring-2 ring-[#DC2626]/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {info.label}
                            </span>
                            {manageTarget.status === stKey && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.58rem] font-extrabold text-slate-700">
                                ACTUAL
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[0.68rem] font-medium leading-snug text-slate-500">
                            {info.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notas internas de administración */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    <MessageSquareText className="size-3.5 text-[#DC2626]" />
                    <span>Notas Internas / Seguimiento de Coordinación</span>
                  </label>
                  <textarea
                    rows={3}
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="Ej: Se coordinó por WhatsApp el envío de la talla 32 para el día viernes con motorizado..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  {buildWhatsAppUrl(manageTarget) ? (
                    <a
                      href={buildWhatsAppUrl(manageTarget)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:brightness-105"
                    >
                      <SiWhatsapp className="size-4" />
                      <span>Escribir al Cliente por WhatsApp</span>
                    </a>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setManageTarget(null)}
                      className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirmSaveModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                    >
                      <Save className="size-4" />
                      <span>Guardar Resolución</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL MODERNO DE CONFIRMACIÓN ANTES DE GUARDAR CAMBIO DE ESTADO */}
      <AnimatePresence>
        {confirmSaveModalOpen && manageTarget && (
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
              <div className="flex items-center gap-3.5">
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                    draftStatus === "rejected"
                      ? "bg-red-100 text-[#DC2626]"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <h3 className="font-sans text-lg font-black text-slate-900">
                    Confirmar Resolución de Cambio
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    Ticket #{manageTarget.ticketNumber}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                ¿Confirmas actualizar la solicitud de{" "}
                <strong className="font-extrabold text-slate-900">
                  {manageTarget.customerName}
                </strong>{" "}
                al estado{" "}
                <strong className="font-extrabold text-[#DC2626]">
                  {STATUS_META[draftStatus]?.label ?? draftStatus}
                </strong>
                ?
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmSaveModalOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={executeSaveResolution}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                >
                  {isPending ? (
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

      {/* MODAL MODERNO DE CONFIRMACIÓN PARA ELIMINAR TICKET */}
      <AnimatePresence>
        {deleteTarget && (
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
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-[#DC2626]">
                  <ShieldAlert className="size-6" />
                </span>
                <div>
                  <h3 className="font-sans text-lg font-black text-slate-900">
                    ¿Eliminar Solicitud de Cambio?
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    Ticket #{deleteTarget.ticketNumber}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                Estás a punto de eliminar el ticket de{" "}
                <strong className="font-extrabold text-slate-900">
                  {deleteTarget.customerName}
                </strong>{" "}
                (Pedido {deleteTarget.orderNumber}). Esta acción no se puede
                deshacer.
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={executeDelete}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  <span>Sí, Eliminar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL LIGHTBOX DE FOTOS ADJUNTAS */}
      <AnimatePresence>
        {lightboxState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxState(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between gap-4 px-2">
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                    Foto Adjunta ({lightboxState.index + 1} de{" "}
                    {lightboxState.images.length})
                  </p>
                  <p className="font-sans text-base font-black text-slate-900">
                    Ticket #{lightboxState.ticketNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxState(null)}
                  className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxState.images[lightboxState.index]}
                  alt={`Evidencia ${lightboxState.index + 1}`}
                  className="max-h-[65vh] w-full object-contain"
                />
              </div>

              {lightboxState.images.length > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxState((prev) =>
                        prev
                          ? {
                              ...prev,
                              index:
                                (prev.index - 1 + prev.images.length) %
                                prev.images.length,
                            }
                          : null,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronLeft className="size-4" />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxState((prev) =>
                        prev
                          ? {
                              ...prev,
                              index: (prev.index + 1) % prev.images.length,
                            }
                          : null,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
