"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Loader2,
  Save,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  adminBulkUpdateWholesaleProductsAction,
  adminUpdateWholesaleProductAction,
} from "@/server/actions/admin-commerce";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface WholesaleManagerProductItem {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName: string;
  status: string;
  isWholesale: boolean;
  retailAmount: number;
  wholesaleTiers: Array<{
    id: number;
    minQuantity: number;
    maxQuantity: number | null;
    amount: number;
  }>;
  totalStock: number;
  variantsCount: number;
  primaryImageUrl: string;
}

interface AdminWholesaleProductsManagerProps {
  initialItems: WholesaleManagerProductItem[];
  categories: Array<{ id: number; name: string }>;
}

function normalizeText(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function AdminWholesaleProductsManager({
  initialItems,
  categories,
}: AdminWholesaleProductsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState<WholesaleManagerProductItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "wholesale" | "retail">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Estado editable inline para cantidad mínima y precio mayorista por producto
  const [draftTiers, setDraftTiers] = useState<
    Record<number, { minQuantity: string; priceSoles: string }>
  >(() => {
    const map: Record<number, { minQuantity: string; priceSoles: string }> = {};
    for (const item of initialItems) {
      const firstTier = item.wholesaleTiers[0];
      const defaultPrice = firstTier
        ? (firstTier.amount / 100).toFixed(2)
        : item.retailAmount > 0
          ? ((item.retailAmount * 0.8) / 100).toFixed(2)
          : "99.00";
      map[item.id] = {
        minQuantity: String(firstTier?.minQuantity ?? 12),
        priceSoles: defaultPrice,
      };
    }
    return map;
  });

  const stats = useMemo(() => {
    const wholesaleCount = items.filter((i) => i.isWholesale).length;
    const activeWholesaleCount = items.filter(
      (i) => i.isWholesale && i.status === "active",
    ).length;
    return {
      total: items.length,
      wholesaleCount,
      activeWholesaleCount,
      retailOnlyCount: items.length - wholesaleCount,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = normalizeText(search);
    return items.filter((item) => {
      if (filterTab === "wholesale" && !item.isWholesale) return false;
      if (filterTab === "retail" && item.isWholesale) return false;
      if (categoryFilter !== "all" && String(item.categoryId) !== categoryFilter) return false;
      if (q) {
        const hay = normalizeText(`${item.name} ${item.slug} ${item.categoryName}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterTab, categoryFilter, search]);

  const allVisibleSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selectedIds.includes(i.id));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredItems.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredItems.map((i) => i.id)])));
    }
  };

  const handleToggleWholesale = (item: WholesaleManagerProductItem, nextState: boolean) => {
    setFeedback(null);
    setSavingId(item.id);
    const draft = draftTiers[item.id];
    const minQty = Number(draft?.minQuantity ?? 12);
    const priceSoles = Number(draft?.priceSoles ?? 0);

    startTransition(async () => {
      const res = await adminUpdateWholesaleProductAction({
        productId: item.id,
        isWholesale: nextState,
        ...(nextState && item.wholesaleTiers.length === 0 && priceSoles > 0
          ? { minQuantity: minQty, wholesalePriceSoles: priceSoles }
          : {}),
      });
      setSavingId(null);

      if (!res.success) {
        setFeedback({ type: "err", text: res.error ?? "No se pudo actualizar el producto." });
        return;
      }

      setItems((prev) =>
        prev.map((p) => {
          if (p.id !== item.id) return p;
          const updatedTiers =
            nextState && p.wholesaleTiers.length === 0 && priceSoles > 0
              ? [{ id: 0, minQuantity: Math.trunc(minQty) || 12, maxQuantity: null, amount: Math.round(priceSoles * 100) }]
              : p.wholesaleTiers;
          return { ...p, isWholesale: nextState, wholesaleTiers: updatedTiers };
        }),
      );
      setFeedback({ type: "ok", text: res.message ?? "Actualizado." });
      router.refresh();
    });
  };

  const handleSaveTierAndEnable = (item: WholesaleManagerProductItem) => {
    setFeedback(null);
    setSavingId(item.id);
    const draft = draftTiers[item.id];
    const minQuantity = Math.trunc(Number(draft?.minQuantity ?? 12));
    const wholesalePriceSoles = Number(draft?.priceSoles ?? 0);

    startTransition(async () => {
      const res = await adminUpdateWholesaleProductAction({
        productId: item.id,
        isWholesale: true,
        minQuantity,
        wholesalePriceSoles,
      });
      setSavingId(null);

      if (!res.success) {
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar la tarifa." });
        return;
      }

      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                isWholesale: true,
                wholesaleTiers: [
                  {
                    id: p.wholesaleTiers[0]?.id ?? 0,
                    minQuantity,
                    maxQuantity: null,
                    amount: Math.round(wholesalePriceSoles * 100),
                  },
                ],
              }
            : p,
        ),
      );
      setFeedback({
        type: "ok",
        text: `Tarifa mayorista guardada para "${item.name}" (${minQuantity}+ uds. a ${formatPEN(Math.round(wholesalePriceSoles * 100))}).`,
      });
      router.refresh();
    });
  };

  const handleBulkUpdate = (enable: boolean) => {
    if (selectedIds.length === 0) return;
    setFeedback(null);
    const targetIds = [...selectedIds];

    startTransition(async () => {
      const res = await adminBulkUpdateWholesaleProductsAction({
        productIds: targetIds,
        isWholesale: enable,
      });

      if (!res.success) {
        setFeedback({ type: "err", text: res.error ?? "Error en actualización masiva." });
        return;
      }

      const idSet = new Set(targetIds);
      setItems((prev) =>
        prev.map((p) => {
          if (!idSet.has(p.id)) return p;
          const ensuredTiers =
            enable && p.wholesaleTiers.length === 0
              ? [
                  {
                    id: 0,
                    minQuantity: 12,
                    maxQuantity: null,
                    amount: p.retailAmount > 0 ? Math.max(100, Math.round(p.retailAmount * 0.8)) : 9900,
                  },
                ]
              : p.wholesaleTiers;
          return { ...p, isWholesale: enable, wholesaleTiers: ensuredTiers };
        }),
      );
      setSelectedIds([]);
      setFeedback({ type: "ok", text: res.message ?? "Actualización masiva completada." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 font-sans antialiased">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-blue-700">
            <Boxes className="size-3.5" aria-hidden />
            <span>Catálogo B2B · Selección de Prendas</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Productos Mayoristas
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-slate-600">
            Selecciona aquí qué prendas están habilitadas para compras al por mayor. Solo los productos activados aparecerán en el filtro <strong>Mayoristas</strong> del catálogo, en la página <strong>/mayorista</strong> y en el cotizador B2B.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/catalogo?mayorista=1"
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-extrabold uppercase tracking-wider text-blue-700 transition-colors hover:bg-blue-100"
          >
            <span>Ver Catálogo Mayorista</span>
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <Link
            href="/mayorista"
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-[#DC2626]"
          >
            <span>Ver Sección Mayorista</span>
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400">
            Total en Catálogo
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-xs text-slate-500">Modelos registrados en tienda</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-emerald-700">
            Habilitados Mayoristas (B2B)
          </p>
          <p className="mt-1 text-3xl font-black text-emerald-800">{stats.wholesaleCount}</p>
          <p className="mt-0.5 text-xs text-emerald-700">
            {stats.activeWholesaleCount} activos y visibles al público
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400">
            Solo Venta por Unidad (B2C)
          </p>
          <p className="mt-1 text-3xl font-black text-slate-700">{stats.retailOnlyCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">No aparecen en filtros ni cotizador B2B</p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold",
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          ) : (
            <XCircle className="size-4 shrink-0" aria-hidden />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filtros y acciones masivas */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: `Todos (${stats.total})` },
                { id: "wholesale", label: `Solo Mayoristas (${stats.wholesaleCount})` },
                { id: "retail", label: `No Mayoristas (${stats.retailOnlyCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors",
                  filterTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar prenda o categoría..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:w-64"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de acciones masivas cuando hay seleccionados */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <span className="text-xs font-extrabold text-blue-900">
              {selectedIds.length} producto(s) seleccionado(s)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleBulkUpdate(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Sparkles className="size-3.5" aria-hidden />
                Habilitar en Mayoristas
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleBulkUpdate(false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Quitar de Mayoristas
              </button>
            </div>
          </div>
        )}

        {/* Tabla interactiva de productos */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    aria-label="Seleccionar todos los visibles"
                    className={cn(
                      "flex size-4 items-center justify-center rounded border",
                      allVisibleSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white",
                    )}
                  >
                    {allVisibleSelected && <Check className="size-3 stroke-[3]" />}
                  </button>
                </th>
                <th className="px-4 py-3.5">Prenda</th>
                <th className="px-4 py-3.5">Precio Unidad</th>
                <th className="px-4 py-3.5">Cant. Mínima / Tarifa Mayorista</th>
                <th className="px-4 py-3.5">Estado Mayorista B2B</th>
                <th className="px-4 py-3.5 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-500">
                    No hay productos que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  const draft = draftTiers[item.id] ?? { minQuantity: "12", priceSoles: "99.00" };
                  const isRowBusy = isPending && savingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors",
                        item.isWholesale ? "bg-emerald-50/25 hover:bg-emerald-50/45" : "hover:bg-slate-50/80",
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.id)}
                          aria-label={`Seleccionar ${item.name}`}
                          className={cn(
                            "flex size-4 items-center justify-center rounded border",
                            isChecked
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white",
                          )}
                        >
                          {isChecked && <Check className="size-3 stroke-[3]" />}
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <Image
                              src={item.primaryImageUrl}
                              alt={item.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-extrabold text-slate-900">
                              {item.name}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.68rem] text-slate-500">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                                {item.categoryName}
                              </span>
                              <span>· Stock: {item.totalStock} uds.</span>
                              {item.status !== "active" && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800 uppercase">
                                  {item.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">
                        {formatPEN(item.retailAmount)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="sr-only" htmlFor={`min-qty-${item.id}`}>
                            Mínimo mayorista {item.name}
                          </label>
                          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                            <span className="text-[0.65rem] font-bold text-slate-400">Min:</span>
                            <input
                              id={`min-qty-${item.id}`}
                              type="number"
                              min={2}
                              max={50000}
                              value={draft.minQuantity}
                              onChange={(e) =>
                                setDraftTiers((prev) => ({
                                  ...prev,
                                  [item.id]: { ...draft, minQuantity: e.target.value },
                                }))
                              }
                              className="w-12 bg-transparent font-mono text-xs font-bold text-slate-900 focus:outline-none"
                            />
                            <span className="text-[0.65rem] text-slate-400">uds</span>
                          </div>

                          <label className="sr-only" htmlFor={`price-soles-${item.id}`}>
                            Precio mayorista {item.name}
                          </label>
                          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                            <span className="text-[0.65rem] font-bold text-slate-400">S/</span>
                            <input
                              id={`price-soles-${item.id}`}
                              type="number"
                              step="0.01"
                              min={1}
                              value={draft.priceSoles}
                              onChange={(e) =>
                                setDraftTiers((prev) => ({
                                  ...prev,
                                  [item.id]: { ...draft, priceSoles: e.target.value },
                                }))
                              }
                              className="w-16 bg-transparent font-mono text-xs font-bold text-slate-900 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveTierAndEnable(item)}
                            title="Guardar tarifa y habilitar para mayoristas"
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[0.65rem] font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                          >
                            {isRowBusy ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Save className="size-3" />
                            )}
                            Guardar
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleWholesale(item, !item.isWholesale)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider transition-all disabled:opacity-50",
                            item.isWholesale
                              ? "border-emerald-300 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                              : "border-slate-300 bg-white text-slate-600 hover:border-slate-900 hover:text-slate-900",
                          )}
                        >
                          {isRowBusy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                item.isWholesale ? "bg-white" : "bg-slate-400",
                              )}
                            />
                          )}
                          {item.isWholesale ? "En Mayoristas" : "Solo Minorista"}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/productos/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[0.68rem] font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900"
                        >
                          <Edit3 className="size-3" aria-hidden />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
