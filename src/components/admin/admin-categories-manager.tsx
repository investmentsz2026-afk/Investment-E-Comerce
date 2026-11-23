"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  adminSaveCategoryAction,
  adminDeleteOrArchiveCategoryAction,
} from "@/server/actions/admin-commerce";
import { normalizeCommercialSlug } from "@/server/pricing/admin-validators";
import { AdminImageUploadSlot } from "./admin-image-upload-slot";
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Search,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  Package,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  CornerDownRight,
  Tag,
} from "lucide-react";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  parentName: string | null;
  audience: "mujer" | "hombre" | "unisex" | null;
  sortOrder: number;
  isActive: boolean;
  totalProductsCount: number;
  activeProductsCount: number;
  subcategoriesCount: number;
}

interface AdminCategoriesManagerProps {
  categories: CategoryItem[];
}

const INPUT_CLASS =
  "mt-1.5 h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-4 text-xs sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all duration-200 focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10";

const LABEL_CLASS =
  "block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600";

const AUDIENCE_LABELS: Record<string, { label: string; className: string }> = {
  hombre: {
    label: "Hombre",
    className: "bg-blue-50 text-blue-800 border-blue-200/80",
  },
  mujer: {
    label: "Mujer",
    className: "bg-rose-50 text-rose-800 border-rose-200/80",
  },
  unisex: {
    label: "Unisex",
    className: "bg-violet-50 text-violet-800 border-violet-200/80",
  },
};

type QuickFilter = "all" | "active" | "hidden" | "root" | "sub";

export function AdminCategoriesManager({
  categories,
}: AdminCategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Estado del formulario crear / editar
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [audience, setAudience] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>(() =>
    String(categories.length + 1),
  );
  const [isActive, setIsActive] = useState<boolean>(true);

  // Estado de exploración, filtros y vista
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modal moderno de eliminación / desactivación
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // KPIs en vivo
  const stats = useMemo(() => {
    const activeCount = categories.filter((c) => c.isActive).length;
    const hiddenCount = categories.length - activeCount;
    const rootCount = categories.filter((c) => !c.parentId).length;
    const subCount = categories.length - rootCount;
    const activeProductsSum = categories.reduce(
      (sum, c) => sum + c.activeProductsCount,
      0,
    );
    const totalProductsSum = categories.reduce(
      (sum, c) => sum + c.totalProductsCount,
      0,
    );
    return {
      total: categories.length,
      activeCount,
      hiddenCount,
      rootCount,
      subCount,
      activeProductsSum,
      totalProductsSum,
    };
  }, [categories]);

  // Filtrado en vivo de categorías
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories.filter((cat) => {
      if (quickFilter === "active" && !cat.isActive) return false;
      if (quickFilter === "hidden" && cat.isActive) return false;
      if (quickFilter === "root" && cat.parentId !== null) return false;
      if (quickFilter === "sub" && cat.parentId === null) return false;

      if (!q) return true;
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.parentName?.toLowerCase().includes(q) ?? false) ||
        (cat.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [categories, searchQuery, quickFilter]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl(null);
    setShowImageUploader(false);
    setParentId("");
    setAudience("");
    setSortOrder(String(categories.length + 1));
    setIsActive(true);
  };

  const handleSelectEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setImageUrl(cat.imageUrl ?? null);
    setShowImageUploader(Boolean(cat.imageUrl));
    setParentId(cat.parentId ? String(cat.parentId) : "");
    setAudience(cat.audience ?? "");
    setSortOrder(String(cat.sortOrder));
    setIsActive(cat.isActive);
    setFeedback(null);

    document
      .getElementById("category-editor-card")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await adminSaveCategoryAction({
        id: editingId,
        name,
        slug,
        description: description.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        parentId: parentId ? Number(parentId) : null,
        audience:
          audience === "mujer" || audience === "hombre" || audience === "unisex"
            ? audience
            : null,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });

      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "No se pudo guardar." });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Categoría guardada correctamente.",
      });
      resetForm();
      router.refresh();
    });
  };

  const handleQuickToggleActive = (cat: CategoryItem) => {
    setFeedback(null);
    setTogglingId(cat.id);
    startTransition(async () => {
      const res = await adminSaveCategoryAction({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId,
        audience: cat.audience,
        sortOrder: cat.sortOrder,
        isActive: !cat.isActive,
      });
      setTogglingId(null);
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo cambiar la visibilidad.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: !cat.isActive
          ? `"${cat.name}" ahora está visible en el catálogo público.`
          : `"${cat.name}" fue ocultada del catálogo público.`,
      });
      router.refresh();
    });
  };

  const handleConfirmDeleteOrArchive = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setFeedback(null);

    startDeleteTransition(async () => {
      const res = await adminDeleteOrArchiveCategoryAction(deleteTarget.id);
      if (!res.success) {
        setDeleteError(res.error ?? "No se pudo procesar la operación.");
        return;
      }
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      setFeedback({
        type: "success",
        text: res.message ?? "Operación completada.",
      });
      router.refresh();
    });
  };

  const previewSlug = slug || normalizeCommercialSlug(name) || "nueva-categoria";
  const willOnlyArchive =
    deleteTarget !== null &&
    (deleteTarget.totalProductsCount > 0 || deleteTarget.subcategoriesCount > 0);

  return (
    <>
      <div className="space-y-6">
        {/* ─── Tarjetas KPI Modernas ─── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Total Categorías
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white shadow-sm shadow-red-500/25">
                <FolderTree className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
              {stats.total}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {stats.rootCount} principales · {stats.subCount} subcategorías
            </p>
          </div>

          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Visibles en Catálogo
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-sm shadow-emerald-500/25">
                <Eye className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-emerald-700">
              {stats.activeCount}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Activas en la tienda online ahora mismo
            </p>
          </div>

          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Ocultas / Inactivas
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 text-white shadow-sm shadow-amber-500/25">
                <EyeOff className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-amber-700">
              {stats.hiddenCount}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              No aparecen en la navegación pública
            </p>
          </div>

          <div className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Prendas Organizadas
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-sm shadow-blue-500/25">
                <Package className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-[#1E40AF]">
              {stats.activeProductsSum}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Activas ({stats.totalProductsSum} en total registrados)
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

        {/* ─── Grid Principal: Formulario Moderno (Izquierda) + Explorador Interactivo (Derecha) ─── */}
        <div className="grid min-w-0 gap-6 lg:grid-cols-12 items-start">
          {/* ════════════════════════════════════════════════════════════════
              COLUMNA IZQUIERDA: FORMULARIO CREAR / EDITAR CATEGORÍA (SCROLL INDEPENDIENTE)
              ════════════════════════════════════════════════════════════════ */}
          <motion.section
            id="category-editor-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm lg:sticky lg:top-[5.25rem] lg:col-span-5 lg:flex lg:max-h-[calc(100vh-6.25rem)] lg:flex-col"
          >
            <div
              className={`shrink-0 flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 ${
                editingId
                  ? "bg-gradient-to-r from-blue-50/80 via-white to-white"
                  : "bg-gradient-to-r from-red-50/80 via-white to-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                    editingId
                      ? "bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] shadow-blue-500/25"
                      : "bg-gradient-to-br from-[#991B1B] to-[#DC2626] shadow-red-500/25"
                  }`}
                >
                  {editingId ? (
                    <Edit3 className="size-5" aria-hidden />
                  ) : (
                    <Plus className="size-5" aria-hidden />
                  )}
                </span>
                <div>
                  <p
                    className={`font-mono text-[0.62rem] font-extrabold uppercase tracking-widest ${
                      editingId ? "text-blue-700" : "text-[#DC2626]"
                    }`}
                  >
                    {editingId
                      ? `EDITANDO CATEGORÍA #${editingId}`
                      : "NUEVA CATEGORÍA / SUBCATEGORÍA"}
                  </p>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                    {editingId ? "Modificar Categoría" : "Registrar Categoría"}
                  </h2>
                </div>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900"
                >
                  <X className="size-3.5" aria-hidden />
                  <span>Cancelar</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 p-6 lg:overflow-y-auto">
                {/* Vista previa en vivo del chip de categoría */}
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-red-50/40 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[0.58rem] font-extrabold uppercase tracking-widest text-slate-400">
                    Vista previa en catálogo
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[0.55rem] font-black uppercase ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isActive ? "Visible" : "Oculta"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-xs">
                    <Tag className="size-3" aria-hidden />
                    <span>{name.trim() || "Nombre de Categoría"}</span>
                  </span>
                  <span className="font-mono text-[0.68rem] font-semibold text-slate-500">
                    /catalogo/{previewSlug}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="cat-name" className={LABEL_CLASS}>
                  Nombre de la Categoría *
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) {
                      setSlug(normalizeCommercialSlug(e.target.value));
                    }
                  }}
                  placeholder="Ej: Bermudas, Casacas Denim, Joggers..."
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="cat-slug" className={LABEL_CLASS}>
                  Slug URL (Único) *
                </label>
                <div className="relative mt-1.5 flex items-center">
                  <span className="pointer-events-none absolute left-3.5 font-mono text-[0.7rem] font-bold text-slate-400">
                    /catalogo/
                  </span>
                  <input
                    id="cat-slug"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(normalizeCommercialSlug(e.target.value))}
                    placeholder="bermudas-drill"
                    className="h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 pl-[5.6rem] pr-4 font-mono text-xs font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="cat-parent" className={LABEL_CLASS}>
                    Categoría Padre
                  </label>
                  <select
                    id="cat-parent"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">Categoría Principal (Raíz)</option>
                    {categories
                      .filter((c) => c.id !== editingId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cat-audience" className={LABEL_CLASS}>
                    Audiencia Principal
                  </label>
                  <select
                    id="cat-audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">Transversal (Todas)</option>
                    <option value="hombre">Hombre</option>
                    <option value="mujer">Mujer</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2 items-end">
                <div>
                  <label htmlFor="cat-sort" className={LABEL_CLASS}>
                    Orden en Catálogo
                  </label>
                  <input
                    id="cat-sort"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>

                <label
                  className={`flex h-11 cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-3.5 transition-all ${
                    isActive
                      ? "border-emerald-400 bg-emerald-50/70 text-emerald-950 shadow-2xs"
                      : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-extrabold">
                    {isActive ? (
                      <Eye className="size-4 text-emerald-600" aria-hidden />
                    ) : (
                      <EyeOff className="size-4 text-slate-400" aria-hidden />
                    )}
                    <span>{isActive ? "Visible en tienda" : "Oculta"}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded accent-emerald-600"
                  />
                </label>
              </div>

              <div>
                <label htmlFor="cat-desc" className={LABEL_CLASS}>
                  Descripción Editorial (Opcional)
                </label>
                <textarea
                  id="cat-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción breve para encabezados y SEO de esta colección..."
                  className="mt-1.5 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                />
              </div>

              {/* Imagen opcional de categoría (desde administrador de archivos) */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowImageUploader((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-extrabold text-slate-700 hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="size-3.5 text-violet-600" aria-hidden />
                    <span>
                      Imagen de Portada de Categoría{" "}
                      <span className="font-normal text-slate-400">(Opcional)</span>
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-4 text-slate-400 transition-transform ${
                      showImageUploader ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {showImageUploader && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-200/70 p-3"
                    >
                      <div className="max-w-[220px] mx-auto">
                        <AdminImageUploadSlot
                          title="Imagen de Colección"
                          subtitle="JPG · PNG · WebP"
                          compact
                          valueUrl={imageUrl}
                          altText={name || "Categoría"}
                          onUploaded={(url) => setImageUrl(url)}
                          onRemove={() => setImageUrl(null)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>

              {/* Botón de envío siempre visible al pie del formulario */}
              <div className="shrink-0 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-xs">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-flow inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_10px_24px_-6px_rgba(220,38,38,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_#7F1D1D] disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      <span>Guardando en Neon...</span>
                    </>
                  ) : editingId ? (
                    <>
                      <Save className="size-4" aria-hidden />
                      <span>Guardar Cambios de Categoría</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" aria-hidden />
                      <span>Crear Categoría</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.section>

          {/* ════════════════════════════════════════════════════════════════
              COLUMNA DERECHA: EXPLORADOR INTERACTIVO DE CATEGORÍAS (SCROLL INDEPENDIENTE)
              ════════════════════════════════════════════════════════════════ */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm lg:col-span-7 lg:flex lg:max-h-[calc(100vh-6.25rem)] lg:flex-col"
          >
            {/* Cabecera + Buscador + Switch de Vista */}
            <div className="shrink-0 space-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#DC2626]">
                    ESTRUCTURA SINCRONIZADA CON EL CATÁLOGO
                  </p>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                    Categorías Configuradas ({filteredCategories.length}
                    {filteredCategories.length !== categories.length
                      ? ` de ${categories.length}`
                      : ""}
                    )
                  </h2>
                </div>

                {/* Switch Tarjetas / Tabla */}
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
              </div>

              {/* Buscador + Filtros rápidos */}
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar categoría por nombre, slug o descripción..."
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

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: "all", label: "Todas", count: stats.total },
                      { id: "active", label: "Activas", count: stats.activeCount },
                      { id: "hidden", label: "Ocultas", count: stats.hiddenCount },
                      { id: "root", label: "Principales", count: stats.rootCount },
                      { id: "sub", label: "Subcategorías", count: stats.subCount },
                    ] as const
                  ).map((pill) => {
                    const active = quickFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setQuickFilter(pill.id)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[0.68rem] font-extrabold transition-all ${
                          active
                            ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50/40 hover:text-[#DC2626]"
                        }`}
                      >
                        <span>{pill.label}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 font-mono text-[0.58rem] font-black ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {pill.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Lista de Categorías (scroll independiente en escritorio) */}
            <div className="flex-1 p-5 sm:p-6 lg:overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
                  <FolderTree className="size-8 text-slate-300" aria-hidden />
                  <p className="text-sm font-black text-slate-700">
                    No se encontraron categorías
                  </p>
                  <p className="text-xs text-slate-500">
                    Prueba otro filtro o crea una nueva categoría desde el panel izquierdo.
                  </p>
                </div>
              ) : viewMode === "cards" ? (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {filteredCategories.map((cat) => {
                    const isEditingThis = editingId === cat.id;
                    const isToggling = togglingId === cat.id;
                    const audienceMeta = cat.audience
                      ? AUDIENCE_LABELS[cat.audience]
                      : null;

                    return (
                      <div
                        key={cat.id}
                        className={`group relative flex flex-col justify-between gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          isEditingThis
                            ? "border-[#2563EB] bg-blue-50/40 ring-4 ring-blue-500/10"
                            : cat.isActive
                              ? "border-slate-200/80 bg-white hover:border-red-200"
                              : "border-slate-200/70 bg-slate-50/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {cat.imageUrl ? (
                                <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cat.imageUrl}
                                    alt={cat.name}
                                    className="size-full object-cover"
                                  />
                                </div>
                              ) : (
                                <span
                                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-black text-sm shadow-2xs ${
                                    cat.isActive
                                      ? "bg-gradient-to-br from-red-50 to-red-100/80 text-[#DC2626] border border-red-200/70"
                                      : "bg-slate-200/70 text-slate-500"
                                  }`}
                                >
                                  {cat.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}

                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-black text-slate-900">
                                  {cat.name}
                                </h3>
                                <p className="truncate font-mono text-[0.65rem] font-semibold text-slate-500">
                                  /{cat.slug} · Orden #{cat.sortOrder}
                                </p>
                              </div>
                            </div>

                            {/* Botón 1-clic Activa / Oculta */}
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleQuickToggleActive(cat)}
                              title={
                                cat.isActive
                                  ? "Clic para ocultar del catálogo"
                                  : "Clic para activar en el catálogo"
                              }
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[0.6rem] font-black uppercase transition-all ${
                                cat.isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                              }`}
                            >
                              {isToggling ? (
                                <Loader2 className="size-3 animate-spin" aria-hidden />
                              ) : cat.isActive ? (
                                <Eye className="size-3" aria-hidden />
                              ) : (
                                <EyeOff className="size-3" aria-hidden />
                              )}
                              <span>{cat.isActive ? "Activa" : "Oculta"}</span>
                            </button>
                          </div>

                          {/* Insignias de jerarquía, audiencia y conteo de productos */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {cat.parentName ? (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-violet-200/80 bg-violet-50 px-2 py-0.5 text-[0.62rem] font-bold text-violet-800">
                                <CornerDownRight className="size-3" aria-hidden />
                                <span>Hija de {cat.parentName}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.62rem] font-bold text-slate-600">
                                <Layers className="size-3" aria-hidden />
                                <span>Principal</span>
                              </span>
                            )}

                            {audienceMeta && (
                              <span
                                className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[0.62rem] font-extrabold ${audienceMeta.className}`}
                              >
                                {audienceMeta.label}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50/70 px-2 py-0.5 font-mono text-[0.62rem] font-extrabold text-[#1E40AF]">
                              <Package className="size-3" aria-hidden />
                              <span>
                                {cat.activeProductsCount}/{cat.totalProductsCount} prendas
                              </span>
                            </span>
                          </div>

                          {cat.description && (
                            <p className="line-clamp-2 text-[0.7rem] leading-relaxed text-slate-500">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        {/* Acciones de tarjeta */}
                        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectEdit(cat)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 text-[0.68rem] font-extrabold text-slate-700 transition-all hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#1E40AF]"
                            >
                              <Edit3 className="size-3" aria-hidden />
                              <span>Editar</span>
                            </button>

                            {cat.isActive && (
                              <Link
                                href={`/catalogo/${cat.slug}`}
                                target="_blank"
                                title={`Abrir /catalogo/${cat.slug}`}
                                className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-[0.68rem] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <ExternalLink className="size-3" aria-hidden />
                                <span>Ver</span>
                              </Link>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(cat);
                            }}
                            title={
                              cat.totalProductsCount > 0 || cat.subcategoriesCount > 0
                                ? "Ocultar / desactivar categoría (tiene registros vinculados)"
                                : "Eliminar categoría vacía"
                            }
                            className="flex size-8 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50/60 text-[#DC2626] transition-all hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
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
                        <th className="py-3 pl-4 pr-3">Categoría / Slug</th>
                        <th className="py-3 pr-3">Jerarquía</th>
                        <th className="py-3 pr-3">Prendas</th>
                        <th className="py-3 pr-3">Estado</th>
                        <th className="py-3 pl-3 pr-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCategories.map((cat) => {
                        const isToggling = togglingId === cat.id;
                        return (
                          <tr
                            key={cat.id}
                            className={`transition-colors hover:bg-red-50/30 ${
                              editingId === cat.id ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <td className="py-3 pl-4 pr-3">
                              <span className="font-extrabold text-slate-900">
                                {cat.name}
                              </span>
                              <span className="block font-mono text-[0.64rem] text-slate-500">
                                /{cat.slug} · #{cat.sortOrder}
                              </span>
                            </td>

                            <td className="py-3 pr-3">
                              {cat.parentName ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[0.64rem] font-bold text-violet-800">
                                  <CornerDownRight className="size-3" aria-hidden />
                                  {cat.parentName}
                                </span>
                              ) : (
                                <span className="text-[0.68rem] font-bold text-slate-700">
                                  Principal
                                </span>
                              )}
                              {cat.audience && (
                                <span className="mt-0.5 block font-mono text-[0.6rem] font-bold uppercase text-[#DC2626]">
                                  {cat.audience}
                                </span>
                              )}
                            </td>

                            <td className="py-3 pr-3 font-mono text-[0.68rem]">
                              <span className="font-black text-[#1E40AF]">
                                {cat.activeProductsCount}
                              </span>{" "}
                              <span className="text-slate-400">
                                / {cat.totalProductsCount}
                              </span>
                            </td>

                            <td className="py-3 pr-3">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleQuickToggleActive(cat)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[0.6rem] font-black uppercase transition-colors ${
                                  cat.isActive
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                              >
                                {isToggling ? (
                                  <Loader2 className="size-3 animate-spin" aria-hidden />
                                ) : null}
                                {cat.isActive ? "Activa" : "Oculta"}
                              </button>
                            </td>

                            <td className="py-3 pl-3 pr-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSelectEdit(cat)}
                                  className="inline-flex h-8 items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-2.5 text-[0.66rem] font-extrabold text-slate-700 transition-colors hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#1E40AF]"
                                >
                                  <Edit3 className="size-3" aria-hidden />
                                  <span>Editar</span>
                                </button>

                                {cat.isActive && (
                                  <Link
                                    href={`/catalogo/${cat.slug}`}
                                    target="_blank"
                                    className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                                    title="Ver en catálogo"
                                  >
                                    <ExternalLink className="size-3.5" aria-hidden />
                                  </Link>
                                )}

                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeleteTarget(cat);
                                  }}
                                  className="flex size-8 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50/70 text-[#DC2626] transition-all hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white disabled:opacity-50"
                                  title="Eliminar o desactivar categoría"
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
      </div>

      {/* ─── Modal Moderno Animado de Confirmación de Eliminación / Desactivación ─── */}
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
              aria-labelledby="delete-category-title"
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
                        {willOnlyArchive
                          ? "PROTECCIÓN DE CATÁLOGO"
                          : "ELIMINACIÓN PERMANENTE"}
                      </p>
                      <h3
                        id="delete-category-title"
                        className="text-lg font-black leading-tight"
                      >
                        {willOnlyArchive
                          ? "¿Desactivar esta categoría?"
                          : "¿Eliminar esta categoría?"}
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
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 font-black text-xs text-[#DC2626]">
                    {deleteTarget.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">
                      {deleteTarget.name}
                    </p>
                    <p className="font-mono text-[0.68rem] text-slate-500">
                      /catalogo/{deleteTarget.slug} · {deleteTarget.totalProductsCount}{" "}
                      prendas · {deleteTarget.subcategoriesCount} subcategorías
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600">
                  {willOnlyArchive ? (
                    <>
                      Esta categoría tiene{" "}
                      <strong>
                        {deleteTarget.totalProductsCount} prendas y{" "}
                        {deleteTarget.subcategoriesCount} subcategorías asociadas
                      </strong>
                      . Para evitar dejar productos huérfanos, se{" "}
                      <strong>ocultará de la tienda pública</strong> conservando sus vínculos intactos.
                    </>
                  ) : (
                    <>
                      Esta categoría no tiene productos ni subcategorías vinculadas. Se{" "}
                      <strong>eliminará permanentemente</strong> de la base de datos.
                    </>
                  )}
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
                    onClick={handleConfirmDeleteOrArchive}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-3.5" aria-hidden />
                        <span>
                          {willOnlyArchive ? "Sí, Desactivar" : "Sí, Eliminar"}
                        </span>
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
