import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCommercialDashboard } from "@/server/queries/admin-commerce";
import { formatPrice } from "@/lib/format";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  Receipt,
  Building2,
  ArrowRight,
  Clock,
  CheckCircle2,
  Boxes,
  Filter,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Centro de Control Comercial — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  payment_processing: "Procesando pago",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
  payment_failed: "Pago fallido",
  refunded: "Reembolsado",
};

interface AdminDashboardPageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    channel?: string;
    status?: string;
  }>;
}

export default async function AdminRootDashboardPage({
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
    customersAndB2B,
    quotesSummary,
    taxDocumentsSummary,
  } = dashboard;

  return (
    <div className="shell py-8 md:py-10 space-y-8">
      {/* Encabezado Ejecutivo */}
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="kicker text-cochinilla">INVESTMENTS · CENTRO DE CONTROL COMERCIAL</p>
          <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Panel Principal del Negocio
          </h1>
          <p className="mt-1 text-sm text-taupe-700">
            Métricas en tiempo real desde Neon PostgreSQL: ventas B2C y B2B, operaciones logísticas, inventario, clientes y facturación electrónica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 bg-ink px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla"
          >
            <ShoppingBag className="size-3.5" aria-hidden />
            <span>Nuevo Producto</span>
          </Link>
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 border border-ink/20 bg-paper px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:border-ink"
          >
            <Boxes className="size-3.5 text-cochinilla" aria-hidden />
            <span>Ajustar Stock</span>
          </Link>
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-2 border border-ink/20 bg-paper px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:border-ink"
          >
            <Package className="size-3.5 text-cochinilla" aria-hidden />
            <span>Gestionar Pedidos</span>
          </Link>
        </div>
      </div>

      {/* Bloque 1: Ventas Globales (Hoy, Últimos 7 días, Este mes) */}
      <section aria-label="Resumen de ventas confirmadas">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-taupe-700">
            1. Ingresos Confirmados (Pedidos Pagados, En Despacho y Entregados)
          </h2>
          <span className="font-mono text-[0.7rem] text-taupe-500">
            Zona horaria: América/Lima (PEN)
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-ink/10 bg-paper p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.68rem] uppercase tracking-widest text-taupe-500">
                Ventas de Hoy
              </span>
              <TrendingUp className="size-4 text-emerald-600" aria-hidden />
            </div>
            <p className="mt-2 font-display text-2xl text-ink">
              {formatPrice(salesGlobal.todayAmount)}
            </p>
            <p className="mt-1 font-mono text-[0.72rem] text-taupe-700">
              {salesGlobal.todayOrders}{" "}
              {salesGlobal.todayOrders === 1 ? "pedido confirmado" : "pedidos confirmados"}
            </p>
          </div>

          <div className="border border-ink/10 bg-paper p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.68rem] uppercase tracking-widest text-taupe-500">
                Últimos 7 Días
              </span>
              <TrendingUp className="size-4 text-cochinilla" aria-hidden />
            </div>
            <p className="mt-2 font-display text-2xl text-ink">
              {formatPrice(salesGlobal.weekAmount)}
            </p>
            <p className="mt-1 font-mono text-[0.72rem] text-taupe-700">
              {salesGlobal.weekOrders}{" "}
              {salesGlobal.weekOrders === 1 ? "pedido confirmado" : "pedidos confirmados"}
            </p>
          </div>

          <div className="border border-ink/10 bg-paper p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.68rem] uppercase tracking-widest text-taupe-500">
                Ventas del Mes Actual
              </span>
              <CheckCircle2 className="size-4 text-indigo-700" aria-hidden />
            </div>
            <p className="mt-2 font-display text-2xl text-ink">
              {formatPrice(salesGlobal.monthAmount)}
            </p>
            <p className="mt-1 font-mono text-[0.72rem] text-taupe-700">
              {salesGlobal.monthOrders}{" "}
              {salesGlobal.monthOrders === 1 ? "pedido confirmado" : "pedidos confirmados"}
            </p>
          </div>

          <div className="border border-ink/10 bg-[#141312] p-5 text-paper shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.68rem] uppercase tracking-widest text-paper/70">
                Atención Operativa Inmediata
              </span>
              <Clock className="size-4 text-amber-400" aria-hidden />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="font-display text-2xl text-amber-300">
                  {filteredSummary.pendingPaymentOrdersCount}
                </p>
                <p className="font-mono text-[0.65rem] text-paper/75">Pend. de pago</p>
              </div>
              <div>
                <p className="font-display text-2xl text-emerald-300">
                  {filteredSummary.pendingPreparationOrdersCount}
                </p>
                <p className="font-mono text-[0.65rem] text-paper/75">Por despachar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bloque 2: Filtros Comerciales por Fecha, Canal (B2C / B2B) y Estado */}
      <section className="border border-ink/10 bg-paper p-5">
        <form method="GET" action="/admin" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="dash-dateFrom"
              className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
            >
              Desde Fecha
            </label>
            <input
              id="dash-dateFrom"
              name="dateFrom"
              type="date"
              defaultValue={params.dateFrom ?? ""}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="dash-dateTo"
              className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
            >
              Hasta Fecha
            </label>
            <input
              id="dash-dateTo"
              name="dateTo"
              type="date"
              defaultValue={params.dateTo ?? ""}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="dash-channel"
              className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
            >
              Canal de Venta
            </label>
            <select
              id="dash-channel"
              name="channel"
              defaultValue={channelFilter}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            >
              <option value="all">Todos los canales (B2C + B2B)</option>
              <option value="retail">Minorista (B2C Retail)</option>
              <option value="wholesale">Mayorista (B2B Empresas)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dash-status"
              className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
            >
              Estado del Pedido
            </label>
            <select
              id="dash-status"
              name="status"
              defaultValue={params.status ?? "all"}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-1.5 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla"
            >
              <Filter className="size-3.5" aria-hidden />
              <span>Filtrar</span>
            </button>
            {(params.dateFrom || params.dateTo || (params.channel && params.channel !== "all") || (params.status && params.status !== "all")) && (
              <Link
                href="/admin"
                className="border border-ink/20 px-3 py-2 font-mono text-xs text-taupe-700 hover:border-ink hover:text-ink"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </section>

      {/* Bloque 3: Comparativa B2C vs B2B y Desglose de Pedidos por Estado */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Comparativa B2C vs B2B */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                RENDIMIENTO POR CANAL
              </p>
              <h2 className="font-display text-xl text-ink">
                Ventas Minoristas (B2C) vs Mayoristas (B2B)
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-ink">
              Total: {formatPrice(filteredSummary.totalRevenueAmount)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-ink/10 bg-sand-50/60 p-4">
              <span className="inline-block rounded bg-ink/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase text-ink">
                Canal Minorista B2C
              </span>
              <p className="mt-2 font-display text-2xl text-ink">
                {formatPrice(filteredSummary.retail.revenueAmount)}
              </p>
              <p className="mt-1 font-mono text-xs text-taupe-700">
                {filteredSummary.retail.confirmedOrders} pagados / {filteredSummary.retail.totalOrders} totales
              </p>
            </div>

            <div className="border border-cochinilla/25 bg-cochinilla/5 p-4">
              <span className="inline-block rounded bg-cochinilla px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase text-paper">
                Canal Mayorista B2B
              </span>
              <p className="mt-2 font-display text-2xl text-ink">
                {formatPrice(filteredSummary.wholesale.revenueAmount)}
              </p>
              <p className="mt-1 font-mono text-xs text-taupe-700">
                {filteredSummary.wholesale.confirmedOrders} pagados / {filteredSummary.wholesale.totalOrders} totales
              </p>
            </div>
          </div>

          {/* Clientes, Empresas y Cotizaciones */}
          <div className="border-t border-ink/10 pt-4">
            <h3 className="font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700">
              Comunidad Comercial y Documentos
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Link
                href="/admin/clientes"
                className="border border-ink/10 p-3 transition-colors hover:border-ink"
              >
                <Users className="size-4 text-cochinilla" aria-hidden />
                <p className="mt-1 font-display text-xl text-ink">
                  {customersAndB2B.totalRegisteredCustomers}
                </p>
                <p className="font-mono text-[0.65rem] text-taupe-700">Clientes reg.</p>
              </Link>

              <Link
                href="/admin/solicitudes"
                className="border border-ink/10 p-3 transition-colors hover:border-ink"
              >
                <Building2 className="size-4 text-emerald-700" aria-hidden />
                <p className="mt-1 font-display text-xl text-ink">
                  {customersAndB2B.approvedCompaniesCount}
                </p>
                <p className="font-mono text-[0.65rem] text-taupe-700">
                  B2B Aprobadas ({customersAndB2B.pendingCompaniesCount} pend.)
                </p>
              </Link>

              <Link
                href="/admin/cotizaciones"
                className="border border-ink/10 p-3 transition-colors hover:border-ink"
              >
                <FileSpreadsheet className="size-4 text-indigo-700" aria-hidden />
                <p className="mt-1 font-display text-xl text-ink">
                  {quotesSummary.pendingCount}
                </p>
                <p className="font-mono text-[0.65rem] text-taupe-700">Cotiz. activas</p>
              </Link>

              <Link
                href="/admin/pedidos"
                className="border border-ink/10 p-3 transition-colors hover:border-ink"
              >
                <Receipt className="size-4 text-amber-700" aria-hidden />
                <p className="mt-1 font-display text-xl text-ink">
                  {taxDocumentsSummary.pendingTotalCount}
                </p>
                <p className="font-mono text-[0.65rem] text-taupe-700">SUNAT pend.</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Pedidos por Estado y Últimos Pedidos Filtrados */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                TRAZABILIDAD DE PEDIDOS
              </p>
              <h2 className="font-display text-xl text-ink">
                Distribución por Estado ({filteredSummary.totalOrders} pedidos en filtro)
              </h2>
            </div>
            <Link
              href="/admin/pedidos"
              className="inline-flex items-center gap-1 font-mono text-xs text-cochinilla hover:underline"
            >
              <span>Ver todos</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {Object.entries(ORDER_STATUS_LABELS).map(([statusKey, label]) => {
              const count = filteredSummary.statusBreakdown[statusKey] ?? 0;
              return (
                <Link
                  key={statusKey}
                  href={`/admin/pedidos?status=${statusKey}`}
                  className="border border-ink/10 bg-sand-50/40 p-2.5 transition-colors hover:border-ink"
                >
                  <p className="font-display text-lg text-ink">{count}</p>
                  <p className="truncate font-mono text-[0.64rem] text-taupe-700" title={label}>
                    {label}
                  </p>
                </Link>
              );
            })}
          </div>

          {filteredSummary.recentOrders.length === 0 ? (
            <div className="border border-dashed border-ink/20 bg-sand-50/40 p-6 text-center">
              <p className="text-sm text-taupe-700">
                No se encontraron pedidos para los criterios seleccionados en el filtro.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 font-mono text-[0.65rem] uppercase tracking-wider text-taupe-500">
                    <th className="py-2 pr-3">N.° Pedido</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Canal</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {filteredSummary.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-sand-50/60">
                      <td className="py-2.5 pr-3 font-mono font-bold">
                        <Link
                          href={`/admin/pedidos/${ord.id}`}
                          className="text-ink hover:text-cochinilla hover:underline"
                        >
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/clientes/${ord.userId}`}
                          className="font-medium text-ink hover:text-cochinilla hover:underline"
                        >
                          {ord.customerFirstNameSnapshot} {ord.customerLastNameSnapshot}
                        </Link>
                        <span className="block font-mono text-[0.65rem] text-taupe-500">
                          {ord.customerEmailSnapshot}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[0.68rem]">
                        {ord.orderMode === "wholesale" ? (
                          <span className="rounded bg-cochinilla/15 px-2 py-0.5 font-bold text-cochinilla">
                            B2B Mayorista
                          </span>
                        ) : (
                          <span className="rounded bg-ink/10 px-2 py-0.5 text-ink">
                            B2C Minorista
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[0.68rem]">
                        {ORDER_STATUS_LABELS[ord.status] ?? ord.status}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-ink">
                        {formatPrice(ord.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bloque 4: Productos Más Vendidos y Alertas de Stock Bajo / Agotado */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Productos más vendidos */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                RANKING DE ROTACIÓN
              </p>
              <h2 className="font-display text-xl text-ink">Productos Más Vendidos</h2>
            </div>
            <Link
              href="/admin/productos"
              className="inline-flex items-center gap-1 font-mono text-xs text-cochinilla hover:underline"
            >
              <span>Catálogo admin</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="border border-dashed border-ink/20 bg-sand-50/40 p-6 text-center">
              <p className="text-sm text-taupe-700">
                Aún no hay líneas de pedidos pagados en el periodo seleccionado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {topSellingProducts.map((item, idx) => (
                <div
                  key={`${item.productSlug}-${idx}`}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-ink font-mono text-[0.68rem] font-bold text-paper">
                      {idx + 1}
                    </span>
                    <div>
                      {item.productId ? (
                        <Link
                          href={`/admin/productos/${item.productId}`}
                          className="font-semibold text-ink hover:text-cochinilla hover:underline"
                        >
                          {item.productName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink">{item.productName}</span>
                      )}
                      <p className="font-mono text-[0.68rem] text-taupe-500">
                        {item.ordersCount} {item.ordersCount === 1 ? "orden" : "órdenes"} ·{" "}
                        {item.unitsSold} uds. vendidas
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-ink">
                    {formatPrice(item.revenueAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas de Inventario (Agotados y Stock Bajo) */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-amber-700">
                VIGILANCIA DE ALMACÉN
              </p>
              <h2 className="font-display text-xl text-ink">
                Alertas de Stock ({inventoryAlerts.outOfStockCount} agotados ·{" "}
                {inventoryAlerts.lowStockCount} stock bajo)
              </h2>
            </div>
            <Link
              href="/admin/inventario"
              className="inline-flex items-center gap-1 font-mono text-xs text-cochinilla hover:underline"
            >
              <span>Ir a kardex</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {inventoryAlerts.outOfStockItems.length === 0 &&
          inventoryAlerts.lowStockItems.length === 0 ? (
            <div className="border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <p className="text-sm font-medium text-emerald-900">
                Todas las variantes activas cuentan con stock saludable (&gt; 5 unidades).
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {inventoryAlerts.outOfStockItems.map((entry) => (
                <div
                  key={entry.variant.id}
                  className="flex items-center justify-between border border-rose-500/25 bg-rose-500/5 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-3.5 text-rose-600" aria-hidden />
                      <Link
                        href={`/admin/productos/${entry.variant.productId}`}
                        className="font-semibold text-ink hover:underline"
                      >
                        {entry.productName}
                      </Link>
                    </div>
                    <p className="mt-0.5 font-mono text-[0.68rem] text-taupe-700">
                      SKU: {entry.variant.sku} · Talla: {entry.variant.size ?? "Única"} · Color:{" "}
                      {entry.variant.colorName ?? "-"}
                    </p>
                  </div>
                  <span className="rounded bg-rose-600 px-2 py-0.5 font-mono text-[0.65rem] font-bold uppercase text-paper">
                    AGOTADO (0 uds.)
                  </span>
                </div>
              ))}

              {inventoryAlerts.lowStockItems.map((entry) => (
                <div
                  key={entry.variant.id}
                  className="flex items-center justify-between border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <Link
                      href={`/admin/productos/${entry.variant.productId}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {entry.productName}
                    </Link>
                    <p className="mt-0.5 font-mono text-[0.68rem] text-taupe-700">
                      SKU: {entry.variant.sku} · Talla: {entry.variant.size ?? "Única"} · Color:{" "}
                      {entry.variant.colorName ?? "-"}
                    </p>
                  </div>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[0.68rem] font-bold text-amber-900">
                    Quedan {entry.variant.stock} uds.
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
