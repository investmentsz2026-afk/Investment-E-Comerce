"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SiWhatsapp } from "react-icons/si";
import { adminSetCustomerActiveStateAction } from "@/server/actions/admin-commerce";
import {
  reviewApplicationAction,
  type AllowedReviewStatus,
} from "@/server/actions/admin";
import { formatPrice } from "@/lib/format";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Ban,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  Mail,
  Package,
  Phone,
  Power,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";

export interface AdminCustomerItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerifiedAtIso: string | null;
  createdAtIso: string;
  company: {
    id: number;
    legalName: string;
    tradeName: string;
    taxId: string;
    status: string;
  } | null;
  ordersCount: number;
  confirmedOrdersCount: number;
  totalSpentAmount: number;
  quotesCount: number;
}

interface AdminCustomersManagerProps {
  customers: AdminCustomerItem[];
  initialSearch?: string;
  initialRole?: string;
  initialStatus?: string;
}

type RoleFilter =
  | "all"
  | "customer"
  | "business_approved"
  | "business_pending"
  | "admin";
type StatusFilter = "all" | "active" | "suspended";
type ViewMode = "cards" | "table";

const ITEMS_PER_PAGE = 10;

function getInitials(firstName: string, lastName: string, email: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  if (f || l) return `${f}${l}`.toUpperCase();
  return email.trim().slice(0, 2).toUpperCase() || "CL";
}

function buildWaHref(phone: string | null, firstName: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.startsWith("51") ? digits : `51${digits}`;
  const greeting = `Hola ${firstName.trim() || "Cliente"}, te escribimos de American Colt JEANS™ para brindarte atención personalizada.`;
  return `https://wa.me/${full}?text=${encodeURIComponent(greeting)}`;
}

function getRoleMeta(role: string) {
  switch (role) {
    case "business_approved":
      return {
        label: "Mayorista B2B Aprobado",
        shortLabel: "Mayorista B2B",
        badgeClass:
          "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900",
        avatarGradient: "from-[#1E3A8A] via-[#2563EB] to-[#3B82F6]",
        topBarClass: "from-[#1E3A8A] via-[#2563EB] to-[#38BDF8]",
      };
    case "business_pending":
      return {
        label: "B2B en Evaluación",
        shortLabel: "En Evaluación",
        badgeClass: "border-amber-300 bg-amber-50 text-amber-900",
        avatarGradient: "from-amber-500 to-orange-600",
        topBarClass: "from-amber-400 via-amber-500 to-orange-500",
      };
    case "admin":
      return {
        label: "Administrador",
        shortLabel: "Admin",
        badgeClass: "border-red-300 bg-red-50 text-[#991B1B]",
        avatarGradient: "from-[#991B1B] via-[#DC2626] to-[#EF233C]",
        topBarClass: "from-[#991B1B] via-[#DC2626] to-[#EF233C]",
      };
    default:
      return {
        label: "Cliente Minorista B2C",
        shortLabel: "Minorista B2C",
        badgeClass: "border-slate-200 bg-slate-100 text-slate-800",
        avatarGradient: "from-slate-700 to-slate-900",
        topBarClass: "from-slate-500 via-slate-700 to-slate-900",
      };
  }
}

export function AdminCustomersManager({
  customers,
  initialSearch = "",
  initialRole = "all",
  initialStatus = "all",
}: AdminCustomersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(() => {
    if (
      initialRole === "customer" ||
      initialRole === "business_approved" ||
      initialRole === "business_pending" ||
      initialRole === "admin"
    ) {
      return initialRole;
    }
    return "all";
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    if (initialStatus === "active" || initialStatus === "suspended") {
      return initialStatus;
    }
    return "all";
  });
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de UI y Modales
  const [quickViewCustomer, setQuickViewCustomer] =
    useState<AdminCustomerItem | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<AdminCustomerItem | null>(null);
  const [b2bConfirmTarget, setB2bConfirmTarget] = useState<{
    customer: AdminCustomerItem;
    decision: Extract<AllowedReviewStatus, "approved" | "suspended">;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const kpis = useMemo(() => {
    let b2c = 0;
    let b2bApproved = 0;
    let b2bPending = 0;
    let admins = 0;
    let activeCount = 0;
    let suspendedCount = 0;
    let totalRevenue = 0;
    let totalOrders = 0;

    for (const c of customers) {
      if (c.role === "business_approved") b2bApproved++;
      else if (c.role === "business_pending") b2bPending++;
      else if (c.role === "admin") admins++;
      else b2c++;

      if (c.isActive) activeCount++;
      else suspendedCount++;

      totalRevenue += c.totalSpentAmount;
      totalOrders += c.confirmedOrdersCount;
    }

    return {
      total: customers.length,
      b2c,
      b2bApproved,
      b2bPending,
      admins,
      activeCount,
      suspendedCount,
      totalRevenue,
      totalOrders,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (roleFilter !== "all" && c.role !== roleFilter) return false;
      if (statusFilter === "active" && !c.isActive) return false;
      if (statusFilter === "suspended" && c.isActive) return false;

      if (!q) return true;
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.company?.taxId ?? "").toLowerCase().includes(q) ||
        (c.company?.legalName ?? "").toLowerCase().includes(q) ||
        (c.company?.tradeName ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  const startIndex = filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(safePage * ITEMS_PER_PAGE, filtered.length);

  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push("ellipsis");
    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(totalPages - 1, safePage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch {
      // Sin acceso al portapapeles
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Nombre",
      "Apellido",
      "Email",
      "Telefono",
      "Rol Comercial",
      "Estado Cuenta",
      "Empresa",
      "RUC",
      "Estado RUC",
      "Pedidos Confirmados",
      "Total Pedidos",
      "Compras Confirmadas (PEN)",
      "Cotizaciones B2B",
      "Fecha Registro",
    ];

    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const rows = filtered.map((c) => [
      String(c.id),
      escapeCsv(c.firstName),
      escapeCsv(c.lastName),
      escapeCsv(c.email),
      escapeCsv(c.phone ?? ""),
      escapeCsv(getRoleMeta(c.role).label),
      c.isActive ? "Activa" : "Suspendida",
      escapeCsv(c.company ? c.company.tradeName || c.company.legalName : "Persona Natural"),
      escapeCsv(c.company?.taxId ?? ""),
      escapeCsv(c.company?.status ?? ""),
      String(c.confirmedOrdersCount),
      String(c.ordersCount),
      (c.totalSpentAmount / 100).toFixed(2),
      String(c.quotesCount),
      new Date(c.createdAtIso).toLocaleDateString("es-PE"),
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clientes-american-colt-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setFeedback({
      type: "success",
      text: `Se exportaron ${filtered.length} cuentas a formato CSV compatible con Excel.`,
    });
  };

  const openStatusConfirm = (c: AdminCustomerItem) => {
    setActionReason("");
    setStatusConfirmTarget(c);
  };

  const handleConfirmToggleAccount = () => {
    if (!statusConfirmTarget) return;
    const target = statusConfirmTarget;
    const nextActive = !target.isActive;
    const reason = actionReason.trim();

    startTransition(async () => {
      const res = await adminSetCustomerActiveStateAction({
        userId: target.id,
        isActive: nextActive,
        reason,
      });

      setStatusConfirmTarget(null);
      setActionReason("");

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo actualizar el estado de la cuenta.",
        });
        return;
      }

      if (quickViewCustomer?.id === target.id) {
        setQuickViewCustomer({ ...quickViewCustomer, isActive: nextActive });
      }

      setFeedback({
        type: "success",
        text:
          res.message ??
          (nextActive
            ? `Cuenta de ${target.firstName} ${target.lastName} reactivada correctamente.`
            : `Cuenta de ${target.firstName} ${target.lastName} suspendida y sesiones cerradas.`),
      });
      router.refresh();
    });
  };

  const handleConfirmB2bReview = () => {
    if (!b2bConfirmTarget || !b2bConfirmTarget.customer.company) return;
    const { customer, decision } = b2bConfirmTarget;
    const company = customer.company!;
    const reason = actionReason.trim();

    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId: company.id,
        newStatus: decision,
        internalNotes:
          reason ||
          `Actualización rápida desde directorio comercial de clientes (#${customer.id}).`,
        rejectionReason:
          decision === "suspended"
            ? reason || "Suspensión temporal de tarifa mayorista B2B."
            : undefined,
      });

      setB2bConfirmTarget(null);
      setActionReason("");

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo actualizar el beneficio B2B.",
        });
        return;
      }

      if (quickViewCustomer?.id === customer.id) {
        setQuickViewCustomer({
          ...quickViewCustomer,
          role: decision === "approved" ? "business_approved" : "customer",
          company: { ...company, status: decision },
        });
      }

      setFeedback({
        type: "success",
        text:
          decision === "approved"
            ? `Empresa ${company.tradeName || company.legalName} aprobada como Mayorista B2B.`
            : `Beneficio Mayorista B2B suspendido para RUC ${company.taxId}.`,
      });
      router.refresh();
    });
  };

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim().length > 0 || roleFilter !== "all" || statusFilter !== "all";

  const roleTabs: { id: RoleFilter; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: kpis.total },
    { id: "customer", label: "Minorista B2C", count: kpis.b2c },
    { id: "business_approved", label: "Mayorista B2B", count: kpis.b2bApproved },
    { id: "business_pending", label: "B2B Pendiente", count: kpis.b2bPending },
    { id: "admin", label: "Admins", count: kpis.admins },
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
              <span>Directorio Comercial 3D · B2C y Mayoristas B2B</span>
            </div>
            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              Clientes y Empresas Mayoristas
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              Supervisa cuentas registradas, verifica RUC empresariales, controla
              accesos con seguridad en sesiones y analiza compras confirmadas desde
              una vista 360° en tarjetas o tabla.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-4 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-all hover:bg-white/25"
            >
              <Download className="size-4" />
              <span>Exportar CSV ({filtered.length})</span>
            </motion.button>

            <Link
              href="/admin/solicitudes"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:bg-red-50"
            >
              <ShieldCheck className="size-4" />
              <span>Solicitudes RUC ({kpis.b2bPending})</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* TOAST DE CONFIRMACIÓN / ERROR ANIMADO */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            role="status"
            className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.2)] ${
              feedback.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                : "border-red-300 bg-red-50 text-red-950"
            }`}
          >
            <div className="flex items-center gap-3 text-sm font-bold">
              {feedback.type === "success" ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-red-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-xl p-1.5 opacity-70 transition hover:bg-black/5 hover:opacity-100"
              aria-label="Cerrar mensaje"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 TARJETAS KPI 3D INTERACTIVAS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            roleFilter === "all" && statusFilter === "all"
              ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Total Cuentas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <Users className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.total}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {kpis.activeCount} activas · {kpis.suspendedCount} suspendidas
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setRoleFilter("customer");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            roleFilter === "customer"
              ? "border-slate-700 ring-2 ring-slate-500/20"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Minoristas B2C
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.b2c}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Personas naturales registradas
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setRoleFilter("business_approved");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            roleFilter === "business_approved"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-blue-700">
              Mayoristas B2B
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Building2 className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.b2bApproved}
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            {kpis.b2bPending > 0
              ? `${kpis.b2bPending} pendientes de revisión`
              : "Empresas con tarifa preferencial"}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter((prev) => (prev === "suspended" ? "all" : "suspended"));
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "suspended"
              ? "border-amber-500 ring-2 ring-amber-400/25"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Volumen Facturado
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <BadgeCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-2xl font-black tabular-nums text-slate-900 sm:text-3xl">
            {formatPrice(kpis.totalRevenue)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {kpis.totalOrders} pedidos confirmados
          </p>
        </button>
      </section>

      {/* BARRA DE BÚSQUEDA, PILLS DE PERFIL, ESTADO Y TOGGLE TARJETAS/TABLA */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_34px_-16px_rgba(15,23,42,0.14)] sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Buscador instantáneo */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, correo, celular, RUC o razón social..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro de estado */}
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
              {(
                [
                  { id: "all", label: "Todas" },
                  { id: "active", label: "Activas" },
                  { id: "suspended", label: "Suspendidas" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.id);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                    statusFilter === opt.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Selector Tarjetas / Tabla */}
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  viewMode === "cards"
                    ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-[0_4px_12px_rgba(220,38,38,0.3)]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  viewMode === "table"
                    ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="size-3.5" />
                <span>Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Perfil Comercial */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {roleTabs.map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-extrabold transition-all ${
                    active
                      ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-[0_6px_16px_-6px_rgba(220,38,38,0.5)]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.68rem] font-black tabular-nums ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-[#DC2626]"
            >
              <X className="size-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </section>

      {/* LISTADO EN TARJETAS 3D O TABLA */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-[0_14px_30px_-16px_rgba(15,23,42,0.1)]"
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-red-50 text-[#DC2626]">
            <Users className="size-8" />
          </div>
          <h2 className="mt-4 font-sans text-xl font-black text-slate-900">
            No encontramos cuentas con ese criterio
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500">
            Prueba cambiando el término de búsqueda, el rol comercial o restablece
            los filtros activos para visualizar todo el directorio.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_6px_0_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5"
            >
              <span>Mostrar todas las cuentas</span>
            </button>
          )}
        </motion.div>
      ) : viewMode === "cards" ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {paginated.map((c, idx) => {
            const roleMeta = getRoleMeta(c.role);
            const waHref = buildWaHref(c.phone, c.firstName);
            const initials = getInitials(c.firstName, c.lastName, c.email);

            return (
              <motion.article
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2) }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_36px_-18px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-red-300/80 hover:shadow-[0_24px_44px_-18px_rgba(220,38,38,0.22)]"
              >
                {/* Franja superior 3D según rol */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${roleMeta.topBarClass}`} />

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Cabecera Avatar + Nombre + Estado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${roleMeta.avatarGradient} font-sans text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(15,23,42,0.45)]`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/clientes/${c.id}`}
                            className="truncate font-sans text-base font-black text-slate-900 transition hover:text-[#DC2626]"
                          >
                            {c.firstName} {c.lastName}
                          </Link>
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.66rem] font-extrabold text-slate-500">
                            #{c.id}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-extrabold ${roleMeta.badgeClass}`}
                          >
                            {roleMeta.label}
                          </span>
                          {c.emailVerifiedAtIso && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">
                              <BadgeCheck className="size-3" />
                              Email Verificado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider ${
                        c.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      <span
                        className={`size-2 rounded-full ${
                          c.isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                        }`}
                      />
                      {c.isActive ? "Activa" : "Suspendida"}
                    </span>
                  </div>

                  {/* Contacto directo */}
                  <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold text-slate-700 min-w-0">
                        <Mail className="size-3.5 shrink-0 text-[#DC2626]" />
                        <span className="truncate">{c.email}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.email, `email-${c.id}`)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[0.66rem] font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        title="Copiar correo"
                      >
                        {copiedKey === `email-${c.id}` ? (
                          <>
                            <Check className="size-3 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold text-slate-700">
                        <Phone className="size-3.5 shrink-0 text-blue-600" />
                        <span>{c.phone || "Sin teléfono registrado"}</span>
                      </span>
                      {waHref && (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1 text-[0.68rem] font-extrabold text-white shadow-sm transition hover:bg-[#1ebe5d]"
                        >
                          <SiWhatsapp className="size-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Empresa RUC + Actividad */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                      <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                        Empresa / RUC Vinculado
                      </span>
                      {c.company ? (
                        <div className="mt-1">
                          <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 truncate">
                            <Building2 className="size-3.5 shrink-0 text-blue-600" />
                            <span className="truncate">
                              {c.company.tradeName || c.company.legalName}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[0.7rem] font-bold text-slate-500">
                            RUC {c.company.taxId} ·{" "}
                            <span className="uppercase">{c.company.status}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Persona Natural (Sin RUC)
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                      <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                        Actividad Comercial
                      </span>
                      <p className="mt-1 text-sm font-black tabular-nums text-slate-900">
                        {formatPrice(c.totalSpentAmount)}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] font-semibold text-slate-500">
                        {c.confirmedOrdersCount}/{c.ordersCount} pedidos
                        {c.quotesCount > 0 ? ` · ${c.quotesCount} cotiz. B2B` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Footer acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickViewCustomer(c)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-800"
                      >
                        <Eye className="size-3.5" />
                        <span>Vista Rápida</span>
                      </button>

                      {c.role !== "admin" ? (
                        <button
                          type="button"
                          onClick={() => openStatusConfirm(c)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                            c.isActive
                              ? "border-red-200 bg-red-50/70 text-[#991B1B] hover:bg-red-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          <Power className="size-3.5" />
                          <span>{c.isActive ? "Suspender" : "Reactivar"}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-2 text-[0.68rem] font-bold text-slate-500">
                          <Lock className="size-3" />
                          Protegido
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-4 py-2 text-xs font-extrabold text-white shadow-[0_4px_0_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                      <span>Ficha 360°</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>
      ) : (
        /* MODO TABLA MODERNA 3D */
        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_38px_-18px_rgba(15,23,42,0.18)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Cliente / Contacto</th>
                  <th className="px-4 py-4">Empresa / RUC</th>
                  <th className="px-4 py-4">Perfil Comercial</th>
                  <th className="px-4 py-4">Actividad</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((c) => {
                  const roleMeta = getRoleMeta(c.role);
                  const waHref = buildWaHref(c.phone, c.firstName);
                  const initials = getInitials(c.firstName, c.lastName, c.email);

                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-red-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${roleMeta.avatarGradient} text-xs font-black text-white shadow-sm`}
                          >
                            {initials}
                          </div>
                          <div>
                            <Link
                              href={`/admin/clientes/${c.id}`}
                              className="font-sans text-sm font-extrabold text-slate-900 hover:text-[#DC2626]"
                            >
                              {c.firstName} {c.lastName}
                            </Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-slate-500">
                              <span>{c.email}</span>
                              {c.phone && (
                                <span className="text-slate-400">· {c.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {c.company ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-900">
                              <Building2 className="size-3.5 text-blue-600" />
                              {c.company.tradeName || c.company.legalName}
                            </span>
                            <span className="mt-0.5 block text-[0.7rem] font-semibold text-slate-500">
                              RUC: {c.company.taxId} ({c.company.status})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            Persona Natural
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-extrabold ${roleMeta.badgeClass}`}
                        >
                          {roleMeta.shortLabel}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-sans text-sm font-black tabular-nums text-slate-900">
                          {formatPrice(c.totalSpentAmount)}
                        </div>
                        <div className="text-[0.7rem] font-semibold text-slate-500">
                          {c.confirmedOrdersCount}/{c.ordersCount} pedidos
                          {c.quotesCount > 0 ? ` · ${c.quotesCount} cotiz.` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-extrabold uppercase ${
                            c.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-800"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              c.isActive ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {c.isActive ? "Activa" : "Suspendida"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {waHref && (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex size-8 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E] transition hover:bg-[#25D366] hover:text-white"
                              title="Escribir por WhatsApp"
                            >
                              <SiWhatsapp className="size-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setQuickViewCustomer(c)}
                            className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                            title="Vista Rápida"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          {c.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => openStatusConfirm(c)}
                              className={`inline-flex size-8 items-center justify-center rounded-xl border transition ${
                                c.isActive
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                              title={c.isActive ? "Suspender cuenta" : "Reactivar cuenta"}
                            >
                              <Power className="size-3.5" />
                            </button>
                          )}
                          <Link
                            href={`/admin/clientes/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3 py-1.5 text-[0.7rem] font-extrabold text-white shadow-sm transition hover:brightness-110"
                          >
                            <span>Ficha 360°</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PAGINACIÓN MODERNA (10 POR HOJA) */}
      {filtered.length > 0 && (
        <section className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_10px_28px_-14px_rgba(15,23,42,0.12)] sm:flex-row">
          <p className="text-xs font-bold text-slate-600">
            Mostrando{" "}
            <span className="font-black text-slate-900">
              {startIndex} – {endIndex}
            </span>{" "}
            de <span className="font-black text-slate-900">{filtered.length}</span>{" "}
            cuentas ({ITEMS_PER_PAGE} por página)
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
              <span>Anterior</span>
            </button>

            {pageNumbers.map((page, i) =>
              page === "ellipsis" ? (
                <span
                  key={`e-${i}`}
                  className="px-2 text-xs font-bold text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`size-9 rounded-xl text-xs font-black tabular-nums transition ${
                    page === safePage
                      ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-[0_4px_12px_rgba(220,38,38,0.35)]"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:text-[#DC2626]"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Siguiente</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* MODAL 3D: VISTA RÁPIDA DE CLIENTE */}
      <AnimatePresence>
        {quickViewCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
            onClick={() => setQuickViewCustomer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_70px_-16px_rgba(15,23,42,0.45)]"
            >
              {/* Header del Modal */}
              <div className="relative bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#DC2626] p-6 text-white">
                <button
                  type="button"
                  onClick={() => setQuickViewCustomer(null)}
                  className="absolute right-4 top-4 rounded-2xl bg-white/15 p-2 text-white backdrop-blur-md transition hover:bg-white/25"
                  aria-label="Cerrar modal"
                >
                  <X className="size-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-lg font-black backdrop-blur-md">
                    {getInitials(
                      quickViewCustomer.firstName,
                      quickViewCustomer.lastName,
                      quickViewCustomer.email,
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans text-xl font-black">
                        {quickViewCustomer.firstName} {quickViewCustomer.lastName}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase ${
                          quickViewCustomer.isActive
                            ? "bg-emerald-400/25 text-emerald-50"
                            : "bg-red-500/35 text-red-50"
                        }`}
                      >
                        {quickViewCustomer.isActive ? "Activa" : "Suspendida"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-bold text-white/85">
                      {getRoleMeta(quickViewCustomer.role).label} · ID #
                      {quickViewCustomer.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido Modal */}
              <div className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                      <Package className="size-3.5 text-[#DC2626]" />
                      Compras Confirmadas
                    </span>
                    <p className="mt-1 font-sans text-lg font-black text-slate-900">
                      {formatPrice(quickViewCustomer.totalSpentAmount)}
                    </p>
                    <p className="text-[0.7rem] font-semibold text-slate-500">
                      {quickViewCustomer.confirmedOrdersCount} de{" "}
                      {quickViewCustomer.ordersCount} pedidos
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                      <FileSpreadsheet className="size-3.5 text-blue-600" />
                      Cotizaciones B2B
                    </span>
                    <p className="mt-1 font-sans text-lg font-black text-slate-900">
                      {quickViewCustomer.quotesCount}
                    </p>
                    <p className="text-[0.7rem] font-semibold text-slate-500">
                      Solicitudes mayoristas
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                      <Calendar className="size-3.5 text-emerald-600" />
                      Registro
                    </span>
                    <p className="mt-1 font-sans text-sm font-black text-slate-900">
                      {new Date(quickViewCustomer.createdAtIso).toLocaleDateString(
                        "es-PE",
                      )}
                    </p>
                    <p className="text-[0.7rem] font-semibold text-slate-500">
                      {quickViewCustomer.emailVerifiedAtIso
                        ? "Correo verificado"
                        : "Verificación pendiente"}
                    </p>
                  </div>
                </div>

                {/* Datos de contacto + Empresa */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400">
                      Contacto Directo
                    </p>
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-800 break-all">
                      <Mail className="size-3.5 shrink-0 text-[#DC2626]" />
                      {quickViewCustomer.email}
                    </p>
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Phone className="size-3.5 shrink-0 text-blue-600" />
                      {quickViewCustomer.phone || "No registrado"}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400">
                      Empresa Vinculada (RUC)
                    </p>
                    {quickViewCustomer.company ? (
                      <>
                        <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                          <Building2 className="size-3.5 shrink-0 text-blue-600" />
                          {quickViewCustomer.company.tradeName ||
                            quickViewCustomer.company.legalName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          RUC: {quickViewCustomer.company.taxId} · Estado:{" "}
                          <span className="font-extrabold uppercase text-slate-800">
                            {quickViewCustomer.company.status}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-slate-500">
                        Cuenta minorista sin empresa B2B vinculada.
                      </p>
                    )}
                  </div>
                </div>

                {/* Botones de acción rápida en Vista Rápida */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {quickViewCustomer.role !== "admin" && (
                      <button
                        type="button"
                        onClick={() => openStatusConfirm(quickViewCustomer)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${
                          quickViewCustomer.isActive
                            ? "border-red-200 bg-red-50 text-[#991B1B] hover:bg-red-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        <Power className="size-3.5" />
                        <span>
                          {quickViewCustomer.isActive
                            ? "Suspender Acceso"
                            : "Reactivar Cuenta"}
                        </span>
                      </button>
                    )}

                    {quickViewCustomer.company &&
                      quickViewCustomer.company.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionReason("");
                            setB2bConfirmTarget({
                              customer: quickViewCustomer,
                              decision: "approved",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-800 transition hover:bg-blue-100"
                        >
                          <UserCheck className="size-3.5" />
                          <span>Aprobar B2B</span>
                        </button>
                      )}

                    {quickViewCustomer.company &&
                      quickViewCustomer.company.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionReason("");
                            setB2bConfirmTarget({
                              customer: quickViewCustomer,
                              decision: "suspended",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-extrabold text-amber-800 transition hover:bg-amber-100"
                        >
                          <Ban className="size-3.5" />
                          <span>Pausar Tarifa B2B</span>
                        </button>
                      )}
                  </div>

                  <Link
                    href={`/admin/clientes/${quickViewCustomer.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_5px_0_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5"
                  >
                    <span>Abrir Ficha 360° Completa</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN 3D: SUSPENDER / REACTIVAR CUENTA */}
      <AnimatePresence>
        {statusConfirmTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
            onClick={() => !isPending && setStatusConfirmTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_70px_-16px_rgba(15,23,42,0.5)]"
            >
              <div
                className={`p-6 text-white ${
                  statusConfirmTarget.isActive
                    ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626]"
                    : "bg-gradient-to-r from-emerald-600 to-teal-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    {statusConfirmTarget.isActive ? (
                      <UserX className="size-5" />
                    ) : (
                      <UserCheck className="size-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white/85">
                      Confirmación de Seguridad
                    </p>
                    <h3 className="font-sans text-lg font-black">
                      {statusConfirmTarget.isActive
                        ? "¿Suspender acceso de cuenta?"
                        : "¿Reactivar acceso de cuenta?"}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  {statusConfirmTarget.isActive ? (
                    <>
                      Vas a suspender la cuenta de{" "}
                      <strong className="font-black text-slate-900">
                        {statusConfirmTarget.firstName}{" "}
                        {statusConfirmTarget.lastName}
                      </strong>{" "}
                      ({statusConfirmTarget.email}). Sus sesiones activas se
                      cerrarán inmediatamente y no podrá iniciar sesión hasta que la
                      reactives.
                    </>
                  ) : (
                    <>
                      Vas a restaurar el acceso completo a la cuenta de{" "}
                      <strong className="font-black text-slate-900">
                        {statusConfirmTarget.firstName}{" "}
                        {statusConfirmTarget.lastName}
                      </strong>{" "}
                      ({statusConfirmTarget.email}).
                    </>
                  )}
                </p>

                <div>
                  <label
                    htmlFor="modal-status-reason"
                    className="block text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-500"
                  >
                    Motivo / Nota de auditoría (opcional)
                  </label>
                  <input
                    id="modal-status-reason"
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={
                      statusConfirmTarget.isActive
                        ? "Ej: Verificación de identidad pendiente..."
                        : "Ej: Documentación validada..."
                    }
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#DC2626] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStatusConfirmTarget(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleConfirmToggleAccount}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition disabled:opacity-50 ${
                      statusConfirmTarget.isActive
                        ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] hover:brightness-110"
                        : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110"
                    }`}
                  >
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <span>
                      {statusConfirmTarget.isActive
                        ? "Sí, Suspender Cuenta"
                        : "Sí, Reactivar Cuenta"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN 3D: CAMBIO RÁPIDO MAYORISTA B2B */}
      <AnimatePresence>
        {b2bConfirmTarget && b2bConfirmTarget.customer.company && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
            onClick={() => !isPending && setB2bConfirmTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_70px_-16px_rgba(15,23,42,0.5)]"
            >
              <div
                className={`p-6 text-white ${
                  b2bConfirmTarget.decision === "approved"
                    ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]"
                    : "bg-gradient-to-r from-amber-600 to-orange-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    {b2bConfirmTarget.decision === "approved" ? (
                      <ShieldCheck className="size-5" />
                    ) : (
                      <ShieldAlert className="size-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white/85">
                      Control Comercial B2B
                    </p>
                    <h3 className="font-sans text-lg font-black">
                      {b2bConfirmTarget.decision === "approved"
                        ? "¿Aprobar Empresa Mayorista?"
                        : "¿Suspender Beneficio Mayorista?"}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  Empresa:{" "}
                  <strong className="font-black text-slate-900">
                    {b2bConfirmTarget.customer.company.tradeName ||
                      b2bConfirmTarget.customer.company.legalName}
                  </strong>{" "}
                  (RUC {b2bConfirmTarget.customer.company.taxId}).{" "}
                  {b2bConfirmTarget.decision === "approved"
                    ? "El cliente pasará a ver tarifas mayoristas por volumen y podrá generar cotizaciones corporativas."
                    : "El cliente perderá acceso temporal a precios mayoristas y regresará a perfil minorista."}
                </p>

                <div>
                  <label
                    htmlFor="modal-b2b-reason"
                    className="block text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-500"
                  >
                    Nota interna o motivo
                  </label>
                  <input
                    id="modal-b2b-reason"
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Detalle para el registro de auditoría..."
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setB2bConfirmTarget(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleConfirmB2bReview}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition disabled:opacity-50 ${
                      b2bConfirmTarget.decision === "approved"
                        ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:brightness-110"
                        : "bg-gradient-to-r from-amber-600 to-orange-700 hover:brightness-110"
                    }`}
                  >
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <span>
                      {b2bConfirmTarget.decision === "approved"
                        ? "Confirmar Aprobación B2B"
                        : "Confirmar Suspensión B2B"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
