"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Expand,
  Images,
  Loader2,
  Plus,
  Power,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AdminImageUploadSlot } from "./admin-image-upload-slot";
import type { CircularGalleryItem } from "@/server/queries/lookbook";
import {
  deleteCircularGalleryItemAction,
  saveCircularGalleryItemAction,
  toggleCircularGalleryItemStatusAction,
} from "@/server/actions/lookbook";
import type { LookbookProductOption } from "./admin-lookbook-manager";

interface AdminCircularGallerySubmanagerProps {
  items: CircularGalleryItem[];
  products: LookbookProductOption[];
  modalOpen: boolean;
  editingItem: CircularGalleryItem | null;
  onCreateNew: () => void;
  onEditItem: (item: CircularGalleryItem) => void;
  onCloseModal: () => void;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}

type GalleryFilterTab = "all" | "with_second" | "single" | "active" | "paused";

const INPUT_CLASS =
  "mt-1 h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all focus:border-[#680C14] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-900/10";

const LABEL_CLASS =
  "block text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-600";

function CircularGalleryModalForm({
  editingItem,
  nextSortOrder,
  products,
  onClose,
  onFeedback,
}: {
  editingItem: CircularGalleryItem | null;
  nextSortOrder: number;
  products: LookbookProductOption[];
  onClose: () => void;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(editingItem?.title ?? "");
  const [subtitle, setSubtitle] = useState(editingItem?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(editingItem?.imageUrl ?? "");
  const [secondaryImageUrl, setSecondaryImageUrl] = useState(
    editingItem?.secondaryImageUrl ?? "",
  );
  const [sortOrder, setSortOrder] = useState(
    String(editingItem?.sortOrder ?? nextSortOrder),
  );
  const [isActive, setIsActive] = useState(editingItem?.isActive ?? true);

  const handlePickProduct = (slug: string) => {
    const found = products.find((p) => p.slug === slug);
    if (!found) return;
    if (!title.trim()) setTitle(found.name);
    if (!subtitle.trim() && found.fitText) setSubtitle(found.fitText);
    if (!imageUrl.trim() && found.imageUrl) setImageUrl(found.imageUrl);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFeedback(null);

    startTransition(async () => {
      const res = await saveCircularGalleryItemAction({
        id: editingItem?.id ?? null,
        title,
        subtitle: subtitle.trim() || null,
        imageUrl,
        secondaryImageUrl: secondaryImageUrl.trim() || null,
        sortOrder: Number(sortOrder) || 1,
        isActive,
      });

      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo guardar el elemento de la galería.",
        });
        return;
      }

      onClose();
      onFeedback({
        type: "success",
        text: res.message ?? "Galería Circular 3D actualizada correctamente.",
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
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_-14px_rgba(15,23,42,0.55)]"
      >
        {/* Cabecera Modal */}
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#090C12] via-[#45060B] to-[#680C14] px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-rose-200">
              <Sparkles className="size-3" />
              <span>GALERÍA CIRCULAR 3D · MODO EXHIBICIÓN</span>
            </span>
            <h3 className="truncate text-base font-black tracking-tight sm:text-lg">
              {editingItem
                ? `Editar Prenda: ${editingItem.title}`
                : "Agregar Prenda a la Galería Circular 3D"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
        >
          {/* Explicación clara de las 2 fotos */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
            <p className="font-bold text-slate-900">
              ¿Cómo funcionan las 2 imágenes de cada tarjeta?
            </p>
            <p className="mt-0.5 leading-relaxed text-slate-600">
              En el carrusel circular de inicio <strong>solo se muestra la Imagen Principal</strong> (sin botones de venta ni enlaces). Cuando el visitante toca una tarjeta para hacer <strong>zoom en el cuadro 3D</strong>, si subiste una <strong>Segunda Imagen Opcional</strong> se activarán automáticamente las flechas laterales (<code className="font-mono">‹ ›</code>) para pasar a ver esa segunda foto.
            </p>
          </div>

          {/* Autocompletar rápido opcional desde productos */}
          {!editingItem && products.length > 0 && (
            <div>
              <label className={LABEL_CLASS}>
                Autocompletar nombre/foto desde un producto existente (opcional)
              </label>
              <select
                defaultValue=""
                onChange={(e) => handlePickProduct(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">
                  — Seleccionar producto para rellenar rápido (o sube libremente abajo) —
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name} {p.fitText ? `· ${p.fitText}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dos ranuras de imagen: Principal (Obligatoria) + Segunda Opcional (Zoom) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminImageUploadSlot
              title="1. Imagen Principal (Carrusel 3D)"
              subtitle="Obligatoria · Se muestra girando en la galería circular y como foto #1 al hacer zoom."
              required
              valueUrl={imageUrl || null}
              altText={title || "Imagen principal"}
              onUploaded={(url) => setImageUrl(url)}
              onRemove={() => setImageUrl("")}
            />

            <AdminImageUploadSlot
              title="2. Segunda Imagen Opcional (Zoom)"
              subtitle="Opcional · Activa las flechas laterales ‹ › dentro del modal 3D cuando el cliente hace zoom."
              recommended
              valueUrl={secondaryImageUrl || null}
              altText={`${title || "Prenda"} — Detalle`}
              onUploaded={(url) => setSecondaryImageUrl(url)}
              onRemove={() => setSecondaryImageUrl("")}
            />
          </div>

          {/* Título y Subtítulo */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>
                Nombre / Título de la Prenda *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Pantalón Drill King 767"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Subtítulo / Detalle en el Zoom 3D (Opcional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: Skinny Fit · Tela Drill Stretch"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Orden y Estado */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
            <div>
              <label className={LABEL_CLASS}>Orden en el Cilindro</label>
              <input
                type="number"
                min={0}
                max={999}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-4 text-xs font-extrabold text-slate-800">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded accent-[#680C14]"
              />
              <span>Visible en la Galería Circular de Inicio</span>
            </label>
          </div>

          {/* Pie de botones */}
          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#680C14] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition hover:bg-[#45060B] disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>
                  {editingItem ? "Guardar Cambios" : "Publicar en Galería 3D"}
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminCircularGallerySubmanager({
  items,
  products,
  modalOpen,
  editingItem,
  onCreateNew,
  onEditItem,
  onCloseModal,
  onFeedback,
}: AdminCircularGallerySubmanagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<GalleryFilterTab>("all");
  const [deleteTarget, setDeleteTarget] = useState<CircularGalleryItem | null>(
    null,
  );

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const withSecond = items.filter((i) =>
      Boolean(i.secondaryImageUrl?.trim()),
    ).length;
    return {
      total,
      active,
      paused: total - active,
      withSecond,
      single: total - withSecond,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const has2 = Boolean(item.secondaryImageUrl?.trim());
      if (tab === "with_second" && !has2) return false;
      if (tab === "single" && has2) return false;
      if (tab === "active" && !item.isActive) return false;
      if (tab === "paused" && item.isActive) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, tab]);

  const handleToggleStatus = (item: CircularGalleryItem) => {
    onFeedback(null);
    startTransition(async () => {
      const res = await toggleCircularGalleryItemStatusAction({
        id: item.id,
        isActive: !item.isActive,
      });
      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo actualizar el estado.",
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
      const res = await deleteCircularGalleryItemAction({ id: target.id });
      setDeleteTarget(null);
      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo eliminar la imagen.",
        });
        return;
      }
      onFeedback({
        type: "success",
        text: res.message ?? "Imagen eliminada de la galería.",
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="font-mono text-[0.62rem] font-extrabold uppercase tracking-wider text-slate-500">
            Total Prendas
          </span>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {stats.total}
          </p>
          <span className="text-[0.68rem] text-slate-500">
            En cilindro 3D
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 shadow-xs">
          <span className="font-mono text-[0.62rem] font-extrabold uppercase tracking-wider text-emerald-800">
            Activas en Inicio
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-900">
            {stats.active}
          </p>
          <span className="text-[0.68rem] text-emerald-700">
            Girando en portada
          </span>
        </div>

        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/40 p-4 shadow-xs">
          <span className="font-mono text-[0.62rem] font-extrabold uppercase tracking-wider text-blue-800">
            Con 2.ª Foto Zoom
          </span>
          <p className="mt-1 text-2xl font-black text-blue-900">
            {stats.withSecond}
          </p>
          <span className="text-[0.68rem] text-blue-700">
            Activan flechas ‹ ›
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 shadow-xs">
          <span className="font-mono text-[0.62rem] font-extrabold uppercase tracking-wider text-slate-600">
            Solo 1 Foto
          </span>
          <p className="mt-1 text-2xl font-black text-slate-800">
            {stats.single}
          </p>
          <span className="text-[0.68rem] text-slate-500">
            Zoom sin flechas
          </span>
        </div>
      </div>

      {/* Barra de filtros y búsqueda */}
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: `Todas (${stats.total})` },
              { id: "with_second", label: `Con 2 fotos (${stats.withSecond})` },
              { id: "single", label: `Solo principal (${stats.single})` },
              { id: "active", label: `Activas (${stats.active})` },
              { id: "paused", label: `Pausadas (${stats.paused})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                tab === t.id
                  ? "bg-[#0F172A] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar prenda en galería..."
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs font-semibold text-slate-900 focus:border-[#680C14] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-[#680C14] px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#45060B]"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Agregar Imagen</span>
          </button>
        </div>
      </div>

      {/* Grilla de tarjetas de la Galería Circular */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Images className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-sm font-extrabold text-slate-800">
            No hay imágenes en este filtro
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Agrega una nueva prenda con su imagen principal y su segunda foto opcional para el zoom 3D.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const hasSecond = Boolean(item.secondaryImageUrl?.trim());
            return (
              <article
                key={item.id}
                className={`group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-xs transition-all hover:shadow-md ${
                  item.isActive
                    ? "border-slate-200/90"
                    : "border-slate-200/70 opacity-70"
                }`}
              >
                {/* Vista previa principal + miniatura de la 2.ª foto opcional */}
                <div className="relative aspect-square w-full overflow-hidden bg-[#0B101B]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    unoptimized={item.imageUrl.startsWith("/api/media/")}
                    sizes="(min-width: 1280px) 24vw, (min-width: 640px) 45vw, 95vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Orden y Estado */}
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                    <span className="rounded-full bg-black/70 px-2.5 py-0.5 font-mono text-[0.62rem] font-extrabold text-white backdrop-blur-md">
                      #{item.sortOrder}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[0.6rem] font-extrabold uppercase ${
                        item.isActive
                          ? "bg-emerald-500/95 text-white"
                          : "bg-slate-700/90 text-slate-200"
                      }`}
                    >
                      {item.isActive ? "Activa" : "Pausada"}
                    </span>
                  </div>

                  {/* Indicador de 2.ª imagen opcional */}
                  <div className="absolute right-3 top-3 z-10">
                    {hasSecond ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/95 px-2.5 py-0.5 font-mono text-[0.58rem] font-extrabold text-white shadow-sm backdrop-blur-md">
                        <ChevronLeft className="size-2.5" />
                        <span>2 Fotos</span>
                        <ChevronRight className="size-2.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-slate-200 backdrop-blur-md">
                        <Expand className="size-2.5" />
                        <span>1 Foto</span>
                      </span>
                    )}
                  </div>

                  {/* Recuadro miniatura esquina inferior derecha si existe 2.ª foto */}
                  {hasSecond && item.secondaryImageUrl && (
                    <div
                      title="2.ª imagen opcional configurada para el zoom 3D"
                      className="absolute bottom-3 right-3 z-10 size-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-lg"
                    >
                      <Image
                        src={item.secondaryImageUrl}
                        alt={`${item.title} — 2da foto`}
                        fill
                        unoptimized={item.secondaryImageUrl.startsWith("/api/media/")}
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Datos y acciones */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h4 className="truncate text-sm font-black uppercase tracking-tight text-slate-900">
                      {item.title}
                    </h4>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.subtitle || "Sin subtítulo adicional"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 transition hover:border-[#680C14] hover:bg-red-50/50 hover:text-[#680C14]"
                    >
                      <Edit3 className="size-3.5" />
                      <span>{hasSecond ? "Editar Fotos" : "+ 2.ª Foto"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleStatus(item)}
                      title={item.isActive ? "Pausar de galería" : "Activar en galería"}
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Power className="size-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeleteTarget(item)}
                      title="Eliminar de galería"
                      className="flex size-9 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      <AnimatePresence>
        {modalOpen && (
          <CircularGalleryModalForm
            key={editingItem ? `edit-gallery-${editingItem.id}` : "new-gallery"}
            editingItem={editingItem}
            nextSortOrder={items.length + 1}
            products={products}
            onClose={onCloseModal}
            onFeedback={onFeedback}
          />
        )}
      </AnimatePresence>

      {/* Modal Confirmar Eliminación */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setDeleteTarget(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <h4 className="text-base font-black text-slate-900">
                ¿Eliminar prenda de la Galería Circular 3D?
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Se quitará <strong>{deleteTarget.title}</strong> (y su segunda foto opcional si la tuviera) del carrusel circular de inicio.
              </p>
              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Sí, eliminar</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
