"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  adminSavePromotionAction,
  adminTogglePromotionStatusAction,
  adminDeletePromotionAction,
} from "@/server/actions/admin-commerce";
import { AdminImageUploadSlot } from "./admin-image-upload-slot";
import {
  encodePromoDescription,
  parsePromoDescription,
  type PromoPlacement,
} from "@/lib/promo-display";
import {
  Percent,
  Plus,
  Edit3,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  Megaphone,
  LayoutTemplate,
  Sparkles,
  Trash2,
  Search,
  LayoutGrid,
  List,
  PanelTop,
  Layers,
  Tag,
  Calendar,
  AlertTriangle,
  Loader2,
  Eye,
  ShoppingBag,
  Store,
  ArrowUpRight,
  ImageIcon,
} from "lucide-react";

interface PromotionItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountPercent: number;
  categoryId: number | null;
  categoryName: string | null;
  productId: number | null;
  productName: string | null;
  channelTarget: "retail" | "wholesale";
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  liveStatus: "active_now" | "scheduled" | "expired" | "paused";
}

interface AdminPromotionsManagerProps {
  promotions: PromotionItem[];
  categories: Array<{ id: number; name: string; slug: string }>;
  products: Array<{ id: number; name: string; slug: string; isWholesale: boolean }>;
}

const INPUT_CLASS =
  "mt-1.5 h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-4 text-xs sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all duration-200 focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10";

const LABEL_CLASS =
  "block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600";

const PLACEMENT_CATEGORIES: Array<{
  id: PromoPlacement;
  title: string;
  shortTitle: string;
  subtitle: string;
  badgeClass: string;
  icon: typeof PanelTop;
}> = [
  {
    id: "top_bar",
    title: "Cintillo Superior",
    shortTitle: "Cintillo Arriba",
    subtitle: "Franja fija arriba de toda la página web.",
    badgeClass: "bg-red-50 text-[#DC2626] border-red-200",
    icon: PanelTop,
  },
  {
    id: "popup",
    title: "Popup al Cargar",
    shortTitle: "Popup Inicio",
    subtitle: "Ventana emergente 3D al abrir la tienda.",
    badgeClass: "bg-blue-50 text-[#1E40AF] border-blue-200",
    icon: Sparkles,
  },
  {
    id: "home_banner",
    title: "Banner en Portada",
    shortTitle: "Banner Inicio",
    subtitle: "Tarjetas destacadas en la página de inicio.",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    icon: LayoutTemplate,
  },
  {
    id: "catalog_banner",
    title: "Banner en Catálogo",
    shortTitle: "Banner Catálogo",
    subtitle: "Visible en /catalogo o la categoría elegida.",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Store,
  },
  {
    id: "all",
    title: "Multizona Total",
    shortTitle: "Todas las Zonas",
    subtitle: "Cintillo + Popup + Portada + Catálogo a la vez.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Layers,
  },
  {
    id: "catalog_only",
    title: "Solo Descuento",
    shortTitle: "Solo Carrito",
    subtitle: "Descuento directo sin banner ni popup.",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Tag,
  },
];

function toInputDateTimeLocal(dateVal: Date | string): string {
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AdminPromotionsManager({
  promotions,
  categories,
  products,
}: AdminPromotionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [defaultRange] = useState(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      start: toInputDateTimeLocal(start),
      end: toInputDateTimeLocal(end),
    };
  });

  // Estado del modal crear / editar
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<PromoPlacement>("top_bar");
  const [messageText, setMessageText] = useState(
    "Delivery gratis en Lima por compras mayores a S/ 199.00 · ¡Aprovecha las ofertas American Colt JEANS™!",
  );
  const [ctaHref, setCtaHref] = useState("/catalogo");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [applyToCart, setApplyToCart] = useState(false);
  const [promoImageUrl, setPromoImageUrl] = useState("/promo-3x2-oferta.jpg");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [channelTarget, setChannelTarget] = useState<"retail" | "wholesale">("retail");
  const [startsAt, setStartsAt] = useState(defaultRange.start);
  const [endsAt, setEndsAt] = useState(defaultRange.end);
  const [isActive, setIsActive] = useState(true);

  // Estado del explorador derecho
  const [searchQuery, setSearchQuery] = useState("");
  const [placementFilter, setPlacementFilter] = useState<"all_filters" | PromoPlacement>(
    "all_filters",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "active_now" | "inactive">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modal moderno de eliminación
  const [deleteTarget, setDeleteTarget] = useState<PromotionItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const parsedPromotions = useMemo(() => {
    return promotions.map((pr) => ({
      ...pr,
      meta: parsePromoDescription(pr.description, pr.code),
    }));
  }, [promotions]);

  // KPIs en vivo
  const stats = useMemo(() => {
    const activeNow = parsedPromotions.filter((p) => p.liveStatus === "active_now").length;
    const topOrPopup = parsedPromotions.filter(
      (p) => p.meta.showInTopBar || p.meta.showInPopup,
    ).length;
    const banners = parsedPromotions.filter(
      (p) => p.meta.showInHomeBanner || p.meta.showInCatalogBanner,
    ).length;
    const pausedOrOther = parsedPromotions.length - activeNow;
    return {
      total: parsedPromotions.length,
      activeNow,
      topOrPopup,
      banners,
      pausedOrOther,
    };
  }, [parsedPromotions]);

  // Contadores por categoría de ubicación
  const countByPlacement = useMemo(() => {
    const counts: Record<PromoPlacement, number> = {
      top_bar: 0,
      popup: 0,
      home_banner: 0,
      catalog_banner: 0,
      all: 0,
      catalog_only: 0,
    };
    for (const p of parsedPromotions) {
      counts[p.meta.placement] = (counts[p.meta.placement] ?? 0) + 1;
    }
    return counts;
  }, [parsedPromotions]);

  // Filtrado en vivo
  const filteredPromotions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parsedPromotions.filter((pr) => {
      if (placementFilter !== "all_filters" && pr.meta.placement !== placementFilter) {
        return false;
      }
      if (statusFilter === "active_now" && pr.liveStatus !== "active_now") {
        return false;
      }
      if (statusFilter === "inactive" && pr.liveStatus === "active_now") {
        return false;
      }
      if (!q) return true;
      return (
        pr.code.toLowerCase().includes(q) ||
        pr.name.toLowerCase().includes(q) ||
        pr.meta.cleanDescription.toLowerCase().includes(q) ||
        (pr.categoryName?.toLowerCase().includes(q) ?? false) ||
        (pr.productName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [parsedPromotions, searchQuery, placementFilter, statusFilter]);

  const resetForm = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setEditingId(null);
    setCode("");
    setName("");
    setPlacement("top_bar");
    setMessageText(
      "Delivery gratis en Lima por compras mayores a S/ 199.00 · ¡Aprovecha las ofertas American Colt JEANS™!",
    );
    setCtaHref("/catalogo");
    setDiscountPercent("20");
    setApplyToCart(false);
    setPromoImageUrl("/promo-3x2-oferta.jpg");
    setCategoryId("");
    setProductId("");
    setChannelTarget("retail");
    setStartsAt(toInputDateTimeLocal(now));
    setEndsAt(toInputDateTimeLocal(end));
    setIsActive(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setFeedback(null);
    setEditorModalOpen(true);
  };

  const handleSelectEdit = (promo: PromotionItem) => {
    const parsed = parsePromoDescription(promo.description, promo.code);
    setEditingId(promo.id);
    setCode(promo.code);
    setName(promo.name);
    setPlacement(parsed.placement);
    setMessageText(parsed.cleanDescription || promo.name);
    setCtaHref(parsed.ctaHref || "/catalogo");
    setDiscountPercent(String(promo.discountPercent));
    setApplyToCart(parsed.applyToCart);
    setPromoImageUrl(
      parsed.imageUrl || (parsed.showInPopup ? "/promo-3x2-oferta.jpg" : ""),
    );
    setCategoryId(promo.categoryId ? String(promo.categoryId) : "");
    setProductId(promo.productId ? String(promo.productId) : "");
    setChannelTarget(promo.channelTarget);
    setStartsAt(toInputDateTimeLocal(promo.startsAt));
    setEndsAt(toInputDateTimeLocal(promo.endsAt));
    setIsActive(promo.isActive);
    setFeedback(null);
    setEditorModalOpen(true);
  };

  const handleCategoryTargetChange = (newCatId: string) => {
    setCategoryId(newCatId);
    if (newCatId) {
      const cat = categories.find((c) => String(c.id) === newCatId);
      if (cat && (!ctaHref || ctaHref === "/catalogo" || ctaHref.startsWith("/catalogo/"))) {
        setCtaHref(`/catalogo/${cat.slug}`);
      }
    } else if (ctaHref.startsWith("/catalogo/")) {
      setCtaHref("/catalogo");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const encodedDescription = encodePromoDescription(
      placement,
      messageText.trim() || name.trim(),
      ctaHref,
      applyToCart,
      placement === "top_bar" || placement === "catalog_only"
        ? null
        : promoImageUrl || null,
    );

    startTransition(async () => {
      const res = await adminSavePromotionAction({
        id: editingId,
        code,
        name,
        description: encodedDescription,
        discountPercent: Number(discountPercent),
        categoryId: categoryId ? Number(categoryId) : null,
        productId: productId ? Number(productId) : null,
        channelTarget,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive,
      });

      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "No se pudo guardar la promoción." });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Promoción comercial guardada y publicada en la tienda.",
      });
      setEditorModalOpen(false);
      resetForm();
      router.refresh();
    });
  };

  const handleToggleActive = (promo: PromotionItem) => {
    setFeedback(null);
    setTogglingId(promo.id);
    startTransition(async () => {
      const res = await adminTogglePromotionStatusAction({
        promotionId: promo.id,
        isActive: !promo.isActive,
      });
      setTogglingId(null);
      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "Error al cambiar estado." });
        return;
      }
      setFeedback({ type: "success", text: res.message ?? "Estado actualizado." });
      router.refresh();
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setFeedback(null);

    startDeleteTransition(async () => {
      const res = await adminDeletePromotionAction({ promotionId: deleteTarget.id });
      if (!res.success) {
        setDeleteError(res.error ?? "No se pudo eliminar la promoción.");
        return;
      }
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      setFeedback({
        type: "success",
        text: res.message ?? "Promoción eliminada correctamente.",
      });
      router.refresh();
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* ─── 4 Tarjetas KPI Interactivas ─── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Vigentes Ahora
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-sm shadow-emerald-500/25">
                <CheckCircle2 className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-emerald-700">
              {stats.activeNow}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Mostrándose en tiempo real ({stats.total} creadas)
            </p>
          </div>

          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Cintillo / Popup
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white shadow-sm shadow-red-500/25">
                <Megaphone className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-[#DC2626]">
              {stats.topOrPopup}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Barra superior y ventana emergente
            </p>
          </div>

          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Banners Portada / Catálogo
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-sm shadow-blue-500/25">
                <LayoutTemplate className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-[#1E40AF]">
              {stats.banners}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Anuncios visuales en secciones
            </p>
          </div>

          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Pausadas / Programadas
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 text-white shadow-sm shadow-amber-500/25">
                <Calendar className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-amber-700">
              {stats.pausedOrOther}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Inactivas, futuras o vencidas
            </p>
          </div>
        </div>

        {/* ─── Alertas de Retroalimentación ─── */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              role="status"
              className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-xs font-semibold shadow-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white text-emerald-950"
                  : "border-red-200 bg-gradient-to-r from-red-50 to-white text-red-950"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0 text-[#DC2626]"
                    aria-hidden
                  />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar notificación"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Explorador Ancho Completo por Categorías de Anuncio ─── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_42px_-18px_rgba(15,23,42,0.14)]"
        >
          {/* Cabecera con buscador, botón Crear 3D, filtro por categoría y switch vista */}
          <div className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#DC2626]">
                  CAMPAÑAS Y ANUNCIOS ACTIVOS EN LA TIENDA
                </p>
                <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-900">
                  Promociones por Categoría de Ubicación ({filteredPromotions.length}
                  {filteredPromotions.length !== promotions.length
                    ? ` de ${promotions.length}`
                    : ""}
                  )
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Switch Tarjetas 3D / Tabla */}
                <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                      viewMode === "cards"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <LayoutGrid className="size-3.5" aria-hidden />
                    <span>Tarjetas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                      viewMode === "table"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <List className="size-3.5" aria-hidden />
                    <span>Tabla</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_10px_20px_-6px_rgba(220,38,38,0.45)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <Plus className="size-4" aria-hidden />
                  <span>Nueva Promoción</span>
                </button>
              </div>
            </div>

              {/* Buscador + Estado */}
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por código, título, mensaje o categoría..."
                    className="h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-white pl-10 pr-9 text-xs font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>

                <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
                  {(
                    [
                      { id: "all", label: "Todas" },
                      { id: "active_now", label: "Vigentes" },
                      { id: "inactive", label: "Pausadas" },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`rounded-xl px-2.5 py-1.5 text-[0.68rem] font-extrabold transition-colors ${
                        statusFilter === st.id
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros por Categoría de Ubicación */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlacementFilter("all_filters")}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[0.68rem] font-extrabold transition-all ${
                    placementFilter === "all_filters"
                      ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-[#DC2626]"
                  }`}
                >
                  <span>Todas las Zonas</span>
                  <span
                    className={`rounded-full px-1.5 font-mono text-[0.58rem] font-black ${
                      placementFilter === "all_filters"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {promotions.length}
                  </span>
                </button>

                {PLACEMENT_CATEGORIES.map((opt) => {
                  const active = placementFilter === opt.id;
                  const count = countByPlacement[opt.id] ?? 0;
                  return (
                    <button
                      key={`filter-${opt.id}`}
                      type="button"
                      onClick={() => setPlacementFilter(opt.id)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[0.68rem] font-extrabold transition-all ${
                        active
                          ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-[#DC2626]"
                      }`}
                    >
                      <span>{opt.shortTitle}</span>
                      <span
                        className={`rounded-full px-1.5 font-mono text-[0.58rem] font-black ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listado ancho completo */}
            <div className="p-5 sm:p-6">
              {filteredPromotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-14 text-center">
                  <Megaphone className="size-9 text-slate-300" aria-hidden />
                  <p className="text-sm font-black text-slate-700">
                    No hay promociones en esta vista
                  </p>
                  <p className="max-w-xs text-xs text-slate-500">
                    Crea un nuevo anuncio haciendo clic en el botón Nueva Promoción.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="mt-1 inline-flex h-10 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-4 text-xs font-extrabold uppercase text-white shadow-md"
                  >
                    <Plus className="size-4" aria-hidden />
                    <span>Nueva Promoción</span>
                  </button>
                </div>
              ) : viewMode === "cards" ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredPromotions.map((pr) => {
                    const placeMeta =
                      PLACEMENT_CATEGORIES.find((o) => o.id === pr.meta.placement) ??
                      PLACEMENT_CATEGORIES[4];
                    const PlaceIcon = placeMeta.icon;
                    const isEditingThis = editingId === pr.id;
                    const isToggling = togglingId === pr.id;

                    return (
                      <div
                        key={pr.id}
                        className={`group rounded-3xl border-2 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          isEditingThis
                            ? "border-[#2563EB] bg-blue-50/35 ring-4 ring-blue-500/10"
                            : pr.liveStatus === "active_now"
                              ? "border-slate-200/90 bg-white hover:border-red-200"
                              : "border-slate-200/70 bg-slate-50/80 opacity-85 hover:opacity-100"
                        }`}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.64rem] font-extrabold ${placeMeta.badgeClass}`}
                            >
                              <PlaceIcon className="size-3.5" aria-hidden />
                              <span>{placeMeta.title}</span>
                            </span>

                            <span className="rounded-full bg-slate-900 px-2.5 py-1 font-mono text-[0.62rem] font-black text-white">
                              {pr.code}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[0.6rem] font-black uppercase ${
                                pr.meta.applyToCart
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {pr.meta.applyToCart ? "Descuento en Carrito" : "Anuncio Visual"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-flow rounded-full bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3 py-1 font-mono text-xs font-black text-white shadow-xs">
                              -{pr.discountPercent}% OFF
                            </span>

                            {pr.liveStatus === "active_now" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[0.62rem] font-extrabold uppercase text-emerald-700">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Vigente
                              </span>
                            ) : pr.liveStatus === "scheduled" ? (
                              <span className="rounded-full bg-indigo-100 px-3 py-1 font-mono text-[0.62rem] font-extrabold uppercase text-indigo-800">
                                Programada
                              </span>
                            ) : pr.liveStatus === "expired" ? (
                              <span className="rounded-full bg-rose-100 px-3 py-1 font-mono text-[0.62rem] font-extrabold uppercase text-rose-800">
                                Vencida
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-200 px-3 py-1 font-mono text-[0.62rem] font-extrabold uppercase text-slate-600">
                                Pausada
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contenido principal */}
                        <div className="mt-3.5 flex items-start gap-3.5">
                          {(pr.meta.imageUrl || pr.meta.showInPopup) && (
                            <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={pr.meta.imageUrl || "/promo-3x2-oferta.jpg"}
                                alt={pr.name}
                                className="size-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <h3 className="text-base font-black text-slate-900">{pr.name}</h3>
                            {pr.meta.cleanDescription && (
                              <p className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-xs leading-relaxed text-slate-600">
                                &ldquo;{pr.meta.cleanDescription}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Pie con alcance, vigencia y botones */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                          <div className="flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="size-3.5 text-[#DC2626]" aria-hidden />
                              {pr.productName
                                ? `Prenda: ${pr.productName}`
                                : pr.categoryName
                                  ? `Categoría: ${pr.categoryName}`
                                  : "Todo el catálogo"}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Calendar className="size-3.5 text-slate-400" aria-hidden />
                              Hasta {new Date(pr.endsAt).toLocaleDateString("es-PE")}
                            </span>
                            {pr.meta.ctaHref && (
                              <Link
                                href={pr.meta.ctaHref}
                                target="_blank"
                                className="inline-flex items-center gap-0.5 font-mono text-blue-600 hover:underline"
                              >
                                <span>{pr.meta.ctaHref}</span>
                                <ArrowUpRight className="size-3" aria-hidden />
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectEdit(pr)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#1E40AF]"
                            >
                              <Edit3 className="size-3.5" aria-hidden />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleToggleActive(pr)}
                              title={pr.isActive ? "Pausar anuncio" : "Activar anuncio"}
                              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border-2 px-3 text-xs font-extrabold transition-all ${
                                pr.isActive
                                  ? "border-amber-200 bg-amber-50/70 text-amber-800 hover:border-amber-400 hover:bg-amber-100"
                                  : "border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"
                              }`}
                            >
                              {isToggling ? (
                                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Power className="size-3.5" aria-hidden />
                              )}
                              <span>{pr.isActive ? "Pausar" : "Activar"}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(pr);
                              }}
                              title={`Eliminar ${pr.name}`}
                              className="flex size-9 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50/70 text-[#DC2626] shadow-[0_2px_0_#FECACA] transition-all hover:-translate-y-0.5 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ─── Vista Tabla Moderna ─── */
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 font-mono text-[0.62rem] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="py-3 pl-4 pr-3">Código / Campaña</th>
                        <th className="py-3 pr-3">Ubicación</th>
                        <th className="py-3 pr-3">Descuento</th>
                        <th className="py-3 pr-3">Estado</th>
                        <th className="py-3 pl-3 pr-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPromotions.map((pr) => {
                        const placeMeta =
                          PLACEMENT_CATEGORIES.find((o) => o.id === pr.meta.placement) ??
                          PLACEMENT_CATEGORIES[4];
                        return (
                          <tr key={pr.id} className="hover:bg-red-50/30">
                            <td className="py-3 pl-4 pr-3 max-w-[230px]">
                              <span className="font-mono font-black text-slate-900">
                                {pr.code}
                              </span>
                              <span className="block font-bold text-slate-800">
                                {pr.name}
                              </span>
                              {pr.meta.cleanDescription && (
                                <span className="block line-clamp-1 text-[0.65rem] text-slate-500">
                                  &ldquo;{pr.meta.cleanDescription}&rdquo;
                                </span>
                              )}
                            </td>

                            <td className="py-3 pr-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-extrabold ${placeMeta.badgeClass}`}
                              >
                                {placeMeta.shortTitle}
                              </span>
                            </td>

                            <td className="py-3 pr-3 font-mono">
                              <span className="font-black text-[#DC2626]">
                                -{pr.discountPercent}% OFF
                              </span>
                              <span className="block text-[0.62rem] text-slate-500">
                                {pr.categoryName ?? "Todo el catálogo"}
                              </span>
                            </td>

                            <td className="py-3 pr-3 font-mono text-[0.62rem]">
                              {pr.liveStatus === "active_now" ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-extrabold uppercase text-emerald-800">
                                  Vigente
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-extrabold uppercase text-slate-600">
                                  Pausada
                                </span>
                              )}
                            </td>

                            <td className="py-3 pl-3 pr-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSelectEdit(pr)}
                                  className="inline-flex h-8 items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-2.5 text-[0.66rem] font-extrabold text-slate-700 hover:border-[#2563EB] hover:text-[#1E40AF]"
                                >
                                  <Edit3 className="size-3" aria-hidden />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleToggleActive(pr)}
                                  className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-700"
                                  title={pr.isActive ? "Pausar" : "Activar"}
                                >
                                  <Power className="size-3.5" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeleteTarget(pr);
                                  }}
                                  className="flex size-8 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50/70 text-[#DC2626] hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                                  title="Eliminar promoción"
                                >
                                  <Trash2 className="size-3.5" aria-hidden />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.section>
      </div>

      {/* ─── Modal 3D Amplio para Crear / Editar Promoción (sin scroll incómodo) ─── */}
      <AnimatePresence>
        {editorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setEditorModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_-14px_rgba(15,23,42,0.5)]"
            >
              {/* Header del Modal */}
              <div
                className={`shrink-0 flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 text-white ${
                  editingId
                    ? "bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6]"
                    : "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    {editingId ? (
                      <Edit3 className="size-5" aria-hidden />
                    ) : (
                      <Percent className="size-5" aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-white/85">
                      {editingId
                        ? `EDITANDO ANUNCIO #${editingId}`
                        : "NUEVA CAMPAÑA / ANUNCIO 3D"}
                    </p>
                    <h2 className="text-lg font-black tracking-tight sm:text-xl">
                      {editingId ? "Modificar Promoción" : "Crear Anuncio y Promoción"}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditorModalOpen(false)}
                  className="flex size-9 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
                  aria-label="Cerrar modal"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              {/* Formulario en 2 Columnas Amplias dentro del Modal */}
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  <div className="grid gap-6 lg:grid-cols-12">
                    {/* Columna izquierda del modal: Zona + Datos + Imagen */}
                    <div className="space-y-5 lg:col-span-7">
                      <div className="space-y-2.5">
                        <label className={LABEL_CLASS}>
                          1. ¿En qué zona de la web debe aparecer este anuncio? *
                        </label>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          {PLACEMENT_CATEGORIES.map((opt) => {
                            const Icon = opt.icon;
                            const selected = placement === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setPlacement(opt.id)}
                                className={`group relative flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                                  selected
                                    ? "border-[#DC2626] bg-gradient-to-br from-red-50 via-white to-red-50/40 shadow-sm ring-2 ring-red-500/15"
                                    : "border-slate-200/80 bg-slate-50/60 hover:border-red-200 hover:bg-white"
                                }`}
                              >
                                <div className="flex w-full items-center justify-between gap-2">
                                  <span
                                    className={`flex size-7 items-center justify-center rounded-xl transition-colors ${
                                      selected
                                        ? "bg-[#DC2626] text-white"
                                        : "bg-white text-slate-500 shadow-2xs"
                                    }`}
                                  >
                                    <Icon className="size-3.5" aria-hidden />
                                  </span>
                                  {selected && (
                                    <span className="rounded-full bg-[#DC2626] px-2 py-0.5 font-mono text-[0.52rem] font-black uppercase text-white">
                                      Elegido
                                    </span>
                                  )}
                                </div>
                                <span className="mt-1 text-xs font-black text-slate-900">
                                  {opt.shortTitle}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="promo-code" className={LABEL_CLASS}>
                            Código Único *
                          </label>
                          <input
                            id="promo-code"
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="EJ: COLT3X2"
                            className={`${INPUT_CLASS} font-mono uppercase`}
                          />
                        </div>

                        <div>
                          <label htmlFor="promo-pct" className={LABEL_CLASS}>
                            Descuento (%) *
                          </label>
                          <div className="relative mt-1.5">
                            <input
                              id="promo-pct"
                              type="number"
                              min="1"
                              max="90"
                              required
                              value={discountPercent}
                              onChange={(e) => setDiscountPercent(e.target.value)}
                              className="h-11 w-full rounded-2xl border-2 border-red-200/90 bg-white pl-4 pr-9 font-mono text-base font-black text-[#DC2626] focus:border-[#DC2626] focus:outline-none focus:ring-4 focus:ring-red-500/10"
                            />
                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-black text-red-400">
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="promo-name" className={LABEL_CLASS}>
                          Título Principal del Anuncio *
                        </label>
                        <input
                          id="promo-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: ¡Gran Oferta 3x2 y hasta 50% OFF!"
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label htmlFor="promo-message" className={LABEL_CLASS}>
                          Texto / Mensaje (Cintillo / Banners) *
                        </label>
                        <textarea
                          id="promo-message"
                          rows={2}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Texto del cintillo superior o banner..."
                          className="mt-1.5 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                        />
                      </div>

                      {placement !== "top_bar" && placement !== "catalog_only" && (
                        <div className="space-y-2 rounded-2xl border-2 border-blue-100 bg-blue-50/30 p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-700">
                              <ImageIcon
                                className="size-3.5 text-blue-600"
                                aria-hidden
                              />
                              <span>Imagen Central de la Promoción</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setPromoImageUrl("/promo-3x2-oferta.jpg")}
                              className="rounded-xl border border-blue-200 bg-white px-2.5 py-1 text-[0.65rem] font-extrabold text-blue-700 shadow-2xs transition hover:border-blue-400 hover:bg-blue-50"
                            >
                              Usar Arte Oficial 3x2
                            </button>
                          </div>

                          <div className="mx-auto max-w-[260px]">
                            <AdminImageUploadSlot
                              title="Banner Gráfico de Oferta"
                              subtitle="Se muestra centrado en el Popup 3D (JPG, PNG o WebP)"
                              recommended={placement === "popup" || placement === "all"}
                              compact
                              valueUrl={promoImageUrl || null}
                              altText={name.trim() || "Imagen promocional"}
                              onUploaded={(url) => setPromoImageUrl(url)}
                              onRemove={() => setPromoImageUrl("")}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Columna derecha del modal: Vista previa + Destino + Vigencia */}
                    <div className="space-y-4 lg:col-span-5">
                      <div className="rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] font-extrabold uppercase tracking-widest text-slate-500">
                            <Eye className="size-3.5 text-[#DC2626]" aria-hidden />
                            <span>Vista Previa en Vivo</span>
                          </span>
                          <span className="font-mono text-[0.58rem] font-bold text-slate-400">
                            {code || "CODIGO"}
                          </span>
                        </div>

                        {(placement === "top_bar" || placement === "all") && (
                          <div className="overflow-hidden rounded-xl border border-red-300/60 bg-gradient-to-r from-[#8E0710] via-[#C8101E] to-[#940812] px-3 py-2 text-center text-[0.66rem] font-extrabold text-white shadow-sm">
                            <span className="mr-1.5 text-amber-300">★</span>
                            <span>
                              {messageText.trim() ||
                                name.trim() ||
                                "Mensaje del cintillo superior"}
                            </span>
                            <span className="ml-2 inline-block rounded-full bg-white px-2 py-0.5 font-mono text-[0.55rem] font-black text-[#C8101E]">
                              OFERTA -{discountPercent || "20"}%
                            </span>
                          </div>
                        )}

                        {(placement === "popup" || placement === "all") && (
                          <div className="overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-[#09122B] via-[#132968] to-[#0E1E4A] p-4 text-center text-white shadow-md">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3 py-0.5 font-mono text-[0.55rem] font-black uppercase">
                              Popup 3D · HASTA -{discountPercent || "20"}% OFF
                            </span>
                            <p className="mt-2 text-xs font-black uppercase tracking-tight">
                              {name.trim() || "¡Título de tu Popup 3D!"}
                            </p>
                            {(promoImageUrl || "/promo-3x2-oferta.jpg") && (
                              <div className="mx-auto mt-2.5 w-40 overflow-hidden rounded-xl border border-white/40 shadow-md">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={promoImageUrl || "/promo-3x2-oferta.jpg"}
                                  alt={name.trim() || "Imagen de oferta popup"}
                                  className="aspect-[4/3] w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {(placement === "home_banner" ||
                          placement === "catalog_banner" ||
                          placement === "all") && (
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 py-3 text-white shadow-sm">
                            <div className="min-w-0">
                              <span className="inline-block rounded-full bg-white px-2 py-0.5 font-mono text-[0.54rem] font-black uppercase text-[#DC2626]">
                                Banner {placement === "catalog_banner" ? "Catálogo" : "Portada"} · -
                                {discountPercent || "20"}% OFF
                              </span>
                              <p className="mt-1 truncate text-xs font-black uppercase">
                                {name.trim() || "Título del Banner"}
                              </p>
                            </div>
                          </div>
                        )}

                        {placement === "catalog_only" && (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-center text-[0.68rem] font-semibold text-slate-600">
                            Descuento silencioso del{" "}
                            <strong className="text-[#DC2626]">
                              -{discountPercent || "20"}%
                            </strong>{" "}
                            directo en catálogo/carrito.
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="promo-cat" className={LABEL_CLASS}>
                            Categoría Destino
                          </label>
                          <select
                            id="promo-cat"
                            value={categoryId}
                            onChange={(e) => handleCategoryTargetChange(e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="">Todo el catálogo</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="promo-prod" className={LABEL_CLASS}>
                            Prenda Específica
                          </label>
                          <select
                            id="promo-prod"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="">Cualquier producto</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="promo-link" className={LABEL_CLASS}>
                            Enlace del Botón
                          </label>
                          <select
                            id="promo-link"
                            value={ctaHref}
                            onChange={(e) => setCtaHref(e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="/catalogo">Catálogo Completo</option>
                            <option value="/catalogo?novedades=1&oferta=50">
                              Ofertas 3x2 / Descuentos
                            </option>
                            {categories.map((c) => (
                              <option
                                key={`cta-${c.id}`}
                                value={`/catalogo/${c.slug}`}
                              >
                                Categoría: {c.name}
                              </option>
                            ))}
                            <option value="/catalogo?audiencia=hombre">
                              Colección Hombre
                            </option>
                            <option value="/catalogo?novedades=1">
                              Nuevos Ingresos
                            </option>
                            <option value="/mayorista">Venta por Mayor B2B</option>
                            <option value="/mayorista/cotizaciones">
                              Cotizador Mayorista
                            </option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="promo-channel" className={LABEL_CLASS}>
                            Canal Comercial
                          </label>
                          <select
                            id="promo-channel"
                            value={channelTarget}
                            onChange={(e) =>
                              setChannelTarget(
                                e.target.value as "retail" | "wholesale",
                              )
                            }
                            className={INPUT_CLASS}
                          >
                            <option value="retail">Minorista B2C</option>
                            <option value="wholesale">Mayoristas B2B</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="promo-start" className={LABEL_CLASS}>
                            Inicio Vigencia *
                          </label>
                          <input
                            id="promo-start"
                            type="datetime-local"
                            required
                            value={startsAt}
                            onChange={(e) => setStartsAt(e.target.value)}
                            className={`${INPUT_CLASS} font-mono text-xs`}
                          />
                        </div>

                        <div>
                          <label htmlFor="promo-end" className={LABEL_CLASS}>
                            Fin Vigencia *
                          </label>
                          <input
                            id="promo-end"
                            type="datetime-local"
                            required
                            value={endsAt}
                            onChange={(e) => setEndsAt(e.target.value)}
                            className={`${INPUT_CLASS} font-mono text-xs`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-3 transition-all ${
                            applyToCart
                              ? "border-blue-400 bg-blue-50/70 text-blue-950"
                              : "border-slate-200 bg-slate-50/70 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="size-4 shrink-0 text-blue-600" />
                            <span className="text-xs font-extrabold">
                              Aplicar descuento directo en carrito
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={applyToCart}
                            onChange={(e) => setApplyToCart(e.target.checked)}
                            className="size-4 rounded accent-blue-600"
                          />
                        </label>

                        <label
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-3 transition-all ${
                            isActive
                              ? "border-emerald-400 bg-emerald-50/70 text-emerald-950"
                              : "border-slate-200 bg-slate-50/70 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span className="text-xs font-extrabold">
                              Activa y visible en tienda
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="size-4 rounded accent-emerald-600"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer fijo del Modal */}
                <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/90 px-6 py-4">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setEditorModalOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-flow inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_10px_24px_-6px_rgba(220,38,38,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        <span>Guardando...</span>
                      </>
                    ) : editingId ? (
                      <>
                        <CheckCircle2 className="size-4" aria-hidden />
                        <span>Guardar Cambios</span>
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" aria-hidden />
                        <span>Publicar Anuncio</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal Moderno Animado de Eliminación de Promoción ─── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-promo-title"
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                      <AlertTriangle className="size-6 text-white" aria-hidden />
                    </span>
                    <div>
                      <p className="font-mono text-[0.6rem] font-extrabold uppercase tracking-widest text-red-100">
                        ELIMINACIÓN DE CAMPAÑA
                      </p>
                      <h3
                        id="delete-promo-title"
                        className="text-lg font-black leading-tight"
                      >
                        ¿Eliminar esta promoción?
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeleteTarget(null)}
                    className="rounded-xl p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
                    aria-label="Cerrar modal"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-[0.62rem] font-black text-white">
                      {deleteTarget.code}
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 font-mono text-[0.62rem] font-black text-[#DC2626]">
                      -{deleteTarget.discountPercent}% OFF
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-900">{deleteTarget.name}</p>
                </div>

                <p className="text-xs leading-relaxed text-slate-600">
                  Si eliminas esta campaña, dejará de aparecer inmediatamente en el cintillo superior, ventana emergente o banners de la tienda. Si solo deseas ocultarla temporalmente, usa <strong>Pausar</strong>.
                </p>

                {deleteError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeleteTarget(null)}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-3.5" aria-hidden />
                        <span>Sí, Eliminar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
