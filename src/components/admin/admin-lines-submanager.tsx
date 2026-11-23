"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Edit3,
  Eye,
  FolderTree,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  Power,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AdminImageUploadSlot } from "./admin-image-upload-slot";
import type { HomeLineItem } from "@/server/queries/lookbook";
import {
  deleteHomeLineAction,
  saveHomeLineAction,
  toggleHomeLineStatusAction,
} from "@/server/actions/lookbook";
import type { HeroProductOption } from "./admin-hero-submanager";

export interface LineCategoryOption {
  id: number;
  name: string;
  slug: string;
  audience: string | null;
  activeProductsCount: number;
}

interface AdminLinesSubmanagerProps {
  lines: HomeLineItem[];
  categories: LineCategoryOption[];
  products: HeroProductOption[];
  modalOpen: boolean;
  editingLine: HomeLineItem | null;
  onEditLine: (line: HomeLineItem) => void;
  onCloseModal: () => void;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}

const INPUT_CLASS =
  "mt-1 h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10";

const LABEL_CLASS =
  "block text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-600";

function HomeLineModalForm({
  editingLine,
  nextSortOrder,
  categories,
  products,
  onClose,
  onFeedback,
}: {
  editingLine: HomeLineItem | null;
  nextSortOrder: number;
  categories: LineCategoryOption[];
  products: HeroProductOption[];
  onClose: () => void;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultCatHref = categories[0]
    ? `/catalogo/${categories[0].slug}`
    : "/catalogo";

  const [title, setTitle] = useState(editingLine?.title ?? "");
  const [subtitle, setSubtitle] = useState(editingLine?.subtitle ?? "");
  const [badge, setBadge] = useState(editingLine?.badge ?? "Línea 2026");
  const [imageUrl, setImageUrl] = useState(editingLine?.imageUrl ?? "");
  const [hoverImageUrl, setHoverImageUrl] = useState(
    editingLine?.hoverImageUrl ?? "",
  );
  const [linkHref, setLinkHref] = useState(
    editingLine?.linkHref ?? defaultCatHref,
  );
  const [accent, setAccent] = useState<"blue" | "red">(
    editingLine?.accent ?? "blue",
  );
  const [sortOrder, setSortOrder] = useState(
    String(editingLine?.sortOrder ?? nextSortOrder),
  );
  const [isActive, setIsActive] = useState(editingLine?.isActive ?? true);

  const handleLinkChange = (newHref: string) => {
    setLinkHref(newHref);

    if (!editingLine) {
      const catMatch = categories.find(
        (c) =>
          `/catalogo/${c.slug}` === newHref ||
          `/catalogo/${c.slug}?audiencia=hombre` === newHref ||
          `/catalogo/${c.slug}?audiencia=mujer` === newHref,
      );
      if (catMatch) {
        if (!title.trim()) setTitle(catMatch.name);
        return;
      }

      const prodMatch = products.find((p) => `/producto/${p.slug}` === newHref);
      if (prodMatch) {
        if (!title.trim()) setTitle(prodMatch.name);
        if (!subtitle.trim() && prodMatch.fitText) setSubtitle(prodMatch.fitText);
        if (!imageUrl.trim()) setImageUrl(prodMatch.imageUrl);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFeedback(null);

    startTransition(async () => {
      const res = await saveHomeLineAction({
        id: editingLine?.id ?? null,
        title,
        subtitle,
        badge,
        imageUrl,
        hoverImageUrl: hoverImageUrl || null,
        linkHref,
        accent,
        sortOrder: Number(sortOrder) || 1,
        isActive,
      });

      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo guardar la línea.",
        });
        return;
      }

      onClose();
      onFeedback({
        type: "success",
        text: res.message ?? "Línea actualizada correctamente en portada.",
      });
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isPending && onClose()}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[93vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_-14px_rgba(15,23,42,0.55)]"
      >
        {/* Header Modal */}
        <div
          className={`shrink-0 flex items-center justify-between px-6 py-4 text-white ${
            editingLine
              ? "bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB]"
              : "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              {editingLine ? <Edit3 className="size-5" /> : <Tag className="size-5" />}
            </span>
            <div>
              <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-white/85">
                {editingLine
                  ? `EDITANDO LÍNEA #${editingLine.id}`
                  : "NUEVA TARJETA EN ¡EXPLORA NUESTRAS LÍNEAS!"}
              </p>
              <h2 className="text-lg font-black">
                {editingLine
                  ? "Editar Línea y Destino del Catálogo"
                  : "Crear Línea y Conectar al Catálogo"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-2xl bg-white/15 p-2 text-white hover:bg-white/25"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div className="grid gap-5 md:grid-cols-12">
              {/* Fotos 1 y 2 */}
              <div className="md:col-span-5 space-y-3">
                <AdminImageUploadSlot
                  title="Foto 1: Modelo Principal *"
                  subtitle="Visible en la tarjeta (celular o PC)"
                  required
                  compact
                  valueUrl={imageUrl || null}
                  altText={title || "Foto principal línea"}
                  onUploaded={(url) => setImageUrl(url)}
                  onRemove={() => setImageUrl("")}
                />
                <AdminImageUploadSlot
                  title="Foto 2: Al Pasar el Mouse (Opcional)"
                  subtitle="Acercamiento de prenda para efecto hover"
                  compact
                  valueUrl={hoverImageUrl || null}
                  altText={title || "Foto hover línea"}
                  onUploaded={(url) => setHoverImageUrl(url)}
                  onRemove={() => setHoverImageUrl("")}
                />
              </div>

              {/* Configuración de Categoría / Destino y Textos */}
              <div className="md:col-span-7 space-y-4">
                <div className="rounded-2xl border-2 border-blue-200/80 bg-blue-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-950">
                    <FolderTree className="size-4 text-[#1E40AF]" />
                    <label htmlFor="line-href" className={LABEL_CLASS}>
                      ¿A qué Categoría o Producto lleva al tocar &ldquo;Ver Prendas →&rdquo;? *
                    </label>
                  </div>
                  <select
                    id="line-href"
                    value={linkHref}
                    onChange={(e) => handleLinkChange(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <optgroup label="Categorías Reales del Catálogo (Línea Hombre / General)">
                      {categories.map((cat) => (
                        <option
                          key={`cat-m-${cat.id}`}
                          value={`/catalogo/${cat.slug}?audiencia=hombre`}
                        >
                          Categoría: {cat.name} (Hombre · {cat.activeProductsCount} prendas)
                        </option>
                      ))}
                      {categories.map((cat) => (
                        <option
                          key={`cat-all-${cat.id}`}
                          value={`/catalogo/${cat.slug}`}
                        >
                          Categoría: {cat.name} (Todo género · {cat.activeProductsCount} prendas)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Vistas Generales y Ofertas">
                      <option value="/catalogo">Catálogo Completo</option>
                      <option value="/catalogo?audiencia=hombre">
                        Todo Hombre
                      </option>
                      <option value="/catalogo?oferta=1">
                        Prendas en Oferta 3x2 / -50%
                      </option>
                      <option value="/mayorista">Canal Mayorista B2B</option>
                    </optgroup>
                    <optgroup label="Productos Específicos del Catálogo">
                      {products.map((p) => (
                        <option key={`prod-${p.id}`} value={`/producto/${p.slug}`}>
                          Producto: {p.name}
                          {p.retailPriceText ? ` (${p.retailPriceText})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="font-mono text-[0.66rem] font-bold text-[#1E40AF]">
                    Destino activo: {linkHref}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="line-title" className={LABEL_CLASS}>
                      Nombre de la Línea *
                    </label>
                    <input
                      id="line-title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Pantalones Drill"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="line-badge" className={LABEL_CLASS}>
                      Etiqueta Superior
                    </label>
                    <input
                      id="line-badge"
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="Ej: Línea Drill"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="line-sub" className={LABEL_CLASS}>
                    Subtítulo / Modelos Destacados *
                  </label>
                  <input
                    id="line-sub"
                    type="text"
                    required
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ej: King 767 · Skinny Fit"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className={LABEL_CLASS}>Color de Tarjeta</span>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccent("blue")}
                        className={`rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition ${
                          accent === "blue"
                            ? "border-[#1E40AF] bg-blue-50 text-[#1E40AF]"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        Azul Eléctrico
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccent("red")}
                        className={`rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition ${
                          accent === "red"
                            ? "border-[#DC2626] bg-red-50 text-[#991B1B]"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        Rojo Crimson
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="line-order" className={LABEL_CLASS}>
                      Orden
                    </label>
                    <input
                      id="line-order"
                      type="number"
                      min="0"
                      max="999"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className={`${INPUT_CLASS} font-mono`}
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-3.5">
                  <span className="text-xs font-extrabold text-emerald-950">
                    Visible inmediatamente en ¡Explora Nuestras Líneas!
                  </span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4.5 rounded accent-emerald-600"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>{editingLine ? "Guardar Línea" : "Publicar Línea"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminLinesSubmanager({
  lines,
  categories,
  products,
  modalOpen,
  editingLine,
  onEditLine,
  onCloseModal,
  onFeedback,
}: AdminLinesSubmanagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "paused">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [toggleTarget, setToggleTarget] = useState<HomeLineItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeLineItem | null>(null);

  const activeCount = useMemo(
    () => lines.filter((l) => l.isActive).length,
    [lines],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lines.filter((l) => {
      if (filterTab === "active" && !l.isActive) return false;
      if (filterTab === "paused" && l.isActive) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.subtitle.toLowerCase().includes(q) ||
        l.badge.toLowerCase().includes(q) ||
        l.linkHref.toLowerCase().includes(q)
      );
    });
  }, [lines, search, filterTab]);

  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    const target = toggleTarget;
    startTransition(async () => {
      const res = await toggleHomeLineStatusAction({
        id: target.id,
        isActive: !target.isActive,
      });
      setToggleTarget(null);
      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo cambiar el estado.",
        });
        return;
      }
      onFeedback({
        type: "success",
        text: res.message ?? "Estado actualizado.",
      });
      router.refresh();
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const res = await deleteHomeLineAction({ id: target.id });
      setDeleteTarget(null);
      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo eliminar la línea.",
        });
        return;
      }
      onFeedback({
        type: "success",
        text: res.message ?? "Línea eliminada.",
      });
      router.refresh();
    });
  };

  return (
    <>
      {/* KPIs Líneas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            filterTab === "all"
              ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
              : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-600">
              Total Líneas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <ImageIcon className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
            {lines.length}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            En ¡Explora Nuestras Líneas!
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilterTab((prev) => (prev === "active" ? "paused" : "active"))
          }
          className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
            filterTab !== "all"
              ? "border-emerald-500 ring-2 ring-emerald-400/25"
              : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Visibles en Carrusel
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Sparkles className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
            {activeCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {lines.length - activeCount} pausadas · Clic para alternar
          </p>
        </button>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#1E40AF]">
              Categorías Conectadas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF]">
              <FolderTree className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
            {categories.length}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Disponibles para enlazar al botón &ldquo;Ver Prendas&rdquo;
          </p>
        </div>
      </section>

      {/* Barra de Búsqueda */}
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.12)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar línea por título o categoría destino..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-900 focus:border-[#DC2626] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "Todas" },
              { id: "active", label: "Visibles" },
              { id: "paused", label: "Pausadas" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterTab(t.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                filterTab === t.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                viewMode === "cards"
                  ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-sm"
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
                  ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="size-3.5" />
              <span>Tabla</span>
            </button>
          </div>
        </div>
      </section>

      {/* Listado */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ImageIcon className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-base font-black text-slate-800">
            No se encontraron líneas con ese filtro
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((line) => (
            <article
              key={line.id}
              className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_36px_-18px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-400"
            >
              <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={line.imageUrl}
                  alt={line.title}
                  className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[0.58rem] font-black uppercase text-white shadow-md ${
                    line.accent === "blue"
                      ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]"
                      : "bg-gradient-to-r from-[#991B1B] to-[#DC2626]"
                  }`}
                >
                  {line.badge}
                </span>

                {line.hoverImageUrl && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2.5 py-1 font-mono text-[0.58rem] font-bold text-white backdrop-blur-md">
                    <Eye className="size-3" />
                    Hover activo
                  </span>
                )}

                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.62rem] font-extrabold uppercase backdrop-blur-md ${
                    line.isActive
                      ? "bg-emerald-500/90 text-white"
                      : "bg-slate-800/85 text-white"
                  }`}
                >
                  {line.isActive ? "Visible" : "Pausado"}
                </span>
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black uppercase text-slate-900">
                      {line.title}
                    </h3>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {line.subtitle}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[0.62rem] font-black text-slate-600">
                    #{line.sortOrder}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-blue-50/70 px-2.5 py-1.5 font-mono text-[0.65rem] font-bold text-[#1E40AF]">
                  <ArrowRight className="size-3 shrink-0" />
                  <span className="truncate">{line.linkHref}</span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <button
                    type="button"
                    onClick={() => onEditLine(line)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggleTarget(line)}
                    title={line.isActive ? "Pausar" : "Mostrar"}
                    className={`flex size-9 items-center justify-center rounded-xl border-2 transition ${
                      line.isActive
                        ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    <Power className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(line)}
                    title="Eliminar"
                    className="flex size-9 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 text-[#DC2626] transition hover:bg-[#DC2626] hover:text-white"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Línea / Imagen</th>
                  <th className="px-4 py-4">Categoría o Producto Destino</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((line) => (
                  <tr key={line.id} className="hover:bg-blue-50/25">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={line.imageUrl}
                            alt={line.title}
                            className="size-full object-cover object-top"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {line.title}
                          </p>
                          <p className="text-[0.7rem] text-slate-500">
                            {line.subtitle} · #{line.sortOrder}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[0.7rem] font-bold text-[#1E40AF]">
                      {line.linkHref}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold uppercase ${
                          line.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {line.isActive ? "Visible" : "Pausado"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditLine(line)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-extrabold text-slate-700 hover:border-blue-500 hover:text-blue-700"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleTarget(line)}
                          className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-amber-400"
                        >
                          <Power className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(line)}
                          className="flex size-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Crear / Editar Línea */}
      <AnimatePresence>
        {modalOpen && (
          <HomeLineModalForm
            key={editingLine?.id ?? "new-home-line"}
            editingLine={editingLine}
            nextSortOrder={lines.length + 1}
            categories={categories}
            products={products}
            onClose={onCloseModal}
            onFeedback={onFeedback}
          />
        )}
      </AnimatePresence>

      {/* Modal Pausar / Activar */}
      <AnimatePresence>
        {toggleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setToggleTarget(null)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-6 text-white">
                <h3 className="text-lg font-black">
                  {toggleTarget.isActive
                    ? "¿Pausar esta línea de la portada?"
                    : "¿Publicar esta línea en la portada?"}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  {toggleTarget.isActive
                    ? `"${toggleTarget.title}" dejará de mostrarse en ¡Explora Nuestras Líneas!.`
                    : `"${toggleTarget.title}" volverá a aparecer en ¡Explora Nuestras Líneas!.`}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setToggleTarget(null)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleConfirmToggle}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-2 text-xs font-extrabold text-white"
                  >
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Confirmar</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Eliminar */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setDeleteTarget(null)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#991B1B] to-[#DC2626] p-6 text-white">
                <h3 className="text-lg font-black">¿Eliminar línea de portada?</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  Vas a eliminar permanentemente{" "}
                  <strong>{deleteTarget.title}</strong> de ¡Explora Nuestras
                  Líneas!.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setDeleteTarget(null)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleConfirmDelete}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#DC2626] px-5 py-2 text-xs font-extrabold text-white"
                  >
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Sí, Eliminar</span>
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
