"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  adminSaveProductAction,
  adminSetProductStatusAction,
  adminDeleteProductAction,
  type AdminProductSavePayload,
} from "@/server/actions/admin-commerce";
import { normalizeCommercialSlug } from "@/server/pricing/admin-validators";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  Tag,
  Sparkles,
  Star,
  Boxes,
  Archive,
  RotateCcw,
  ShieldCheck,
  Loader2,
  Package,
  ExternalLink,
  Palette,
  Camera,
  Info,
  Check,
  X,
  ArrowDownRight,
  Crown,
} from "lucide-react";
import { AdminProductDeleteModal } from "./admin-product-delete-modal";
import { AdminImageUploadSlot } from "./admin-image-upload-slot";

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

interface InitialProductData {
  id: number;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string | null;
  fullDescription: string | null;
  categoryId: number;
  audience: "mujer" | "hombre" | "unisex";
  status: "draft" | "active" | "archived";
  badgeLabel: string | null;
  sortOrder: number;
  isNew: boolean;
  isFeatured: boolean;
  isWholesale: boolean;
  retailPricePen: string;
  compareAtPricePen: string;
  wholesaleTiers: Array<{
    minQuantity: string;
    maxQuantity: string;
    pricePen: string;
  }>;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
    imageType?: "portada" | "cerca" | "reverso" | "ficha" | "galeria";
    colorName?: string | null;
  }>;
  variants: Array<{
    id?: number;
    sku: string;
    size: string;
    colorName: string;
    colorSwatch: string;
    stock: string;
    isActive: boolean;
    hasHistoricalReferences?: boolean;
  }>;
  hasHistoricalOrdersOrQuotes?: boolean;
}

interface AdminProductEditorFormProps {
  categories: CategoryOption[];
  initialData?: InitialProductData | null;
}

const INPUT_CLASS =
  "mt-1.5 h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-4 text-xs sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all duration-200 focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10";

const LABEL_CLASS =
  "block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600";

type ColorImageGallery = {
  portada: string | null;
  cerca: string | null;
  reverso: string | null;
  extras: string[];
};

function normalizeColorKey(name: string): string {
  return name.trim().toLowerCase();
}

function buildInitialImageState(initialImages?: InitialProductData["images"]) {
  const list = initialImages ?? [];
  const general = list.filter((im) => !im.colorName || !im.colorName.trim());

  const usedIndices = new Set<number>();
  const pickGeneral = (predicate: (im: (typeof general)[number]) => boolean): string | null => {
    const idx = general.findIndex((im, i) => !usedIndices.has(i) && predicate(im));
    if (idx >= 0) {
      usedIndices.add(idx);
      return general[idx].url;
    }
    return null;
  };

  const mainPortada =
    pickGeneral((im) => im.imageType === "portada") ??
    pickGeneral((im) => im.isPrimary) ??
    pickGeneral(() => true);
  const mainCerca =
    pickGeneral((im) => im.imageType === "cerca") ??
    pickGeneral((im) => im.url.includes("-closeup"));
  const mainReverso = pickGeneral((im) => im.imageType === "reverso");
  const mainFicha =
    pickGeneral((im) => im.imageType === "ficha") ??
    pickGeneral((im) => im.url.includes("-spec"));

  const mainExtras = general
    .filter((_, idx) => !usedIndices.has(idx))
    .map((im) => im.url);

  const colorGalleries: Record<string, ColorImageGallery> = {};
  for (const im of list) {
    if (!im.colorName || !im.colorName.trim()) continue;
    const key = normalizeColorKey(im.colorName);
    if (!colorGalleries[key]) {
      colorGalleries[key] = { portada: null, cerca: null, reverso: null, extras: [] };
    }
    const g = colorGalleries[key];
    if (im.imageType === "portada" && !g.portada) {
      g.portada = im.url;
    } else if (im.imageType === "cerca" && !g.cerca) {
      g.cerca = im.url;
    } else if (im.imageType === "reverso" && !g.reverso) {
      g.reverso = im.url;
    } else {
      g.extras.push(im.url);
    }
  }

  let detectedPortadaColorKey: string | null = null;
  if (mainPortada) {
    for (const [k, gal] of Object.entries(colorGalleries)) {
      if (gal.portada && gal.portada === mainPortada) {
        detectedPortadaColorKey = k;
        break;
      }
    }
  }

  return {
    mainPortada,
    mainCerca,
    mainReverso,
    mainFicha,
    mainExtras,
    colorGalleries,
    detectedPortadaColorKey,
  };
}

function normalizeSafeHexColor(value: string): string {
  const clean = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return "#1e293b";
}

export function AdminProductEditorForm({
  categories,
  initialData,
}: AdminProductEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [brand, setBrand] = useState(initialData?.brand ?? "AMERICAN COLT");
  const [shortDescription, setShortDescription] = useState(
    initialData?.shortDescription ?? "",
  );
  const [fullDescription, setFullDescription] = useState(
    initialData?.fullDescription ?? "",
  );
  const [categoryId, setCategoryId] = useState<number>(
    initialData?.categoryId ?? (categories[0]?.id ?? 1),
  );
  const [audience, setAudience] = useState<"mujer" | "hombre" | "unisex">(
    initialData?.audience ?? "hombre",
  );
  const [status, setStatus] = useState<"draft" | "active" | "archived">(
    initialData?.status ?? "active",
  );
  const [badgeLabel, setBadgeLabel] = useState(initialData?.badgeLabel ?? "");
  const [sortOrder, setSortOrder] = useState(String(initialData?.sortOrder ?? 0));
  const [isNew, setIsNew] = useState(initialData?.isNew ?? false);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [isWholesale, setIsWholesale] = useState(initialData?.isWholesale ?? true);

  const [retailPricePen, setRetailPricePen] = useState(
    initialData?.retailPricePen ?? "140.00",
  );
  const [compareAtPricePen, setCompareAtPricePen] = useState(
    initialData?.compareAtPricePen ?? "",
  );

  const [wholesaleTiers, setWholesaleTiers] = useState<
    Array<{ minQuantity: string; maxQuantity: string; pricePen: string }>
  >(
    initialData?.wholesaleTiers && initialData.wholesaleTiers.length > 0
      ? initialData.wholesaleTiers
      : [
          { minQuantity: "6", maxQuantity: "11", pricePen: "115.00" },
          { minQuantity: "12", maxQuantity: "", pricePen: "98.00" },
        ],
  );

  const initialImgState = useMemo(
    () => buildInitialImageState(initialData?.images),
    [initialData?.images],
  );

  // Presentación principal del producto (4 tipos + fotos adicionales)
  const [mainPortadaUrl, setMainPortadaUrl] = useState<string | null>(
    initialImgState.mainPortada,
  );
  const [mainCercaUrl, setMainCercaUrl] = useState<string | null>(
    initialImgState.mainCerca,
  );
  const [mainReversoUrl, setMainReversoUrl] = useState<string | null>(
    initialImgState.mainReverso,
  );
  const [mainFichaUrl, setMainFichaUrl] = useState<string | null>(
    initialImgState.mainFicha,
  );
  const [mainExtraUrls, setMainExtraUrls] = useState<string[]>(
    initialImgState.mainExtras,
  );

  // Color actualmente vinculado a la Portada principal (siempre enlazado a un color)
  const [portadaColorKey, setPortadaColorKey] = useState<string | null>(() => {
    if (initialImgState.detectedPortadaColorKey) {
      return initialImgState.detectedPortadaColorKey;
    }
    const firstVariantColor = (
      initialData?.variants?.[0]?.colorName ?? "Azul Marino"
    ).trim();
    return firstVariantColor ? normalizeColorKey(firstVariantColor) : null;
  });
  const [portadaColorWarning, setPortadaColorWarning] = useState<{
    colorKey: string;
    colorName: string;
  } | null>(null);

  // Galerías específicas por cada color (opcionales)
  const [colorGalleries, setColorGalleries] = useState<
    Record<string, ColorImageGallery>
  >(initialImgState.colorGalleries);

  const [variants, setVariants] = useState<
    Array<{
      id?: number;
      sku: string;
      size: string;
      colorName: string;
      colorSwatch: string;
      stock: string;
      isActive: boolean;
      hasHistoricalReferences?: boolean;
    }>
  >(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants
      : [
          {
            sku: "AC-NEW-001-30",
            size: "30",
            colorName: "Azul Marino",
            colorSwatch: "#153875",
            stock: "15",
            isActive: true,
          },
          {
            sku: "AC-NEW-001-32",
            size: "32",
            colorName: "Azul Marino",
            colorSwatch: "#153875",
            stock: "20",
            isActive: true,
          },
        ],
  );

  // Colores creados manualmente con "+ Nuevo Color" (disponibles incluso antes de añadir su 1ra talla)
  const [customColors, setCustomColors] = useState<
    Array<{ name: string; swatch: string }>
  >([]);

  const uniqueVariantColors = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; swatch: string; sizesCount: number }
    >();
    for (const v of variants) {
      const cleanName = v.colorName.trim();
      if (!cleanName) continue;
      const key = normalizeColorKey(cleanName);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          name: cleanName,
          swatch: normalizeSafeHexColor(v.colorSwatch),
          sizesCount: 1,
        });
      } else {
        existing.sizesCount += 1;
      }
    }
    for (const cc of customColors) {
      const cleanName = cc.name.trim();
      if (!cleanName) continue;
      const key = normalizeColorKey(cleanName);
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: cleanName,
          swatch: normalizeSafeHexColor(cc.swatch),
          sizesCount: 0,
        });
      }
    }
    return Array.from(map.values());
  }, [variants, customColors]);

  // Filtros interactivos por color (Sección 03 Variantes y Sección 04 Imágenes por Color)
  const [variantColorFilter, setVariantColorFilter] = useState<string>(() => {
    if (initialImgState.detectedPortadaColorKey) {
      return initialImgState.detectedPortadaColorKey;
    }
    const firstVariantColor = (initialData?.variants?.[0]?.colorName ?? "Azul Marino").trim();
    return firstVariantColor ? normalizeColorKey(firstVariantColor) : "all";
  });
  const [imageColorFilter, setImageColorFilter] = useState<string>(() => {
    if (initialImgState.detectedPortadaColorKey) {
      return initialImgState.detectedPortadaColorKey;
    }
    const firstVariantColor = (initialData?.variants?.[0]?.colorName ?? "Azul Marino").trim();
    return firstVariantColor ? normalizeColorKey(firstVariantColor) : "all";
  });

  // Panel "+ Nuevo Color"
  const [showNewColorPanel, setShowNewColorPanel] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorSwatch, setNewColorSwatch] = useState("#1E3A8A");
  const [newColorError, setNewColorError] = useState<string | null>(null);

  // Modal "¿De qué color crear la nueva variante?" cuando el filtro está en "Todos"
  const [variantColorPickerOpen, setVariantColorPickerOpen] = useState(false);
  const [highlightedVariantIdx, setHighlightedVariantIdx] = useState<number | null>(null);

  useEffect(() => {
    if (highlightedVariantIdx === null) return;
    const scrollTimer = window.setTimeout(() => {
      const rowEl = document.getElementById(`variant-row-${highlightedVariantIdx}`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
        const skuInput = rowEl.querySelector<HTMLInputElement>("input[data-sku-input]");
        skuInput?.focus();
        skuInput?.select();
      }
    }, 90);
    const clearTimer = window.setTimeout(() => {
      setHighlightedVariantIdx(null);
    }, 2800);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightedVariantIdx]);

  // Si el color filtrado dejó de existir, volver de forma segura a "all" o al primer color
  const effectiveVariantFilter = useMemo(() => {
    if (variantColorFilter === "all") return "all";
    const exists = uniqueVariantColors.some((c) => c.key === variantColorFilter);
    return exists ? variantColorFilter : "all";
  }, [variantColorFilter, uniqueVariantColors]);

  const effectiveImageFilter = useMemo(() => {
    if (imageColorFilter === "all") return "all";
    const exists = uniqueVariantColors.some((c) => c.key === imageColorFilter);
    return exists ? imageColorFilter : uniqueVariantColors[0]?.key ?? "all";
  }, [imageColorFilter, uniqueVariantColors]);

  // La portada siempre está vinculada a un color válido del producto
  const effectivePortadaColorKey = useMemo(() => {
    if (
      portadaColorKey &&
      uniqueVariantColors.some((c) => c.key === portadaColorKey)
    ) {
      return portadaColorKey;
    }
    return uniqueVariantColors[0]?.key ?? null;
  }, [portadaColorKey, uniqueVariantColors]);

  const effectivePortadaColor = useMemo(
    () => uniqueVariantColors.find((c) => c.key === effectivePortadaColorKey) ?? null,
    [uniqueVariantColors, effectivePortadaColorKey],
  );

  const activeVariantColorObj = useMemo(
    () => uniqueVariantColors.find((c) => c.key === effectiveVariantFilter) ?? null,
    [uniqueVariantColors, effectiveVariantFilter],
  );

  const visibleVariantsWithIndex = useMemo(() => {
    return variants
      .map((variant, originalIndex) => ({ variant, originalIndex }))
      .filter(({ variant }) => {
        if (effectiveVariantFilter === "all") return true;
        return normalizeColorKey(variant.colorName) === effectiveVariantFilter;
      });
  }, [variants, effectiveVariantFilter]);

  const visibleImageColors = useMemo(() => {
    if (effectiveImageFilter === "all") return uniqueVariantColors;
    return uniqueVariantColors.filter((c) => c.key === effectiveImageFilter);
  }, [uniqueVariantColors, effectiveImageFilter]);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialData) {
      setSlug(normalizeCommercialSlug(val));
    }
  };

  const handleAddWholesaleTier = () => {
    setWholesaleTiers((prev) => [
      ...prev,
      { minQuantity: "24", maxQuantity: "", pricePen: "" },
    ]);
  };

  const handleRemoveWholesaleTier = (index: number) => {
    setWholesaleTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMainSlot = (
    slot: "portada" | "cerca" | "reverso",
    url: string | null,
  ) => {
    if (slot === "portada") setMainPortadaUrl(url);
    if (slot === "cerca") setMainCercaUrl(url);
    if (slot === "reverso") setMainReversoUrl(url);

    // Toda foto de portada se sincroniza obligatoriamente con el color vinculado
    if (effectivePortadaColorKey) {
      setColorGalleries((prev) => {
        const current = prev[effectivePortadaColorKey] ?? {
          portada: null,
          cerca: null,
          reverso: null,
          extras: [],
        };
        return {
          ...prev,
          [effectivePortadaColorKey]: {
            ...current,
            [slot]: url,
          },
        };
      });
    }
  };

  const updateColorGallerySlot = (
    colorKey: string,
    slot: "portada" | "cerca" | "reverso",
    url: string | null,
  ) => {
    setColorGalleries((prev) => {
      const current = prev[colorKey] ?? {
        portada: null,
        cerca: null,
        reverso: null,
        extras: [],
      };
      return {
        ...prev,
        [colorKey]: {
          ...current,
          [slot]: url,
        },
      };
    });

    // Si el color editado es el que está activo como Portada, reflejar el cambio arriba también
    if (effectivePortadaColorKey === colorKey) {
      if (slot === "portada") setMainPortadaUrl(url);
      if (slot === "cerca") setMainCercaUrl(url);
      if (slot === "reverso") setMainReversoUrl(url);
    }

    // Limpiar aviso si se acaban de completar las fotos de ese color
    if (portadaColorWarning?.colorKey === colorKey && url) {
      setPortadaColorWarning(null);
    }
  };

  const handleSelectPortadaColor = (color: { key: string; name: string }) => {
    const gal = colorGalleries[color.key];
    const hasPortada = Boolean(gal?.portada?.trim());
    const hasCerca = Boolean(gal?.cerca?.trim());
    const mainIsCompletelyEmpty = !mainPortadaUrl?.trim() && !mainCercaUrl?.trim();

    // Si es un producto nuevo sin fotos aún en portada, permitimos elegir el color directamente para subirlas ahí
    if (mainIsCompletelyEmpty) {
      setPortadaColorKey(color.key);
      setImageColorFilter(color.key);
      setPortadaColorWarning(null);
      return;
    }

    if (!hasPortada || !hasCerca) {
      setPortadaColorWarning({ colorKey: color.key, colorName: color.name });
      return;
    }

    setPortadaColorKey(color.key);
    setPortadaColorWarning(null);
    setMainPortadaUrl(gal.portada);
    setMainCercaUrl(gal.cerca);
    setMainReversoUrl(gal.reverso ?? null);
  };

  const addColorExtraSlot = (colorKey: string) => {
    setColorGalleries((prev) => {
      const current = prev[colorKey] ?? {
        portada: null,
        cerca: null,
        reverso: null,
        extras: [],
      };
      return {
        ...prev,
        [colorKey]: {
          ...current,
          extras: [...current.extras, ""],
        },
      };
    });
  };

  const updateColorExtraSlot = (colorKey: string, idx: number, url: string) => {
    setColorGalleries((prev) => {
      const current = prev[colorKey];
      if (!current) return prev;
      return {
        ...prev,
        [colorKey]: {
          ...current,
          extras: current.extras.map((item, i) => (i === idx ? url : item)),
        },
      };
    });
  };

  const removeColorExtraSlot = (colorKey: string, idx: number) => {
    setColorGalleries((prev) => {
      const current = prev[colorKey];
      if (!current) return prev;
      return {
        ...prev,
        [colorKey]: {
          ...current,
          extras: current.extras.filter((_, i) => i !== idx),
        },
      };
    });
  };

  const createVariantForColor = (colorName: string, colorSwatch: string) => {
    const cleanName = colorName.trim() || "Negro";
    const cleanSwatch = normalizeSafeHexColor(colorSwatch);
    const baseCode = (slug || "AC-PRENDA")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    const colorCode = cleanName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3) || "CLR";

    const nextIndex = variants.length;
    const sameColorCount = variants.filter(
      (v) => normalizeColorKey(v.colorName) === normalizeColorKey(cleanName),
    ).length;

    const existingSkus = new Set(variants.map((v) => v.sku.toUpperCase()));
    let suffixNum = sameColorCount + 1;
    let candidateSku = `${baseCode}-${colorCode}-${suffixNum}`;
    while (existingSkus.has(candidateSku)) {
      suffixNum += 1;
      candidateSku = `${baseCode}-${colorCode}-${suffixNum}`;
    }

    setVariants((prev) => [
      ...prev,
      {
        sku: candidateSku,
        size: "",
        colorName: cleanName,
        colorSwatch: cleanSwatch,
        stock: "10",
        isActive: true,
      },
    ]);
    setHighlightedVariantIdx(nextIndex);
  };

  const handleRequestAddVariant = () => {
    if (effectiveVariantFilter === "all") {
      if (uniqueVariantColors.length > 0) {
        setVariantColorPickerOpen(true);
      } else {
        setShowNewColorPanel(true);
      }
      return;
    }

    const active = uniqueVariantColors.find((c) => c.key === effectiveVariantFilter);
    if (active) {
      createVariantForColor(active.name, active.swatch);
    } else {
      setVariantColorPickerOpen(true);
    }
  };

  const handleSaveNewColor = () => {
    setNewColorError(null);
    const cleanName = newColorName.trim();
    if (cleanName.length < 2) {
      setNewColorError("Ingresa un nombre válido para el color (mín. 2 letras).");
      return;
    }
    const cleanHex = normalizeSafeHexColor(newColorSwatch).toUpperCase();
    const key = normalizeColorKey(cleanName);

    const alreadyExists = uniqueVariantColors.some((c) => c.key === key);
    if (alreadyExists) {
      setVariantColorFilter(key);
      setImageColorFilter(key);
      setShowNewColorPanel(false);
      setNewColorName("");
      return;
    }

    setCustomColors((prev) => [...prev, { name: cleanName, swatch: cleanHex }]);
    setVariantColorFilter(key);
    setImageColorFilter(key);
    setShowNewColorPanel(false);
    setNewColorName("");
    setNewColorError(null);
  };

  const handleRemoveVariant = (index: number) => {
    const target = variants[index];
    if (target?.hasHistoricalReferences) {
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, isActive: false, stock: "0" } : v)),
      );
      return;
    }
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!mainPortadaUrl?.trim()) {
      setFeedback({
        type: "error",
        text: "Debes subir la imagen obligatoria de Portada (con el modelo) en la Sección 04 antes de guardar.",
      });
      document
        .getElementById("section-product-gallery")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!mainCercaUrl?.trim()) {
      setFeedback({
        type: "error",
        text: "Debes subir la imagen obligatoria de Cerca (detalle de la prenda) en la Sección 04 antes de guardar.",
      });
      document
        .getElementById("section-product-gallery")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const baseName = name.trim() || "Prenda American Colt";
    const assembledImages: AdminProductSavePayload["images"] = [
      {
        url: mainPortadaUrl.trim(),
        alt: `${baseName} — Portada con modelo`,
        isPrimary: true,
        imageType: "portada",
        colorName: null,
      },
      {
        url: mainCercaUrl.trim(),
        alt: `${baseName} — Vista de cerca`,
        isPrimary: false,
        imageType: "cerca",
        colorName: null,
      },
    ];

    if (mainReversoUrl?.trim()) {
      assembledImages.push({
        url: mainReversoUrl.trim(),
        alt: `${baseName} — Vista posterior / reverso`,
        isPrimary: false,
        imageType: "reverso",
        colorName: null,
      });
    }

    if (mainFichaUrl?.trim()) {
      assembledImages.push({
        url: mainFichaUrl.trim(),
        alt: `${baseName} — Ficha técnica`,
        isPrimary: false,
        imageType: "ficha",
        colorName: null,
      });
    }

    mainExtraUrls.forEach((u, idx) => {
      if (u.trim()) {
        assembledImages.push({
          url: u.trim(),
          alt: `${baseName} — Vista adicional ${idx + 1}`,
          isPrimary: false,
          imageType: "galeria",
          colorName: null,
        });
      }
    });

    // Adjuntar fotos específicas por cada color registrado en las variantes
    // (garantizando siempre que el color activo en portada quede enlazado a sus fotos)
    for (const color of uniqueVariantColors) {
      const gal = colorGalleries[color.key];
      const isPortadaColor = color.key === effectivePortadaColorKey;
      const colorPortada = gal?.portada?.trim() || (isPortadaColor ? mainPortadaUrl.trim() : "");
      const colorCerca = gal?.cerca?.trim() || (isPortadaColor ? mainCercaUrl.trim() : "");
      const colorReverso =
        gal?.reverso?.trim() || (isPortadaColor ? mainReversoUrl?.trim() ?? "" : "");
      const colorExtras = gal?.extras ?? [];

      if (colorPortada) {
        assembledImages.push({
          url: colorPortada,
          alt: `${baseName} — Color ${color.name} (Modelo)`,
          isPrimary: false,
          imageType: "portada",
          colorName: color.name,
        });
      }
      if (colorCerca) {
        assembledImages.push({
          url: colorCerca,
          alt: `${baseName} — Color ${color.name} (De cerca)`,
          isPrimary: false,
          imageType: "cerca",
          colorName: color.name,
        });
      }
      if (colorReverso) {
        assembledImages.push({
          url: colorReverso,
          alt: `${baseName} — Color ${color.name} (Reverso)`,
          isPrimary: false,
          imageType: "reverso",
          colorName: color.name,
        });
      }
      colorExtras.forEach((u, idx) => {
        if (u.trim()) {
          assembledImages.push({
            url: u.trim(),
            alt: `${baseName} — Color ${color.name} (Foto ${idx + 4})`,
            isPrimary: false,
            imageType: "galeria",
            colorName: color.name,
          });
        }
      });
    }

    const payload: AdminProductSavePayload = {
      id: initialData?.id ?? null,
      name,
      slug,
      brand,
      shortDescription,
      fullDescription,
      categoryId: Number(categoryId),
      audience,
      status,
      badgeLabel,
      sortOrder: Number(sortOrder) || 0,
      isNew,
      isFeatured,
      isWholesale,
      retailPricePen,
      compareAtPricePen: compareAtPricePen.trim() || null,
      wholesaleTiers: isWholesale ? wholesaleTiers : [],
      images: assembledImages,
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        colorName: v.colorName,
        colorSwatch: v.colorSwatch,
        stock: Number(v.stock) || 0,
        isActive: v.isActive,
      })),
    };

    startTransition(async () => {
      const res = await adminSaveProductAction(payload);
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo guardar el producto.",
        });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Producto guardado correctamente.",
      });

      if (!initialData && res.entityId) {
        router.push(`/admin/productos/${res.entityId}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleQuickArchive = (nextStatus: "active" | "draft" | "archived") => {
    if (!initialData?.id) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await adminSetProductStatusAction({
        productId: initialData.id,
        status: nextStatus,
      });
      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "Error al cambiar estado." });
        return;
      }
      setStatus(nextStatus);
      setFeedback({ type: "success", text: res.message ?? "Estado actualizado." });
      router.refresh();
    });
  };

  const handleConfirmDelete = () => {
    if (!initialData?.id) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await adminDeleteProductAction({ productId: initialData.id });
      if (!res.success) {
        setDeleteError(res.error ?? "No se pudo eliminar el producto.");
        return;
      }
      setDeleteModalOpen(false);
      router.push("/admin/productos");
      router.refresh();
    });
  };

  // Cálculos visuales en vivo
  const retailNum = parseFloat(retailPricePen) || 0;
  const compareNum = parseFloat(compareAtPricePen) || 0;
  const liveDiscountPct =
    compareNum > retailNum && retailNum > 0
      ? Math.round((1 - retailNum / compareNum) * 100)
      : null;

  const totalVariantsStock = variants.reduce(
    (sum, v) => sum + (v.isActive ? Math.max(0, parseInt(v.stock, 10) || 0) : 0),
    0,
  );
  const activeVariantsCount = variants.filter((v) => v.isActive).length;
  const mainUploadedCount =
    (mainPortadaUrl ? 1 : 0) +
    (mainCercaUrl ? 1 : 0) +
    (mainReversoUrl ? 1 : 0) +
    (mainFichaUrl ? 1 : 0) +
    mainExtraUrls.filter((u) => u.trim()).length;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        {/* ─── Barra Superior Flotante de Acciones ─── */}
        <div className="sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white/95 px-5 py-3.5 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.14)] backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/productos"
              className="group inline-flex h-10 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
            >
              <ArrowLeft
                className="size-3.5 transition-transform group-hover:-translate-x-0.5"
                aria-hidden
              />
              <span>Volver a Productos</span>
            </Link>

            {initialData?.id && status === "active" && (
              <Link
                href={`/producto/${slug}`}
                target="_blank"
                className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-2xl border-2 border-blue-100 bg-blue-50/70 px-3.5 text-xs font-bold text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                <span>Ver en tienda</span>
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {initialData?.id && (
              <>
                {status !== "archived" ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleQuickArchive("archived")}
                    className="inline-flex h-10 items-center gap-1.5 rounded-2xl border-2 border-amber-200 bg-amber-50/80 px-4 text-xs font-extrabold text-amber-800 shadow-[0_2px_0_#FDE68A] transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100 active:translate-y-0 disabled:opacity-50"
                  >
                    <Archive className="size-3.5" aria-hidden />
                    <span>Archivar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleQuickArchive("active")}
                    className="inline-flex h-10 items-center gap-1.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/90 px-4 text-xs font-extrabold text-emerald-800 shadow-[0_2px_0_#A7F3D0] transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 active:translate-y-0 disabled:opacity-50"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    <span>Reactivar</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isPending || isDeleting}
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteModalOpen(true);
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-2xl border-2 border-red-200 bg-red-50/80 px-4 text-xs font-extrabold text-[#DC2626] shadow-[0_2px_0_#FECACA] transition-all hover:-translate-y-0.5 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white hover:shadow-[0_4px_0_#991B1B] active:translate-y-0 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  <span>Eliminar</span>
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="bg-flow inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_10px_24px_-6px_rgba(220,38,38,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_6px_0_#7F1D1D,0_14px_28px_-6px_rgba(220,38,38,0.6)] active:translate-y-0.5 active:shadow-[0_1px_0_#7F1D1D] disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>Guardando en Neon...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  <span>{initialData ? "Guardar Cambios" : "Publicar Producto"}</span>
                </>
              )}
            </button>
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
              className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-xs font-semibold shadow-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white text-emerald-950"
                  : "border-red-200 bg-gradient-to-r from-red-50 to-white text-red-950"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" aria-hidden />
              )}
              <span>{feedback.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {initialData?.hasHistoricalOrdersOrQuotes && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-white p-4 text-xs text-amber-950 shadow-2xs">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <p>
              <strong>Protección de Integridad Histórica Activa:</strong> Este producto cuenta con pedidos o cotizaciones registradas. Puedes editar sus precios, descripciones y variantes con total libertad; los pedidos pasados conservarán siempre sus snapshots inmutables.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECCIÓN 1: IDENTIDAD DEL PRODUCTO
            ════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-red-50/70 via-white to-white px-6 py-4">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] font-mono text-sm font-black text-white shadow-md shadow-red-500/25">
                01
              </span>
              <div>
                <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#DC2626]">
                  IDENTIDAD COMERCIAL
                </p>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Nombre, Marca, Categoría y Visibilidad
                </h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-[0.65rem] font-bold text-slate-600 shadow-2xs">
              <Package className="size-3.5 text-[#DC2626]" aria-hidden />
              <span>Ficha Principal</span>
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="prod-name" className={LABEL_CLASS}>
                  Nombre Comercial del Producto *
                </label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Pantalón Drill King 767 — Skinny Fit"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="prod-slug" className={LABEL_CLASS}>
                  Slug URL (Único) *
                </label>
                <input
                  id="prod-slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(normalizeCommercialSlug(e.target.value))}
                  placeholder="pantalon-drill-king-767"
                  className={`${INPUT_CLASS} font-mono text-xs`}
                />
              </div>

              <div>
                <label htmlFor="prod-brand" className={LABEL_CLASS}>
                  Marca / Atelier *
                </label>
                <input
                  id="prod-brand"
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="prod-category" className={LABEL_CLASS}>
                    Categoría *
                  </label>
                  <Link
                    href="/admin/categorias"
                    className="text-[0.62rem] font-extrabold text-[#DC2626] hover:underline"
                  >
                    + Gestionar
                  </Link>
                </div>
                <select
                  id="prod-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className={INPUT_CLASS}
                >
                  {categories.map((cat) => {
                    const parent = cat.parentId
                      ? categories.find((p) => p.id === cat.parentId)
                      : null;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {parent ? `↳ ${cat.name} (${parent.name})` : cat.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="prod-audience" className={LABEL_CLASS}>
                  Colección / Audiencia *
                </label>
                <select
                  id="prod-audience"
                  value={audience}
                  onChange={(e) =>
                    setAudience(e.target.value as "mujer" | "hombre" | "unisex")
                  }
                  className={INPUT_CLASS}
                >
                  <option value="hombre">Hombre</option>
                  <option value="mujer">Mujer</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div>
                <label htmlFor="prod-status" className={LABEL_CLASS}>
                  Estado de Publicación *
                </label>
                <select
                  id="prod-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "draft" | "active" | "archived")
                  }
                  className={INPUT_CLASS}
                >
                  <option value="active">Activo (Visible en tienda)</option>
                  <option value="draft">Borrador (Oculto al público)</option>
                  <option value="archived">Archivado / Desactivado</option>
                </select>
              </div>

              <div>
                <label htmlFor="prod-badge" className={LABEL_CLASS}>
                  Insignia Editorial (Opcional)
                </label>
                <input
                  id="prod-badge"
                  type="text"
                  value={badgeLabel}
                  onChange={(e) => setBadgeLabel(e.target.value)}
                  placeholder="Ej: Top Ventas, Edición Limitada"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="prod-sort" className={LABEL_CLASS}>
                  Orden de Prioridad
                </label>
                <input
                  id="prod-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={`${INPUT_CLASS} font-mono`}
                />
              </div>
            </div>

            {/* ─── Interruptores Modernos Interactivos (Tarjetas Toggle) ─── */}
            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <label
                className={`group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isFeatured
                    ? "border-amber-400 bg-gradient-to-r from-amber-50/90 to-white shadow-sm"
                    : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex size-9 items-center justify-center rounded-xl transition-colors ${
                      isFeatured
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    <Star className="size-4" aria-hidden />
                  </span>
                  <div>
                    <span className="block text-xs font-extrabold text-slate-900">
                      Destacado
                    </span>
                    <span className="block text-[0.65rem] text-slate-500">
                      Priorizar en portada
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="size-4.5 rounded accent-amber-600"
                />
              </label>

              <label
                className={`group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isNew
                    ? "border-blue-400 bg-gradient-to-r from-blue-50/90 to-white shadow-sm"
                    : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex size-9 items-center justify-center rounded-xl transition-colors ${
                      isNew
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  <div>
                    <span className="block text-xs font-extrabold text-slate-900">
                      Novedad 2026
                    </span>
                    <span className="block text-[0.65rem] text-slate-500">
                      Etiqueta Nuevo Ingreso
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="size-4.5 rounded accent-blue-600"
                />
              </label>

              <label
                className={`group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isWholesale
                    ? "border-red-400 bg-gradient-to-r from-red-50/90 to-white shadow-sm"
                    : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex size-9 items-center justify-center rounded-xl transition-colors ${
                      isWholesale
                        ? "bg-[#DC2626] text-white shadow-xs"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    <Boxes className="size-4" aria-hidden />
                  </span>
                  <div>
                    <span className="block text-xs font-extrabold text-slate-900">
                      Mayorista B2B
                    </span>
                    <span className="block text-[0.65rem] text-slate-500">
                      Activar escalas volumen
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isWholesale}
                  onChange={(e) => setIsWholesale(e.target.checked)}
                  className="size-4.5 rounded accent-[#DC2626]"
                />
              </label>
            </div>

            {/* ─── Descripciones ─── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prod-shortDesc" className={LABEL_CLASS}>
                  Resumen Ejecutivo / Descripción Corta
                </label>
                <textarea
                  id="prod-shortDesc"
                  rows={3}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Descripción breve para tarjetas y vista rápida del catálogo..."
                  className="mt-1.5 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                />
              </div>

              <div>
                <label htmlFor="prod-fullDesc" className={LABEL_CLASS}>
                  Ficha Técnica / Descripción Completa
                </label>
                <textarea
                  id="prod-fullDesc"
                  rows={3}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Composición textil, gramaje, entalle, cuidados de lavado y confección peruana..."
                  className="mt-1.5 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════════════════════════
            SECCIÓN 2: MOTOR DE PRECIOS B2C Y ESCALAS B2B
            ════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-white to-white px-6 py-4">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] font-mono text-sm font-black text-white shadow-md shadow-blue-500/25">
                02
              </span>
              <div>
                <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-blue-700">
                  MOTOR DE PRECIOS B2C Y B2B (SOLES PEN)
                </p>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Tarifas Minoristas y Escalas por Volumen
                </h2>
              </div>
            </div>
            {liveDiscountPct && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3.5 py-1 font-mono text-xs font-black text-white shadow-sm">
                <Tag className="size-3" aria-hidden />
                <span>-{liveDiscountPct}% OFF B2C</span>
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                <label htmlFor="prod-retailPrice" className={LABEL_CLASS}>
                  Precio Minorista Unitario B2C (S/ PEN con IGV) *
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-black text-slate-400">
                    S/
                  </span>
                  <input
                    id="prod-retailPrice"
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={retailPricePen}
                    onChange={(e) => setRetailPricePen(e.target.value)}
                    className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-10 pr-4 font-mono text-lg font-black text-slate-900 transition-all focus:border-[#DC2626] focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                <label htmlFor="prod-comparePrice" className={LABEL_CLASS}>
                  Precio Anterior Tachado B2C (Opcional, S/ PEN)
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    id="prod-comparePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPricePen}
                    onChange={(e) => setCompareAtPricePen(e.target.value)}
                    placeholder="Ej: 185.00"
                    className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-10 pr-4 font-mono text-base font-bold text-slate-500 transition-all focus:border-blue-500 focus:text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            {isWholesale && (
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Escalas Mayoristas para Empresas Aprobadas (B2B)
                    </h3>
                    <p className="text-xs text-slate-500">
                      El servidor acumula automáticamente unidades de distintas tallas y colores de este modelo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWholesaleTier}
                    className="inline-flex h-10 items-center gap-1.5 rounded-2xl border-2 border-red-200 bg-red-50/80 px-4 text-xs font-extrabold text-[#DC2626] shadow-[0_2px_0_#FECACA] transition-all hover:-translate-y-0.5 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white active:translate-y-0"
                  >
                    <Plus className="size-4" aria-hidden />
                    <span>Añadir Escala</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {wholesaleTiers.map((tier, idx) => {
                      const tierNum = parseFloat(tier.pricePen) || 0;
                      const savingPct =
                        retailNum > 0 && tierNum > 0 && tierNum < retailNum
                          ? Math.round((1 - tierNum / retailNum) * 100)
                          : null;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid gap-3 rounded-2xl border-2 border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-12 items-end transition-colors hover:border-red-200/80"
                        >
                          <div className="sm:col-span-3">
                            <label className={LABEL_CLASS}>Cant. Mínima (uds.) *</label>
                            <input
                              type="number"
                              min="2"
                              required
                              value={tier.minQuantity}
                              onChange={(e) =>
                                setWholesaleTiers((prev) =>
                                  prev.map((t, i) =>
                                    i === idx ? { ...t, minQuantity: e.target.value } : t,
                                  ),
                                )
                              }
                              className="mt-1.5 h-10 w-full rounded-xl border-2 border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-900 focus:border-[#DC2626] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className={LABEL_CLASS}>Cant. Máxima (Opcional)</label>
                            <input
                              type="number"
                              min="2"
                              value={tier.maxQuantity}
                              placeholder="Sin tope"
                              onChange={(e) =>
                                setWholesaleTiers((prev) =>
                                  prev.map((t, i) =>
                                    i === idx ? { ...t, maxQuantity: e.target.value } : t,
                                  ),
                                )
                              }
                              className="mt-1.5 h-10 w-full rounded-xl border-2 border-slate-200 bg-white px-3 font-mono text-xs font-semibold text-slate-900 focus:border-[#DC2626] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <div className="flex items-center justify-between">
                              <label className={LABEL_CLASS}>Precio Unitario B2B *</label>
                              {savingPct && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[0.58rem] font-black text-emerald-800">
                                  -{savingPct}% vs B2C
                                </span>
                              )}
                            </div>
                            <div className="relative mt-1.5">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-black text-[#DC2626]">
                                S/
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="1"
                                required
                                value={tier.pricePen}
                                onChange={(e) =>
                                  setWholesaleTiers((prev) =>
                                    prev.map((t, i) =>
                                      i === idx ? { ...t, pricePen: e.target.value } : t,
                                    ),
                                  )
                                }
                                className="h-10 w-full rounded-xl border-2 border-red-200/80 bg-white pl-8 pr-3 font-mono text-sm font-black text-[#DC2626] focus:border-[#DC2626] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveWholesaleTier(idx)}
                              className="inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-red-200 bg-white px-3 text-xs font-extrabold text-[#DC2626] transition-all hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              <span>Quitar</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════════════════════════
            SECCIÓN 3: MATRIZ DE VARIANTES Y STOCK POR SKU (FILTRADO POR COLOR)
            ════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="section-product-variants"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-white to-white px-6 py-4">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 font-mono text-sm font-black text-white shadow-md shadow-emerald-500/25">
                03
              </span>
              <div>
                <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-emerald-700">
                  MATRIZ DE VARIANTES Y STOCK POR SKU
                </p>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Tallas, Colores, Códigos SKU y Disponibilidad
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-mono text-[0.68rem] font-extrabold text-emerald-800">
                Stock activo: {totalVariantsStock} uds. ({activeVariantsCount}/{variants.length})
              </span>

              <button
                type="button"
                onClick={() => {
                  setNewColorError(null);
                  setShowNewColorPanel((prev) => !prev);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 px-3.5 text-xs font-extrabold text-emerald-800 shadow-[0_2px_0_#A7F3D0] transition-all hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white active:translate-y-0"
              >
                <Palette className="size-3.5" aria-hidden />
                <span>+ Nuevo Color</span>
              </button>

              <button
                type="button"
                onClick={handleRequestAddVariant}
                className="bg-flow inline-flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_#1E3A8A,0_8px_18px_-4px_rgba(37,99,235,0.45)] transition-all hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <Layers className="size-3.5" aria-hidden />
                <span>
                  {activeVariantColorObj
                    ? `Añadir Variante (${activeVariantColorObj.name})`
                    : "Añadir Variante"}
                </span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* ─── Barra Interactiva de Colores + Opción "Todos" con Check ─── */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                  Filtrar variantes por color ({uniqueVariantColors.length}{" "}
                  {uniqueVariantColors.length === 1 ? "color" : "colores"})
                </p>
                <span className="text-[0.68rem] font-semibold text-slate-500">
                  Mostrando{" "}
                  <strong className="text-slate-900">
                    {visibleVariantsWithIndex.length}
                  </strong>{" "}
                  de {variants.length} variantes
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Botón "Todos" con icono de check interactivo */}
                <button
                  type="button"
                  onClick={() => setVariantColorFilter("all")}
                  className={`group inline-flex h-9 items-center gap-2 rounded-xl border-2 px-3 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${
                    effectiveVariantFilter === "all"
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  <span
                    className={`flex size-4 items-center justify-center rounded-md border transition-colors ${
                      effectiveVariantFilter === "all"
                        ? "border-emerald-400 bg-emerald-500 text-white"
                        : "border-slate-300 bg-slate-50 text-transparent"
                    }`}
                  >
                    <Check className="size-3 stroke-[3]" aria-hidden />
                  </span>
                  <span>Todos</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-black ${
                      effectiveVariantFilter === "all"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {variants.length}
                  </span>
                </button>

                {/* Fichas de cada color */}
                {uniqueVariantColors.map((color) => {
                  const isActive = effectiveVariantFilter === color.key;
                  return (
                    <button
                      key={color.key}
                      type="button"
                      onClick={() => setVariantColorFilter(color.key)}
                      className={`group inline-flex h-9 items-center gap-2 rounded-xl border-2 px-3 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${
                        isActive
                          ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A] shadow-sm ring-2 ring-blue-500/15"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                    >
                      <span
                        className="size-4 shrink-0 rounded-full border border-black/15 shadow-2xs ring-1 ring-white"
                        style={{ backgroundColor: color.swatch }}
                        aria-hidden
                      />
                      <span>{color.name}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-black ${
                          isActive
                            ? "bg-[#2563EB] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {color.sizesCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Panel Desplegable "+ Agregar Nuevo Color" ─── */}
            <AnimatePresence initial={false}>
              {showNewColorPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/40 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                          <Palette className="size-4" aria-hidden />
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-slate-900">
                            Crear Nuevo Color para este Producto
                          </h3>
                          <p className="text-[0.68rem] text-slate-500">
                            Se agregará arriba como opción lista para cargar sus tallas e imágenes.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewColorPanel(false);
                          setNewColorError(null);
                        }}
                        className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Cerrar panel de nuevo color"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-3.5 grid gap-3 sm:grid-cols-12 items-end">
                      <div className="sm:col-span-5">
                        <label htmlFor="new-color-name" className={LABEL_CLASS}>
                          Nombre del Color *
                        </label>
                        <input
                          id="new-color-name"
                          type="text"
                          value={newColorName}
                          onChange={(e) => {
                            setNewColorName(e.target.value);
                            setNewColorError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveNewColor();
                            }
                          }}
                          placeholder="Ej: Azul Oscuro, Verde Militar, Rojo..."
                          className="mt-1.5 h-10 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="new-color-hex" className={LABEL_CLASS}>
                          Selector y Código HEX
                        </label>
                        <div className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-2.5 focus-within:border-emerald-500">
                          <input
                            type="color"
                            aria-label="Elegir color visual"
                            value={normalizeSafeHexColor(newColorSwatch)}
                            onChange={(e) =>
                              setNewColorSwatch(e.target.value.toUpperCase())
                            }
                            className="size-6 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
                          />
                          <input
                            id="new-color-hex"
                            type="text"
                            value={newColorSwatch}
                            onChange={(e) => setNewColorSwatch(e.target.value)}
                            placeholder="#1E3A8A"
                            className="w-full min-w-0 bg-transparent font-mono text-xs font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:col-span-3">
                        <button
                          type="button"
                          onClick={handleSaveNewColor}
                          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-500 px-4 text-xs font-extrabold text-white shadow-[0_3px_0_#065F46] transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Check className="size-3.5" aria-hidden />
                          <span>Guardar Color</span>
                        </button>
                      </div>
                    </div>

                    {newColorError && (
                      <p
                        role="alert"
                        className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#DC2626]"
                      >
                        <AlertCircle className="size-3.5" aria-hidden />
                        <span>{newColorError}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Lista de Variantes Filtradas (o estado vacío para un color recién creado) ─── */}
            {visibleVariantsWithIndex.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-8 text-center">
                {activeVariantColorObj && (
                  <span
                    className="size-10 rounded-full border-2 border-white shadow-md ring-2 ring-blue-200"
                    style={{ backgroundColor: activeVariantColorObj.swatch }}
                    aria-hidden
                  />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900">
                    {activeVariantColorObj
                      ? `Aún no agregaste tallas para el color ${activeVariantColorObj.name}`
                      : "No hay variantes en este filtro"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Crea la primera variante de este color para asignarle su talla, código SKU y stock.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestAddVariant}
                  className="bg-flow inline-flex h-10 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_#1E3A8A] transition-all hover:-translate-y-0.5"
                >
                  <Plus className="size-4" aria-hidden />
                  <span>
                    Añadir primera talla en{" "}
                    {activeVariantColorObj?.name ?? "este color"}
                  </span>
                </button>
              </div>
            ) : (
              <div
                className={`space-y-3 ${
                  effectiveVariantFilter === "all" && visibleVariantsWithIndex.length > 8
                    ? "max-h-[560px] overflow-y-auto pr-1.5"
                    : ""
                }`}
              >
                {visibleVariantsWithIndex.map(({ variant: v, originalIndex: idx }) => {
                  const safeColor = normalizeSafeHexColor(v.colorSwatch);
                  const stockVal = parseInt(v.stock, 10) || 0;
                  const isHighlighted = highlightedVariantIdx === idx;

                  return (
                    <div
                      key={v.id ?? `new-${idx}`}
                      id={`variant-row-${idx}`}
                      className={`relative grid gap-3 rounded-2xl border-2 p-4 sm:grid-cols-12 items-end transition-all duration-300 ${
                        isHighlighted
                          ? "border-[#2563EB] bg-blue-50/70 shadow-md ring-4 ring-blue-500/20"
                          : v.isActive
                            ? "border-slate-100 bg-slate-50/60 hover:border-blue-200 hover:bg-white hover:shadow-xs"
                            : "border-slate-200/70 bg-slate-100/60 opacity-75"
                      }`}
                    >
                      {isHighlighted && (
                        <span className="absolute -top-2.5 right-4 rounded-full bg-[#2563EB] px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider text-white shadow-sm">
                          Nueva variante
                        </span>
                      )}

                      <div className="sm:col-span-3">
                        <label className={LABEL_CLASS}>Código SKU Único *</label>
                        <input
                          type="text"
                          required
                          data-sku-input
                          data-testid={`variant-sku-${idx}`}
                          value={v.sku}
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, sku: e.target.value.toUpperCase() }
                                  : item,
                              ),
                            )
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border-2 border-slate-200 bg-white px-3 font-mono text-xs font-black text-slate-900 focus:border-[#DC2626] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className={LABEL_CLASS}>Talla</label>
                        <input
                          type="text"
                          value={v.size}
                          placeholder="30, M"
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, size: e.target.value } : item,
                              ),
                            )
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border-2 border-slate-200 bg-white px-2.5 text-center text-xs font-extrabold text-slate-900 focus:border-[#DC2626] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={LABEL_CLASS}>Color</label>
                        <input
                          type="text"
                          value={v.colorName}
                          placeholder="Ej: Camello"
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, colorName: e.target.value } : item,
                              ),
                            )
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#DC2626] focus:outline-none"
                        />
                      </div>

                      {/* Selector de color visual + Hex */}
                      <div className="sm:col-span-2">
                        <label className={LABEL_CLASS}>Muestra Color</label>
                        <div className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-2 focus-within:border-[#DC2626]">
                          <input
                            type="color"
                            aria-label={`Elegir color para variante ${idx + 1}`}
                            value={safeColor}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? { ...item, colorSwatch: e.target.value.toUpperCase() }
                                    : item,
                                ),
                              )
                            }
                            className="size-6 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={v.colorSwatch}
                            placeholder="#141312"
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? { ...item, colorSwatch: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="w-full min-w-0 bg-transparent font-mono text-[0.7rem] font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className={LABEL_CLASS}>Stock (uds.) *</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={v.stock}
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, stock: e.target.value } : item,
                              ),
                            )
                          }
                          className={`mt-1.5 h-10 w-full rounded-xl border-2 bg-white px-3 font-mono text-xs font-black focus:outline-none ${
                            stockVal <= 0
                              ? "border-red-200 text-red-700 focus:border-red-500"
                              : stockVal <= 10
                                ? "border-amber-200 text-amber-800 focus:border-amber-500"
                                : "border-emerald-200 text-emerald-800 focus:border-emerald-500"
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 sm:col-span-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[0.68rem] font-extrabold text-slate-700 hover:border-slate-300">
                          <input
                            type="checkbox"
                            checked={v.isActive}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, isActive: e.target.checked } : item,
                                ),
                              )
                            }
                            className="size-3.5 accent-[#DC2626]"
                          />
                          <span>Activa</span>
                        </label>

                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            title={
                              v.hasHistoricalReferences
                                ? "Desactivar variante (protegida por historial de pedidos)"
                                : "Eliminar variante"
                            }
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-red-200 bg-white text-[#DC2626] transition-all hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════════════════════════
            SECCIÓN 4: GALERÍA DE IMÁGENES (DESDE ARCHIVOS) Y FOTOS POR COLOR
            ════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="section-product-gallery"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/70 via-white to-white px-6 py-4">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-purple-600 font-mono text-sm font-black text-white shadow-md shadow-violet-500/25">
                04
              </span>
              <div>
                <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-violet-700">
                  GALERÍA EDITORIAL DESDE ARCHIVOS (JPG · PNG · WEBP)
                </p>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Presentación Principal e Imágenes por Color
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-mono text-[0.66rem] font-extrabold text-violet-800">
                <Camera className="size-3.5" aria-hidden />
                <span>{mainUploadedCount} fotos principales</span>
              </span>
              {uniqueVariantColors.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-[0.66rem] font-extrabold text-blue-800">
                  <Palette className="size-3.5" aria-hidden />
                  <span>
                    {uniqueVariantColors.length}{" "}
                    {uniqueVariantColors.length === 1 ? "color" : "colores"}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* ─── SUB-BLOQUE A: PRESENTACIÓN PRINCIPAL DEL PRODUCTO ─── */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <ImageIcon className="size-4 text-[#DC2626]" aria-hidden />
                    <span>1. Presentación Principal (Portada del Producto)</span>
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Sube las fotos directo desde tu computadora o elige abajo qué color mostrar en portada. Solo{" "}
                    <strong className="text-[#DC2626]">Portada (Modelo)</strong> y{" "}
                    <strong className="text-[#DC2626]">De Cerca</strong> son obligatorias.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMainExtraUrls((prev) => [...prev, ""])}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-violet-200 bg-violet-50/80 px-3.5 text-xs font-extrabold text-violet-800 shadow-[0_2px_0_#DDD6FE] transition-all hover:-translate-y-0.5 hover:border-violet-600 hover:bg-violet-600 hover:text-white active:translate-y-0"
                >
                  <Plus className="size-3.5" aria-hidden />
                  <span>Añadir foto adicional</span>
                </button>
              </div>

              {/* ─── Selector: ¿De qué color mostrar la Portada? ─── */}
              {uniqueVariantColors.length > 0 && (
                <div className="rounded-2xl border-2 border-red-100/90 bg-gradient-to-r from-red-50/50 via-white to-amber-50/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Crown className="size-4 text-[#DC2626]" aria-hidden />
                      <span className="text-xs font-black text-slate-900">
                        ¿Qué color deseas mostrar como Portada principal en la tienda?
                      </span>
                    </div>
                    {effectivePortadaColor && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[0.62rem] font-extrabold text-emerald-800">
                        <CheckCircle2 className="size-3" aria-hidden />
                        <span>
                          Portada enlazada al color: {effectivePortadaColor.name}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {uniqueVariantColors.map((color) => {
                      const gal = colorGalleries[color.key];
                      const isSelectedPortada = effectivePortadaColorKey === color.key;
                      const isReady = Boolean(
                        (gal?.portada?.trim() && gal?.cerca?.trim()) ||
                          (isSelectedPortada &&
                            mainPortadaUrl?.trim() &&
                            mainCercaUrl?.trim()),
                      );

                      return (
                        <button
                          key={`portada-pick-${color.key}`}
                          type="button"
                          onClick={() => handleSelectPortadaColor(color)}
                          className={`inline-flex h-9 items-center gap-2 rounded-xl border-2 px-3 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${
                            isSelectedPortada
                              ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-sm"
                              : isReady
                                ? "border-emerald-200 bg-white text-slate-800 hover:border-[#DC2626]"
                                : "border-slate-200 bg-slate-50/80 text-slate-600 hover:border-amber-300 hover:bg-amber-50/50"
                          }`}
                        >
                          <span
                            className="size-4 shrink-0 rounded-full border border-black/15 ring-1 ring-white"
                            style={{ backgroundColor: color.swatch }}
                            aria-hidden
                          />
                          <span>{color.name}</span>
                          {isSelectedPortada ? (
                            <span className="rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[0.55rem] font-black uppercase">
                              En portada
                            </span>
                          ) : isReady ? (
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-mono text-[0.55rem] font-black text-emerald-800">
                              Listo ✓
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-slate-500">
                              Sin fotos
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Alerta amigable si eligió un color que todavía no tiene fotos subidas */}
                  <AnimatePresence>
                    {portadaColorWarning && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex flex-col gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            className="mt-0.5 size-4 shrink-0 text-amber-600"
                            aria-hidden
                          />
                          <p>
                            Para mostrar el color{" "}
                            <strong>{portadaColorWarning.colorName}</strong> en la portada,
                            primero debe tener sus imágenes de <strong>Portada</strong> y{" "}
                            <strong>De Cerca</strong> subidas.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setImageColorFilter(portadaColorWarning.colorKey);
                              setPortadaColorWarning(null);
                              document
                                .getElementById("section-color-galleries")
                                ?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-[0.68rem] font-extrabold text-white transition-colors hover:bg-amber-700"
                          >
                            <ArrowDownRight className="size-3.5" aria-hidden />
                            <span>Subir fotos de {portadaColorWarning.colorName}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AdminImageUploadSlot
                  title="1. Portada (Modelo)"
                  subtitle="Cómo se ve puesto en el modelo"
                  required
                  valueUrl={mainPortadaUrl}
                  altText={`${name || "Prenda"} — Portada`}
                  onUploaded={(url) => updateMainSlot("portada", url)}
                  onRemove={() => updateMainSlot("portada", null)}
                />

                <AdminImageUploadSlot
                  title="2. De Cerca"
                  subtitle="Detalle cercano de tela y prenda"
                  required
                  valueUrl={mainCercaUrl}
                  altText={`${name || "Prenda"} — De cerca`}
                  onUploaded={(url) => updateMainSlot("cerca", url)}
                  onRemove={() => updateMainSlot("cerca", null)}
                />

                <AdminImageUploadSlot
                  title="3. Reverso (Detrás)"
                  subtitle="Cómo se ve la prenda por atrás"
                  valueUrl={mainReversoUrl}
                  altText={`${name || "Prenda"} — Reverso`}
                  onUploaded={(url) => updateMainSlot("reverso", url)}
                  onRemove={() => updateMainSlot("reverso", null)}
                />

                <AdminImageUploadSlot
                  title="4. Ficha Técnica"
                  subtitle="Imagen informativa o medidas"
                  valueUrl={mainFichaUrl}
                  altText={`${name || "Prenda"} — Ficha técnica`}
                  onUploaded={(url) => setMainFichaUrl(url)}
                  onRemove={() => setMainFichaUrl(null)}
                />
              </div>

              {/* Fotos adicionales opcionales de la galería general */}
              {mainExtraUrls.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                    Fotos Adicionales de Presentación ({mainExtraUrls.length})
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {mainExtraUrls.map((extraUrl, idx) => (
                      <AdminImageUploadSlot
                        key={`main-extra-${idx}`}
                        title={`Foto Extra #${idx + 1}`}
                        subtitle="Vista adicional en galería"
                        compact
                        valueUrl={extraUrl || null}
                        altText={`${name || "Prenda"} — Extra ${idx + 1}`}
                        onUploaded={(url) =>
                          setMainExtraUrls((prev) =>
                            prev.map((item, i) => (i === idx ? url : item)),
                          )
                        }
                        onRemove={() =>
                          setMainExtraUrls((prev) => prev.filter((_, i) => i !== idx))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── SUB-BLOQUE B: IMÁGENES POR CADA COLOR (CON FILTRO INTERACTIVO) ─── */}
            <div
              id="section-color-galleries"
              className="space-y-4 border-t-2 border-dashed border-slate-200 pt-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Palette className="size-4 text-blue-600" aria-hidden />
                    <span>2. Imágenes por Cada Color (Cambio Automático en Tienda)</span>
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Selecciona un color abajo para subir sus fotos de forma ordenada, o activa{" "}
                    <strong>Todos</strong> para ver todas las galerías juntas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-3.5 text-xs text-blue-950">
                <Info className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
                <p>
                  Al subir las fotos de un color aquí, se guardan listas en memoria mientras cambias entre colores. Cuando un cliente elija ese color en la tienda, verá automáticamente sus fotos; si falta subirlas, verá el aviso{" "}
                  <strong>&ldquo;en proceso de subida&rdquo;</strong>.
                </p>
              </div>

              {uniqueVariantColors.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-xs text-slate-500">
                  Agrega al menos un color en la <strong>Sección 03 (Variantes)</strong> para habilitar la carga de imágenes por color.
                </div>
              ) : (
                <>
                  {/* Barra Interactiva de Filtro de Colores para Imágenes */}
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                      Selecciona el color para gestionar sus imágenes
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Botón "Todos" con check */}
                      <button
                        type="button"
                        onClick={() => setImageColorFilter("all")}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl border-2 px-3 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${
                          effectiveImageFilter === "all"
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        <span
                          className={`flex size-4 items-center justify-center rounded-md border transition-colors ${
                            effectiveImageFilter === "all"
                              ? "border-violet-400 bg-violet-500 text-white"
                              : "border-slate-300 bg-slate-50 text-transparent"
                          }`}
                        >
                          <Check className="size-3 stroke-[3]" aria-hidden />
                        </span>
                        <span>Todos</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-black ${
                            effectiveImageFilter === "all"
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {uniqueVariantColors.length}
                        </span>
                      </button>

                      {/* Fichas por color con contador de fotos */}
                      {uniqueVariantColors.map((color) => {
                        const gal = colorGalleries[color.key];
                        const count =
                          (gal?.portada ? 1 : 0) +
                          (gal?.cerca ? 1 : 0) +
                          (gal?.reverso ? 1 : 0) +
                          (gal?.extras.filter((u) => u.trim()).length ?? 0);
                        const isActive = effectiveImageFilter === color.key;
                        const isPortadaColor = effectivePortadaColorKey === color.key;

                        return (
                          <button
                            key={`img-tab-${color.key}`}
                            type="button"
                            onClick={() => setImageColorFilter(color.key)}
                            className={`inline-flex h-9 items-center gap-2 rounded-xl border-2 px-3 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${
                              isActive
                                ? "border-violet-600 bg-violet-50 text-violet-950 shadow-sm ring-2 ring-violet-500/15"
                                : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/30"
                            }`}
                          >
                            <span
                              className="size-4 shrink-0 rounded-full border border-black/15 shadow-2xs ring-1 ring-white"
                              style={{ backgroundColor: color.swatch }}
                              aria-hidden
                            />
                            <span>{color.name}</span>
                            {isPortadaColor && (
                              <Crown
                                className="size-3 text-[#DC2626]"
                                aria-label="Color en portada"
                              />
                            )}
                            <span
                              className={`rounded-full px-1.5 py-0.5 font-mono text-[0.58rem] font-black ${
                                count > 0
                                  ? isActive
                                    ? "bg-emerald-600 text-white"
                                    : "bg-emerald-100 text-emerald-800"
                                  : isActive
                                    ? "bg-violet-600 text-white"
                                    : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {count} {count === 1 ? "foto" : "fotos"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tarjeta(s) del color seleccionado o de todos */}
                  <div className="space-y-4">
                    {visibleImageColors.map((color) => {
                      const gal = colorGalleries[color.key] ?? {
                        portada: null,
                        cerca: null,
                        reverso: null,
                        extras: [],
                      };
                      const uploadedCount =
                        (gal.portada ? 1 : 0) +
                        (gal.cerca ? 1 : 0) +
                        (gal.reverso ? 1 : 0) +
                        gal.extras.filter((u) => u.trim()).length;
                      const isReadyForPortada = Boolean(
                        gal.portada?.trim() && gal.cerca?.trim(),
                      );
                      const isPortadaColor = effectivePortadaColorKey === color.key;

                      return (
                        <div
                          key={color.key}
                          className="overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-slate-50/40 shadow-2xs transition-all hover:border-violet-200"
                        >
                          {/* Encabezado del bloque de color */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <span
                                className="size-8 shrink-0 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-300"
                                style={{ backgroundColor: color.swatch }}
                                aria-hidden
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-black text-slate-900">
                                    Color: {color.name}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 font-mono text-[0.6rem] font-extrabold ${
                                      uploadedCount > 0
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {uploadedCount}{" "}
                                    {uploadedCount === 1 ? "foto subida" : "fotos subidas"}
                                  </span>
                                  {isPortadaColor && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 font-mono text-[0.58rem] font-black text-[#DC2626]">
                                      <Crown className="size-2.5" aria-hidden />
                                      Portada activa
                                    </span>
                                  )}
                                </div>
                                <p className="text-[0.68rem] text-slate-500">
                                  {color.sizesCount}{" "}
                                  {color.sizesCount === 1
                                    ? "variante/talla"
                                    : "variantes/tallas"}{" "}
                                  · <span className="font-mono">{color.swatch}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {!isPortadaColor && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectPortadaColor(color)}
                                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[0.68rem] font-extrabold transition-all ${
                                    isReadyForPortada
                                      ? "border-red-200 bg-red-50 text-[#DC2626] hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                                  }`}
                                >
                                  <Crown className="size-3" aria-hidden />
                                  <span>Usar en Portada</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => addColorExtraSlot(color.key)}
                                className="inline-flex h-8 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/80 px-3 text-[0.68rem] font-extrabold text-blue-700 transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white"
                              >
                                <Plus className="size-3" aria-hidden />
                                <span>Más fotos</span>
                              </button>
                            </div>
                          </div>

                          {/* 3 slots recomendados/opcionales + fotos extra por color */}
                          <div className="p-4 space-y-4">
                            <div className="grid gap-3.5 sm:grid-cols-3">
                              <AdminImageUploadSlot
                                title={`Portada — ${color.name}`}
                                subtitle="Modelo usando este color"
                                recommended
                                compact
                                valueUrl={gal.portada}
                                altText={`${name || "Prenda"} — ${color.name} Portada`}
                                onUploaded={(url) =>
                                  updateColorGallerySlot(color.key, "portada", url)
                                }
                                onRemove={() =>
                                  updateColorGallerySlot(color.key, "portada", null)
                                }
                              />

                              <AdminImageUploadSlot
                                title={`De Cerca — ${color.name}`}
                                subtitle="Detalle de prenda en este color"
                                recommended
                                compact
                                valueUrl={gal.cerca}
                                altText={`${name || "Prenda"} — ${color.name} De cerca`}
                                onUploaded={(url) =>
                                  updateColorGallerySlot(color.key, "cerca", url)
                                }
                                onRemove={() =>
                                  updateColorGallerySlot(color.key, "cerca", null)
                                }
                              />

                              <AdminImageUploadSlot
                                title={`Reverso — ${color.name}`}
                                subtitle="Vista posterior en este color"
                                compact
                                valueUrl={gal.reverso}
                                altText={`${name || "Prenda"} — ${color.name} Reverso`}
                                onUploaded={(url) =>
                                  updateColorGallerySlot(color.key, "reverso", url)
                                }
                                onRemove={() =>
                                  updateColorGallerySlot(color.key, "reverso", null)
                                }
                              />
                            </div>

                            {gal.extras.length > 0 && (
                              <div className="grid gap-3.5 sm:grid-cols-3 lg:grid-cols-4 pt-1">
                                {gal.extras.map((extraUrl, eIdx) => (
                                  <AdminImageUploadSlot
                                    key={`${color.key}-extra-${eIdx}`}
                                    title={`Extra #${eIdx + 1} — ${color.name}`}
                                    subtitle="Foto adicional de este color"
                                    compact
                                    valueUrl={extraUrl || null}
                                    altText={`${name || "Prenda"} — ${color.name} Extra ${eIdx + 1}`}
                                    onUploaded={(url) =>
                                      updateColorExtraSlot(color.key, eIdx, url)
                                    }
                                    onRemove={() =>
                                      removeColorExtraSlot(color.key, eIdx)
                                    }
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* ─── Pie de Confirmación Final 3D ─── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-red-50/40 p-5 shadow-sm">
          <p className="text-xs text-slate-500">
            Todos los cambios se sincronizan instantáneamente con el catálogo público y el motor B2B en <strong>Neon PostgreSQL</strong>.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/productos"
              className="inline-flex h-11 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-5 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="bg-flow inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-7 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_10px_24px_-6px_rgba(220,38,38,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_#7F1D1D] disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  <span>{initialData ? "Guardar Cambios" : "Publicar Producto"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ─── Modal Moderno: ¿De qué color crear la nueva variante? (cuando el filtro está en "Todos") ─── */}
      <AnimatePresence>
        {variantColorPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVariantColorPickerOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pick-color-modal-title"
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-white px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-sm">
                    <Layers className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h3
                      id="pick-color-modal-title"
                      className="text-sm font-black text-slate-900"
                    >
                      ¿De qué color es la nueva variante?
                    </h3>
                    <p className="text-[0.68rem] text-slate-500">
                      Te llevaremos directo a la nueva fila para ingresar su talla y SKU.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVariantColorPickerOpen(false)}
                  className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Cerrar"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {uniqueVariantColors.map((color) => (
                    <button
                      key={`modal-pick-${color.key}`}
                      type="button"
                      onClick={() => {
                        setVariantColorPickerOpen(false);
                        createVariantForColor(color.name, color.swatch);
                      }}
                      className="group flex items-center gap-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-blue-50/70 hover:shadow-sm"
                    >
                      <span
                        className="size-6 shrink-0 rounded-full border-2 border-white shadow-xs ring-1 ring-slate-300"
                        style={{ backgroundColor: color.swatch }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-black text-slate-900 group-hover:text-[#1E3A8A]">
                          {color.name}
                        </span>
                        <span className="block font-mono text-[0.6rem] text-slate-500">
                          {color.sizesCount}{" "}
                          {color.sizesCount === 1 ? "talla" : "tallas"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVariantColorPickerOpen(false);
                      setShowNewColorPanel(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-800 transition-colors hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                  >
                    <Palette className="size-3.5" aria-hidden />
                    <span>+ Crear nuevo color</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVariantColorPickerOpen(false)}
                    className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal Moderno Animado de Eliminación desde Editar ─── */}
      {initialData?.id && (
        <AdminProductDeleteModal
          product={
            deleteModalOpen
              ? {
                  id: initialData.id,
                  name: name || initialData.name,
                  slug: slug || initialData.slug,
                  imageUrl: mainPortadaUrl ?? undefined,
                  variantsCount: variants.length,
                }
              : null
          }
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
