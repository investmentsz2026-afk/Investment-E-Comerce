import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminOrdersList } from "@/server/queries/orders";
import { getOrSeedShippingZones } from "@/server/shipping/service";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import { AdminShippingZonesPanel } from "@/components/admin/admin-shipping-zones-panel";
import { formatPEN } from "@/lib/format";
import { Search, ArrowRight, Package, CheckCircle2, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Gestión de Pedidos, Pagos e Inventario — Admin",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    paymentStatus?: string;
    orderMode?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}) {
  await requireAdmin();
  const filters = await searchParams;

  const [ordersList, shippingZones] = await Promise.all([
    getAdminOrdersList({
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      orderMode: filters.orderMode,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      search: filters.search,
    }),
    getOrSeedShippingZones(),
  ]);

  const paidCount = ordersList.filter((o) => o.paymentStatus === "approved").length;
  const pendingCount = ordersList.filter((o) => o.status === "pending_payment").length;

  return (
    <div className="space-y-10">
      <header className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-cochinilla">
            Operaciones Comerciales, Logística y SUNAT
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">
            Pedidos, Pagos e Inventario
          </h1>
          <p className="mt-1 text-xs text-taupe-600">
            Supervisa pedidos minoristas (B2C) y mayoristas (B2B), concilia pagos, registra transportistas y audita el stock.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 border border-ink/15 bg-paper px-4 py-2">
            <Package className="size-4 text-ink" aria-hidden />
            <span>Total listados: <strong>{ordersList.length}</strong></span>
          </div>
          <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 px-4 py-2 text-emerald-950">
            <CheckCircle2 className="size-4 text-emerald-700" aria-hidden />
            <span>Pagados: <strong>{paidCount}</strong></span>
          </div>
          <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-2 text-amber-950">
            <Clock className="size-4 text-amber-700" aria-hidden />
            <span>Pendientes de pago: <strong>{pendingCount}</strong></span>
          </div>
        </div>
      </header>

      {/* Filtros de búsqueda */}
      <form
        method="GET"
        action="/admin/pedidos"
        className="grid grid-cols-1 gap-4 border border-ink/15 bg-paper p-5 md:grid-cols-12"
      >
        <div className="md:col-span-4">
          <label
            htmlFor="admin-order-search"
            className="block font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600"
          >
            Buscar por N° pedido, cliente, RUC/DNI o correo
          </label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-taupe-400" />
            <input
              id="admin-order-search"
              name="search"
              type="search"
              defaultValue={filters.search ?? ""}
              placeholder="Ej: ORD-2026-..., RUC 20..., correo..."
              className="h-10 w-full border border-ink/25 bg-[#fbfaf7] pr-3 pl-9 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="admin-order-mode-filter"
            className="block font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600"
          >
            Canal de Venta
          </label>
          <select
            id="admin-order-mode-filter"
            name="orderMode"
            defaultValue={filters.orderMode ?? ""}
            className="mt-1.5 h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-xs text-ink"
          >
            <option value="">Todos (B2C + B2B)</option>
            <option value="retail">Minorista (B2C)</option>
            <option value="wholesale">Mayorista (B2B)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="admin-order-status-filter"
            className="block font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600"
          >
            Estado del Pedido
          </label>
          <select
            id="admin-order-status-filter"
            name="status"
            defaultValue={filters.status ?? ""}
            className="mt-1.5 h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-xs text-ink"
          >
            <option value="">Todos los estados</option>
            <option value="pending_payment">Pendiente de Pago</option>
            <option value="payment_processing">Pago en Proceso</option>
            <option value="paid">Pagado</option>
            <option value="preparing">Preparando Pedido</option>
            <option value="shipped">Enviado / En Ruta</option>
            <option value="delivered">Entregado</option>
            <option value="payment_failed">Pago Fallido</option>
            <option value="cancelled">Cancelado</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="admin-payment-status-filter"
            className="block font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600"
          >
            Estado de Pago
          </label>
          <select
            id="admin-payment-status-filter"
            name="paymentStatus"
            defaultValue={filters.paymentStatus ?? ""}
            className="mt-1.5 h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-xs text-ink"
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="processing">En Proceso</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Rechazado</option>
            <option value="cancelled">Cancelado</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-end gap-2">
          <button
            type="submit"
            className="h-10 flex-1 bg-ink px-4 font-mono text-xs font-semibold uppercase tracking-wider text-paper hover:bg-cochinilla"
          >
            Filtrar
          </button>
          <Link
            href="/admin/pedidos"
            className="inline-flex h-10 items-center justify-center border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-xs text-ink hover:border-ink"
          >
            Limpiar
          </Link>
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="admin-order-date-from"
            className="block font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600"
          >
            Desde Fecha
          </label>
          <input
            id="admin-order-date-from"
            name="dateFrom"
            type="date"
            defaultValue={filters.dateFrom ?? ""}
            className="mt-1.5 h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-xs text-ink"
          />
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="admin-order-date-to"
            className="block font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600"
          >
            Hasta Fecha
          </label>
          <input
            id="admin-order-date-to"
            name="dateTo"
            type="date"
            defaultValue={filters.dateTo ?? ""}
            className="mt-1.5 h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-xs text-ink"
          />
        </div>
      </form>

      {/* Tabla de Pedidos */}
      <div className="overflow-x-auto border border-ink/15 bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-[#fbfaf7] font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-600">
            <tr>
              <th className="px-4 py-3.5">N° Pedido / Fecha</th>
              <th className="px-4 py-3.5">Cliente / Comprobante</th>
              <th className="px-4 py-3.5">Destino</th>
              <th className="px-4 py-3.5">Estado Logístico</th>
              <th className="px-4 py-3.5">Pago</th>
              <th className="px-4 py-3.5 text-right">Total (PEN)</th>
              <th className="px-4 py-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {ordersList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-xs text-taupe-500">
                  No se encontraron pedidos con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              ordersList.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#fbfaf7]/60">
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-bold text-ink">
                      {ord.orderNumber}
                    </span>
                    <span className="ml-2 border border-ink/15 bg-[#fbfaf7] px-1.5 py-0.5 font-mono text-[0.58rem] uppercase text-taupe-600">
                      {ord.orderMode === "wholesale" ? "B2B" : "B2C"}
                    </span>
                    <p className="mt-0.5 font-mono text-[0.68rem] text-taupe-500">
                      {new Date(ord.createdAt).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs">
                    <Link
                      href={`/admin/clientes/${ord.userId}`}
                      className="font-medium text-ink hover:text-cochinilla hover:underline"
                    >
                      {ord.billingCustomerName}
                    </Link>
                    <p className="font-mono text-[0.68rem] text-taupe-500">
                      {ord.taxDocumentType.toUpperCase()} · {ord.billingDocType}: {ord.billingDocNumber}
                    </p>
                    <p className="text-[0.68rem] text-taupe-500">{ord.customerEmailSnapshot}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-taupe-700">
                    {ord.shippingDistrict}, {ord.shippingProvince}
                    <span className="block font-mono text-[0.65rem] uppercase text-taupe-500">
                      {ord.shippingDepartment}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusBadge status={ord.status} />
                  </td>
                  <td className="px-4 py-4">
                    <PaymentStatusBadge status={ord.paymentStatus} />
                    <span className="mt-1 block font-mono text-[0.62rem] uppercase text-taupe-500">
                      {ord.paymentProvider} ({ord.totalUnits} uds.)
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm font-bold tabular-nums text-ink">
                    {formatPEN(ord.totalAmount)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/pedidos/${ord.id}`}
                      data-testid={`admin-manage-order-${ord.orderNumber}`}
                      className="inline-flex h-9 items-center gap-1.5 bg-ink px-3.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-paper hover:bg-cochinilla"
                    >
                      <span>Gestionar</span>
                      <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Configuración Administrativa de Tarifas de Envío */}
      <AdminShippingZonesPanel zones={shippingZones} />
    </div>
  );
}

