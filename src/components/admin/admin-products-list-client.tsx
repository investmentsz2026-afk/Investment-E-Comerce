"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Plus,
  Search,
  ShoppingBag,
  ExternalLink,
  Edit3,
  Layers,
  Trash2,
  Filter,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Package,
  Boxes,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Star,
  Tag,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { adminDeleteProductAction } from "@/server/actions/admin-commerce";
import {
  AdminProductDeleteModal,
  type DeleteProductTarget,
} from "./admin-product-delete-modal";

export interface AdminProductListItem {
  id: number;
  name: string;
  slug: string;
  brand: string;
  categoryName: string;
  audience: string;
  status: string;
  badgeLabel: string | null;
  isFeatured: boolean;
  isNew: boolean;
  isWholesale: boolean;
  retailAmount: number | null;
  lowestWholesaleAmount: number | null;
  wholesaleMinQty: number | null;
  totalStock: number;
  activeVariantsCount: number;
  variantsCount: number;
  skusPreview: string[];
  primaryImageUrl: string;
}

interface AdminProductsListClientProps {
  items: AdminProductListItem[];
  categories: Array<{ id: number; name: string }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  initialView: "table" | "grid";
  filters: {
    search: string;
    categoryId: string;
    status: string;
    stockFilter: string;
  };
}

export function AdminProductsListClient({
  items,
  categories,
  pagination,
  initialView,
  filters,
}: AdminProductsListClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "grid">(initialView);
  const [deleteTarget, setDeleteTarget] = useState<DeleteProductTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categoryId ||
      filters.status ||
      (filters.stockFilter && filters.stockFilter !== "all"),
  );

  // KPIs calculados sobre el listado actual
  const activeCount = items.filter((p) => p.status === "active").length;
  const totalUnitsStock = items.reduce((acc, p) => acc + p.totalStock, 0);
  const totalVariantsCount = items.reduce((acc, p) => acc + p.variantsCount, 0);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    startDeleteTransition(async () => {
      const res = await adminDeleteProductAction({ productId: deleteTarget.id });
      if (!res.success) {
        setDeleteError(res.error ?? "No se pudo eliminar el producto.");
        return;
      }

      setToastMessage(res.message ?? `Producto "${deleteTarget.name}" eliminado.`);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const buildPageHref = (pageNum: number, targetView: "table" | "grid" = viewMode) => {
    const qs = new URLSearchParams();
    if (filters.search) qs.set("search", filters.search);
    if (filters.categoryId) qs.set("categoryId", filters.categoryId);
    if (filters.status) qs.set("status", filters.status);
    if (filters.stockFilter && filters.stockFilter !== "all") {
      qs.set("stockFilter", filters.stockFilter);
    }
    if (targetView === "grid") {
      qs.set("view", "grid");
    }
    qs.set("page", String(pageNum));
    return `/admin/productos?${qs.toString()}`;
  };

  const handleSwitchViewMode = (nextView: "table" | "grid") => {
    if (nextView === viewMode) return;
    setViewMode(nextView);
    router.push(buildPageHref(1, nextView), { scroll: false });
  };

  const rangeStart =
    pagination.totalCount === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(
    pagination.currentPage * pagination.pageSize,
    pagination.totalCount,
  );

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Hero Banner Moderno del Módulo de Productos ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-red-100/90 bg-gradient-to-br from-white via-[#FFF9F9] to-red-50/70 p-6 sm:p-8 shadow-sm">
        {/* Ondas decorativas sutiles en rojo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-red-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 size-56 rounded-full bg-blue-500/8 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626] shadow-2xs">
              <Sparkles className="size-3" aria-hidden />
              <span>GESTIÓN DE CATÁLOGO B2C / B2B</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Administración de Productos
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
              Crea, edita, elimina y organiza tus prendas, tallas, colores, códigos SKU, precios minoristas y escalas mayoristas en tiempo real.
            </p>
          </div>

          <Link
            href="/admin/productos/nuevo"
            className="bg-flow group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_12px_25px_-6px_rgba(220,38,38,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_6px_0_#7F1D1D,0_16px_30px_-6px_rgba(220,38,38,0.6)] active:translate-y-0.5 active:shadow-[0_1px_0_#7F1D1D]"
          >
            <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" aria-hidden />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* ─── Toast de confirmación al eliminar ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            role="status"
            className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 text-xs font-bold text-emerald-900 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden />
              </span>
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="rounded-lg px-2 py-1 text-[0.68rem] font-extrabold uppercase text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Ocultar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 4 Mini-Tarjetas KPI Interactivas ─── */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
              Total Catálogo
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-[#DC2626] border border-red-100 transition-transform group-hover:scale-110">
              <Package className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900">
            {pagination.totalCount}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-slate-400">
            Prendas registradas en Neon DB
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
              Activos en Tienda
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-transform group-hover:scale-110">
              <CheckCircle2 className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-emerald-700">
            {activeCount}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-slate-400">
            Visibles en esta página
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
              Stock Disponible
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 transition-transform group-hover:scale-110">
              <Boxes className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900">
            {totalUnitsStock.toLocaleString("es-PE")}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-slate-400">
            Unidades listas para despacho
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
              Variantes SKU
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100 transition-transform group-hover:scale-110">
              <Layers className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900">
            {totalVariantsCount}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-slate-400">
            Combinaciones talla y color
          </p>
        </div>
      </div>

      {/* ─── Panel de Filtros y Buscador Moderno Redondeado ─── */}
      <form
        method="GET"
        action="/admin/productos"
        className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4"
      >
        {viewMode === "grid" && <input type="hidden" name="view" value="grid" />}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-12 items-end">
          <div className="lg:col-span-4">
            <label
              htmlFor="p-search"
              className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600"
            >
              Buscar producto, slug, marca o SKU
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="p-search"
                name="search"
                type="text"
                defaultValue={filters.search}
                placeholder="Ej: King 767, Jean Comfort, AC-P22..."
                className="h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 pr-4 pl-10 text-xs font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="p-cat"
              className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600"
            >
              Categoría
            </label>
            <select
              id="p-cat"
              name="categoryId"
              defaultValue={filters.categoryId}
              className="h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-3.5 text-xs font-semibold text-slate-800 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="p-status"
              className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600"
            >
              Estado
            </label>
            <select
              id="p-status"
              name="status"
              defaultValue={filters.status}
              className="h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-3.5 text-xs font-semibold text-slate-800 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivados</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="p-stock"
              className="mb-1.5 block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600"
            >
              Nivel de Stock
            </label>
            <select
              id="p-stock"
              name="stockFilter"
              defaultValue={filters.stockFilter}
              className="h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 px-3.5 text-xs font-semibold text-slate-800 transition-all focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
            >
              <option value="all">Cualquier stock</option>
              <option value="in_stock">Con stock disponible</option>
              <option value="low_stock">Stock bajo (≤ 10 uds.)</option>
              <option value="out_of_stock">Agotados (0 uds.)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 lg:col-span-2">
            <button
              type="submit"
              className="bg-flow flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_#7F1D1D,0_8px_18px_-4px_rgba(220,38,38,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_#7F1D1D]"
            >
              <Filter className="size-3.5" aria-hidden />
              <span>Filtrar</span>
            </button>
            {hasActiveFilters && (
              <Link
                href="/admin/productos"
                title="Limpiar filtros"
                className="flex h-11 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-3 text-slate-600 shadow-2xs transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
              >
                <RotateCcw className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* ─── Contenedor Principal de Productos (Tabla Moderna / Tarjetas Grid) ─── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
        {/* Cabecera de la tabla con contador y selector de vista */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex size-2 rounded-full bg-[#DC2626]" />
            <span>
              Mostrando{" "}
              <strong className="font-black text-slate-900">
                {rangeStart}–{rangeEnd}
              </strong>{" "}
              de{" "}
              <strong className="font-black text-slate-900">
                {pagination.totalCount}
              </strong>{" "}
              productos
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline font-mono text-[0.7rem] text-slate-500">
              {pagination.pageSize} por hoja · Página {pagination.currentPage} de{" "}
              {pagination.totalPages}
            </span>
          </div>

          {/* Selector de vista Tabla (10/hoja) / Tarjetas (12/hoja) */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSwitchViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.7rem] font-extrabold transition-all ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="size-3.5" aria-hidden />
              <span>Tabla (10)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchViewMode("grid")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.7rem] font-extrabold transition-all ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="size-3.5" aria-hidden />
              <span>Tarjetas (12)</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-14 text-center space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-red-50 text-[#DC2626] border border-red-100">
              <ShoppingBag className="size-7" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">
                No se encontraron productos con estos filtros
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Prueba limpiando la búsqueda o registra una nueva prenda en el catálogo.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              {hasActiveFilters && (
                <Link
                  href="/admin/productos"
                  className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-700 hover:border-slate-400 transition-all"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  <span>Limpiar filtros</span>
                </Link>
              )}
              <Link
                href="/admin/productos/nuevo"
                className="bg-flow inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:scale-105"
              >
                <Plus className="size-3.5" aria-hidden />
                <span>Crear Producto</span>
              </Link>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* ─── VISTA TABLA MODERNA INTERACTIVA ─── */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Producto / Modelo</th>
                  <th className="px-4 py-3.5">Categoría</th>
                  <th className="px-4 py-3.5">Precios B2C / B2B</th>
                  <th className="px-4 py-3.5">Variantes y Stock</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((prod, idx) => (
                  <motion.tr
                    key={prod.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.3) }}
                    className="group transition-colors hover:bg-red-50/30"
                  >
                    {/* Producto + Imagen redondeada */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <Link
                          href={`/admin/productos/${prod.id}`}
                          className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs transition-transform duration-300 group-hover:scale-105"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prod.primaryImageUrl}
                            alt={prod.name}
                            className="size-full object-cover"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/productos/${prod.id}`}
                            className="block truncate text-sm font-extrabold text-slate-900 transition-colors hover:text-[#DC2626]"
                          >
                            {prod.name}
                          </Link>
                          <p className="mt-0.5 truncate font-mono text-[0.66rem] text-slate-400">
                            /{prod.slug} · <span className="text-slate-500">{prod.brand}</span>
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {prod.isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase text-amber-800">
                                <Star className="size-2.5 fill-amber-500 text-amber-500" aria-hidden />
                                Destacado
                              </span>
                            )}
                            {prod.isNew && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase text-blue-700">
                                Novedad
                              </span>
                            )}
                            {prod.badgeLabel && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.58rem] font-bold text-slate-700">
                                {prod.badgeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Categoría / Colección */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100/90 px-2.5 py-1 text-[0.7rem] font-bold text-slate-800">
                        <Tag className="size-3 text-slate-400" aria-hidden />
                        {prod.categoryName}
                      </span>
                      <span className="mt-1 block font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400">
                        {prod.audience}
                      </span>
                    </td>

                    {/* Precios B2C / B2B */}
                    <td className="px-4 py-4">
                      <div className="font-mono text-sm font-black text-slate-900">
                        {prod.retailAmount ? formatPrice(prod.retailAmount) : "Sin precio"}
                      </div>
                      {prod.isWholesale && prod.lowestWholesaleAmount ? (
                        <span className="mt-1 inline-flex items-center rounded-lg bg-red-50 border border-red-100 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-[#DC2626]">
                          B2B: {formatPrice(prod.lowestWholesaleAmount)} (≥{prod.wholesaleMinQty})
                        </span>
                      ) : (
                        <span className="mt-0.5 block text-[0.65rem] text-slate-400">
                          Solo B2C minorista
                        </span>
                      )}
                    </td>

                    {/* Variantes y Stock */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[0.68rem] font-black border ${
                            prod.totalStock <= 0
                              ? "bg-red-50 text-red-700 border-red-200"
                              : prod.totalStock <= 10
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <Layers className="size-3" aria-hidden />
                          {prod.totalStock} uds.
                        </span>
                        <span className="font-mono text-[0.66rem] text-slate-500">
                          ({prod.activeVariantsCount}/{prod.variantsCount})
                        </span>
                      </div>
                      {prod.skusPreview.length > 0 && (
                        <p className="mt-1 max-w-[200px] truncate font-mono text-[0.62rem] text-slate-400">
                          {prod.skusPreview.join(" · ")}
                        </p>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-4">
                      {prod.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-wider text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activo
                        </span>
                      ) : prod.status === "draft" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-wider text-amber-800">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          Borrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-600">
                          <span className="size-1.5 rounded-full bg-slate-400" />
                          Archivado
                        </span>
                      )}
                    </td>

                    {/* Botones de Acción (Editar, Ver tienda, Eliminar) */}
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/admin/productos/${prod.id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 text-[0.7rem] font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 hover:shadow-[0_4px_0_#BFDBFE] active:translate-y-0"
                        >
                          <Edit3 className="size-3.5" aria-hidden />
                          <span>Editar</span>
                        </Link>

                        {prod.status === "active" && (
                          <Link
                            href={`/producto/${prod.slug}`}
                            target="_blank"
                            title="Ver en tienda pública"
                            className="inline-flex size-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-500 shadow-[0_2px_0_#E2E8F0] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:translate-y-0"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                          </Link>
                        )}

                        <button
                          type="button"
                          title={`Eliminar ${prod.name}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget({
                              id: prod.id,
                              name: prod.name,
                              slug: prod.slug,
                              imageUrl: prod.primaryImageUrl,
                              variantsCount: prod.variantsCount,
                            });
                          }}
                          className="inline-flex size-9 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50/70 text-[#DC2626] shadow-[0_2px_0_#FECACA] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white hover:shadow-[0_4px_0_#991B1B] active:translate-y-0"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── VISTA TARJETAS VISUALES (GRID 3D MODERNO) ─── */
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((prod, idx) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.32) }}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
              >
                <div className="flex gap-4">
                  <Link
                    href={`/admin/productos/${prod.id}`}
                    className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.primaryImageUrl}
                      alt={prod.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase text-slate-600">
                        {prod.categoryName}
                      </span>
                      {prod.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase text-emerald-700 border border-emerald-200">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase text-amber-800 border border-amber-200">
                          {prod.status}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/admin/productos/${prod.id}`}
                      className="block text-sm font-black leading-snug text-slate-900 group-hover:text-[#DC2626] transition-colors line-clamp-2"
                    >
                      {prod.name}
                    </Link>

                    <div className="pt-1">
                      <span className="font-mono text-base font-black text-slate-900">
                        {prod.retailAmount ? formatPrice(prod.retailAmount) : "Sin precio"}
                      </span>
                      {prod.isWholesale && prod.lowestWholesaleAmount && (
                        <p className="font-mono text-[0.65rem] font-bold text-[#DC2626]">
                          Mayorista: {formatPrice(prod.lowestWholesaleAmount)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5 font-mono text-[0.65rem] text-slate-500">
                      <span className="font-bold text-emerald-700">{prod.totalStock} uds.</span>
                      <span>·</span>
                      <span>{prod.variantsCount} variantes</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/admin/productos/${prod.id}`}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Edit3 className="size-3.5" aria-hidden />
                    <span>Editar</span>
                  </Link>

                  {prod.status === "active" && (
                    <Link
                      href={`/producto/${prod.slug}`}
                      target="_blank"
                      title="Ver en tienda pública"
                      className="flex size-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-500 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900"
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                    </Link>
                  )}

                  <button
                    type="button"
                    title={`Eliminar ${prod.name}`}
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget({
                        id: prod.id,
                        name: prod.name,
                        slug: prod.slug,
                        imageUrl: prod.primaryImageUrl,
                        variantsCount: prod.variantsCount,
                      });
                    }}
                    className="flex size-9 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50/70 text-[#DC2626] shadow-[0_2px_0_#FECACA] transition-all hover:-translate-y-0.5 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Paginación moderna numerada */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs">
            <span className="font-mono text-[0.72rem] font-semibold text-slate-500">
              Página <strong className="text-slate-900">{pagination.currentPage}</strong> de{" "}
              <strong className="text-slate-900">{pagination.totalPages}</strong> ·{" "}
              {pagination.pageSize} productos por hoja
            </span>

            <nav aria-label="Paginación de productos" className="flex flex-wrap items-center gap-1.5">
              {pagination.currentPage > 1 ? (
                <Link
                  href={buildPageHref(pagination.currentPage - 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-950"
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                  <span>Anterior</span>
                </Link>
              ) : (
                <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-xl border-2 border-slate-100 bg-slate-50 px-3 text-xs font-bold text-slate-300">
                  <ChevronLeft className="size-3.5" aria-hidden />
                  <span>Anterior</span>
                </span>
              )}

              {pageNumbers.map((num) => {
                const isCurrent = num === pagination.currentPage;
                return (
                  <Link
                    key={num}
                    href={buildPageHref(num)}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`inline-flex size-9 items-center justify-center rounded-xl border-2 font-mono text-xs font-black transition-all ${
                      isCurrent
                        ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-sm shadow-red-500/25"
                        : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-red-300 hover:text-[#DC2626]"
                    }`}
                  >
                    {num}
                  </Link>
                );
              })}

              {pagination.currentPage < pagination.totalPages ? (
                <Link
                  href={buildPageHref(pagination.currentPage + 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-950"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              ) : (
                <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-xl border-2 border-slate-100 bg-slate-50 px-3 text-xs font-bold text-slate-300">
                  <span>Siguiente</span>
                  <ChevronRight className="size-3.5" aria-hidden />
                </span>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* ─── Modal Moderno Animado de Confirmación de Eliminación ─── */}
      <AdminProductDeleteModal
        product={deleteTarget}
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
