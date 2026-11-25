"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Monitor,
  PanelLeft,
  PanelRight,
  Plus,
  Power,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { AdminImageUploadSlot } from "./admin-image-upload-slot";
import { AdminHeroSubmanager } from "./admin-hero-submanager";
import {
  AdminLinesSubmanager,
  type LineCategoryOption,
} from "./admin-lines-submanager";
import { AdminCircularGallerySubmanager } from "./admin-circular-gallery-submanager";
import type {
  CircularGalleryItem,
  EcommerceShowcaseConfig,
  HeroSlideItem,
  HomeLineItem,
  LookbookSlideItem,
  LookbookSlot,
} from "@/server/queries/lookbook";
import {
  deleteLookbookSlideAction,
  saveLookbookSlideAction,
  saveShowcaseConfigAction,
  toggleLookbookSlideStatusAction,
} from "@/server/actions/lookbook";

const SHOWCASE_CONFIG_KEY = "home_b2b_stage";
const BRAND_CONFIG_KEY = "home_brand_manifesto";

export interface LookbookProductOption {
  id: number;
  name: string;
  slug: string;
  retailPriceText: string | null;
  imageUrl: string;
  fitText: string | null;
}

interface AdminLookbookManagerProps {
  slides: LookbookSlideItem[];
  heroSlides: HeroSlideItem[];
  homeLines: HomeLineItem[];
  circularGallery: CircularGalleryItem[];
  showcaseConfig: EcommerceShowcaseConfig;
  brandConfig: EcommerceShowcaseConfig;
  products: LookbookProductOption[];
  categories: LineCategoryOption[];
}

type AdminSubModule = "hero" | "lines" | "b2b" | "gallery" | "brand";
type StatusTab = "all" | "left" | "right" | "active" | "paused";
type ViewMode = "cards" | "table";

const INPUT_CLASS =
  "mt-1.5 h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-4 text-xs sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10";

const LABEL_CLASS =
  "block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600";

export function AdminLookbookManager({
  slides,
  heroSlides,
  homeLines,
  circularGallery,
  showcaseConfig,
  brandConfig,
  products,
  categories,
}: AdminLookbookManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [subModule, setSubModule] = useState<AdminSubModule>("hero");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Modal Portada Principal (Submódulo Hero)
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlideItem | null>(
    null,
  );

  // Modal ¡Explora Nuestras Líneas! (Submódulo Líneas)
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<HomeLineItem | null>(null);

  // Modal Galería Circular 3D (Submódulo Galería)
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] =
    useState<CircularGalleryItem | null>(null);

  const handleSelectSubModule = (next: AdminSubModule) => {
    setSubModule(next);
    setStatusTab("all");
    setSearch("");
  };

  // Modal Crear / Editar Foto Lookbook
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("EDICIÓN 2026");
  const [priceTag, setPriceTag] = useState("S/ 130.00");
  const [imageUrl, setImageUrl] = useState("");
  const [linkHref, setLinkHref] = useState("/catalogo");
  const [slot, setSlot] = useState<LookbookSlot>("right");
  const [sortOrder, setSortOrder] = useState("1");
  const [isActive, setIsActive] = useState(true);

  // Modal Editar Textos Centrales y Títulos de Secciones
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [centerBadge, setCenterBadge] = useState(showcaseConfig.centerBadge);
  const [centerTitle, setCenterTitle] = useState(showcaseConfig.centerTitle);
  const [centerHighlight, setCenterHighlight] = useState(
    showcaseConfig.centerHighlight,
  );
  const [centerSubtitle, setCenterSubtitle] = useState(
    showcaseConfig.centerSubtitle,
  );
  const [leftLabel, setLeftLabel] = useState(showcaseConfig.leftLabel);
  const [rightLabel, setRightLabel] = useState(showcaseConfig.rightLabel);

  // Modal Editar Textos Sección Marca Oficial Peruana
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [bBadge, setBBadge] = useState(brandConfig.centerBadge);
  const [bTitle, setBTitle] = useState(brandConfig.centerTitle);
  const [bHighlight, setBHighlight] = useState(brandConfig.centerHighlight);
  const [bSubtitle, setBSubtitle] = useState(brandConfig.centerSubtitle);
  const [bLeftLabel, setBLeftLabel] = useState(brandConfig.leftLabel);
  const [bRightLabel, setBRightLabel] = useState(brandConfig.rightLabel);

  // Modales confirmación Pausar/Activar y Eliminar
  const [toggleTarget, setToggleTarget] = useState<LookbookSlideItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<LookbookSlideItem | null>(
    null,
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const b2bSlides = useMemo(
    () => slides.filter((s) => s.slot === "left" || s.slot === "right"),
    [slides],
  );
  const brandSlides = useMemo(
    () => slides.filter((s) => s.slot === "brand"),
    [slides],
  );

  const kpis = useMemo(() => {
    const scopeSlides = subModule === "b2b" ? b2bSlides : brandSlides;
    const active = scopeSlides.filter((s) => s.isActive).length;
    const leftCount = b2bSlides.filter((s) => s.slot === "left").length;
    const rightCount = b2bSlides.filter((s) => s.slot === "right").length;
    return {
      scopeTotal: scopeSlides.length,
      scopeActive: active,
      scopePaused: scopeSlides.length - active,
      b2bTotal: b2bSlides.length,
      brandTotal: brandSlides.length,
      leftCount,
      rightCount,
    };
  }, [subModule, b2bSlides, brandSlides]);

  const filtered = useMemo(() => {
    const scopeSlides = subModule === "b2b" ? b2bSlides : brandSlides;
    const q = search.trim().toLowerCase();
    return scopeSlides.filter((s) => {
      if (subModule === "b2b") {
        if (statusTab === "left" && s.slot !== "left") return false;
        if (statusTab === "right" && s.slot !== "right") return false;
      }
      if (statusTab === "active" && !s.isActive) return false;
      if (statusTab === "paused" && s.isActive) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.subtitle ?? "").toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q)
      );
    });
  }, [subModule, b2bSlides, brandSlides, search, statusTab]);

  const openCreateModal = (defaultSlot?: LookbookSlot) => {
    const resolvedSlot =
      defaultSlot ?? (subModule === "brand" ? "brand" : "right");
    const firstProd = products[0];
    setEditingId(null);
    setTitle(firstProd?.name ?? "");
    setSubtitle("");
    setBadge(
      resolvedSlot === "left"
        ? "CAMISAS & POLOS"
        : resolvedSlot === "brand"
          ? "MARCA OFICIAL"
          : "JEANS & DRILL",
    );
    setPriceTag(firstProd?.retailPriceText ?? "S/ 130.00");
    setImageUrl("");
    setLinkHref(firstProd ? `/producto/${firstProd.slug}` : "/catalogo");
    setSlot(resolvedSlot);
    setSortOrder(
      String(
        (resolvedSlot === "brand" ? brandSlides.length : b2bSlides.length) + 1,
      ),
    );
    setIsActive(true);
    setFeedback(null);
    setModalOpen(true);
  };

  const openEditModal = (slide: LookbookSlideItem) => {
    setEditingId(slide.id);
    setTitle(slide.title);
    setSubtitle(slide.subtitle ?? "");
    setBadge(slide.badge);
    setPriceTag(slide.priceTag ?? "");
    setImageUrl(slide.imageUrl);
    setLinkHref(slide.linkHref || "/catalogo");
    setSlot(slide.slot);
    setSortOrder(String(slide.sortOrder));
    setIsActive(slide.isActive);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleLinkedProductChange = (newHref: string) => {
    setLinkHref(newHref);
    const matched = products.find((p) => `/producto/${p.slug}` === newHref);
    if (matched) {
      if (!editingId || !title.trim()) {
        setTitle(matched.name);
      }
      if (matched.retailPriceText) {
        setPriceTag(matched.retailPriceText);
      }
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await saveLookbookSlideAction({
        id: editingId,
        title,
        subtitle,
        badge,
        priceTag,
        imageUrl,
        linkHref,
        slot,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo guardar la imagen del Lookbook.",
        });
        return;
      }

      setModalOpen(false);
      setFeedback({
        type: "success",
        text: res.message ?? "Look guardado y publicado en portada.",
      });
      router.refresh();
    });
  };

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await saveShowcaseConfigAction({
        configKey: SHOWCASE_CONFIG_KEY,
        centerBadge,
        centerTitle,
        centerHighlight,
        centerSubtitle,
        leftLabel,
        rightLabel,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo actualizar la configuración central.",
        });
        return;
      }

      setConfigModalOpen(false);
      setFeedback({
        type: "success",
        text:
          res.message ??
          "Textos centrales y títulos de secciones actualizados.",
      });
      router.refresh();
    });
  };

  const handleSaveBrandConfig = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await saveShowcaseConfigAction({
        configKey: BRAND_CONFIG_KEY,
        centerBadge: bBadge,
        centerTitle: bTitle,
        centerHighlight: bHighlight,
        centerSubtitle: bSubtitle,
        leftLabel: bLeftLabel,
        rightLabel: bRightLabel,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          text:
            res.error ??
            "No se pudo actualizar los textos de la sección Marca.",
        });
        return;
      }

      setBrandModalOpen(false);
      setFeedback({
        type: "success",
        text: "Textos de la sección Marca Oficial Peruana actualizados en la portada.",
      });
      router.refresh();
    });
  };

  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    const target = toggleTarget;
    startTransition(async () => {
      const res = await toggleLookbookSlideStatusAction({
        id: target.id,
        isActive: !target.isActive,
      });
      setToggleTarget(null);
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "Error al cambiar visibilidad.",
        });
        return;
      }
      setFeedback({
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
      const res = await deleteLookbookSlideAction({ id: target.id });
      setDeleteTarget(null);
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo eliminar el look.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: res.message ?? "Look eliminado correctamente.",
      });
      router.refresh();
    });
  };

  const selectedProductObj = products.find(
    (p) => `/producto/${p.slug}` === linkHref,
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
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-56 rounded-full bg-black/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>
                {subModule === "hero"
                  ? "Submódulo 01 · Portada Principal y Producto Enlazado"
                  : subModule === "lines"
                    ? "Submódulo 02 · ¡Explora Nuestras Líneas!"
                    : subModule === "b2b"
                      ? "Submódulo 03 · Escenario Lookbook 3D"
                      : subModule === "gallery"
                        ? "Submódulo 04 · Galería Circular 3D (Principal + Zoom)"
                        : "Submódulo 05 · Sección Marca Oficial Peruana"}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              {subModule === "hero"
                ? "Portada Principal · Imágenes de Fondo y Producto"
                : subModule === "lines"
                  ? "¡Explora Nuestras Líneas! · Enlace a Categorías"
                  : subModule === "b2b"
                    ? `${centerBadge} — ${centerTitle} ${centerHighlight}`
                    : subModule === "gallery"
                      ? "Galería Circular 3D · Exhibición y 2.ª Foto en Zoom"
                      : `${bBadge} — ${bTitle} ${bHighlight}`}
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              {subModule === "hero"
                ? "Sube cualquier imagen de fondo desde tu celular o PC, edita su cuadro de texto flotante y selecciona el producto que aparecerá en el cuadrito derecho."
                : subModule === "lines"
                  ? "Administra las tarjetas de líneas de ropa, sus fotos (modelo y acercamiento) y elige a qué categoría del catálogo lleva el botón «Ver Prendas →»."
                  : subModule === "b2b"
                    ? `Edita únicamente las fotos de ${leftLabel}, ${rightLabel} y los textos centrales del Escenario 3D B2B.`
                    : subModule === "gallery"
                      ? "Sube las fotos principales que giran en el cilindro 3D y agrega una segunda foto opcional por prenda para activar las flechas laterales ‹ › cuando el cliente hace zoom."
                      : "Edita únicamente las fotografías de campaña 3D y los textos institucionales de Marca Oficial Peruana."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {subModule === "b2b" ? (
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/15 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md transition hover:bg-white/25"
              >
                <Type className="size-4" />
                <span>Editar Textos Sección</span>
              </button>
            ) : subModule === "brand" ? (
              <button
                type="button"
                onClick={() => setBrandModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/15 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md transition hover:bg-white/25"
              >
                <Award className="size-4" />
                <span>Editar Textos Marca</span>
              </button>
            ) : null}

            <Link
              href={
                subModule === "hero"
                  ? "/#inicio"
                  : subModule === "lines"
                    ? "/#lineas-catalogo"
                    : subModule === "b2b"
                      ? "/#mayorista"
                      : subModule === "gallery"
                        ? "/#galeria-circular"
                        : "/#manifiesto-marca"
              }
              target="_blank"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-4 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md transition hover:bg-white/25"
            >
              <ExternalLink className="size-4" />
              <span>Ver Sección en Portada</span>
            </Link>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (subModule === "hero") {
                  setEditingHeroSlide(null);
                  setHeroModalOpen(true);
                } else if (subModule === "lines") {
                  setEditingLine(null);
                  setLineModalOpen(true);
                } else if (subModule === "gallery") {
                  setEditingGalleryItem(null);
                  setGalleryModalOpen(true);
                } else {
                  openCreateModal(subModule === "brand" ? "brand" : "right");
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:bg-red-50"
            >
              <Plus className="size-4" />
              <span>
                {subModule === "hero"
                  ? "Nueva Portada Principal"
                  : subModule === "lines"
                    ? "Nueva Línea / Categoría"
                    : subModule === "b2b"
                      ? "Subir Foto Lookbook"
                      : subModule === "gallery"
                        ? "Nueva Foto Galería 3D"
                        : "Subir Foto de Marca"}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* SELECTOR DE 5 SUB-MÓDULOS PARA EDITAR POR SEPARADO SIN CONFUNDIRSE */}
      <section
        aria-label="Submódulos de Contenido E-Commerce"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <button
          type="button"
          onClick={() => handleSelectSubModule("hero")}
          className={`group relative overflow-hidden rounded-3xl border-2 p-4 text-left transition-all ${
            subModule === "hero"
              ? "border-[#DC2626] bg-white shadow-[0_18px_40px_-14px_rgba(220,38,38,0.28)]"
              : "border-slate-200/90 bg-white/75 opacity-80 hover:border-slate-300 hover:bg-white hover:opacity-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider ${
                  subModule === "hero"
                    ? "bg-[#DC2626] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Monitor className="size-3" />
                <span>01 · {heroSlides.length} portadas</span>
              </span>
              <h2 className="mt-2 text-sm font-black uppercase tracking-tight text-slate-900">
                Portada Principal
              </h2>
              <p className="mt-0.5 text-[0.72rem] font-semibold text-slate-500">
                Fondo, textos y cuadrito de producto.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-xl px-2 py-0.5 text-[0.6rem] font-black uppercase ${
                subModule === "hero"
                  ? "bg-red-50 text-[#DC2626]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {subModule === "hero" ? "Abierto" : "Entrar"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSubModule("lines")}
          className={`group relative overflow-hidden rounded-3xl border-2 p-4 text-left transition-all ${
            subModule === "lines"
              ? "border-[#1E40AF] bg-white shadow-[0_18px_40px_-14px_rgba(30,64,175,0.28)]"
              : "border-slate-200/90 bg-white/75 opacity-80 hover:border-slate-300 hover:bg-white hover:opacity-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider ${
                  subModule === "lines"
                    ? "bg-[#1E40AF] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <FolderTree className="size-3" />
                <span>02 · {homeLines.length} líneas</span>
              </span>
              <h2 className="mt-2 text-sm font-black uppercase tracking-tight text-slate-900">
                ¡Explora Líneas!
              </h2>
              <p className="mt-0.5 text-[0.72rem] font-semibold text-slate-500">
                Conecta cada línea a su categoría en catálogo.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-xl px-2 py-0.5 text-[0.6rem] font-black uppercase ${
                subModule === "lines"
                  ? "bg-blue-50 text-[#1E40AF]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {subModule === "lines" ? "Abierto" : "Entrar"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSubModule("b2b")}
          className={`group relative overflow-hidden rounded-3xl border-2 p-4 text-left transition-all ${
            subModule === "b2b"
              ? "border-[#DC2626] bg-white shadow-[0_18px_40px_-14px_rgba(220,38,38,0.28)]"
              : "border-slate-200/90 bg-white/75 opacity-80 hover:border-slate-300 hover:bg-white hover:opacity-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider ${
                  subModule === "b2b"
                    ? "bg-[#DC2626] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Layers className="size-3" />
                <span>03 · {kpis.b2bTotal} fotos</span>
              </span>
              <h2 className="mt-2 truncate text-sm font-black uppercase tracking-tight text-slate-900">
                Lookbook B2B 3D
              </h2>
              <p className="mt-0.5 truncate text-[0.72rem] font-semibold text-slate-500">
                {leftLabel} + {rightLabel}.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-xl px-2 py-0.5 text-[0.6rem] font-black uppercase ${
                subModule === "b2b"
                  ? "bg-red-50 text-[#DC2626]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {subModule === "b2b" ? "Abierto" : "Entrar"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSubModule("gallery")}
          className={`group relative overflow-hidden rounded-3xl border-2 p-4 text-left transition-all ${
            subModule === "gallery"
              ? "border-[#680C14] bg-white shadow-[0_18px_40px_-14px_rgba(104,12,20,0.28)]"
              : "border-slate-200/90 bg-white/75 opacity-80 hover:border-slate-300 hover:bg-white hover:opacity-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider ${
                  subModule === "gallery"
                    ? "bg-[#680C14] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <ImageIcon className="size-3" />
                <span>04 · {circularGallery.length} prendas</span>
              </span>
              <h2 className="mt-2 truncate text-sm font-black uppercase tracking-tight text-slate-900">
                Galería Circular 3D
              </h2>
              <p className="mt-0.5 truncate text-[0.72rem] font-semibold text-slate-500">
                Foto principal + 2.ª foto en zoom.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-xl px-2 py-0.5 text-[0.6rem] font-black uppercase ${
                subModule === "gallery"
                  ? "bg-red-50 text-[#680C14]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {subModule === "gallery" ? "Abierto" : "Entrar"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSubModule("brand")}
          className={`group relative overflow-hidden rounded-3xl border-2 p-4 text-left transition-all ${
            subModule === "brand"
              ? "border-[#1E40AF] bg-white shadow-[0_18px_40px_-14px_rgba(30,64,175,0.28)]"
              : "border-slate-200/90 bg-white/75 opacity-80 hover:border-slate-300 hover:bg-white hover:opacity-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider ${
                  subModule === "brand"
                    ? "bg-[#1E40AF] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Award className="size-3" />
                <span>05 · {kpis.brandTotal} fotos</span>
              </span>
              <h2 className="mt-2 truncate text-sm font-black uppercase tracking-tight text-slate-900">
                Marca Peruana 3D
              </h2>
              <p className="mt-0.5 truncate text-[0.72rem] font-semibold text-slate-500">
                Cuadro tech y texto de marca.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-xl px-2 py-0.5 text-[0.6rem] font-black uppercase ${
                subModule === "brand"
                  ? "bg-blue-50 text-[#1E40AF]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {subModule === "brand" ? "Abierto" : "Entrar"}
            </span>
          </div>
        </button>
      </section>

      {/* TOAST FEEDBACK */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
            className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 shadow-md ${
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
              className="rounded-lg p-1 hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENIDO SEGÚN EL SUBMÓDULO SELECCIONADO */}
      {subModule === "hero" ? (
        <AdminHeroSubmanager
          heroSlides={heroSlides}
          products={products}
          modalOpen={heroModalOpen}
          editingSlide={editingHeroSlide}
          onEditSlide={(slide) => {
            setEditingHeroSlide(slide);
            setHeroModalOpen(true);
          }}
          onCloseModal={() => {
            setHeroModalOpen(false);
            setEditingHeroSlide(null);
          }}
          onFeedback={setFeedback}
        />
      ) : subModule === "lines" ? (
        <AdminLinesSubmanager
          lines={homeLines}
          categories={categories}
          products={products}
          modalOpen={lineModalOpen}
          editingLine={editingLine}
          onEditLine={(line) => {
            setEditingLine(line);
            setLineModalOpen(true);
          }}
          onCloseModal={() => {
            setLineModalOpen(false);
            setEditingLine(null);
          }}
          onFeedback={setFeedback}
        />
      ) : subModule === "gallery" ? (
        <AdminCircularGallerySubmanager
          items={circularGallery}
          products={products}
          modalOpen={galleryModalOpen}
          editingItem={editingGalleryItem}
          onCreateNew={() => {
            setEditingGalleryItem(null);
            setGalleryModalOpen(true);
          }}
          onEditItem={(item) => {
            setEditingGalleryItem(item);
            setGalleryModalOpen(true);
          }}
          onCloseModal={() => {
            setGalleryModalOpen(false);
            setEditingGalleryItem(null);
          }}
          onFeedback={setFeedback}
        />
      ) : (
        <>
          {/* TARJETAS KPI INTERACTIVAS DEL SUBMÓDULO ACTUAL */}
          {subModule === "b2b" ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              statusTab === "all"
                ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-600">
                Total Escenario B2B
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
                <ImageIcon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
              {kpis.scopeTotal}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {kpis.scopeActive} visibles · {kpis.scopePaused} pausados
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("left")}
            className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              statusTab === "left"
                ? "border-blue-600 ring-2 ring-blue-500/20"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-blue-700">
                Lado Izquierdo
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <PanelLeft className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
              {kpis.leftCount}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {leftLabel}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("right")}
            className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              statusTab === "right"
                ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#DC2626]">
                Lado Derecho
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
                <PanelRight className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
              {kpis.rightCount}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {rightLabel}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 hover:border-blue-400"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-700">
                Texto del Centro
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Type className="size-4" />
              </span>
            </div>
            <p className="mt-3 truncate text-base font-black text-slate-900">
              {centerTitle} {centerHighlight}
            </p>
            <p className="mt-1 text-xs font-bold text-blue-700">
              Clic para editar textos →
            </p>
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              statusTab === "all"
                ? "border-[#1E40AF] ring-2 ring-blue-500/20"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#1E40AF]">
                Fotos de Marca
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF]">
                <ImageIcon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
              {kpis.scopeTotal}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              En el cuadro 3D tecnológico
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusTab((prev) => (prev === "active" ? "paused" : "active"))
            }
            className={`rounded-3xl border bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              statusTab === "active" || statusTab === "paused"
                ? "border-emerald-500 ring-2 ring-emerald-400/25"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                Estado de Publicación
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
              {kpis.scopeActive}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {kpis.scopePaused} pausadas · Clic para alternar
            </p>
          </button>

          <button
            type="button"
            onClick={() => setBrandModalOpen(true)}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 hover:border-[#1E40AF]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-amber-700">
                Textos de Marca
              </span>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Award className="size-4" />
              </span>
            </div>
            <p className="mt-3 truncate text-base font-black text-slate-900">
              {bTitle} {bHighlight}
            </p>
            <p className="mt-1 text-xs font-bold text-blue-700">
              Clic para editar textos →
            </p>
          </button>
        </section>
      )}

      {/* BARRA DE CONTROLES */}
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.12)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              subModule === "b2b"
                ? "Buscar look por título, etiqueta o tela..."
                : "Buscar foto de marca o campaña..."
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-900 focus:border-[#DC2626] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(subModule === "b2b"
            ? ([
                { id: "all", label: "Todos" },
                { id: "left", label: leftLabel },
                { id: "right", label: rightLabel },
                { id: "paused", label: "Pausados" },
              ] as const)
            : ([
                { id: "all", label: "Todas" },
                { id: "active", label: "Visibles" },
                { id: "paused", label: "Pausadas" },
              ] as const)
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusTab(t.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                statusTab === t.id
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

      {/* LISTADO DE LOOKS EN TARJETAS 3D O TABLA */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ImageIcon className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-base font-black text-slate-800">
            No se encontraron fotos con ese filtro
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((slide) => (
            <article
              key={slide.id}
              className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_36px_-18px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:shadow-[0_24px_44px_-18px_rgba(220,38,38,0.22)]"
            >
              {/* Foto Look */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3 py-1 font-mono text-[0.62rem] font-black uppercase text-white shadow-md">
                  {slide.badge}
                </span>
                <span
                  className={`absolute left-3 bottom-3 rounded-full px-2.5 py-1 text-[0.62rem] font-extrabold uppercase backdrop-blur-md ${
                    slide.slot === "left"
                      ? "bg-blue-700/90 text-white"
                      : slide.slot === "brand"
                        ? "bg-amber-600/95 text-white"
                        : "bg-slate-900/90 text-white"
                  }`}
                >
                  {slide.slot === "left"
                    ? `Izquierda (${leftLabel})`
                    : slide.slot === "brand"
                      ? "Sección Marca Oficial"
                      : `Derecha (${rightLabel})`}
                </span>
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.64rem] font-extrabold uppercase backdrop-blur-md ${
                    slide.isActive
                      ? "bg-emerald-500/90 text-white"
                      : "bg-slate-800/80 text-white"
                  }`}
                >
                  {slide.isActive ? "Visible" : "Pausado"}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {slide.title}
                    </h3>
                    {slide.subtitle && (
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[0.65rem] font-black text-slate-600">
                    Orden #{slide.sortOrder}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-black text-[#1E40AF]">
                    {slide.priceTag || "Sin precio"}
                  </span>
                  <span className="truncate max-w-[175px] font-mono text-[0.66rem] text-slate-500">
                    {slide.linkHref}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(slide)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Editar Foto / Producto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToggleTarget(slide)}
                    title={slide.isActive ? "Ocultar" : "Mostrar"}
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
                  <th className="px-5 py-4">Imagen / Modelo</th>
                  <th className="px-4 py-4">Ubicación en Portada</th>
                  <th className="px-4 py-4">Precio / Producto</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((slide) => (
                  <tr key={slide.id} className="hover:bg-red-50/25">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            className="size-full object-cover object-top"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {slide.title}
                          </p>
                          <p className="text-[0.7rem] text-slate-500">
                            {slide.subtitle || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[0.64rem] font-extrabold uppercase ${
                          slide.slot === "left"
                            ? "bg-blue-100 text-blue-800"
                            : slide.slot === "brand"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-[#991B1B]"
                        }`}
                      >
                        {slide.slot === "left"
                          ? `Izquierdo (${leftLabel})`
                          : slide.slot === "brand"
                            ? "Sección Marca"
                            : `Derecho (${rightLabel})`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-800">
                        {slide.priceTag || "—"}
                      </span>
                      <span className="block truncate max-w-[180px] font-mono text-[0.65rem] text-slate-500">
                        {slide.linkHref}
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
                          onClick={() => openEditModal(slide)}
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
        </>
      )}

      {/* MODAL 3D CREAR / EDITAR LOOKBOOK (CON PRODUCTO ENLAZADO Y LADO IZQUIERDO/DERECHO) */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setModalOpen(false)}
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
              <div
                className={`shrink-0 flex items-center justify-between px-6 py-4 text-white ${
                  editingId
                    ? "bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6]"
                    : "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    {editingId ? (
                      <Edit3 className="size-5" />
                    ) : (
                      <Tag className="size-5" />
                    )}
                  </span>
                  <div>
                    <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-white/85">
                      {editingId
                        ? `EDITANDO LOOK #${editingId}`
                        : "NUEVO MODELO / LOOKBOOK 3D"}
                    </p>
                    <h2 className="text-lg font-black">
                      {editingId
                        ? "Actualizar Foto y Producto Enlazado"
                        : "Subir Nueva Foto y Enlazar Producto"}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setModalOpen(false)}
                  className="rounded-2xl bg-white/15 p-2 text-white hover:bg-white/25"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form
                onSubmit={handleSave}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid gap-6 md:grid-cols-12">
                    {/* Subida de foto compacta para que siempre se vean los botones abajo */}
                    <div className="md:col-span-5 space-y-3">
                      <AdminImageUploadSlot
                        title="Fotografía del Modelo *"
                        subtitle="Vertical 3:4 recomendada (JPG, PNG, WebP)"
                        required
                        compact
                        valueUrl={imageUrl || null}
                        altText={title || "Foto del Lookbook"}
                        onUploaded={(url) => setImageUrl(url)}
                        onRemove={() => setImageUrl("")}
                      />

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                        <span className={LABEL_CLASS}>
                          Sección en la Portada *
                        </span>
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSlot("left")}
                            className={`flex flex-col items-start rounded-xl border-2 p-2 text-left transition ${
                              slot === "left"
                                ? "border-blue-600 bg-blue-50 text-blue-950"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            <span className="flex items-center gap-1 text-[0.68rem] font-black">
                              <PanelLeft className="size-3" />
                              Izquierdo
                            </span>
                            <span className="mt-0.5 truncate w-full text-[0.58rem] font-semibold">
                              {leftLabel}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlot("right")}
                            className={`flex flex-col items-start rounded-xl border-2 p-2 text-left transition ${
                              slot === "right"
                                ? "border-[#DC2626] bg-red-50 text-[#991B1B]"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            <span className="flex items-center gap-1 text-[0.68rem] font-black">
                              <PanelRight className="size-3" />
                              Derecho
                            </span>
                            <span className="mt-0.5 truncate w-full text-[0.58rem] font-semibold">
                              {rightLabel}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlot("brand")}
                            className={`flex flex-col items-start rounded-xl border-2 p-2 text-left transition ${
                              slot === "brand"
                                ? "border-amber-500 bg-amber-50 text-amber-950"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            <span className="flex items-center gap-1 text-[0.68rem] font-black">
                              <Award className="size-3" />
                              Marca
                            </span>
                            <span className="mt-0.5 truncate w-full text-[0.58rem] font-semibold">
                              Sección Info
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Campos */}
                    <div className="space-y-4 md:col-span-7">
                      {/* Selector destacado de Producto del Catálogo */}
                      <div className="rounded-2xl border-2 border-blue-200/80 bg-blue-50/40 p-3.5">
                        <label htmlFor="lb-href" className={LABEL_CLASS}>
                          Producto del Catálogo Enlazado al Hacer Clic *
                        </label>
                        <select
                          id="lb-href"
                          value={linkHref}
                          onChange={(e) =>
                            handleLinkedProductChange(e.target.value)
                          }
                          className={INPUT_CLASS}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={`/producto/${p.slug}`}>
                              {p.name}
                              {p.retailPriceText
                                ? ` (${p.retailPriceText})`
                                : ""}
                            </option>
                          ))}
                          <option value="/catalogo">Catálogo Completo</option>
                          <option value="/mayorista">Canal Mayorista B2B</option>
                        </select>
                        {selectedProductObj && (
                          <p className="mt-1.5 text-[0.68rem] font-bold text-blue-800">
                            Al tocar &ldquo;Ver Look&rdquo; o la foto en portada,
                            llevará directo a{" "}
                            <span className="font-mono underline">
                              /producto/{selectedProductObj.slug}
                            </span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="lb-title" className={LABEL_CLASS}>
                          Título del Look o Prenda *
                        </label>
                        <input
                          id="lb-title"
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ej: Camisa Denim Zair"
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label htmlFor="lb-sub" className={LABEL_CLASS}>
                          Subtítulo / Tela y Calce
                        </label>
                        <input
                          id="lb-sub"
                          type="text"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          placeholder="Ej: Slim Fit · Tela Stretch 7 Colores"
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="lb-badge" className={LABEL_CLASS}>
                            Sello
                          </label>
                          <input
                            id="lb-badge"
                            type="text"
                            value={badge}
                            onChange={(e) =>
                              setBadge(e.target.value.toUpperCase())
                            }
                            placeholder="TOP LOOK"
                            className={`${INPUT_CLASS} font-mono uppercase`}
                          />
                        </div>

                        <div>
                          <label htmlFor="lb-price" className={LABEL_CLASS}>
                            Precio Mostrado
                          </label>
                          <input
                            id="lb-price"
                            type="text"
                            value={priceTag}
                            onChange={(e) => setPriceTag(e.target.value)}
                            placeholder="S/ 130.00"
                            className={`${INPUT_CLASS} font-mono`}
                          />
                        </div>

                        <div>
                          <label htmlFor="lb-order" className={LABEL_CLASS}>
                            Orden
                          </label>
                          <input
                            id="lb-order"
                            type="number"
                            min="0"
                            max="999"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={`${INPUT_CLASS} font-mono`}
                          />
                        </div>
                      </div>

                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-3.5">
                        <span className="text-xs font-extrabold text-emerald-950">
                          Visible inmediatamente en la portada
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
                    onClick={() => setModalOpen(false)}
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
                    <span>{editingId ? "Guardar Cambios" : "Publicar Look"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3D: EDITAR TEXTOS CENTRALES Y TÍTULOS DE SECCIONES */}
      <AnimatePresence>
        {configModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setConfigModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-6 py-4 text-white">
                <div>
                  <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-blue-100">
                    PORTADA E-COMMERCE
                  </p>
                  <h3 className="text-lg font-black">
                    Textos del Centro y Nombres de Lados
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="rounded-xl bg-white/15 p-2 text-white hover:bg-white/25"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cfg-left" className={LABEL_CLASS}>
                      Título Lado Izquierdo *
                    </label>
                    <input
                      id="cfg-left"
                      type="text"
                      required
                      value={leftLabel}
                      onChange={(e) => setLeftLabel(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="cfg-right" className={LABEL_CLASS}>
                      Título Lado Derecho *
                    </label>
                    <input
                      id="cfg-right"
                      type="text"
                      required
                      value={rightLabel}
                      onChange={(e) => setRightLabel(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cfg-badge" className={LABEL_CLASS}>
                    Etiqueta Superior Central
                  </label>
                  <input
                    id="cfg-badge"
                    type="text"
                    value={centerBadge}
                    onChange={(e) => setCenterBadge(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cfg-title" className={LABEL_CLASS}>
                      Título Central *
                    </label>
                    <input
                      id="cfg-title"
                      type="text"
                      required
                      value={centerTitle}
                      onChange={(e) => setCenterTitle(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="cfg-hi" className={LABEL_CLASS}>
                      Palabra Destacada (Rojo)
                    </label>
                    <input
                      id="cfg-hi"
                      type="text"
                      value={centerHighlight}
                      onChange={(e) => setCenterHighlight(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cfg-sub" className={LABEL_CLASS}>
                    Descripción Corta Central
                  </label>
                  <textarea
                    id="cfg-sub"
                    rows={2}
                    value={centerSubtitle}
                    onChange={(e) => setCenterSubtitle(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-3 text-sm font-medium text-slate-900 focus:border-[#DC2626] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setConfigModalOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-5 py-2.5 text-xs font-extrabold text-white shadow-md"
                  >
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Guardar Textos</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3D: EDITAR TEXTOS SECCIÓN MARCA OFICIAL PERUANA */}
      <AnimatePresence>
        {brandModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setBrandModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] px-6 py-4 text-white">
                <div>
                  <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-amber-300">
                    SECCIÓN HISTORIA Y MARCA
                  </p>
                  <h3 className="text-lg font-black">
                    Textos de &ldquo;Marca Oficial Peruana&rdquo;
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="rounded-xl bg-white/15 p-2 text-white hover:bg-white/25"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBrandConfig} className="space-y-4 p-6">
                <div>
                  <label htmlFor="br-badge" className={LABEL_CLASS}>
                    Etiqueta Superior (Insignia)
                  </label>
                  <input
                    id="br-badge"
                    type="text"
                    value={bBadge}
                    onChange={(e) => setBBadge(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="br-title" className={LABEL_CLASS}>
                      Título Principal *
                    </label>
                    <input
                      id="br-title"
                      type="text"
                      required
                      value={bTitle}
                      onChange={(e) => setBTitle(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="br-hi" className={LABEL_CLASS}>
                      Frase Destacada (Rojo)
                    </label>
                    <input
                      id="br-hi"
                      type="text"
                      value={bHighlight}
                      onChange={(e) => setBHighlight(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="br-sub" className={LABEL_CLASS}>
                    Descripción Corta de Marca
                  </label>
                  <textarea
                    id="br-sub"
                    rows={2}
                    value={bSubtitle}
                    onChange={(e) => setBSubtitle(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-3 text-sm font-medium text-slate-900 focus:border-[#DC2626] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="br-left" className={LABEL_CLASS}>
                      Etiqueta Pie Foto (Izq.)
                    </label>
                    <input
                      id="br-left"
                      type="text"
                      value={bLeftLabel}
                      onChange={(e) => setBLeftLabel(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="br-right" className={LABEL_CLASS}>
                      Etiqueta Pie Foto (Der.)
                    </label>
                    <input
                      id="br-right"
                      type="text"
                      value={bRightLabel}
                      onChange={(e) => setBRightLabel(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setBrandModalOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold text-white shadow-md"
                  >
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Guardar Sección Marca</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMACIÓN PAUSAR / ACTIVAR */}
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
                    ? "¿Pausar esta foto de portada?"
                    : "¿Publicar esta foto en portada?"}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  {toggleTarget.isActive
                    ? `"${toggleTarget.title}" dejará de aparecer en el Lookbook 3D hasta que la actives de nuevo.`
                    : `"${toggleTarget.title}" volverá a mostrarse en el escenario 3D de la portada.`}
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

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
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
                <h3 className="text-lg font-black">¿Eliminar foto del Lookbook?</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  Vas a eliminar permanentemente{" "}
                  <strong>{deleteTarget.title}</strong> de la galería 3D.
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
    </div>
  );
}
