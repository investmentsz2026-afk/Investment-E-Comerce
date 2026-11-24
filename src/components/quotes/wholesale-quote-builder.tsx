"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Building2,
  BadgePercent,
  MapPin,
  Send,
  Sparkles,
  Search,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { FaBoxesStacked, FaLayerGroup } from "react-icons/fa6";
import { submitWholesaleQuoteAction } from "@/server/actions/quotes";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CatalogSelectorProduct {
  id: number;
  slug: string;
  name: string;
  isWholesale: boolean;
  imageUrl: string;
  retailPrice: number;
  wholesaleTiers: {
    minQuantity: number;
    maxQuantity: number | null;
    amount: number;
  }[];
  variants: {
    id: number;
    sku: string;
    size: string | null;
    colorName: string | null;
    colorSwatch: string | null;
    stock: number;
  }[];
}

export interface InitialQuoteLine {
  variantId: number;
  quantity: number;
  itemNotes?: string;
}

interface WholesaleQuoteBuilderProps {
  catalogProducts: CatalogSelectorProduct[];
  initialLines?: InitialQuoteLine[];
  defaultDeliveryCity?: string;
  preselectedProductSlug?: string;
  isUserAuthorized?: boolean;
  isAuthenticated?: boolean;
  userRole?: string | null;
  /** Ruta base para ver el detalle de una cotización recién enviada. */
  quoteDetailBasePath?: string;
}

const QUOTE_DRAFT_KEY = "investments_quote_draft_v1";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getInitialDraft(
  variantInfoMap: Map<number, unknown>,
  initialLines: InitialQuoteLine[],
  defaultCity: string,
) {
  if (initialLines.length > 0) {
    return {
      lines: initialLines
        .filter((l) => variantInfoMap.has(l.variantId))
        .map((l) => ({
          variantId: l.variantId,
          quantity: Math.max(1, l.quantity),
          itemNotes: l.itemNotes ?? "",
        })),
      deliveryCity: defaultCity,
      commercialNeeds: "",
      customerNotes: "",
    };
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(QUOTE_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validLines = Array.isArray(parsed?.lines)
          ? parsed.lines.filter((l: { variantId: number }) => variantInfoMap.has(l.variantId))
          : [];
        return {
          lines: validLines,
          deliveryCity:
            typeof parsed?.deliveryCity === "string" && parsed.deliveryCity
              ? parsed.deliveryCity
              : defaultCity,
          commercialNeeds:
            typeof parsed?.commercialNeeds === "string" ? parsed.commercialNeeds : "",
          customerNotes:
            typeof parsed?.customerNotes === "string" ? parsed.customerNotes : "",
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    lines: [],
    deliveryCity: defaultCity,
    commercialNeeds: "",
    customerNotes: "",
  };
}

export function WholesaleQuoteBuilder({
  catalogProducts,
  initialLines = [],
  defaultDeliveryCity = "Lima",
  preselectedProductSlug,
  isUserAuthorized = false,
  isAuthenticated = false,
  userRole = null,
  quoteDetailBasePath = "/mayorista/cotizaciones",
}: WholesaleQuoteBuilderProps) {
  const router = useRouter();

  const variantInfoMap = useMemo(() => {
    const map = new Map<
      number,
      {
        product: CatalogSelectorProduct;
        variant: CatalogSelectorProduct["variants"][number];
      }
    >();
    for (const p of catalogProducts) {
      for (const v of p.variants) {
        map.set(v.id, { product: p, variant: v });
      }
    }
    return map;
  }, [catalogProducts]);

  const initialProduct = useMemo(() => {
    if (preselectedProductSlug) {
      const found = catalogProducts.find((p) => p.slug === preselectedProductSlug);
      if (found) return found.id;
    }
    return catalogProducts[0]?.id ?? 0;
  }, [catalogProducts, preselectedProductSlug]);

  const [selectedProductId, setSelectedProductId] = useState<number>(initialProduct);
  const currentProduct = useMemo(
    () => catalogProducts.find((p) => p.id === selectedProductId) ?? catalogProducts[0] ?? null,
    [catalogProducts, selectedProductId],
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    currentProduct?.variants[0]?.id ?? 0,
  );
  const [addQuantity, setAddQuantity] = useState<number>(
    currentProduct?.wholesaleTiers[0]?.minQuantity ?? 12,
  );
  const [addNotes, setAddNotes] = useState<string>("");

  // Estado para los comboboxes buscables de modelo y variante
  const [productOpen, setProductOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [variantOpen, setVariantOpen] = useState(false);
  const [variantQuery, setVariantQuery] = useState("");

  const productBoxRef = useRef<HTMLDivElement>(null);
  const variantBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (productBoxRef.current && !productBoxRef.current.contains(target)) {
        setProductOpen(false);
      }
      if (variantBoxRef.current && !variantBoxRef.current.contains(target)) {
        setVariantOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = normalizeSearch(productQuery);
    if (!q) return catalogProducts;
    return catalogProducts.filter((p) => {
      const haystack = normalizeSearch(`${p.name} ${p.slug}`);
      return haystack.includes(q);
    });
  }, [catalogProducts, productQuery]);

  const filteredVariants = useMemo(() => {
    const all = currentProduct?.variants ?? [];
    const q = normalizeSearch(variantQuery);
    if (!q) return all;
    return all.filter((v) => {
      const haystack = normalizeSearch(
        `${v.colorName ?? ""} ${v.size ?? ""} talla ${v.size ?? ""} ${v.sku}`,
      );
      return haystack.includes(q);
    });
  }, [currentProduct, variantQuery]);

  const [initialDraft] = useState(() =>
    getInitialDraft(variantInfoMap, initialLines, defaultDeliveryCity),
  );

  const [lines, setLines] = useState<
    Array<{ variantId: number; quantity: number; itemNotes: string }>
  >(initialDraft.lines);
  const [deliveryCity, setDeliveryCity] = useState(initialDraft.deliveryCity);
  const [commercialNeeds, setCommercialNeeds] = useState(initialDraft.commercialNeeds);
  const [customerNotes, setCustomerNotes] = useState(initialDraft.customerNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [successQuote, setSuccessQuote] = useState<{
    quoteId: number;
    quoteNumber: string;
  } | null>(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined" || successQuote) return;
      if (lines.length === 0 && !commercialNeeds && !customerNotes) {
        window.localStorage.removeItem(QUOTE_DRAFT_KEY);
      } else {
        window.localStorage.setItem(
          QUOTE_DRAFT_KEY,
          JSON.stringify({
            lines,
            commercialNeeds,
            customerNotes,
            deliveryCity,
          }),
        );
      }
    } catch {
      // ignore
    }
  }, [lines, commercialNeeds, customerNotes, deliveryCity, successQuote]);

  const handleProductChange = (prodId: number) => {
    setSelectedProductId(prodId);
    const prod = catalogProducts.find((p) => p.id === prodId);
    if (prod) {
      setSelectedVariantId(prod.variants[0]?.id ?? 0);
      setAddQuantity(prod.wholesaleTiers[0]?.minQuantity ?? 12);
    }
    setProductQuery("");
    setProductOpen(false);
    setVariantQuery("");
  };

  const handleVariantSelect = (variantId: number) => {
    setSelectedVariantId(variantId);
    setVariantQuery("");
    setVariantOpen(false);
  };

  const handleAddLine = () => {
    setErrorMessage(null);
    const info = variantInfoMap.get(selectedVariantId);
    if (!info) {
      setErrorMessage("Selecciona una variante válida de producto.");
      return;
    }
    const cleanQty = Math.trunc(Number(addQuantity));
    if (!Number.isFinite(cleanQty) || cleanQty < 1 || cleanQty > 50000) {
      setErrorMessage("Ingresa una cantidad entera válida entre 1 y 50,000 unidades.");
      return;
    }

    setLines((prev) => {
      const existingIdx = prev.findIndex((item) => item.variantId === selectedVariantId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + cleanQty,
          itemNotes: addNotes.trim() || next[existingIdx].itemNotes,
        };
        return next;
      }
      return [
        ...prev,
        {
          variantId: selectedVariantId,
          quantity: cleanQty,
          itemNotes: addNotes.trim(),
        },
      ];
    });
    setAddNotes("");
  };

  const handleUpdateLineQuantity = (variantId: number, newQty: number) => {
    const clean = Math.max(1, Math.min(50000, Math.trunc(newQty || 1)));
    setLines((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, quantity: clean } : l)),
    );
  };

  const handleRemoveLine = (variantId: number) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  };

  const summaryLines = useMemo(() => {
    const qtyByProduct = new Map<number, number>();
    for (const line of lines) {
      const info = variantInfoMap.get(line.variantId);
      if (!info) continue;
      qtyByProduct.set(
        info.product.id,
        (qtyByProduct.get(info.product.id) ?? 0) + line.quantity,
      );
    }

    return lines
      .map((line) => {
        const info = variantInfoMap.get(line.variantId);
        if (!info) return null;
        const { product, variant } = info;
        const groupQty = qtyByProduct.get(product.id) ?? line.quantity;

        let unitPrice = product.retailPrice;
        let appliedTierMin: number | null = null;

        if (product.isWholesale && product.wholesaleTiers.length > 0) {
          for (const tier of product.wholesaleTiers) {
            if (groupQty >= tier.minQuantity) {
              unitPrice = tier.amount;
              appliedTierMin = tier.minQuantity;
            }
          }
        }

        const subtotal = unitPrice * line.quantity;
        return {
          ...line,
          product,
          variant,
          unitPrice,
          appliedTierMin,
          subtotal,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [lines, variantInfoMap]);

  const totalUnits = useMemo(
    () => summaryLines.reduce((acc, l) => acc + l.quantity, 0),
    [summaryLines],
  );
  const estimatedSubtotal = useMemo(
    () => summaryLines.reduce((acc, l) => acc + l.subtotal, 0),
    [summaryLines],
  );

  const selectedVariantObj = useMemo(
    () =>
      currentProduct?.variants.find((v) => v.id === selectedVariantId) ??
      currentProduct?.variants[0] ??
      null,
    [currentProduct, selectedVariantId],
  );

  const selectedVariantDisplayLabel = selectedVariantObj
    ? `${selectedVariantObj.colorName ?? "Único"} · Talla ${selectedVariantObj.size ?? "Única"} (${selectedVariantObj.sku})`
    : "Selecciona color y talla";

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (summaryLines.length === 0) {
      setErrorMessage("Agrega al menos una prenda/variante a tu solicitud de cotización.");
      return;
    }

    if (commercialNeeds.trim().length < 10) {
      setErrorMessage(
        "Por favor describe tus necesidades comerciales o condiciones requeridas (mínimo 10 caracteres).",
      );
      return;
    }

    if (!isUserAuthorized) {
      setShowAuthGate(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitWholesaleQuoteAction({
        deliveryCity,
        commercialNeeds,
        customerNotes,
        items: summaryLines.map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
          itemNotes: l.itemNotes,
        })),
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error ?? "No se pudo registrar la cotización.");
        return;
      }

      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(QUOTE_DRAFT_KEY);
        }
      } catch {
        // ignore
      }

      setSuccessQuote(res.data);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successQuote) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <CheckCircle2 className="size-7" aria-hidden />
          </div>
          <div className="flex-1">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-emerald-800">
              Solicitud de Cotización Registrada
            </span>
            <h3 className="mt-3 font-sans text-2xl font-black tracking-tight text-slate-900">
              Expediente <span className="font-mono text-[#2563EB]">{successQuote.quoteNumber}</span> enviado con éxito
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Nuestro equipo de ventas corporativas revisará las cantidades, disponibilidad de producción y condiciones especiales solicitadas. Recibirás una propuesta económica formal con precios unitarios garantizados y fecha de vigencia.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`${quoteDetailBasePath}/${successQuote.quoteId}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#EF233C]"
              >
                Ver detalle de {successQuote.quoteNumber}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccessQuote(null);
                  setLines([]);
                  setCommercialNeeds("");
                  setCustomerNotes("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
              >
                Crear otra solicitud
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitQuote} className="space-y-4 sm:space-y-7">
      {!isUserAuthorized && (
        <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-white to-red-50/40 p-3.5 shadow-xs sm:rounded-2xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-start gap-2.5 sm:gap-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-xs sm:size-10 sm:rounded-xl">
                <FaBoxesStacked className="size-3.5 sm:size-4" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 sm:text-sm">
                  Modo Borrador de Cotización B2B
                </p>
                <p className="mt-0.5 text-[0.68rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
                  Arma tu lote libremente. Para emitir cotización formal con RUC necesitarás una cuenta empresarial.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
              {!isAuthenticated ? (
                <Link
                  href="/iniciar-sesion?next=/mayorista/cotizaciones"
                  className="inline-flex h-8 items-center justify-center rounded-full bg-slate-900 px-3 text-[0.6rem] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#EF233C] sm:h-9 sm:px-4 sm:text-[0.68rem]"
                >
                  Iniciar sesión
                </Link>
              ) : null}
              <Link
                href="/mayorista/registro"
                className="inline-flex h-8 items-center justify-center rounded-full border border-slate-300 bg-white px-3 text-[0.6rem] font-bold uppercase tracking-wider text-slate-800 transition-colors hover:border-slate-900 sm:h-9 sm:px-4 sm:text-[0.68rem]"
              >
                Registrar empresa
              </Link>
            </div>
          </div>
        </div>
      )}

      {showAuthGate && !isUserAuthorized && (
        <div
          className="rounded-3xl border-2 border-[#EF233C]/40 bg-white p-6 shadow-lg sm:p-8"
          role="alert"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#EF233C]">
              <Building2 className="size-6" aria-hidden />
            </div>
            <div className="flex-1">
              <h4 className="font-sans text-xl font-black text-slate-900">
                {isAuthenticated
                  ? userRole === "business_pending"
                    ? "Tu empresa está en evaluación comercial"
                    : "Se requiere cuenta empresarial con RUC para cotizar"
                  : "Inicia sesión o registra tu empresa para enviar esta cotización"}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {isAuthenticated
                  ? userRole === "business_pending"
                    ? "Hemos guardado tus prendas seleccionadas. Nuestro equipo está validando tu RUC; podrás enviar la cotización inmediatamente una vez aprobada tu cuenta."
                    : "Tu cuenta actual es de cliente minorista. Tus prendas seleccionadas se han guardado en tu borrador. Completa el registro de tu RUC para enviar la propuesta formal."
                  : "Tus productos, tallas y notas se han guardado en tu navegador. Para emitir una cotización con validez tributaria y precios por escala, accede con tu cuenta o registra tu empresa."}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {!isAuthenticated && (
                  <Link
                    href="/iniciar-sesion?next=/mayorista/cotizaciones"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#2563EB]"
                  >
                    Iniciar sesión
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
                {(!isAuthenticated || userRole === "customer") && (
                  <Link
                    href="/mayorista/registro"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#D90429]"
                  >
                    Registrar mi empresa (RUC)
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
                {userRole === "business_pending" && (
                  <Link
                    href="/mayorista/solicitud"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-amber-500 px-5 text-xs font-bold uppercase tracking-wider text-slate-950 transition-colors hover:bg-amber-400"
                  >
                    Consultar estado de solicitud
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowAuthGate(false)}
                  className="ml-1 text-xs font-semibold text-slate-500 underline hover:text-slate-900"
                >
                  Seguir editando borrador
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-[#D90429]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Paso 1: Selector buscable de productos y variantes */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:gap-3 sm:pb-5">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-[#EF233C] sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.14em]">
              Paso 1 · Selección de Prendas
            </span>
            <h3 className="mt-1 font-sans text-base font-black uppercase tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
              Añadir modelos y tallas al lote
            </h3>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#2563EB] sm:size-10 sm:rounded-xl">
            <FaLayerGroup className="size-4 sm:size-5" aria-hidden />
          </div>
        </div>

        {/* Vista previa rápida del modelo elegido + escalas B2B clicables */}
        {currentProduct && (
          <div className="mt-3.5 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:rounded-2xl sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-16 sm:rounded-xl">
                <Image
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/producto/${currentProduct.slug}`}
                  className="line-clamp-1 text-xs font-extrabold text-slate-900 transition-colors hover:text-[#2563EB] sm:text-sm"
                >
                  {currentProduct.name}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.66rem] text-slate-600 sm:mt-1 sm:gap-2 sm:text-xs">
                  <span>Catálogo: {formatPEN(currentProduct.retailPrice)}</span>
                  {selectedVariantObj && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[0.58rem] text-slate-700 sm:gap-1.5 sm:px-2.5 sm:text-[0.68rem]">
                      {selectedVariantObj.colorSwatch && (
                        <span
                          className="size-2 rounded-full border border-slate-300 sm:size-2.5"
                          style={{ backgroundColor: selectedVariantObj.colorSwatch }}
                        />
                      )}
                      Stock: {selectedVariantObj.stock}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {currentProduct.wholesaleTiers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 text-[0.56rem] font-extrabold uppercase tracking-wider text-slate-500 sm:text-[0.65rem]">
                  <BadgePercent className="size-3 text-emerald-600 sm:size-3.5" aria-hidden />
                  B2B:
                </span>
                {currentProduct.wholesaleTiers.map((tier) => (
                  <button
                    key={tier.minQuantity}
                    type="button"
                    onClick={() => setAddQuantity(tier.minQuantity)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[0.62rem] font-bold transition-all sm:px-3 sm:py-1 sm:text-xs",
                      addQuantity >= tier.minQuantity
                        ? "border-emerald-300 bg-emerald-100 text-emerald-900 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                    )}
                  >
                    {tier.minQuantity}+ · {formatPEN(tier.amount)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-12">
          {/* Buscador de Modelo */}
          <div ref={productBoxRef} className="relative md:col-span-5">
            <label
              htmlFor="quote-product-select"
              className="block text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-slate-700"
            >
              Modelo del catálogo (escribe para buscar)
            </label>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="quote-product-select"
                type="text"
                role="combobox"
                aria-expanded={productOpen}
                aria-controls="quote-product-listbox"
                autoComplete="off"
                value={productOpen ? productQuery : (currentProduct?.name ?? "")}
                placeholder={
                  currentProduct
                    ? `Buscar modelo... (Actual: ${currentProduct.name})`
                    : "Buscar modelo por nombre..."
                }
                onFocus={() => {
                  setProductQuery("");
                  setProductOpen(true);
                  setVariantOpen(false);
                }}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  if (!productOpen) setProductOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredProducts[0]) {
                      handleProductChange(filteredProducts[0].id);
                    }
                  } else if (e.key === "Escape") {
                    setProductOpen(false);
                  }
                }}
                className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pr-16 pl-10 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
                {productOpen && productQuery && (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda de modelo"
                    onClick={() => setProductQuery("")}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Mostrar lista de modelos"
                  onClick={() => {
                    if (!productOpen) setProductQuery("");
                    setProductOpen((prev) => !prev);
                    setVariantOpen(false);
                  }}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
                >
                  <ChevronDown
                    className={cn("size-4 transition-transform", productOpen && "rotate-180")}
                  />
                </button>
              </div>

              {productOpen && (
                <div
                  id="quote-product-listbox"
                  role="listbox"
                  className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                >
                  {filteredProducts.length === 0 ? (
                    <p className="px-3 py-5 text-center text-xs text-slate-500">
                      No encontramos modelos con &ldquo;{productQuery}&rdquo;.
                    </p>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isSelected = prod.id === currentProduct?.id;
                      const wholesale = prod.wholesaleTiers[0];
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleProductChange(prod.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                            isSelected
                              ? "bg-blue-50 text-[#0F172A]"
                              : "hover:bg-slate-50 text-slate-800",
                          )}
                        >
                          <div className="relative aspect-[3/4] w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            <Image
                              src={prod.imageUrl}
                              alt={prod.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900">
                              {prod.name}
                            </p>
                            <p className="text-[0.68rem] text-slate-500">
                              {wholesale
                                ? `Mayorista: ${formatPEN(wholesale.amount)} (${wholesale.minQuantity}+ uds.)`
                                : `Base: ${formatPEN(prod.retailPrice)}`}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="size-4 shrink-0 text-[#2563EB]" aria-hidden />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Buscador de Color y Talla (SKU) */}
          <div ref={variantBoxRef} className="relative md:col-span-4">
            <label
              htmlFor="quote-variant-select"
              className="block text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-slate-700"
            >
              Color y Talla / SKU (escribe para filtrar)
            </label>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="quote-variant-select"
                type="text"
                role="combobox"
                aria-expanded={variantOpen}
                aria-controls="quote-variant-listbox"
                autoComplete="off"
                value={variantOpen ? variantQuery : selectedVariantDisplayLabel}
                placeholder="Ej: Negro, 32, Camello, SKU..."
                onFocus={() => {
                  setVariantQuery("");
                  setVariantOpen(true);
                  setProductOpen(false);
                }}
                onChange={(e) => {
                  setVariantQuery(e.target.value);
                  if (!variantOpen) setVariantOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredVariants[0]) {
                      handleVariantSelect(filteredVariants[0].id);
                    }
                  } else if (e.key === "Escape") {
                    setVariantOpen(false);
                  }
                }}
                className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pr-16 pl-10 font-mono text-xs font-semibold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
                {variantOpen && variantQuery && (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda de talla o color"
                    onClick={() => setVariantQuery("")}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Mostrar tallas y colores"
                  onClick={() => {
                    if (!variantOpen) setVariantQuery("");
                    setVariantOpen((prev) => !prev);
                    setProductOpen(false);
                  }}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
                >
                  <ChevronDown
                    className={cn("size-4 transition-transform", variantOpen && "rotate-180")}
                  />
                </button>
              </div>

              {variantOpen && (
                <div
                  id="quote-variant-listbox"
                  role="listbox"
                  className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                >
                  {filteredVariants.length === 0 ? (
                    <p className="px-3 py-5 text-center text-xs text-slate-500">
                      Sin variantes para &ldquo;{variantQuery}&rdquo;.
                    </p>
                  ) : (
                    filteredVariants.map((v) => {
                      const isSelected = v.id === selectedVariantObj?.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleVariantSelect(v.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
                            isSelected ? "bg-blue-50 text-slate-900" : "hover:bg-slate-50 text-slate-800",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="size-3.5 shrink-0 rounded-full border border-slate-300"
                              style={{ backgroundColor: v.colorSwatch ?? "#CBD5E1" }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {v.colorName ?? "Único"} · Talla {v.size ?? "Única"}
                              </p>
                              <p className="truncate font-mono text-[0.65rem] text-slate-500">
                                {v.sku} · Stock: {v.stock}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="size-4 shrink-0 text-[#2563EB]" aria-hidden />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cantidad */}
          <div className="md:col-span-3">
            <label
              htmlFor="quote-qty-input"
              className="block text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-slate-700"
            >
              Cantidad (unidades)
            </label>
            <input
              id="quote-qty-input"
              type="number"
              min={1}
              max={50000}
              value={addQuantity}
              onChange={(e) => setAddQuantity(Number(e.target.value))}
              className="mt-2 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 font-mono text-sm font-bold tabular-nums text-slate-900 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
            placeholder="Observación opcional para esta variante (ej: empaque individual, bordado corporativo)..."
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
          />
          <button
            type="button"
            onClick={handleAddLine}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D90429]"
          >
            <Plus className="size-4" aria-hidden />
            Agregar variante al lote
          </button>
        </div>
      </div>

      {/* Paso 2: Resumen del lote */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:gap-3 sm:pb-5">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-[#2563EB] sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.14em]">
              Paso 2 · Resumen de Prendas
            </span>
            <h3 className="mt-1 font-sans text-base font-black uppercase tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
              Detalle ({summaryLines.length}{" "}
              {summaryLines.length === 1 ? "línea" : "líneas"} · {totalUnits} uds.)
            </h3>
          </div>
          {summaryLines.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[0.64rem] font-bold text-slate-800 sm:gap-1.5 sm:px-3.5 sm:py-1.5 sm:text-xs">
              <Sparkles className="size-3 text-[#2563EB] sm:size-3.5" aria-hidden />
              Est.: {formatPEN(estimatedSubtotal)}
            </span>
          )}
        </div>

        {summaryLines.length === 0 ? (
          <div className="py-7 text-center sm:py-12">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:size-14 sm:rounded-2xl">
              <ShoppingBag className="size-5 sm:size-6" aria-hidden />
            </div>
            <p className="mt-3 text-xs font-bold text-slate-800 sm:mt-4 sm:text-sm">
              Aún no has añadido variantes al lote
            </p>
            <p className="mt-1 text-[0.68rem] text-slate-500 sm:text-xs">
              Usa el buscador superior para elegir modelos, colores y tallas.
            </p>
          </div>
        ) : (
          <div className="mt-3.5 space-y-2.5 sm:mt-5 sm:space-y-3">
            {summaryLines.map((line) => (
              <div
                key={line.variantId}
                data-testid={`quote-builder-line-${line.variant.sku}`}
                className="flex flex-col justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-4"
              >
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="relative aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-14 sm:rounded-xl">
                    <Image
                      src={line.product.imageUrl}
                      alt={line.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">{line.product.name}</p>
                    <p className="mt-0.5 font-mono text-[0.6rem] text-slate-500 sm:text-xs">
                      {line.variant.colorName ?? "Único"} · Talla {line.variant.size ?? "Única"} · {line.variant.sku}
                    </p>
                    {line.itemNotes && (
                      <p className="mt-0.5 text-[0.64rem] italic text-slate-600 sm:mt-1 sm:text-xs">
                        Nota: {line.itemNotes}
                      </p>
                    )}
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.55rem] font-bold uppercase sm:mt-1.5 sm:px-2.5 sm:text-[0.65rem]",
                        line.appliedTierMin
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200/80 text-slate-700",
                      )}
                    >
                      {line.appliedTierMin
                        ? `B2B (≥${line.appliedTierMin}): ${formatPEN(line.unitPrice)}/ud.`
                        : `Ref: ${formatPEN(line.unitPrice)}/ud.`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2 sm:justify-end sm:gap-4 sm:border-t-0 sm:pt-0">
                  <div>
                    <label className="sr-only" htmlFor={`q-line-${line.variantId}`}>
                      Cantidad para {line.variant.sku}
                    </label>
                    <input
                      id={`q-line-${line.variantId}`}
                      type="number"
                      min={1}
                      max={50000}
                      value={line.quantity}
                      onChange={(e) =>
                        handleUpdateLineQuantity(line.variantId, Number(e.target.value))
                      }
                      className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center font-mono text-xs font-bold tabular-nums text-slate-900 focus:border-[#2563EB] focus:outline-none sm:h-10 sm:w-24 sm:rounded-xl"
                    />
                  </div>

                  <div className="min-w-20 text-right sm:min-w-28">
                    <p className="font-mono text-xs font-extrabold tabular-nums text-slate-900 sm:text-sm">
                      {formatPEN(line.subtotal)}
                    </p>
                    <p className="text-[0.56rem] font-medium text-slate-500 sm:text-[0.65rem]">Subtotal ref.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.variantId)}
                    aria-label={`Quitar ${line.variant.sku}`}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-[#EF233C] sm:rounded-xl sm:p-2"
                  >
                    <Trash2 className="size-3.5 sm:size-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-3 flex flex-col justify-between gap-1.5 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-3.5 text-white sm:mt-5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-2xl sm:p-5">
              <div>
                <p className="text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-slate-300 sm:text-[0.68rem] sm:tracking-[0.14em]">
                  Valor referencial del lote
                </p>
                <p className="text-[0.64rem] text-slate-400 sm:text-xs">
                  {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"} · Sujeto a propuesta formal
                </p>
              </div>
              <span className="font-sans text-xl font-black tabular-nums text-white sm:text-3xl">
                {formatPEN(estimatedSubtotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Paso 3: Condiciones comerciales y despacho */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="border-b border-slate-100 pb-3 sm:pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-emerald-700 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.14em]">
            Paso 3 · Condiciones y Despacho
          </span>
          <h3 className="mt-1 font-sans text-base font-black uppercase tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
            Requerimientos del pedido corporativo
          </h3>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-5">
          <div className="sm:col-span-2">
            <label
              htmlFor="quote-commercial-needs"
              className="block text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-slate-700"
            >
              Necesidades comerciales y objetivo del pedido *
            </label>
            <textarea
              id="quote-commercial-needs"
              name="commercialNeeds"
              rows={3}
              required
              value={commercialNeeds}
              onChange={(e) => setCommercialNeeds(e.target.value)}
              placeholder="Indica si requieres tarifa especial por volumen superior, cronograma de entregas parciales, facturación a crédito corporativo o personalización textil..."
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          <div>
            <label
              htmlFor="quote-delivery-city"
              className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-slate-700"
            >
              <MapPin className="size-3.5 text-[#EF233C]" aria-hidden />
              Ciudad / Destino de despacho
            </label>
            <input
              id="quote-delivery-city"
              name="deliveryCity"
              type="text"
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              placeholder="Lima, Arequipa, Trujillo..."
              className="mt-2 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-900 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          <div>
            <label
              htmlFor="quote-customer-notes"
              className="block text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-slate-700"
            >
              Observaciones adicionales (opcional)
            </label>
            <input
              id="quote-customer-notes"
              name="customerNotes"
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Horario de recepción de almacén, contacto logístico..."
              className="mt-2 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-900 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-xs leading-relaxed text-slate-500">
            Nota: El envío de una solicitud de cotización no genera cobro automático ni compromete reserva de inventario hasta la emisión y aceptación de la propuesta formal.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || summaryLines.length === 0}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-8 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#EF233C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Enviando solicitud...
              </>
            ) : isUserAuthorized ? (
              <>
                <Send className="size-4" aria-hidden />
                Enviar solicitud de cotización B2B
              </>
            ) : (
              <>
                <FileText className="size-4" aria-hidden />
                Guardar borrador y enviar cotización
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
