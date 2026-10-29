import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminProductsCatalog } from "@/server/queries/admin-commerce";
import { formatPrice } from "@/lib/format";
import {
  Plus,
  Search,
  ShoppingBag,
  ExternalLink,
  Edit3,
  Layers,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Gestión de Productos — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

interface AdminProductsPageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    status?: string;
    audience?: string;
    stockFilter?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AdminProductsListPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const stockFilter =
    params.stockFilter === "in_stock" ||
    params.stockFilter === "low_stock" ||
    params.stockFilter === "out_of_stock"
      ? params.stockFilter
      : "all";

  const sort =
    params.sort === "name_asc" ||
    params.sort === "stock_asc" ||
    params.sort === "price_asc" ||
    params.sort === "price_desc"
      ? params.sort
      : "newest";

  const catalog = await getAdminProductsCatalog({
    search: params.search,
    categoryId: params.categoryId ? Number(params.categoryId) : undefined,
    status: params.status || undefined,
    audience: params.audience || undefined,
    stockFilter,
    sort,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="shell py-8 md:py-10 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker text-cochinilla">GESTIÓN DE CATÁLOGO B2C / B2B</p>
          <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Administración de Productos
          </h1>
          <p className="mt-1 text-sm text-taupe-700">
            Crea, edita y organiza prendas, tallas, colores, códigos SKU, precios minoristas y escalas mayoristas.
          </p>
        </div>

        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 bg-ink px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla"
        >
          <Plus className="size-4" aria-hidden />
          <span>Nuevo Producto</span>
        </Link>
      </div>

      {/* Filtros y Buscador */}
      <form
        method="GET"
        action="/admin/productos"
        className="grid gap-3 border border-ink/10 bg-paper p-5 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label
            htmlFor="p-search"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Buscar por nombre, slug, marca o SKU
          </label>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-taupe-500"
              aria-hidden
            />
            <input
              id="p-search"
              name="search"
              type="text"
              defaultValue={params.search ?? ""}
              placeholder="Ej: Alpaca, INV-001, Blazer..."
              className="w-full border border-ink/20 bg-sand-50 py-2 pr-3 pl-8 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="p-cat"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Categoría
          </label>
          <select
            id="p-cat"
            name="categoryId"
            defaultValue={params.categoryId ?? ""}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="">Todas las categorías</option>
            {catalog.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="p-status"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Estado
          </label>
          <select
            id="p-status"
            name="status"
            defaultValue={params.status ?? ""}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="draft">Borradores</option>
            <option value="archived">Archivados</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="p-stock"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Nivel de Stock
          </label>
          <select
            id="p-stock"
            name="stockFilter"
            defaultValue={stockFilter}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="all">Cualquier stock</option>
            <option value="in_stock">Con stock disponible</option>
            <option value="low_stock">Stock bajo (≤ 10 uds.)</option>
            <option value="out_of_stock">Agotados (0 uds.)</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-paper hover:bg-cochinilla"
          >
            Filtrar
          </button>
          {(params.search ||
            params.categoryId ||
            params.status ||
            params.stockFilter) && (
            <Link
              href="/admin/productos"
              className="border border-ink/20 px-3 py-2 font-mono text-xs text-taupe-700 hover:border-ink"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {/* Tabla de Productos */}
      <div className="border border-ink/10 bg-paper">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3 text-xs">
          <span className="font-mono text-taupe-700">
            Mostrando <strong>{catalog.items.length}</strong> de{" "}
            <strong>{catalog.pagination.totalCount}</strong> productos
          </span>
          <span className="font-mono text-[0.7rem] text-taupe-500">
            Página {catalog.pagination.currentPage} de {catalog.pagination.totalPages}
          </span>
        </div>

        {catalog.items.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <ShoppingBag className="mx-auto size-8 text-taupe-400" aria-hidden />
            <p className="font-display text-xl text-ink">
              No se encontraron productos con estos filtros
            </p>
            <p className="text-xs text-taupe-700">
              Prueba ajustando la búsqueda o crea un nuevo producto comercial.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 bg-sand-50/60 font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600">
                  <th className="px-4 py-3">Producto / Slug</th>
                  <th className="px-4 py-3">Categoría / Colección</th>
                  <th className="px-4 py-3">Precios B2C / B2B</th>
                  <th className="px-4 py-3">Variantes y Stock</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {catalog.items.map((prod) => (
                  <tr key={prod.id} className="hover:bg-sand-50/40">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-11 shrink-0 overflow-hidden border border-ink/10 bg-sand-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prod.primaryImageUrl}
                            alt={prod.name}
                            className="size-full object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/admin/productos/${prod.id}`}
                            className="font-semibold text-ink hover:text-cochinilla hover:underline"
                          >
                            {prod.name}
                          </Link>
                          <p className="font-mono text-[0.65rem] text-taupe-500">
                            /{prod.slug} · {prod.brand}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {prod.isFeatured && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-amber-900">
                                Destacado
                              </span>
                            )}
                            {prod.isNew && (
                              <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-indigo-900">
                                Novedad
                              </span>
                            )}
                            {prod.badgeLabel && (
                              <span className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-[0.6rem] text-ink">
                                {prod.badgeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-ink">{prod.categoryName}</span>
                      <span className="block font-mono text-[0.65rem] uppercase text-taupe-500">
                        Colección: {prod.audience}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      <div className="font-bold text-ink">
                        B2C:{" "}
                        {prod.retailAmount ? formatPrice(prod.retailAmount) : "Sin precio"}
                      </div>
                      {prod.isWholesale && prod.lowestWholesaleAmount ? (
                        <div className="text-[0.68rem] text-cochinilla">
                          B2B: desde {formatPrice(prod.lowestWholesaleAmount)} (≥{" "}
                          {prod.wholesaleMinQty} uds.)
                        </div>
                      ) : (
                        <div className="text-[0.65rem] text-taupe-500">Solo venta B2C</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Layers className="size-3.5 text-taupe-500" aria-hidden />
                        <span
                          className={`font-bold ${
                            prod.totalStock <= 0
                              ? "text-rose-600"
                              : prod.totalStock <= 10
                                ? "text-amber-700"
                                : "text-emerald-700"
                          }`}
                        >
                          {prod.totalStock} uds.
                        </span>
                        <span className="text-[0.68rem] text-taupe-500">
                          ({prod.activeVariantsCount}/{prod.variantsCount} variantes)
                        </span>
                      </div>
                      {prod.skusPreview.length > 0 && (
                        <p className="mt-0.5 font-mono text-[0.64rem] text-taupe-500">
                          SKUs: {prod.skusPreview.join(", ")}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[0.68rem]">
                      {prod.status === "active" ? (
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold uppercase text-emerald-800">
                          Activo
                        </span>
                      ) : prod.status === "draft" ? (
                        <span className="rounded bg-amber-500/15 px-2 py-0.5 font-bold uppercase text-amber-800">
                          Borrador
                        </span>
                      ) : (
                        <span className="rounded bg-rose-500/15 px-2 py-0.5 font-bold uppercase text-rose-800">
                          Archivado
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/productos/${prod.id}`}
                          className="inline-flex items-center gap-1 border border-ink/20 px-2.5 py-1 font-mono text-[0.68rem] uppercase text-ink hover:border-ink"
                        >
                          <Edit3 className="size-3" aria-hidden />
                          <span>Editar</span>
                        </Link>
                        {prod.status === "active" && (
                          <Link
                            href={`/producto/${prod.slug}`}
                            target="_blank"
                            title="Ver en tienda pública"
                            className="border border-ink/15 p-1.5 text-taupe-700 hover:border-ink hover:text-ink"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

