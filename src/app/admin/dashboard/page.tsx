import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCommercialDashboard } from "@/server/queries/admin-commerce";
import { formatPEN } from "@/lib/format";
import {
  ShoppingCart,
  Calendar,
  Layers,
  Truck,
  Plus,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard de Ventas e Inventario | American Colt JEANS™",
  robots: { index: false, follow: false },
};

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  paid: {
    label: "Pagado",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  preparing: {
    label: "En preparación",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  shipped: {
    label: "En tránsito",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  delivered: {
    label: "Entregado",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  pending_payment: {
    label: "Pendiente de pago",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  cancelled: {
    label: "Cancelado",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
  },
  refunded: {
    label: "Reembolsado",
    badgeClass: "bg-neutral-100 text-neutral-800 border-neutral-300",
  },
};

interface AdminDashboardPageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    channel?: string;
    status?: string;
  }>;
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const channelFilter =
    params.channel === "retail" || params.channel === "wholesale"
      ? params.channel
      : "all";

  const dashboard = await getAdminCommercialDashboard({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    channel: channelFilter,
    status: params.status || "all",
  });

  const {
    salesGlobal,
    filteredSummary,
    inventoryAlerts,
    topSellingProducts,
  } = dashboard;

  const ordersToDispatch =
    (filteredSummary.statusBreakdown["paid"] ?? 0) +
    (filteredSummary.statusBreakdown["preparing"] ?? 0);

  const hasActiveFilters = Boolean(
    params.dateFrom ||
      params.dateTo ||
      (params.channel && params.channel !== "all") ||
      (params.status && params.status !== "all")
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Encabezado del Dashboard y Botones de Acción ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
            Ventas, pedidos e inventario en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#DC2626] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] active:scale-[0.98] transition-all"
          >
            <Plus className="size-4" />
            <span>Nuevo producto</span>
          </Link>

          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 shadow-xs hover:bg-neutral-50 active:scale-[0.98] transition-all"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Ajustar stock</span>
          </Link>
        </div>
      </div>

      {/* ─── Barra de Filtros Inteligentes (Desde, Hasta, Canal, Estado) ─── */}
      <form
        method="GET"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Desde fecha */}
          <div className="space-y-1">
            <label className="text-[0.68rem] font-bold uppercase tracking-wider text-neutral-500">
              Desde fecha
            </label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={params.dateFrom || ""}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-800 focus:bg-white focus:border-[#DC2626] focus:outline-none transition-colors"
            />
          </div>

          {/* Hasta fecha */}
          <div className="space-y-1">
            <label className="text-[0.68rem] font-bold uppercase tracking-wider text-neutral-500">
              Hasta fecha
            </label>
            <input
              type="date"
              name="dateTo"
              defaultValue={params.dateTo || ""}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-800 focus:bg-white focus:border-[#DC2626] focus:outline-none transition-colors"
            />
          </div>

          {/* Canal de venta */}
          <div className="space-y-1">
            <label className="text-[0.68rem] font-bold uppercase tracking-wider text-neutral-500">
              Canal de venta
            </label>
            <select
              name="channel"
              defaultValue={channelFilter}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-800 focus:bg-white focus:border-[#DC2626] focus:outline-none transition-colors"
            >
              <option value="all">Todos los canales (B2C + B2B)</option>
              <option value="retail">B2C Minorista</option>
              <option value="wholesale">B2B Mayorista</option>
            </select>
          </div>

          {/* Estado del pedido */}
          <div className="space-y-1">
            <label className="text-[0.68rem] font-bold uppercase tracking-wider text-neutral-500">
              Estado del pedido
            </label>
            <select
              name="status"
              defaultValue={params.status || "all"}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-800 focus:bg-white focus:border-[#DC2626] focus:outline-none transition-colors"
            >
              <option value="all">Todos los estados</option>
              <option value="paid">Pagados</option>
              <option value="pending_payment">Pendiente de pago</option>
              <option value="preparing">En preparación</option>
              <option value="shipped">En tránsito</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Botones Filtrar y Limpiar */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] active:scale-[0.98] transition-all"
            >
              <Filter className="size-3.5" />
              <span>Filtrar</span>
            </button>

            {hasActiveFilters && (
              <Link
                href="/admin/dashboard"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                title="Limpiar filtros"
              >
                <RotateCcw className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* ─── Fila de 4 Tarjetas KPI Vibrantes y Modernas ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ventas de hoy */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-neutral-500">
              Ventas de hoy
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-neutral-900">
            {formatPEN(salesGlobal.todayAmount)}
          </p>
          <p className="mt-1 text-[0.68rem] font-medium text-neutral-500">
            {salesGlobal.todayOrders} {salesGlobal.todayOrders === 1 ? "pedido confirmado" : "pedidos confirmados"}
          </p>
        </div>

        {/* 2. Últimos 7 días */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-neutral-500">
              Últimos 7 días
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-[#DC2626] border border-rose-100">
              <Calendar className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-neutral-900">
            {formatPEN(salesGlobal.weekAmount)}
          </p>
          <p className="mt-1 text-[0.68rem] font-medium text-neutral-500">
            {salesGlobal.weekOrders} pedidos confirmados
          </p>
        </div>

        {/* 3. Ventas del mes */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-neutral-500">
              Ventas del mes
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Layers className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-neutral-900">
            {formatPEN(salesGlobal.monthAmount)}
          </p>
          <p className="mt-1 text-[0.68rem] font-medium text-neutral-500">
            {salesGlobal.monthOrders} pedidos confirmados
          </p>
        </div>

        {/* 4. Por despachar */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-neutral-500">
              Por despachar
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Truck className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-neutral-900">
            {ordersToDispatch}
          </p>
          <p className="mt-1 text-[0.68rem] font-medium text-neutral-500">
            Pedidos pendientes de entrega
          </p>
        </div>
      </div>

      {/* ─── Desglose por Canal y Estado de Pedidos ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ventas por canal (B2C vs B2B) */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Ventas por canal
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Canal B2C */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 space-y-1">
              <span className="inline-block rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[0.62rem] font-extrabold text-blue-800">
                B2C
              </span>
              <p className="text-lg font-black text-neutral-900 pt-0.5">
                {formatPEN(filteredSummary.retail.revenueAmount)}
              </p>
              <p className="text-[0.68rem] text-neutral-500 font-medium">
                {filteredSummary.retail.confirmedOrders} pedidos / {filteredSummary.totalOrders} totales
              </p>
            </div>

            {/* Canal B2B */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 space-y-1">
              <span className="inline-block rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[0.62rem] font-extrabold text-[#DC2626]">
                B2B
              </span>
              <p className="text-lg font-black text-neutral-900 pt-0.5">
                {formatPEN(filteredSummary.wholesale.revenueAmount)}
              </p>
              <p className="text-[0.68rem] text-neutral-500 font-medium">
                {filteredSummary.wholesale.confirmedOrders} pedidos / {filteredSummary.totalOrders} totales
              </p>
            </div>
          </div>
        </div>

        {/* Estado de Pedidos */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Estado de pedidos
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Pagados */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-lg font-black text-emerald-950">
                  {filteredSummary.statusBreakdown["paid"] ?? 0}
                </p>
                <p className="text-[0.68rem] font-bold text-emerald-700">Pagados</p>
              </div>
            </div>

            {/* Cancelados */}
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-rose-100 text-rose-700 shrink-0">
                <XCircle className="size-5" />
              </div>
              <div>
                <p className="text-lg font-black text-rose-950">
                  {filteredSummary.statusBreakdown["cancelled"] ?? 0}
                </p>
                <p className="text-[0.68rem] font-bold text-rose-700">Cancelados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabla: Pedidos Recientes con Datos en Vivo ─── */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <div>
            <h2 className="text-sm font-extrabold text-neutral-900">Pedidos recientes</h2>
            <p className="text-[0.68rem] text-neutral-500 mt-0.5">
              Últimas transacciones registradas en el sistema
            </p>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs font-bold text-[#DC2626] hover:underline flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/70 border-b border-neutral-100 text-[0.68rem] font-extrabold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-3 px-5">N.° Pedido</th>
                <th className="py-3 px-5">Canal</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSummary.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-400">
                    No se encontraron pedidos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSummary.recentOrders.map((order) => {
                  const statusConfig =
                    ORDER_STATUS_CONFIG[order.status] || {
                      label: order.status,
                      badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-200",
                    };

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-neutral-900">
                        <Link
                          href={`/admin/pedidos`}
                          className="hover:text-[#DC2626] hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-5 text-neutral-600 font-medium">
                        {order.orderMode === "wholesale" ? "B2B Mayorista" : "B2C Minorista"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.62rem] font-extrabold ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-neutral-900">
                        {formatPEN(order.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Fila Inferior: Productos Más Vendidos y Alertas de Stock ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Productos Más Vendidos */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Productos más vendidos
          </h2>

          <div className="space-y-2.5">
            {topSellingProducts.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">
                Aún no hay prendas vendidas registradas.
              </p>
            ) : (
              topSellingProducts.slice(0, 4).map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-6 items-center justify-center rounded-full bg-rose-100 text-[#DC2626] text-xs font-black shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-neutral-900">
                        {p.productName}
                      </p>
                      <p className="text-[0.65rem] text-neutral-500 font-medium">
                        {p.ordersCount} órdenes · {p.unitsSold} uds. vendidas
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-xs text-neutral-900 shrink-0 ml-3">
                    {formatPEN(p.revenueAmount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Alertas de stock
            </h2>
            <Link
              href="/admin/inventario"
              className="text-xs font-bold text-[#DC2626] hover:underline"
            >
              Ver inventario
            </Link>
          </div>

          {inventoryAlerts.outOfStockCount === 0 && inventoryAlerts.lowStockCount === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center gap-2.5 text-emerald-900">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">Sin alertas de stock. Todo el inventario se encuentra disponible.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {inventoryAlerts.outOfStockItems.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-rose-950 truncate">
                      {item.productName} ({item.variant.sku})
                    </p>
                    <p className="text-[0.65rem] text-rose-700">Talla {item.variant.size} · Color {item.variant.colorName}</p>
                  </div>
                  <span className="rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[0.62rem] font-black text-rose-800 shrink-0">
                    Agotado (0 uds.)
                  </span>
                </div>
              ))}

              {inventoryAlerts.lowStockItems.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-amber-950 truncate">
                      {item.productName} ({item.variant.sku})
                    </p>
                    <p className="text-[0.65rem] text-amber-700">Talla {item.variant.size} · Color {item.variant.colorName}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[0.62rem] font-black text-amber-800 shrink-0">
                    {item.variant.stock} en stock
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
