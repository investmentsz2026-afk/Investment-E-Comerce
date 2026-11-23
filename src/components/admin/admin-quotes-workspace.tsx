"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type {
  getAdminWholesaleQuotes,
  QuoteStatus,
} from "@/server/queries/quotes";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { formatPEN } from "@/lib/format";
import {
  ArrowRight,
  Ban,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Layers,
  LayoutGrid,
  List,
  PackageCheck,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

type AdminQuoteRow = Awaited<ReturnType<typeof getAdminWholesaleQuotes>>[number];
type ViewMode = "cards" | "table";
type FilterTab = "all" | QuoteStatus;

const ITEMS_PER_PAGE = 10;

const TOP_BAR_BY_STATUS: Record<QuoteStatus, string> = {
  submitted: "from-sky-400 to-blue-600",
  under_review: "from-amber-400 to-amber-600",
  quoted: "from-emerald-400 to-teal-600",
  accepted: "from-emerald-600 to-green-800",
  rejected: "from-[#991B1B] to-[#DC2626]",
  expired: "from-slate-400 to-slate-600",
  cancelled: "from-slate-500 to-slate-700",
};

export function AdminQuotesWorkspace({
  quotes,
  initialStatus,
  initialSearch,
}: {
  quotes: AdminQuoteRow[];
  initialStatus?: string;
  initialSearch?: string;
}) {
  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    if (
      initialStatus === "submitted" ||
      initialStatus === "under_review" ||
      initialStatus === "quoted" ||
      initialStatus === "accepted" ||
      initialStatus === "rejected" ||
      initialStatus === "expired" ||
      initialStatus === "cancelled"
    ) {
      return initialStatus;
    }
    return "all";
  });
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [currentPage, setCurrentPage] = useState(1);

  const kpis = useMemo(() => {
    let submitted = 0;
    let underReview = 0;
    let quoted = 0;
    let accepted = 0;
    let closed = 0;
    let acceptedVolume = 0;
    let quotedVolume = 0;

    for (const q of quotes) {
      if (q.status === "submitted") submitted++;
      else if (q.status === "under_review") underReview++;
      else if (q.status === "quoted") {
        quoted++;
        quotedVolume += q.quotedTotalAmount ?? 0;
      } else if (q.status === "accepted") {
        accepted++;
        acceptedVolume += q.quotedTotalAmount ?? 0;
      } else {
        closed++;
      }
    }

    return {
      total: quotes.length,
      submitted,
      underReview,
      pendingPipeline: submitted + underReview,
      quoted,
      accepted,
      closed,
      acceptedVolume,
      quotedVolume,
    };
  }, [quotes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((item) => {
      if (activeTab !== "all" && item.status !== activeTab) return false;
      if (!q) return true;
      return [
        item.quoteNumber,
        item.companyLegalName,
        item.companyTradeName,
        item.companyTaxId,
        item.contactEmail,
        item.contactName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [quotes, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  const tabs: {
    id: FilterTab;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "all", label: "Todas", count: kpis.total, icon: Layers },
    { id: "submitted", label: "Enviadas", count: kpis.submitted, icon: Send },
    {
      id: "under_review",
      label: "En Revisión",
      count: kpis.underReview,
      icon: Clock,
    },
    {
      id: "quoted",
      label: "Cotizadas",
      count: kpis.quoted,
      icon: FileSpreadsheet,
    },
    {
      id: "accepted",
      label: "Aceptadas",
      count: kpis.accepted,
      icon: CheckCircle2,
    },
    {
      id: "rejected",
      label: "Rechazadas",
      count: quotes.filter((q) => q.status === "rejected").length,
      icon: XCircle,
    },
    {
      id: "expired",
      label: "Vencidas",
      count: quotes.filter((q) => q.status === "expired").length,
      icon: Clock,
    },
    {
      id: "cancelled",
      label: "Canceladas",
      count: quotes.filter((q) => q.status === "cancelled").length,
      icon: Ban,
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
              <span>Mesa Corporativa de Negociación B2B 3D</span>
            </div>
            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              Cotizaciones Empresariales y Lotes Mayoristas
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              Evalúa requerimientos por volumen de empresas con RUC, define
              tarifas unitarias preferenciales por SKU, fija fechas de vigencia
              y haz seguimiento completo hasta la orden final.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setActiveTab("submitted");
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:bg-red-50"
            >
              <Send className="size-4" />
              <span>Por Cotizar ({kpis.submitted})</span>
            </motion.button>

            <Link
              href="/admin/solicitudes"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-4 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-all hover:bg-white/25"
            >
              <ShieldCheck className="size-4" />
              <span>Empresas RUC</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 5 TARJETAS KPI 3D INTERACTIVAS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "all"
              ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Total Expedientes
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <FileSpreadsheet className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.total}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Solicitudes corporativas
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("submitted");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "submitted"
              ? "border-sky-500 ring-2 ring-sky-400/25"
              : "border-slate-200/80 hover:border-sky-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sky-700">
              Recibidas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Send className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.submitted}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            En revisión: {kpis.underReview}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("quoted");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "quoted"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-blue-700">
              Propuestas Emitidas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.quoted}
          </p>
          <p className="mt-1 text-xs font-extrabold tabular-nums text-blue-700">
            {formatPEN(kpis.quotedVolume)} en espera
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("accepted");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "accepted"
              ? "border-emerald-600 ring-2 ring-emerald-500/20"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Aceptadas B2B
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <PackageCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.accepted}
          </p>
          <p className="mt-1 text-xs font-extrabold tabular-nums text-emerald-700">
            {formatPEN(kpis.acceptedVolume)} cerrados
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("rejected");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "rejected" ||
            activeTab === "expired" ||
            activeTab === "cancelled"
              ? "border-red-600 ring-2 ring-red-500/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#DC2626]">
              Cerradas / Vencidas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <XCircle className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.closed}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Rechazadas, vencidas o canc.
          </p>
        </button>
      </section>

      {/* PESTAÑAS ANIMADAS + SWITCH TARJETAS / TABLA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.15)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setActiveTab(tab.id);
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
                    layoutId="quotesTabPill"
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
            placeholder="Buscar cotización por N° COT-..., razón social, RUC o correo corporativo..."
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
          />
        </div>
      </div>

      {/* LISTADO: TARJETAS 3D O TABLA */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-red-50 text-[#DC2626]">
            <FileSpreadsheet className="size-7" />
          </div>
          <p className="mt-4 font-sans text-xl font-black text-slate-900">
            No se encontraron cotizaciones con los filtros seleccionados
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs font-medium text-slate-500">
            Cuando una empresa B2B aprobada solicite una cotización por lote o
            volumen desde la tienda, aparecerá aquí lista para armar tu
            propuesta económica.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {paginated.map((q, idx) => (
            <motion.article
              key={q.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025 }}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.16)] transition-all hover:border-red-300/70"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${
                  TOP_BAR_BY_STATUS[q.status] ?? "from-slate-500 to-slate-700"
                }`}
              />

              <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-slate-900 px-2.5 py-1 text-xs font-black tracking-tight text-white">
                      {q.quoteNumber}
                    </span>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700">
                      RUC {q.companyTaxId}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate font-sans text-lg font-black text-slate-900">
                    {q.companyLegalName}
                  </h3>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {q.contactName} · {q.contactEmail}
                  </p>
                </div>

                <QuoteStatusBadge status={q.status} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-3.5 text-xs">
                <div>
                  <span className="block text-[0.62rem] font-extrabold uppercase text-slate-500">
                    Volumen Lote
                  </span>
                  <span className="mt-0.5 block font-black text-slate-900">
                    {q.totalUnits} uds. ({q.itemCount} líns.)
                  </span>
                </div>
                <div>
                  <span className="block text-[0.62rem] font-extrabold uppercase text-slate-500">
                    Ref. Catálogo
                  </span>
                  <span className="mt-0.5 block font-bold tabular-nums text-slate-700">
                    {formatPEN(q.requestedSubtotalAmount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.62rem] font-extrabold uppercase text-slate-500">
                    Total Cotizado
                  </span>
                  <span className="mt-0.5 block text-sm font-black tabular-nums text-emerald-700">
                    {q.quotedTotalAmount !== null
                      ? formatPEN(q.quotedTotalAmount)
                      : "Pendiente"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Calendar className="size-3.5 text-slate-400" />
                  <span>
                    {q.validUntil
                      ? `Vence: ${new Date(q.validUntil).toLocaleDateString("es-PE", { dateStyle: "medium" })}`
                      : `Creada: ${new Date(q.createdAt).toLocaleDateString("es-PE", { dateStyle: "medium" })}`}
                  </span>
                </div>

                <Link
                  href={`/admin/cotizaciones/${q.id}`}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span>Evaluar Propuesta</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-4">Expediente</th>
                  <th className="px-4 py-4">Empresa / RUC</th>
                  <th className="px-4 py-4">Lote</th>
                  <th className="px-4 py-4">Ref. Solicitado</th>
                  <th className="px-4 py-4">Total Cotizado</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-4 py-4">Vencimiento</th>
                  <th className="px-5 py-4 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((q) => (
                  <tr key={q.id} className="transition-colors hover:bg-red-50/30">
                    <td className="px-5 py-4 align-top">
                      <span className="text-sm font-black text-slate-900">
                        {q.quoteNumber}
                      </span>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {new Date(q.createdAt).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 shrink-0 text-slate-400" />
                        <span className="text-sm font-extrabold text-slate-900">
                          {q.companyLegalName}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        RUC: {q.companyTaxId} · {q.contactEmail}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs font-bold text-slate-800">
                      {q.itemCount} {q.itemCount === 1 ? "línea" : "líneas"} (
                      {q.totalUnits} uds.)
                    </td>
                    <td className="px-4 py-4 align-top text-xs font-bold tabular-nums text-slate-600">
                      {formatPEN(q.requestedSubtotalAmount)}
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-black tabular-nums text-emerald-700">
                      {q.quotedTotalAmount !== null
                        ? formatPEN(q.quotedTotalAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-4 align-top text-xs font-semibold text-slate-600">
                      {q.validUntil
                        ? new Date(q.validUntil).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <Link
                        href={`/admin/cotizaciones/${q.id}`}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-4 py-2 text-[0.68rem] font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_#7F1D1D] hover:brightness-110"
                      >
                        <span>Evaluar</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs font-bold text-slate-600">
            Página {safePage} de {totalPages} · {filtered.length} cotizaciones
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
    </div>
  );
}
