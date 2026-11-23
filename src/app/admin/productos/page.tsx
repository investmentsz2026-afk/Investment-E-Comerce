import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminProductsCatalog } from "@/server/queries/admin-commerce";
import { AdminProductsListClient } from "@/components/admin/admin-products-list-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Gestión de Productos — Admin | American Colt JEANS™",
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
    view?: string;
  }>;
}

export default async function AdminProductsListPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const viewMode: "table" | "grid" = params.view === "grid" ? "grid" : "table";
  const pageSize = viewMode === "grid" ? 12 : 10;

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
    pageSize,
  });

  return (
    <AdminProductsListClient
      items={catalog.items}
      categories={catalog.categories.map((c) => ({ id: c.id, name: c.name }))}
      pagination={{ ...catalog.pagination, pageSize }}
      initialView={viewMode}
      filters={{
        search: params.search ?? "",
        categoryId: params.categoryId ?? "",
        status: params.status ?? "",
        stockFilter,
      }}
    />
  );
}
