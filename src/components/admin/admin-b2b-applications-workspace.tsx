"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SiWhatsapp } from "react-icons/si";
import {
  reviewApplicationAction,
  type AllowedReviewStatus,
} from "@/server/actions/admin";
import type {
  getAdminApplications,
  getAdminAuditLogs,
} from "@/server/queries/admin";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  History,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";

type ApplicationRow = Awaited<
  ReturnType<typeof getAdminApplications>
>["items"][number];
type AuditLogRow = Awaited<ReturnType<typeof getAdminAuditLogs>>[number];

type FilterTab =
  | "all"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "audit";

type ViewMode = "cards" | "table";

const STATUS_META: Record<
  string,
  {
    label: string;
    badgeClass: string;
    topBarClass: string;
  }
> = {
  pending: {
    label: "Pendiente",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-900",
    topBarClass: "from-amber-400 to-amber-600",
  },
  under_review: {
    label: "En Evaluación",
    badgeClass: "border-blue-300 bg-blue-50 text-blue-900",
    topBarClass: "from-blue-500 to-indigo-600",
  },
  approved: {
    label: "Aprobada",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-900",
    topBarClass: "from-emerald-500 to-teal-600",
  },
  rejected: {
    label: "Rechazada",
    badgeClass: "border-red-300 bg-red-50 text-red-900",
    topBarClass: "from-[#991B1B] to-[#DC2626]",
  },
  suspended: {
    label: "Suspendida",
    badgeClass: "border-rose-300 bg-rose-100 text-rose-950",
    topBarClass: "from-slate-600 to-rose-700",
  },
};

const RESOLUTION_OPTIONS: {
  value: AllowedReviewStatus;
  label: string;
  description: string;
  confirmVerb: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    value: "approved",
    label: "Aprobar Empresa",
    description:
      "Activa el rol mayorista B2B con tarifas escalonadas y cotizaciones.",
    confirmVerb: "APROBAR acceso mayorista B2B",
    icon: CheckCircle2,
    activeClass:
      "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/25",
  },
  {
    value: "under_review",
    label: "En Evaluación",
    description:
      "Deja constancia de verificación de RUC y evaluación comercial en curso.",
    confirmVerb: "marcar EN EVALUACIÓN",
    icon: Clock,
    activeClass: "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/25",
  },
  {
    value: "rejected",
    label: "Rechazar Solicitud",
    description:
      "Deniega la solicitud e informa el motivo obligatorio al postulante.",
    confirmVerb: "RECHAZAR solicitud comercial",
    icon: XCircle,
    activeClass:
      "border-[#DC2626] bg-red-50/80 ring-2 ring-[#DC2626]/25",
  },
  {
    value: "suspended",
    label: "Suspender Acceso",
    description:
      "Revoca inmediatamente los privilegios mayoristas a cuenta minorista.",
    confirmVerb: "SUSPENDER acceso mayorista B2B",
    icon: Ban,
    activeClass: "border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/25",
  },
];

const ITEMS_PER_PAGE = 10;

function buildWhatsAppHref(app: ApplicationRow): string | null {
  const digits = app.contactPhone.replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.startsWith("51") ? digits : `51${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(
    `Hola ${app.contactName}, te escribimos de American Colt JEANS™ respecto a la solicitud mayorista B2B de ${app.legalName} (RUC ${app.taxId}).`,
  )}`;
}

export function AdminB2BApplicationsWorkspace({
  applications,
  auditLogs,
  initialStatus,
  initialSearch,
}: {
  applications: ApplicationRow[];
  auditLogs: AuditLogRow[];
  initialStatus?: string;
  initialSearch?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    if (
      initialStatus === "pending" ||
      initialStatus === "under_review" ||
      initialStatus === "approved" ||
      initialStatus === "rejected" ||
      initialStatus === "suspended"
    ) {
      return initialStatus;
    }
    return "all";
  });
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal moderno de Gestión + Confirmación
  const [manageTarget, setManageTarget] = useState<ApplicationRow | null>(null);
  const [draftStatus, setDraftStatus] =
    useState<AllowedReviewStatus>("approved");
  const [draftReason, setDraftReason] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const kpis = useMemo(() => {
    let pending = 0;
    let underReview = 0;
    let approved = 0;
    let rejected = 0;
    let suspended = 0;

    for (const app of applications) {
      if (app.status === "pending") pending++;
      else if (app.status === "under_review") underReview++;
      else if (app.status === "approved") approved++;
      else if (app.status === "rejected") rejected++;
      else if (app.status === "suspended") suspended++;
    }

    return {
      total: applications.length,
      pending,
      underReview,
      approved,
      rejected,
      suspended,
    };
  }, [applications]);

  const filtered = useMemo(() => {
    if (activeTab === "audit") return [];
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (activeTab !== "all" && app.status !== activeTab) return false;
      if (!q) return true;
      return [
        app.legalName,
        app.tradeName,
        app.taxId,
        app.contactName,
        app.contactEmail,
        app.contactPhone,
        app.district,
        app.department,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [applications, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  const openManageModal = (app: ApplicationRow) => {
    setModalError(null);
    setFeedback(null);
    setManageTarget(app);
    const defaultResolution: AllowedReviewStatus =
      app.status === "rejected" ||
      app.status === "suspended" ||
      app.status === "under_review"
        ? (app.status as AllowedReviewStatus)
        : "approved";
    setDraftStatus(defaultResolution);
    setDraftReason(app.rejectionReason ?? "");
    setDraftNotes(app.internalNotes ?? "");
    setConfirmOpen(false);
  };

  const handleRequestConfirm = () => {
    setModalError(null);
    if (draftStatus === "rejected" && draftReason.trim().length < 5) {
      setModalError(
        "Para rechazar una solicitud debes ingresar un motivo claro (mínimo 5 caracteres).",
      );
      return;
    }
    setConfirmOpen(true);
  };

  const executeReview = () => {
    if (!manageTarget) return;
    const target = manageTarget;
    setModalError(null);
    setFeedback(null);

    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId: target.id,
        newStatus: draftStatus,
        internalNotes: draftNotes,
        rejectionReason: draftReason,
      });

      if (!res.success) {
        setModalError(
          res.error ?? "No se pudo actualizar la solicitud mayorista.",
        );
        setConfirmOpen(false);
        return;
      }

      setFeedback({
        type: "ok",
        text: `Expediente #${target.id} (${target.legalName}) actualizado a "${STATUS_META[draftStatus]?.label ?? draftStatus}" y notificado en auditoría.`,
      });
      setConfirmOpen(false);
      setManageTarget(null);
      router.refresh();
    });
  };

  const tabs: {
    id: FilterTab;
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "all", label: "Todas", count: kpis.total, icon: Layers },
    { id: "pending", label: "Pendientes", count: kpis.pending, icon: Clock },
    {
      id: "under_review",
      label: "En Evaluación",
      count: kpis.underReview,
      icon: Search,
    },
    {
      id: "approved",
      label: "Aprobadas",
      count: kpis.approved,
      icon: CheckCircle2,
    },
    {
      id: "rejected",
      label: "Rechazadas",
      count: kpis.rejected,
      icon: XCircle,
    },
    { id: "suspended", label: "Suspendidas", count: kpis.suspended, icon: Ban },
    {
      id: "audit",
      label: "Auditoría",
      count: auditLogs.length,
      icon: History,
    },
  ];

  const selectedResolutionMeta = RESOLUTION_OPTIONS.find(
    (r) => r.value === draftStatus,
  );

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
              <span>Comercial B2B · Verificación SUNAT y Accesos 3D</span>
            </div>
            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              Solicitudes Mayoristas B2B
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              Evalúa postulaciones empresariales, valida RUC y volumen mensual,
              y aprueba, evalúa, rechaza o suspende cuentas mayoristas mediante
              modales interactivos con confirmación atómica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setActiveTab("pending");
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:bg-red-50"
            >
              <Clock className="size-4" />
              <span>Revisar Pendientes ({kpis.pending})</span>
            </motion.button>
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
              Total Empresas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <Building2 className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.total}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Postulaciones B2B
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("pending");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "pending"
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
            Por evaluar RUC y datos
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("under_review");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "under_review"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-blue-700">
              En Evaluación
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Search className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.underReview}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Verificación en curso
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("approved");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "approved"
              ? "border-emerald-600 ring-2 ring-emerald-500/20"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Aprobadas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.approved}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Mayoristas B2B activos
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("rejected");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            activeTab === "rejected" || activeTab === "suspended"
              ? "border-red-600 ring-2 ring-red-500/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#DC2626]">
              Rechaz. / Susp.
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <Ban className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.rejected + kpis.suspended}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Rech: {kpis.rejected} · Susp: {kpis.suspended}
          </p>
        </button>
      </section>

      {/* PESTAÑAS ANIMADAS + SWITCH VISTA */}
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
                    layoutId="b2bAppsTabPill"
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    className={`absolute inset-0 rounded-2xl shadow-md ${
                      tab.id === "audit"
                        ? "bg-gradient-to-r from-slate-800 to-slate-950"
                        : "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
                    }`}
                  />
                )}
                <Icon className="relative z-10 size-3.5" />
                <span className="relative z-10">{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`relative z-10 rounded-full px-2 py-0.5 text-[0.65rem] font-black tabular-nums ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {activeTab !== "audit" && (
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
        )}
      </div>

      {/* FEEDBACK */}
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

      {/* SUBMÓDULO AUDITORÍA */}
      {activeTab === "audit" ? (
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)] space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <History className="size-5" />
            </span>
            <div>
              <h2 className="font-sans text-xl font-black text-slate-900">
                Registro Reciente de Decisiones y Seguridad B2B
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Trazabilidad auditable de aprobaciones, rechazos y suspensiones.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase text-[#DC2626]">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {log.details}
                  </span>
                </div>
                <span className="shrink-0 font-bold text-slate-400">
                  {new Date(log.createdAt).toLocaleString("es-PE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
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
                placeholder="Buscar por Razón Social, Nombre Comercial, RUC, Correo o Contacto..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
              <Building2 className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 font-sans text-lg font-black text-slate-900">
                No se encontraron solicitudes B2B
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Prueba seleccionando otro filtro o cambiando el término de
                búsqueda.
              </p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {paginated.map((item, idx) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.pending;
                const waUrl = buildWhatsAppHref(item);
                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.025 }}
                    whileHover={{ y: -3 }}
                    className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.16)] transition-all hover:border-red-300/70"
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${meta.topBarClass}`}
                    />

                    <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl bg-slate-900 px-2.5 py-0.5 text-xs font-black text-white">
                            #{item.id}
                          </span>
                          <span className="rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-700">
                            RUC {item.taxId}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate font-sans text-lg font-black text-slate-900">
                          {item.legalName}
                        </h3>
                        <p className="truncate text-xs font-bold text-slate-500">
                          {item.tradeName} · {item.businessType}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4 text-xs sm:grid-cols-2">
                      <div>
                        <span className="block text-[0.62rem] font-extrabold uppercase text-slate-500">
                          Contacto Comercial
                        </span>
                        <p className="mt-0.5 font-extrabold text-slate-900">
                          {item.contactName}
                        </p>
                        <p className="truncate font-medium text-slate-600">
                          {item.contactEmail}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[0.62rem] font-extrabold uppercase text-slate-500">
                          Volumen Estimado / Sede
                        </span>
                        <p className="mt-0.5 font-extrabold text-[#991B1B]">
                          {item.estimatedVolume}
                        </p>
                        <p className="truncate font-semibold text-slate-600">
                          {item.district}, {item.department}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
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
                        <Link
                          href={`/admin/solicitudes/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="size-3.5" />
                          <span>Expediente</span>
                        </Link>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => openManageModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition hover:brightness-110"
                      >
                        <span>Gestionar</span>
                        <ArrowRight className="size-3.5" />
                      </motion.button>
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
                      <th className="px-5 py-4">ID / Fecha</th>
                      <th className="px-4 py-4">Empresa / Razón Social</th>
                      <th className="px-4 py-4">RUC</th>
                      <th className="px-4 py-4">Contacto / Correo</th>
                      <th className="px-4 py-4">Volumen Estimado</th>
                      <th className="px-4 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((item) => {
                      const meta =
                        STATUS_META[item.status] ?? STATUS_META.pending;
                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-red-50/30"
                        >
                          <td className="px-5 py-4 align-top">
                            <span className="text-sm font-black text-slate-900">
                              #{item.id}
                            </span>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              {new Date(item.createdAt).toLocaleDateString(
                                "es-PE",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Link
                              href={`/admin/solicitudes/${item.id}`}
                              className="text-sm font-extrabold text-slate-900 hover:text-[#DC2626] hover:underline"
                            >
                              {item.legalName}
                            </Link>
                            <p className="text-xs font-semibold text-slate-500">
                              {item.tradeName}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top text-xs font-black text-slate-900">
                            {item.taxId}
                          </td>
                          <td className="px-4 py-4 align-top text-xs">
                            <p className="font-bold text-slate-900">
                              {item.contactName}
                            </p>
                            <p className="font-medium text-slate-500">
                              {item.contactEmail}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top text-xs font-bold text-slate-700">
                            {item.estimatedVolume}
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
                                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3.5 py-2 text-[0.68rem] font-extrabold uppercase text-white shadow-xs hover:brightness-110"
                              >
                                <span>Gestionar</span>
                                <ArrowRight className="size-3" />
                              </button>
                              <Link
                                href={`/admin/solicitudes/${item.id}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[0.68rem] font-extrabold uppercase text-slate-700 hover:bg-slate-100"
                              >
                                Ver
                              </Link>
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
                Página {safePage} de {totalPages} · {filtered.length}{" "}
                solicitudes
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL MODERNO 3D: GESTIONAR / EVALUAR SOLICITUD B2B */}
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
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                      <Building2 className="size-3.5" />
                      Expediente B2B #{manageTarget.id}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-extrabold uppercase ${
                        (
                          STATUS_META[manageTarget.status] ??
                          STATUS_META.pending
                        ).badgeClass
                      }`}
                    >
                      Actual:{" "}
                      {
                        (
                          STATUS_META[manageTarget.status] ??
                          STATUS_META.pending
                        ).label
                      }
                    </span>
                  </div>
                  <h2 className="mt-2 font-sans text-2xl font-black tracking-tight text-slate-900">
                    {manageTarget.legalName}
                  </h2>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">
                    {manageTarget.tradeName} · RUC{" "}
                    <strong className="text-slate-900">
                      {manageTarget.taxId}
                    </strong>{" "}
                    · {manageTarget.businessType}
                  </p>
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
                {/* Ficha rápida Empresa + Representante */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/75 p-4 text-xs">
                    <p className="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-600">
                      <MapPin className="size-3.5 text-[#DC2626]" />
                      Sede y Volumen Comercial
                    </p>
                    <p className="font-extrabold text-slate-900">
                      {manageTarget.addressLine}
                    </p>
                    <p className="font-semibold text-slate-600">
                      {manageTarget.district}, {manageTarget.province},{" "}
                      {manageTarget.department}
                    </p>
                    <p className="inline-block rounded-lg bg-red-50 px-2.5 py-1 font-extrabold text-[#991B1B]">
                      Volumen: {manageTarget.estimatedVolume}
                    </p>
                    {manageTarget.additionalNotes && (
                      <p className="pt-1 text-slate-500 italic">
                        &ldquo;{manageTarget.additionalNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/75 p-4 text-xs">
                    <p className="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-600">
                      <User className="size-3.5 text-blue-700" />
                      Representante y Cuenta
                    </p>
                    <p className="font-extrabold text-slate-900">
                      {manageTarget.contactName}
                    </p>
                    <p className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Mail className="size-3 text-slate-400" />
                      {manageTarget.contactEmail}
                    </p>
                    <p className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Phone className="size-3 text-slate-400" />
                      {manageTarget.contactPhone}
                    </p>
                    <p className="text-[0.68rem] font-semibold text-slate-500">
                      Usuario: {manageTarget.applicantName} (Rol:{" "}
                      <code className="rounded bg-white px-1.5 py-0.5 font-bold text-slate-900">
                        {manageTarget.applicantRole}
                      </code>
                      )
                    </p>
                  </div>
                </div>

                {/* Selección de Resolución 3D */}
                <div>
                  <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Dictamen Comercial a Aplicar *
                  </label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {RESOLUTION_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const chosen = draftStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setDraftStatus(opt.value);
                            setModalError(null);
                          }}
                          className={`rounded-2xl border p-3.5 text-left transition-all ${
                            chosen
                              ? opt.activeClass
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 shrink-0" />
                            <span className="text-xs font-black text-slate-900">
                              {opt.label}
                            </span>
                          </div>
                          <p className="mt-1 text-[0.7rem] font-medium leading-snug text-slate-600">
                            {opt.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Motivo obligatorio en rechazo / opcional en suspensión */}
                <AnimatePresence>
                  {(draftStatus === "rejected" ||
                    draftStatus === "suspended") && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-2xl border border-red-300 bg-red-50/60 p-4 space-y-2"
                    >
                      <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#991B1B]">
                        <FileText className="size-3.5" />
                        <span>
                          {draftStatus === "rejected"
                            ? "Motivo de Rechazo (Se enviará por correo al postulante) *"
                            : "Motivo de Suspensión Comercial (Opcional)"}
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        value={draftReason}
                        onChange={(e) => setDraftReason(e.target.value)}
                        placeholder={
                          draftStatus === "rejected"
                            ? "Ej: RUC inactivo / no habido en SUNAT o volumen fuera de mínimo mayorista..."
                            : "Motivo de suspensión del acceso mayorista..."
                        }
                        className="w-full rounded-2xl border border-red-200 bg-white p-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notas internas */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    <MessageSquareText className="size-3.5 text-blue-700" />
                    <span>
                      Notas Internas de Auditoría (Solo administradores)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="Observaciones de verificación SUNAT, referencias comerciales o llamadas..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>

                {modalError && (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs font-bold text-red-900">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {buildWhatsAppHref(manageTarget) && (
                      <a
                        href={buildWhatsAppHref(manageTarget)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-[#25D366] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:brightness-105"
                      >
                        <SiWhatsapp className="size-4" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <Link
                      href={`/admin/solicitudes/${manageTarget.id}`}
                      className="text-xs font-extrabold text-blue-700 hover:underline"
                    >
                      Abrir vista completa →
                    </Link>
                  </div>

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
                      onClick={handleRequestConfirm}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                    >
                      <ShieldCheck className="size-4" />
                      <span>Aplicar Dictamen</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL MODERNO DE CONFIRMACIÓN ANTES DE GUARDAR DICTAMEN B2B */}
      <AnimatePresence>
        {confirmOpen && manageTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                    draftStatus === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : draftStatus === "under_review"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-[#DC2626]"
                  }`}
                >
                  {draftStatus === "rejected" || draftStatus === "suspended" ? (
                    <ShieldAlert className="size-6" />
                  ) : (
                    <ShieldCheck className="size-6" />
                  )}
                </span>
                <div>
                  <h3 className="font-sans text-lg font-black text-slate-900">
                    ¿Confirmar Dictamen B2B?
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    RUC {manageTarget.taxId} · Expediente #{manageTarget.id}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                Estás a punto de{" "}
                <strong className="font-black text-slate-900">
                  {selectedResolutionMeta?.confirmVerb ?? draftStatus}
                </strong>{" "}
                para{" "}
                <strong className="font-extrabold text-[#DC2626]">
                  {manageTarget.legalName}
                </strong>
                .
              </p>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                {draftStatus === "approved"
                  ? "La cuenta pasará a rol business_approved, habilitará precios mayoristas y enviará correo de bienvenida."
                  : draftStatus === "rejected"
                    ? "La solicitud quedará rechazada, el rol se mantendrá minorista y se notificará el motivo por correo."
                    : draftStatus === "suspended"
                      ? "Los privilegios mayoristas serán revocados inmediatamente y se notificará a la empresa."
                      : "El expediente quedará marcado en evaluación comercial para el equipo."}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isPending}
                  onClick={executeReview}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md disabled:opacity-50 ${
                    draftStatus === "approved"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_4px_0_#065F46]"
                      : draftStatus === "under_review"
                        ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] shadow-[0_4px_0_#1E3A8A]"
                        : "bg-gradient-to-r from-[#991B1B] to-[#DC2626] shadow-[0_4px_0_#7F1D1D]"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  <span>Sí, Confirmar</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
