import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getOrderDetailForUser } from "@/server/queries/orders";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/order-status-badge";
import { AdminOrderManagementForm } from "@/components/admin/admin-order-management-form";
import { formatPEN } from "@/lib/format";
import {
  ArrowLeft,
  History,
  Boxes,
  Camera,
  CreditCard,
  FileText,
  MapPin,
  Package,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Detalle de Pedido e Inventario — Admin",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ user: adminUser }, { id }] = await Promise.all([
    requireAdmin(),
    params,
  ]);

  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    notFound();
  }

  const detail = await getOrderDetailForUser(orderId, adminUser.id, true);
  if (!detail) {
    notFound();
  }

  const {
    order,
    items,
    payments,
    reservations,
    movements,
    taxDocument,
    webhooks,
    auditLogs,
  } = detail;

  const destinationLabel =
    [order.shippingDistrict, order.shippingProvince, order.shippingDepartment]
      .map((s) => (s ?? "").trim())
      .filter(Boolean)
      .join(", ") || "Recojo en tienda / Sin dirección";

  return (
    <div className="space-y-6 font-sans">
      <div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:text-[#DC2626]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al listado de pedidos
        </Link>
      </div>

      {/* CABECERA HERO 3D DEL EXPEDIENTE */}
      <header className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white shadow-[0_20px_48px_-14px_rgba(220,38,38,0.42)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
                Expediente de Venta #{order.id}
              </span>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              {order.orderNumber} — {order.billingCustomerName}
            </h1>

            <p className="text-xs font-semibold text-white/90">
              Cliente:{" "}
              <Link
                href={`/admin/clientes/${order.userId}`}
                className="font-extrabold underline decoration-white/60 hover:decoration-white"
              >
                {order.customerFirstNameSnapshot}{" "}
                {order.customerLastNameSnapshot}
              </Link>{" "}
              ({order.customerEmailSnapshot}) · Tel:{" "}
              {order.customerPhoneSnapshot}
            </p>
          </div>

          <div className="rounded-2xl border border-white/25 bg-white/95 px-6 py-4 text-right text-slate-900 shadow-lg backdrop-blur-md">
            <span className="block text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
              Importe Total Inmutable (PEN)
            </span>
            <span
              data-testid="admin-order-total-amount"
              className="mt-0.5 block font-sans text-3xl font-black tabular-nums text-[#991B1B]"
            >
              {formatPEN(order.totalAmount)}
            </span>
            <span className="mt-1 block text-xs font-bold tabular-nums text-slate-500">
              Base: {formatPEN(order.taxableBaseAmount)} + IGV 18%:{" "}
              {formatPEN(order.igvAmount)}
            </span>
          </div>
        </div>
      </header>

      {/* Formulario de Gestión Logística y Conciliación */}
      <AdminOrderManagementForm
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStatus={order.status}
        paymentStatus={order.paymentStatus}
        carrierName={order.carrierName}
        trackingNumber={order.trackingNumber}
        trackingUrl={order.trackingUrl}
        deliveryProofImageUrl={order.deliveryProofImageUrl}
        paymentReference={order.paymentProviderReference}
        adminNotes={order.adminNotes}
      />

      {/* Evidencia Fotográfica de Entrega (si fue cargada) */}
      {order.deliveryProofImageUrl && (
        <section className="flex flex-wrap items-center gap-5 rounded-3xl border border-emerald-200 bg-white p-6 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl border border-emerald-300 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.deliveryProofImageUrl}
              alt={`Evidencia entrega ${order.orderNumber}`}
              className="size-full object-cover"
            />
          </div>
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[0.68rem] font-extrabold uppercase text-emerald-800">
              <Camera className="size-3.5" />
              Evidencia Fotográfica Registrada
            </span>
            <h2 className="font-sans text-lg font-extrabold text-slate-900">
              Confirmación Visual de Entrega al Cliente
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Imagen almacenada en el expediente de venta junto a la fecha de
              entrega.
            </p>
          </div>
        </section>
      )}

      {/* Dirección y Comprobante Tributario */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2.5 rounded-3xl border border-slate-200/90 bg-white p-6 text-xs shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
            <span className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-[#DC2626]">
              <MapPin className="size-4" />
            </span>
            <span>Dirección Histórica de Entrega</span>
          </p>
          <p className="pt-1 text-sm font-extrabold text-slate-900">
            Recibe: {order.shippingRecipientName} · Tel:{" "}
            {order.shippingRecipientPhone}
          </p>
          <p className="font-medium text-slate-700">
            {order.shippingAddressLine1}
          </p>
          {order.shippingReference && (
            <p className="font-medium text-slate-500">
              Referencia: {order.shippingReference}
            </p>
          )}
          <p className="font-bold uppercase text-slate-600">
            {destinationLabel}
          </p>
          <p className="inline-block rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Zona tarifa: {order.shippingZoneNameSnapshot} (
            {formatPEN(order.shippingAmount)})
          </p>
        </div>

        <div className="space-y-2.5 rounded-3xl border border-slate-200/90 bg-white p-6 text-xs shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileText className="size-4" />
            </span>
            <span>
              Datos Tributarios ({order.taxDocumentType.toUpperCase()})
            </span>
          </p>
          <p className="pt-1 text-sm font-extrabold text-slate-900">
            Denominación: {order.billingCustomerName}
          </p>
          <p className="font-bold text-slate-700">
            {order.billingDocType}: {order.billingDocNumber}
          </p>
          {order.billingFiscalAddress && (
            <p className="font-medium text-slate-500">
              Domicilio Fiscal: {order.billingFiscalAddress}
            </p>
          )}
          {taxDocument && (
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
              Estado PSE/SUNAT:{" "}
              <strong className="font-extrabold uppercase text-slate-900">
                {taxDocument.status}
              </strong>{" "}
              — {taxDocument.providerResponseSummary}
            </div>
          )}
        </div>
      </section>

      {/* Líneas del Pedido */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_14px_34px_-16px_rgba(15,23,42,0.15)]">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
          <Package className="size-5 text-[#DC2626]" />
          <h2 className="font-sans text-xl font-extrabold text-slate-900">
            Desglose de Prendas ({items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-6 py-3.5">Prenda / SKU</th>
                <th className="px-5 py-3.5">Tarifa</th>
                <th className="px-5 py-3.5">Cant.</th>
                <th className="px-5 py-3.5">Precio Unit.</th>
                <th className="px-6 py-3.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const imgSrc = item.imageUrlSnapshot ?? "/placeholder.jpg";
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <Image
                            src={imgSrc}
                            alt={item.productNameSnapshot}
                            fill
                            sizes="44px"
                            unoptimized={imgSrc.startsWith("/api/media/")}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          {item.productId ? (
                            <Link
                              href={`/admin/productos/${item.productId}`}
                              className="font-extrabold text-slate-900 hover:text-[#DC2626] hover:underline"
                            >
                              {item.productNameSnapshot}
                            </Link>
                          ) : (
                            <p className="font-extrabold text-slate-900">
                              {item.productNameSnapshot}
                            </p>
                          )}
                          <p className="text-xs font-semibold text-slate-500">
                            {item.skuSnapshot} ·{" "}
                            {item.colorNameSnapshot ?? "Único"} · Talla{" "}
                            {item.sizeSnapshot ?? "Única"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                      {item.appliedPriceLabel}
                    </td>
                    <td className="px-5 py-4 text-xs font-extrabold tabular-nums text-slate-900">
                      {item.quantity} uds.
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold tabular-nums text-slate-700">
                      {formatPEN(item.unitPriceSnapshot)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black tabular-nums text-slate-900">
                      {formatPEN(item.lineSubtotalAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Movimientos de Inventario y Reservas Asociadas al Pedido */}
      <section
        data-testid="admin-order-inventory-movements"
        className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-16px_rgba(15,23,42,0.15)]"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
            <Boxes className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-sans text-xl font-extrabold text-slate-900">
              Reservas y Movimientos de Inventario del Pedido
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Trazabilidad exacta de retención, confirmación de salida o
              reposición por cancelación/reembolso.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Estado de Reservas ({reservations.length})
            </h3>
            <div className="mt-2.5 divide-y divide-slate-200/70 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="font-extrabold text-slate-900">
                      {r.skuSnapshot}
                    </span>
                    <span className="ml-2 font-semibold text-slate-600">
                      ({r.quantity} uds.)
                    </span>
                    {r.releaseReason && (
                      <p className="text-xs font-medium text-slate-500">
                        {r.releaseReason}
                      </p>
                    )}
                  </div>
                  <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-slate-800">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Kardex de Movimientos ({movements.length})
            </h3>
            <div className="mt-2.5 divide-y divide-slate-200/70 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs">
              {movements.map((m) => (
                <div key={m.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">
                      {m.skuSnapshot} [{m.movementType}]
                    </span>
                    <span className="font-bold tabular-nums text-slate-700">
                      Stock: {m.stockBefore} → <strong>{m.stockAfter}</strong> (
                      {m.quantityDelta >= 0
                        ? `+${m.quantityDelta}`
                        : m.quantityDelta}
                      )
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {m.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transacciones de Pago, Webhooks y Registro de Auditoría */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
            <CreditCard className="size-4 text-[#DC2626]" />
            <span>
              Transacciones y Webhooks ({payments.length + webhooks.length})
            </span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {payments.map((tx) => (
              <div key={tx.id} className="py-2.5">
                <p className="font-extrabold text-slate-900">
                  [{tx.status.toUpperCase()}] {tx.provider} —{" "}
                  {formatPEN(tx.amount)} (Ref:{" "}
                  {tx.providerTransactionId ?? "N/A"})
                </p>
                <p className="font-medium text-slate-500">
                  IdempotencyKey: {tx.idempotencyKey} ·{" "}
                  {tx.providerStatusDetail}
                </p>
              </div>
            ))}
            {webhooks.map((wh) => (
              <div key={wh.id} className="py-2.5">
                <p className="font-extrabold text-emerald-900">
                  [WEBHOOK {wh.eventType}] EventID: {wh.eventId} (Firma válida:{" "}
                  {wh.signatureValid ? "Sí" : "No"})
                </p>
                <p className="font-medium text-slate-500">
                  {wh.processingNotes}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
            <History className="size-4 text-[#DC2626]" />
            <span>Historial de Auditoría ({auditLogs.length})</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((entry) => (
              <div key={entry.log.id} className="py-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-extrabold text-slate-700">
                    {entry.log.action}
                  </span>
                  <span className="font-medium">
                    {new Date(entry.log.createdAt).toLocaleString("es-PE")}
                  </span>
                </div>
                <p className="mt-0.5 font-medium text-slate-900">
                  {entry.log.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
