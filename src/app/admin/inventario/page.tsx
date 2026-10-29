import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminInventoryCatalog } from "@/server/queries/admin-commerce";
import { AdminInventoryAdjustmentForm } from "@/components/admin/admin-inventory-adjustment-form";
import {
  Boxes,
  AlertTriangle,
  Clock,
  History,
  Search,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Inventario y Kardex de Stock — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  manual_adjustment: "Ajuste / Entrada / Merma Admin",
  reservation_hold: "Reserva Checkout (Hold)",
  reservation_release: "Liberación de Reserva",
  sale_confirm: "Confirmación de Venta",
  refund_restock: "Reposición por Reembolso",
};

interface AdminInventoryPageProps {
  searchParams: Promise<{
    search?: string;
    stockState?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function AdminInventoryPage({
  searchParams,
}: AdminInventoryPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const stockState =
    params.stockState === "out_of_stock" ||
    params.stockState === "low_stock" ||
    params.stockState === "available"
      ? params.stockState
      : "all";

  const inventory = await getAdminInventoryCatalog({
    search: params.search,
    stockState,
    movementType: params.movementType || "all",
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  return (
    <div className="shell py-8 md:py-10 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker text-cochinilla">CONTROL DE ALMACÉN Y KARDEX</p>
          <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Inventario, Reservas y Movimientos de Stock
          </h1>
          <p className="mt-1 text-sm text-taupe-700">
            Supervisa el stock físico disponible por variante SKU, las reservas activas de checkout y el historial auditable de movimientos.
          </p>
        </div>
      </div>

      {/* Tarjetas de Resumen de Inventario */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border border-ink/10 bg-paper p-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-taupe-500">
            Variantes Totales
          </span>
          <p className="mt-1 font-display text-2xl text-ink">
            {inventory.summary.totalVariants}
          </p>
          <p className="font-mono text-[0.68rem] text-taupe-700">SKUs registrados</p>
        </div>

        <div className="border border-ink/10 bg-paper p-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-taupe-500">
            Unidades Disponibles
          </span>
          <p className="mt-1 font-display text-2xl text-emerald-700">
            {inventory.summary.totalAvailableUnits}
          </p>
          <p className="font-mono text-[0.68rem] text-taupe-700">Listas para venta</p>
        </div>

        <div className="border border-ink/10 bg-paper p-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-taupe-500">
            Reservas Activas
          </span>
          <p className="mt-1 font-display text-2xl text-indigo-700">
            {inventory.summary.totalReservedUnits}
          </p>
          <p className="font-mono text-[0.68rem] text-taupe-700">
            En pedidos por confirmar
          </p>
        </div>

        <div className="border border-amber-500/25 bg-amber-500/5 p-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-amber-800">
            Stock Bajo (1 a 5 uds.)
          </span>
          <p className="mt-1 font-display text-2xl text-amber-900">
            {inventory.summary.lowStockCount}
          </p>
          <p className="font-mono text-[0.68rem] text-amber-800">Variantes por reponer</p>
        </div>

        <div className="border border-rose-500/25 bg-rose-500/5 p-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-rose-800">
            Variantes Agotadas
          </span>
          <p className="mt-1 font-display text-2xl text-rose-700">
            {inventory.summary.outOfStockCount}
          </p>
          <p className="font-mono text-[0.68rem] text-rose-800">0 uds. disponibles</p>
        </div>
      </div>

      {/* Formulario de Entradas, Ajustes y Mermas */}
      <AdminInventoryAdjustmentForm
        variants={inventory.allVariantsForSelector.map((r) => ({
          variant: {
            id: r.variant.id,
            sku: r.variant.sku,
            size: r.variant.size,
            colorName: r.variant.colorName,
            stock: r.variant.stock,
          },
          productName: r.productName,
        }))}
      />

      {/* Filtros de Variantes y Kardex */}
      <form
        method="GET"
        action="/admin/inventario"
        className="grid gap-3 border border-ink/10 bg-paper p-5 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label
            htmlFor="inv-search"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Buscar por SKU, producto, talla, color o motivo
          </label>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-taupe-500"
              aria-hidden
            />
            <input
              id="inv-search"
              name="search"
              type="text"
              defaultValue={params.search ?? ""}
              placeholder="Ej: INV-001, Alpaca, Lote..."
              className="w-full border border-ink/20 bg-sand-50 py-2 pr-3 pl-8 text-xs text-ink"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="inv-state"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Estado de Stock
          </label>
          <select
            id="inv-state"
            name="stockState"
            defaultValue={stockState}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="all">Todas las variantes</option>
            <option value="out_of_stock">Agotadas (0 uds.)</option>
            <option value="low_stock">Stock bajo (1-5 uds.)</option>
            <option value="available">Saludable (&gt; 5 uds.)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="inv-mtype"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Tipo de Movimiento
          </label>
          <select
            id="inv-mtype"
            name="movementType"
            defaultValue={params.movementType ?? "all"}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="all">Todos los movimientos</option>
            {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="inv-from"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Desde Fecha
          </label>
          <input
            id="inv-from"
            name="dateFrom"
            type="date"
            defaultValue={params.dateFrom ?? ""}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-paper hover:bg-cochinilla"
          >
            Filtrar
          </button>
          {(params.search ||
            params.stockState ||
            params.movementType ||
            params.dateFrom) && (
            <Link
              href="/admin/inventario"
              className="border border-ink/20 px-3 py-2 font-mono text-xs text-taupe-700 hover:border-ink"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {/* Matriz de Stock por Variante y Reservas Activas */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                EXISTENCIAS EN TIEMPO REAL
              </p>
              <h2 className="font-display text-xl text-ink">
                Stock por Producto y Variante ({inventory.variants.length})
              </h2>
            </div>
            <Boxes className="size-4 text-cochinilla" aria-hidden />
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[0.64rem] uppercase tracking-wider text-taupe-500">
                  <th className="py-2 pr-3">SKU / Atributos</th>
                  <th className="py-2 pr-3">Producto</th>
                  <th className="py-2 pr-3 text-right">Reservado</th>
                  <th className="py-2 text-right">Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {inventory.variants.map((row) => (
                  <tr key={row.variant.id} className="hover:bg-sand-50/50">
                    <td className="py-2.5 pr-3 font-mono">
                      <span className="font-bold text-ink">{row.variant.sku}</span>
                      <span className="block text-[0.64rem] text-taupe-600">
                        Talla: {row.variant.size ?? "Única"} · Color:{" "}
                        {row.variant.colorName ?? "-"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/admin/productos/${row.productId}`}
                        className="font-medium text-ink hover:text-cochinilla hover:underline"
                      >
                        {row.productName}
                      </Link>
                      <span className="block font-mono text-[0.63rem] text-taupe-500">
                        {row.categoryName}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-indigo-700">
                      {row.reservedUnits > 0 ? `${row.reservedUnits} uds.` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {row.variant.stock <= 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-2 py-0.5 text-[0.64rem] font-bold text-paper">
                          <AlertTriangle className="size-3" aria-hidden />
                          0 uds.
                        </span>
                      ) : row.variant.stock <= 5 ? (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[0.68rem] font-bold text-amber-900">
                          {row.variant.stock} uds. (Bajo)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700">
                          {row.variant.stock} uds.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de Movimientos (Kardex Auditable) */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                TRAZABILIDAD DE KARDEX
              </p>
              <h2 className="font-display text-xl text-ink">
                Historial de Movimientos ({inventory.movements.length})
              </h2>
            </div>
            <History className="size-4 text-cochinilla" aria-hidden />
          </div>

          {inventory.activeReservations.length > 0 && (
            <div className="border border-indigo-500/25 bg-indigo-500/5 p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[0.68rem] font-bold text-indigo-900">
                <Clock className="size-3.5" aria-hidden />
                <span>
                  Reservas de Checkout Activas ({inventory.activeReservations.length})
                </span>
              </div>
              {inventory.activeReservations.slice(0, 4).map((r) => (
                <div
                  key={r.reservation.id}
                  className="flex items-center justify-between font-mono text-[0.65rem] text-indigo-950"
                >
                  <span>
                    SKU {r.reservation.skuSnapshot} ({r.reservation.quantity} uds.)
                  </span>
                  <Link
                    href={`/admin/pedidos/${r.reservation.orderId}`}
                    className="font-bold underline"
                  >
                    {r.orderNumber}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {inventory.movements.length === 0 ? (
            <div className="border border-dashed border-ink/20 p-6 text-center text-xs text-taupe-700">
              No hay movimientos en el kardex para los filtros aplicados.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {inventory.movements.map((m) => (
                <div
                  key={m.movement.id}
                  className="border border-ink/10 bg-sand-50/40 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-ink">
                      {m.movement.skuSnapshot} ·{" "}
                      <Link
                        href={`/admin/productos/${m.productId}`}
                        className="hover:text-cochinilla hover:underline"
                      >
                        {m.productName}
                      </Link>
                    </span>
                    <span
                      className={`font-bold ${
                        m.movement.quantityDelta > 0
                          ? "text-emerald-700"
                          : m.movement.quantityDelta < 0
                            ? "text-rose-700"
                            : "text-indigo-700"
                      }`}
                    >
                      {m.movement.quantityDelta > 0
                        ? `+${m.movement.quantityDelta}`
                        : m.movement.quantityDelta}{" "}
                      uds. ({m.movement.stockBefore} → {m.movement.stockAfter})
                    </span>
                  </div>

                  <p className="text-[0.72rem] text-taupe-800">
                    {m.movement.notes ||
                      MOVEMENT_TYPE_LABELS[m.movement.movementType] ||
                      m.movement.movementType}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.62rem] text-taupe-500">
                    <span>
                      {new Date(m.movement.createdAt).toLocaleString("es-PE")}
                    </span>
                    <span>
                      {m.orderNumber && m.movement.orderId ? (
                        <Link
                          href={`/admin/pedidos/${m.movement.orderId}`}
                          className="text-cochinilla underline"
                        >
                          Pedido {m.orderNumber}
                        </Link>
                      ) : m.actorEmail ? (
                        `Operador: ${m.actorFirstName ?? ""} (${m.actorEmail})`
                      ) : (
                        "Sistema automático"
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

