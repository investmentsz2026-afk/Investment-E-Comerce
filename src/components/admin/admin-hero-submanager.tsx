"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Clock,
  Edit3,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
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
import type { HeroSlideItem } from "@/server/queries/lookbook";
import {
  deleteHeroSlideAction,
  saveHeroSlideAction,
  toggleHeroSlideStatusAction,
} from "@/server/actions/lookbook";

export interface HeroProductOption {
  id: number;
  name: string;
  slug: string;
  retailPriceText: string | null;
  imageUrl: string;
  fitText: string | null;
}

interface AdminHeroSubmanagerProps {
  heroSlides: HeroSlideItem[];
  products: HeroProductOption[];
  modalOpen: boolean;
  editingSlide: HeroSlideItem | null;
  onEditSlide: (slide: HeroSlideItem) => void;
  onCloseModal: () => void;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}

const INPUT_CLASS =
  "mt-1 h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10";

const LABEL_CLASS =
  "block text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-600";

function HeroSlideModalForm({
  editingSlide,
  nextSortOrder,
  products,
  onClose,
  onFeedback,
}: {
  editingSlide: HeroSlideItem | null;
  nextSortOrder: number;
  products: HeroProductOption[];
  onClose: () => void;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const firstProduct = products[0] ?? null;

  const [badge, setBadge] = useState(
    editingSlide?.badge ?? "CATÁLOGO OFICIAL 2026",
  );
  const [promoPill, setPromoPill] = useState(
    editingSlide?.promoPill ?? "3x2 Y HASTA -50% DSCTO",
  );
  const [eyebrow, setEyebrow] = useState(
    editingSlide?.eyebrow ?? "AMERICAN COLT JEANS™ · LÍNEA HOMBRE",
  );
  const [titleLine1, setTitleLine1] = useState(
    editingSlide?.titleLine1 ?? "¡TUS PREFERIDOS EN",
  );
  const [titleHighlight, setTitleHighlight] = useState(
    editingSlide?.titleHighlight ?? "JEANS & DENIM!",
  );
  const [description, setDescription] = useState(
    editingSlide?.description ??
      "Colección masculina American Colt en Denim Ring y Drill Premium con calce anatómico.",
  );
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState(
    editingSlide?.primaryCtaLabel ?? "Ver más aquí >>",
  );
  const [primaryCtaHref, setPrimaryCtaHref] = useState(
    editingSlide?.primaryCtaHref ?? "/catalogo",
  );
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState(
    editingSlide?.secondaryCtaLabel ?? "Ofertas -50%",
  );
  const [secondaryCtaHref, setSecondaryCtaHref] = useState(
    editingSlide?.secondaryCtaHref ?? "/catalogo?oferta=1",
  );
  const [bgImageUrl, setBgImageUrl] = useState(
    editingSlide?.bgImageUrl ?? "",
  );

  // Producto enlazado en el cuadrito derecho
  const initialProductId =
    editingSlide?.productId ??
    products.find((p) => `/producto/${p.slug}` === editingSlide?.cardHref)?.id ??
    firstProduct?.id ??
    null;

  const [productId, setProductId] = useState<number | null>(initialProductId);
  const [cardTag, setCardTag] = useState(
    editingSlide?.cardTag ?? "Catálogo 2026",
  );
  const [cardTitle, setCardTitle] = useState(
    editingSlide?.cardTitle ?? firstProduct?.name ?? "",
  );
  const [cardSubtitle, setCardSubtitle] = useState(
    editingSlide?.cardSubtitle ??
      firstProduct?.fitText ??
      "Toca la flecha para ver prenda",
  );
  const [cardPriceText, setCardPriceText] = useState(
    editingSlide?.cardPriceText ?? firstProduct?.retailPriceText ?? "S/ 130.00",
  );
  const [cardHref, setCardHref] = useState(
    editingSlide?.cardHref ??
      (firstProduct ? `/producto/${firstProduct.slug}` : "/catalogo"),
  );
  const [cardImageUrl, setCardImageUrl] = useState(
    editingSlide?.cardImageUrl ?? firstProduct?.imageUrl ?? "",
  );
  const [cardHoverImageUrl, setCardHoverImageUrl] = useState(
    editingSlide?.cardHoverImageUrl ?? "",
  );
  const [sortOrder, setSortOrder] = useState(
    String(editingSlide?.sortOrder ?? nextSortOrder),
  );
  const [isActive, setIsActive] = useState(editingSlide?.isActive ?? true);

  const handleSelectProduct = (selectedIdStr: string) => {
    const idNum = Number(selectedIdStr);
    const found = products.find((p) => p.id === idNum);
    if (!found) {
      setProductId(null);
      return;
    }
    setProductId(found.id);
    setCardTitle(found.name);
    setCardHref(`/producto/${found.slug}`);
    setCardImageUrl(found.imageUrl);
    setCardHoverImageUrl("");
    if (found.retailPriceText) {
      setCardPriceText(found.retailPriceText);
    }
    if (found.fitText) {
      setCardSubtitle(found.fitText);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFeedback(null);

    startTransition(async () => {
      const res = await saveHeroSlideAction({
        id: editingSlide?.id ?? null,
        badge,
        promoPill,
        eyebrow,
        titleLine1,
        titleHighlight,
        description,
        primaryCtaLabel,
        primaryCtaHref,
        secondaryCtaLabel,
        secondaryCtaHref,
        bgImageUrl,
        productId,
        cardTag,
        cardTitle,
        cardSubtitle,
        cardPriceText,
        cardHref,
        cardImageUrl,
        cardHoverImageUrl: cardHoverImageUrl || null,
        sortOrder: Number(sortOrder) || 1,
        isActive,
      });

      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo guardar la portada.",
        });
        return;
      }

      onClose();
      onFeedback({
        type: "success",
        text: res.message ?? "Portada principal guardada y publicada.",
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
        className="relative z-10 flex max-h-[93vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_-14px_rgba(15,23,42,0.55)]"
      >
        {/* Cabecera Modal */}
        <div
          className={`shrink-0 flex items-center justify-between px-6 py-4 text-white ${
            editingSlide
              ? "bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB]"
              : "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              {editingSlide ? <Edit3 className="size-5" /> : <Tag className="size-5" />}
            </span>
            <div>
              <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-white/85">
                {editingSlide
                  ? `EDITANDO PORTADA #${editingSlide.id}`
                  : "NUEVO BANNER DE PORTADA PRINCIPAL"}
              </p>
              <h2 className="text-lg font-black">
                {editingSlide
                  ? "Editar Fondo, Textos y Producto Enlazado"
                  : "Subir Imagen de Fondo y Enlazar Producto"}
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
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* FILA SUPERIOR: IMAGEN DE FONDO (ANCHO COMPLETO 16:9) + CUADRITO PRODUCTO DERECHO */}
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-3">
                <AdminImageUploadSlot
                  title="1. Imagen de Fondo de Portada *"
                  subtitle="Sube cualquier imagen desde tu celular o PC (JPG, PNG, WebP, HEIC, GIF, etc.)"
                  required
                  wide
                  valueUrl={bgImageUrl || null}
                  altText={titleHighlight || "Imagen de fondo portada"}
                  onUploaded={(url) => setBgImageUrl(url)}
                  onRemove={() => setBgImageUrl("")}
                />
              </div>

              {/* CUADRITO PRODUCTO DERECHO */}
              <div className="lg:col-span-5 rounded-2xl border-2 border-blue-200/80 bg-blue-50/35 p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-950">
                  <Link2 className="size-4 text-[#1E40AF]" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    2. Producto del Cuadrito Derecho
                  </span>
                </div>

                <div>
                  <label htmlFor="hero-prod" className={LABEL_CLASS}>
                    Elegir Producto del Catálogo *
                  </label>
                  <select
                    id="hero-prod"
                    value={productId ?? ""}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">Selecciona un producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.retailPriceText ? ` — ${p.retailPriceText}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vista previa en vivo del cuadrito derecho */}
                {cardImageUrl && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardImageUrl}
                        alt={cardTitle}
                        className="size-full object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="inline-block rounded-full bg-[#DC2626] px-2 py-0.5 font-mono text-[0.55rem] font-extrabold uppercase text-white">
                        {cardTag}
                      </span>
                      <p className="truncate text-xs font-black uppercase text-slate-900">
                        {cardTitle}
                      </p>
                      <p className="truncate text-[0.66rem] text-slate-500">
                        {cardSubtitle}
                      </p>
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="font-mono text-xs font-black text-[#1E40AF]">
                          {cardPriceText}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] font-bold text-emerald-700">
                          <span>Enlace: {cardHref}</span>
                          <ArrowRight className="size-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="hero-ctag" className={LABEL_CLASS}>
                      Etiqueta Cuadrito
                    </label>
                    <input
                      id="hero-ctag"
                      type="text"
                      value={cardTag}
                      onChange={(e) => setCardTag(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="hero-cprice" className={LABEL_CLASS}>
                      Precio Cuadrito
                    </label>
                    <input
                      id="hero-cprice"
                      type="text"
                      value={cardPriceText}
                      onChange={(e) => setCardPriceText(e.target.value)}
                      className={`${INPUT_CLASS} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hero-csub" className={LABEL_CLASS}>
                    Subtítulo del Cuadrito
                  </label>
                  <input
                    id="hero-csub"
                    type="text"
                    value={cardSubtitle}
                    onChange={(e) => setCardSubtitle(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            {/* BLOQUE INFERIOR: CUADRO DE TEXTO IZQUIERDO DE LA PORTADA */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  3. Cuadro de Texto Flotante de la Portada (Editable)
                </span>
                <span className="font-mono text-[0.64rem] font-bold text-slate-500">
                  Se muestra encima de la imagen de fondo
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="h-badge" className={LABEL_CLASS}>
                    Píldora Roja *
                  </label>
                  <input
                    id="h-badge"
                    type="text"
                    required
                    value={badge}
                    onChange={(e) => setBadge(e.target.value.toUpperCase())}
                    className={`${INPUT_CLASS} font-mono uppercase`}
                  />
                </div>
                <div>
                  <label htmlFor="h-pill" className={LABEL_CLASS}>
                    Píldora Azul *
                  </label>
                  <input
                    id="h-pill"
                    type="text"
                    required
                    value={promoPill}
                    onChange={(e) => setPromoPill(e.target.value.toUpperCase())}
                    className={`${INPUT_CLASS} font-mono uppercase`}
                  />
                </div>
                <div>
                  <label htmlFor="h-eye" className={LABEL_CLASS}>
                    Subtítulo Superior
                  </label>
                  <input
                    id="h-eye"
                    type="text"
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value.toUpperCase())}
                    className={`${INPUT_CLASS} font-mono uppercase`}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="h-t1" className={LABEL_CLASS}>
                    Título Línea 1 (Blanco) *
                  </label>
                  <input
                    id="h-t1"
                    type="text"
                    required
                    value={titleLine1}
                    onChange={(e) => setTitleLine1(e.target.value)}
                    placeholder="Ej: ¡TUS PREFERIDOS EN"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="h-th" className={LABEL_CLASS}>
                    Frase Destacada (Fondo Rojo) *
                  </label>
                  <input
                    id="h-th"
                    type="text"
                    required
                    value={titleHighlight}
                    onChange={(e) => setTitleHighlight(e.target.value)}
                    placeholder="Ej: JEANS & DENIM!"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="h-desc" className={LABEL_CLASS}>
                  Descripción Corta del Slider
                </label>
                <textarea
                  id="h-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-2xl border-2 border-slate-200/80 bg-white p-3 text-xs sm:text-sm font-medium text-slate-900 focus:border-[#DC2626] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                <div>
                  <label htmlFor="h-cta1" className={LABEL_CLASS}>
                    Botón 1 (Texto)
                  </label>
                  <input
                    id="h-cta1"
                    type="text"
                    value={primaryCtaLabel}
                    onChange={(e) => setPrimaryCtaLabel(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="h-cta1h" className={LABEL_CLASS}>
                    Ruta Botón 1
                  </label>
                  <input
                    id="h-cta1h"
                    type="text"
                    value={primaryCtaHref}
                    onChange={(e) => setPrimaryCtaHref(e.target.value)}
                    placeholder="/catalogo"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
                <div>
                  <label htmlFor="h-cta2" className={LABEL_CLASS}>
                    Botón 2 (Texto)
                  </label>
                  <input
                    id="h-cta2"
                    type="text"
                    value={secondaryCtaLabel}
                    onChange={(e) => setSecondaryCtaLabel(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="h-cta2h" className={LABEL_CLASS}>
                    Ruta Botón 2
                  </label>
                  <input
                    id="h-cta2h"
                    type="text"
                    value={secondaryCtaHref}
                    onChange={(e) => setSecondaryCtaHref(e.target.value)}
                    placeholder="/catalogo?oferta=1"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
                <div>
                  <label htmlFor="h-order" className={LABEL_CLASS}>
                    Orden
                  </label>
                  <input
                    id="h-order"
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
                  Mostrar esta portada en el carrusel principal inmediatamente
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
              <span>{editingSlide ? "Guardar Portada" : "Publicar Portada"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminHeroSubmanager({
  heroSlides,
  products,
  modalOpen,
  editingSlide,
  onEditSlide,
  onCloseModal,
  onFeedback,
}: AdminHeroSubmanagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "paused">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [toggleTarget, setToggleTarget] = useState<HeroSlideItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlideItem | null>(null);

  const activeCount = useMemo(
    () => heroSlides.filter((h) => h.isActive).length,
    [heroSlides],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return heroSlides.filter((h) => {
      if (filterTab === "active" && !h.isActive) return false;
      if (filterTab === "paused" && h.isActive) return false;
      if (!q) return true;
      return (
        h.titleLine1.toLowerCase().includes(q) ||
        h.titleHighlight.toLowerCase().includes(q) ||
        h.cardTitle.toLowerCase().includes(q) ||
        h.badge.toLowerCase().includes(q)
      );
    });
  }, [heroSlides, search, filterTab]);

  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    const target = toggleTarget;
    startTransition(async () => {
      const res = await toggleHeroSlideStatusAction({
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
        text: res.message ?? "Portada actualizada.",
      });
      router.refresh();
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const res = await deleteHeroSlideAction({ id: target.id });
      setDeleteTarget(null);
      if (!res.success) {
        onFeedback({
          type: "error",
          text: res.error ?? "No se pudo eliminar la portada.",
        });
        return;
      }
      onFeedback({
        type: "success",
        text: res.message ?? "Portada eliminada.",
      });
      router.refresh();
    });
  };

  return (
    <>
      {/* KPIs Portada Principal */}
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
              Total Portadas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <ImageIcon className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
            {heroSlides.length}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {activeCount} activas · {heroSlides.length - activeCount} pausadas
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
            Clic para filtrar activas / pausadas
          </p>
        </button>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#1E40AF]">
              Transición 3D Automática
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF]">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
            6.0s
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Con enlace directo al producto
          </p>
        </div>
      </section>

      {/* Barra de Búsqueda y Vista */}
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.12)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar portada por título o producto enlazado..."
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
            No se encontraron portadas con ese filtro
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((slide) => (
            <article
              key={slide.id}
              className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_36px_-18px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-red-300"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.bgImageUrl}
                  alt={slide.titleHighlight}
                  className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/20 to-slate-950/50" />

                {/* Preview Cuadro de Texto Izquierdo */}
                <div className="absolute left-3 top-3 max-w-[62%] rounded-2xl border border-white/25 bg-slate-950/45 p-3 text-white backdrop-blur-xs">
                  <span className="inline-block rounded-full bg-[#DC2626] px-2 py-0.5 font-mono text-[0.55rem] font-black uppercase">
                    {slide.badge}
                  </span>
                  <p className="mt-1.5 text-xs font-black uppercase leading-tight">
                    {slide.titleLine1}{" "}
                    <span className="text-red-300">{slide.titleHighlight}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-[0.65rem] text-white/85">
                    {slide.description}
                  </p>
                </div>

                {/* Preview Cuadrito Producto Enlazado Derecho */}
                <div className="absolute bottom-3 right-3 flex w-28 flex-col overflow-hidden rounded-2xl border-2 border-white bg-white p-1 shadow-xl">
                  <div className="relative aspect-[3/3.4] w-full overflow-hidden rounded-xl bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.cardImageUrl}
                      alt={slide.cardTitle}
                      className="size-full object-cover object-top"
                    />
                  </div>
                  <p className="mt-1 truncate px-1 text-[0.58rem] font-black uppercase text-slate-900">
                    {slide.cardTitle}
                  </p>
                  <p className="truncate px-1 font-mono text-[0.58rem] font-black text-[#1E40AF]">
                    {slide.cardPriceText}
                  </p>
                </div>

                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.64rem] font-extrabold uppercase backdrop-blur-md ${
                    slide.isActive
                      ? "bg-emerald-500/90 text-white"
                      : "bg-slate-800/85 text-white"
                  }`}
                >
                  {slide.isActive ? "Visible" : "Pausado"}
                </span>
              </div>

              <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[0.66rem] font-black text-[#1E40AF]">
                    Orden #{slide.sortOrder} · Producto → {slide.cardHref}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-600">
                    Botones: &ldquo;{slide.primaryCtaLabel}&rdquo; y &ldquo;
                    {slide.secondaryCtaLabel}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditSlide(slide)}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-800 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Editar Portada y Textos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggleTarget(slide)}
                    title={slide.isActive ? "Pausar" : "Mostrar"}
                    className={`flex size-9 items-center justify-center rounded-xl border-2 transition ${
                      slide.isActive
                        ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    <Power className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(slide)}
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
                  <th className="px-5 py-4">Fondo y Texto</th>
                  <th className="px-4 py-4">Producto Cuadrito Derecho</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((slide) => (
                  <tr key={slide.id} className="hover:bg-red-50/25">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slide.bgImageUrl}
                            alt={slide.titleHighlight}
                            className="size-full object-cover object-top"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {slide.titleLine1} {slide.titleHighlight}
                          </p>
                          <p className="text-[0.7rem] text-slate-500">
                            {slide.badge} · Orden #{slide.sortOrder}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">
                        {slide.cardTitle}
                      </span>
                      <span className="block font-mono text-[0.66rem] text-[#1E40AF]">
                        {slide.cardPriceText} → {slide.cardHref}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold uppercase ${
                          slide.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {slide.isActive ? "Visible" : "Pausado"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditSlide(slide)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-extrabold text-slate-700 hover:border-blue-500 hover:text-blue-700"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleTarget(slide)}
                          className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-amber-400"
                        >
                          <Power className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(slide)}
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

      {/* Modal Crear / Editar Portada */}
      <AnimatePresence>
        {modalOpen && (
          <HeroSlideModalForm
            key={editingSlide?.id ?? "new-hero-slide"}
            editingSlide={editingSlide}
            nextSortOrder={heroSlides.length + 1}
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
                    ? "¿Pausar esta portada principal?"
                    : "¿Publicar esta portada principal?"}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  {toggleTarget.isActive
                    ? `"${toggleTarget.titleHighlight}" se ocultará del carrusel inicial.`
                    : `"${toggleTarget.titleHighlight}" volverá a mostrarse en la portada principal.`}
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
                <h3 className="text-lg font-black">¿Eliminar banner de portada?</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  Vas a eliminar permanentemente{" "}
                  <strong>{deleteTarget.titleHighlight}</strong> del carrusel
                  principal.
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
