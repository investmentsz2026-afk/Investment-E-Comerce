"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SiWhatsapp } from "react-icons/si";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Download,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  Megaphone,
  PauseCircle,
  Phone,
  PlayCircle,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  deleteNewsletterSubscriberAction,
  subscribeNewsletterAction,
  toggleNewsletterSubscriberStatusAction,
} from "@/server/actions/favorites";

export interface SubscriberItem {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

interface AdminSubscriptionsManagerProps {
  subscribers: SubscriberItem[];
}

type StatusTab = "all" | "active" | "whatsapp" | "inactive";
type ViewMode = "cards" | "table";

const ITEMS_PER_PAGE = 10;

const CAMPAIGN_PRESETS = [
  {
    id: "vip-promo",
    title: "Oferta Exclusiva Club VIP",
    message:
      "Hola {nombre}, por ser parte del Club VIP American Colt JEANS™ tienes acceso anticipado a nuestras promociones 3x2 y descuentos de temporada. ¡Visítanos hoy!",
  },
  {
    id: "new-drop",
    title: "Nueva Colección Denim & Drill",
    message:
      "Hola {nombre}, acaba de llegar nuestro nuevo stock 2026 de Jeans Denim y Pantalones Drill Stretch en todas las tallas. Escríbenos para reservar tu talla favorita.",
  },
  {
    id: "b2b-restock",
    title: "Precios Especiales por Volumen",
    message:
      "Hola {nombre}, en American Colt JEANS™ contamos con precios especiales por compras por mayor desde 6 y 12 unidades con envío a todo el Perú.",
  },
] as const;

function getInitials(firstName: string, lastName: string, email: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  if (f || l) return `${f}${l}`.toUpperCase();
  return email.trim().slice(0, 2).toUpperCase() || "VIP";
}

function buildPersonalizedWaHref(
  sub: SubscriberItem,
  template: string,
): string | null {
  const digits = sub.phone.replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.startsWith("51") ? digits : `51${digits}`;
  const nombre = sub.firstName.trim() || "Cliente VIP";
  const text = template.replace(/\{nombre\}/gi, nombre);
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

export function AdminSubscriptionsManager({
  subscribers,
}: AdminSubscriptionsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Modales 3D
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubscriberItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<SubscriberItem | null>(null);

  // Plantilla de campaña VIP
  const [campaignMessage, setCampaignMessage] = useState<string>(
    CAMPAIGN_PRESETS[0].message,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Campos de nuevo suscriptor
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const kpis = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let withPhone = 0;

    for (const s of subscribers) {
      if (s.isActive) active++;
      else inactive++;
      if (s.phone.trim().length > 0) withPhone++;
    }

    const activePct =
      subscribers.length > 0
        ? Math.round((active / subscribers.length) * 100)
        : 0;

    return {
      total: subscribers.length,
      active,
      inactive,
      withPhone,
      activePct,
    };
  }, [subscribers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter((sub) => {
      if (statusFilter === "active" && !sub.isActive) return false;
      if (statusFilter === "inactive" && sub.isActive) return false;
      if (statusFilter === "whatsapp" && !sub.phone.trim()) return false;
      if (!q) return true;
      const fullName = `${sub.firstName} ${sub.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        sub.phone.toLowerCase().includes(q)
      );
    });
  }, [subscribers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  const activeEmailsList = useMemo(
    () => subscribers.filter((s) => s.isActive).map((s) => s.email),
    [subscribers],
  );

  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const confirmToggleStatus = () => {
    if (!toggleTarget) return;
    const sub = toggleTarget;
    setFeedback(null);

    startTransition(async () => {
      const res = await toggleNewsletterSubscriberStatusAction({
        id: sub.id,
        isActive: !sub.isActive,
      });
      setToggleTarget(null);
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Suscriptor ${sub.email} actualizado a ${!sub.isActive ? "ACTIVO" : "PAUSADO"}.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "err",
          text: res.error ?? "No se pudo actualizar el estado.",
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const sub = deleteTarget;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteNewsletterSubscriberAction({ id: sub.id });
      setDeleteTarget(null);
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Suscriptor ${sub.email} eliminado correctamente del Club VIP.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "err",
          text: res.error ?? "No se pudo eliminar el suscriptor.",
        });
      }
    });
  };

  const handleManualAdd = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await subscribeNewsletterAction({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Suscriptor ${email.trim()} registrado en el Club VIP con éxito.`,
        });
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
        setAddModalOpen(false);
        router.refresh();
      } else {
        setFeedback({
          type: "err",
          text: res.error ?? "Error al registrar suscriptor.",
        });
      }
    });
  };

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Nombre",
      "Apellido",
      "Celular",
      "Correo",
      "Estado",
      "Fecha Registro",
    ];
    const rows = filtered.map((s) => [
      String(s.id),
      `"${(s.firstName || "").replace(/"/g, '""')}"`,
      `"${(s.lastName || "").replace(/"/g, '""')}"`,
      `"${(s.phone || "").replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      s.isActive ? "Activo" : "Inactivo",
      new Date(s.createdAtIso).toLocaleString("es-PE"),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `club-vip-suscriptores-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: {
    id: StatusTab;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "all", label: "Todos", count: kpis.total, icon: Layers },
    { id: "active", label: "Activos", count: kpis.active, icon: UserCheck },
    {
      id: "whatsapp",
      label: "Con WhatsApp",
      count: kpis.withPhone,
      icon: Phone,
    },
    {
      id: "inactive",
      label: "Pausados",
      count: kpis.inactive,
      icon: PauseCircle,
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
              <Crown className="size-3.5 text-amber-300" />
              <span>Club VIP American Colt · Marketing y Leads 3D</span>
            </div>
            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              Suscriptores VIP y Campañas Directas
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              Administra tus clientes registrados en el Club VIP, envía
              mensajes personalizados de ofertas por WhatsApp con un clic,
              copia listas de correos y exporta tu base segmentada a Excel/CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:bg-red-50"
            >
              <UserPlus className="size-4" />
              <span>Nuevo Suscriptor</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCampaignModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-4 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-all hover:bg-white/25"
            >
              <Megaphone className="size-4 text-amber-300" />
              <span>Campaña VIP</span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* 4 TARJETAS KPI 3D */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              Total Suscriptores
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <Users className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.total}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Leads del Club VIP y manuales
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("active");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "active"
              ? "border-emerald-600 ring-2 ring-emerald-500/20"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Activos para Ofertas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <UserCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.active}
          </p>
          <p className="mt-1 text-xs font-extrabold text-emerald-700">
            {kpis.activePct}% de audiencia activa
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("whatsapp");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "whatsapp"
              ? "border-[#25D366] ring-2 ring-[#25D366]/25"
              : "border-slate-200/80 hover:border-green-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-800">
              Con WhatsApp Directo
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-green-50 text-[#25D366]">
              <SiWhatsapp className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.withPhone}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Listos para mensaje en 1 clic
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("inactive");
            setCurrentPage(1);
          }}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            statusFilter === "inactive"
              ? "border-amber-500 ring-2 ring-amber-400/25"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
              Pausados / Inactivos
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <PauseCircle className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.inactive}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Excluidos temporalmente
          </p>
        </button>
      </section>

      {/* PESTAÑAS + EXPORTACIÓN + VISTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.15)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
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
                    layoutId="subsFilterPill"
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={activeEmailsList.length === 0}
            onClick={() =>
              void handleCopyText(activeEmailsList.join(", "), "all-emails")
            }
            className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-800 hover:bg-blue-100 disabled:opacity-40"
          >
            {copiedKey === "all-emails" ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>
              {copiedKey === "all-emails"
                ? "¡Correos copiados!"
                : "Copiar Correos"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100 disabled:opacity-40"
          >
            <Download className="size-3.5 text-[#DC2626]" />
            <span>Exportar CSV</span>
          </button>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                viewMode === "cards"
                  ? "bg-white text-[#DC2626] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
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
            placeholder="Buscar suscriptor por nombre, apellido, celular WhatsApp o correo electrónico..."
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
          />
        </div>
      </div>

      {/* LISTADO: TARJETAS 3D O TABLA */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-red-50 text-[#DC2626]">
            <Mail className="size-7" />
          </div>
          <p className="mt-4 font-sans text-xl font-black text-slate-900">
            No hay suscriptores registrados con este filtro
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs font-medium text-slate-500">
            Cuando un cliente se registre en el Club VIP desde la tienda web o
            agregues uno manualmente, aparecerá aquí listo para campañas.
          </p>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D]"
          >
            <Plus className="size-4" />
            <span>Registrar Primer Suscriptor</span>
          </button>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {paginated.map((sub, idx) => {
            const fullName =
              `${sub.firstName} ${sub.lastName}`.trim() || "Suscriptor VIP";
            const initials = getInitials(
              sub.firstName,
              sub.lastName,
              sub.email,
            );
            const waHref = buildPersonalizedWaHref(sub, campaignMessage);

            return (
              <motion.article
                key={sub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.025 }}
                whileHover={{ y: -3 }}
                className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.16)] transition-all hover:border-red-300/70"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 ${
                    sub.isActive
                      ? "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
                      : "bg-slate-300"
                  }`}
                />

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl font-sans text-sm font-black text-white shadow-md ${
                        sub.isActive
                          ? "bg-gradient-to-br from-[#991B1B] to-[#DC2626]"
                          : "bg-slate-400"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-sans text-base font-black text-slate-900">
                          {fullName}
                        </h3>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.62rem] font-extrabold text-slate-600">
                          #{sub.id}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500">
                        Registro:{" "}
                        {new Date(sub.createdAtIso).toLocaleDateString(
                          "es-PE",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  {sub.isActive ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[0.68rem] font-extrabold text-emerald-800">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[0.68rem] font-extrabold text-slate-600">
                      <PauseCircle className="size-3.5" />
                      Pausado
                    </span>
                  )}
                </div>

                {/* Datos de contacto con copiar rápido */}
                <div className="mt-4 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`mailto:${sub.email}`}
                      className="flex min-w-0 items-center gap-2 font-bold text-blue-700 hover:underline"
                    >
                      <Mail className="size-4 shrink-0 text-blue-600" />
                      <span className="truncate">{sub.email}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyText(sub.email, `mail-${sub.id}`)
                      }
                      className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                      title="Copiar correo"
                    >
                      {copiedKey === `mail-${sub.id}` ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-extrabold text-slate-900">
                      <Phone className="size-4 shrink-0 text-slate-400" />
                      <span>{sub.phone || "Sin número registrado"}</span>
                    </span>
                    {sub.phone && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyText(sub.phone, `tel-${sub.id}`)
                        }
                        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                        title="Copiar teléfono"
                      >
                        {copiedKey === `tel-${sub.id}` ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-[#25D366] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition hover:-translate-y-0.5 hover:brightness-105"
                    >
                      <SiWhatsapp className="size-3.5" />
                      <span>Enviar Oferta WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      Solo correo
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setToggleTarget(sub)}
                      className={`inline-flex items-center gap-1 rounded-2xl border px-3.5 py-2 text-xs font-extrabold uppercase transition ${
                        sub.isActive
                          ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                          : "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      }`}
                    >
                      {sub.isActive ? (
                        <PauseCircle className="size-3.5" />
                      ) : (
                        <PlayCircle className="size-3.5" />
                      )}
                      <span>{sub.isActive ? "Pausar" : "Activar"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(sub)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-[#DC2626] hover:bg-red-100"
                      title="Eliminar suscriptor"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-4">Suscriptor VIP</th>
                  <th className="px-4 py-4">Celular / WhatsApp</th>
                  <th className="px-4 py-4">Correo Electrónico</th>
                  <th className="px-4 py-4">Fecha Registro</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((sub) => {
                  const fullName =
                    `${sub.firstName} ${sub.lastName}`.trim() ||
                    "Suscriptor VIP";
                  const waHref = buildPersonalizedWaHref(sub, campaignMessage);
                  return (
                    <tr
                      key={sub.id}
                      className="transition-colors hover:bg-red-50/30"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-extrabold text-slate-900">
                          {fullName}
                        </p>
                        <span className="text-xs font-semibold text-slate-400">
                          ID #{sub.id}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {sub.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {sub.phone}
                            </span>
                            {waHref && (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-0.5 text-[0.62rem] font-extrabold text-white"
                              >
                                <SiWhatsapp className="size-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            No especificado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-blue-700">
                        <a
                          href={`mailto:${sub.email}`}
                          className="hover:underline"
                        >
                          {sub.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-600">
                        {new Date(sub.createdAtIso).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4">
                        {sub.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-emerald-800">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-slate-600">
                            Pausado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setToggleTarget(sub)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase text-slate-700 hover:bg-slate-100"
                          >
                            {sub.isActive ? "Pausar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(sub)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase text-[#DC2626] hover:bg-red-100"
                          >
                            Eliminar
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
            Página {safePage} de {totalPages} · {filtered.length} suscriptores
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

      {/* MODAL 3D: REGISTRAR NUEVO SUSCRIPTOR */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 14 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                    <UserPlus className="size-3.5" />
                    Club VIP American Colt
                  </span>
                  <h2 className="mt-2 font-sans text-xl font-black text-slate-900">
                    Registrar Nuevo Suscriptor
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleManualAdd} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej: Carlos"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej: Mendoza"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Celular / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 987 654 321"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: cliente@correo.com"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    <span>Guardar Suscriptor</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL EXTRAORDINARIO: CONFIGURADOR DE CAMPAÑA Y PLANTILLAS WHATSAPP VIP */}
      <AnimatePresence>
        {campaignModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 14 }}
              className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-amber-800">
                    <Sparkles className="size-3.5" />
                    Motor de Campañas VIP
                  </span>
                  <h2 className="mt-2 font-sans text-xl font-black text-slate-900">
                    Plantilla Personalizada de WhatsApp y Correo
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    El texto que configures aquí se personalizará con{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-[#DC2626]">
                      {"{nombre}"}
                    </code>{" "}
                    al pulsar &ldquo;Enviar Oferta WhatsApp&rdquo; en cada
                    suscriptor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCampaignModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {CAMPAIGN_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCampaignMessage(preset.message)}
                      className={`rounded-2xl border px-3.5 py-2 text-xs font-extrabold transition ${
                        campaignMessage === preset.message
                          ? "border-[#DC2626] bg-red-50 text-[#991B1B]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Mensaje de Campaña *
                  </label>
                  <textarea
                    rows={4}
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={activeEmailsList.length === 0}
                    onClick={() =>
                      void handleCopyText(
                        activeEmailsList.join(", "),
                        "modal-emails",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-blue-800 hover:bg-blue-100 disabled:opacity-40"
                  >
                    <Copy className="size-3.5" />
                    <span>
                      {copiedKey === "modal-emails"
                        ? "¡Lista copiada!"
                        : `Copiar ${activeEmailsList.length} correos activos`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaignModalOpen(false)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D]"
                  >
                    <Send className="size-4" />
                    <span>Listo, Aplicar Plantilla</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMACIÓN PAUSAR / ACTIVAR */}
      <AnimatePresence>
        {toggleTarget && (
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
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  {toggleTarget.isActive ? (
                    <PauseCircle className="size-6" />
                  ) : (
                    <PlayCircle className="size-6" />
                  )}
                </span>
                <div>
                  <h3 className="font-sans text-lg font-black text-slate-900">
                    {toggleTarget.isActive
                      ? "¿Pausar Suscripción VIP?"
                      : "¿Reactivar Suscripción VIP?"}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {toggleTarget.email}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                {toggleTarget.isActive
                  ? "Este suscriptor dejará de aparecer como activo en las listas de campañas."
                  : "El suscriptor volverá a quedar activo para promociones y campañas."}
              </p>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setToggleTarget(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={confirmToggleStatus}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D]"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  <span>Sí, Confirmar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
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
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-[#DC2626]">
                  <ShieldAlert className="size-6" />
                </span>
                <div>
                  <h3 className="font-sans text-lg font-black text-slate-900">
                    ¿Eliminar Suscriptor?
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {deleteTarget.email}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Estás a punto de eliminar permanentemente a{" "}
                <strong className="font-extrabold text-slate-900">
                  {`${deleteTarget.firstName} ${deleteTarget.lastName}`.trim() ||
                    deleteTarget.email}
                </strong>{" "}
                del Club VIP.
              </p>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={confirmDelete}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D]"
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
    </div>
  );
}
