import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getOrderDetailForUser } from "@/server/queries/orders";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import { AdminOrderManagementForm } from "@/components/admin/admin-order-management-form";
import { formatPEN } from "@/lib/format";
import {
  ArrowLeft,
  History,
  Boxes,
  CreditCard,
  FileText,
  MapPin,
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
  const [{ user: adminUser }, { id }] = await Promise.all([requireAdmin(), params]);

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

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-taupe-600 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Volver al listado de pedidos
        </Link>
      </div>

      {/* Cabecera */}
      <header className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-cochinilla">
              Expediente de Venta #{order.id}
            </span>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <h1 className="mt-2 font-display text-3xl text-ink">
            {order.orderNumber} — {order.billingCustomerName}
          </h1>
          <p className="mt-1 font-mono text-xs text-taupe-600">
            Cliente:{" "}
            <Link
              href={`/admin/clientes/${order.userId}`}
              className="font-semibold text-cochinilla underline"
            >
              {order.customerFirstNameSnapshot} {order.customerLastNameSnapshot}
            </Link>{" "}
            ({order.customerEmailSnapshot}) · Tel: {order.customerPhoneSnapshot}
          </p>
        </div>

        <div className="border border-ink/15 bg-paper px-6 py-4 text-right">
          <span className="block font-mono text-[0.65rem] uppercase text-taupe-500">
            Importe Total Inmutable (PEN)
          </span>
          <span
            data-testid="admin-order-total-amount"
            className="font-display text-3xl font-bold tabular-nums text-ink"
          >
            {formatPEN(order.totalAmount)}
          </span>
          <span className="mt-0.5 block font-mono text-[0.65rem] text-taupe-500">
            Base: {formatPEN(order.taxableBaseAmount)} + IGV 18%: {formatPEN(order.igvAmount)}
          </span>
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
        paymentReference={order.paymentProviderReference}
        adminNotes={order.adminNotes}
      />

      {/* Dirección y Comprobante Tributario */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-ink/15 bg-paper p-5 space-y-2 text-xs">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-ink">
            <MapPin className="size-4 text-cochinilla" />
            <span>Dirección Histórica de Entrega</span>
          </p>
          <p className="font-medium text-ink">
            Recibe: {order.shippingRecipientName} · Tel: {order.shippingRecipientPhone}
          </p>
          <p className="text-taupe-700">{order.shippingAddressLine1}</p>
          {order.shippingReference && (
            <p className="text-taupe-600">Referencia: {order.shippingReference}</p>
          )}
          <p className="font-mono uppercase text-taupe-600">
            {order.shippingDistrict}, {order.shippingProvince} — {order.shippingDepartment}
          </p>
          <p className="text-taupe-500">
            Zona tarifa: {order.shippingZoneNameSnapshot} ({formatPEN(order.shippingAmount)})
          </p>
        </div>

        <div className="border border-ink/15 bg-paper p-5 space-y-2 text-xs">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-ink">
            <FileText className="size-4 text-cochinilla" />
            <span>
              Datos Tributarios ({order.taxDocumentType.toUpperCase()})
            </span>
          </p>
          <p className="font-medium text-ink">
            Denominación: {order.billingCustomerName}
          </p>
          <p className="font-mono text-taupe-700">
            {order.billingDocType}: {order.billingDocNumber}
          </p>
          {order.billingFiscalAddress && (
            <p className="text-taupe-600">Domicilio Fiscal: {order.billingFiscalAddress}</p>
          )}
          {taxDocument && (
            <p className="border-t border-ink/10 pt-2 font-mono text-[0.7rem] text-taupe-600">
              Estado PSE/SUNAT: <strong>{taxDocument.status}</strong> —{" "}
              {taxDocument.providerResponseSummary}
            </p>
          )}
        </div>
      </section>

      {/* Líneas del Pedido */}
      <section className="border border-ink/15 bg-paper">
        <div className="border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl text-ink">
            Desglose de Prendas ({items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-[#fbfaf7] font-mono text-[0.65rem] uppercase text-taupe-600">
              <tr>
                <th className="px-5 py-3">Prenda / SKU</th>
                <th className="px-5 py-3">Tarifa</th>
                <th className="px-5 py-3">Cant.</th>
                <th className="px-5 py-3">Precio Unit.</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden bg-taupe-100">
                        <Image
                          src={item.imageUrlSnapshot ?? "/placeholder.jpg"}
                          alt={item.productNameSnapshot}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        {item.productId ? (
                          <Link
                            href={`/admin/productos/${item.productId}`}
                            className="font-medium text-ink hover:text-cochinilla hover:underline"
                          >
                            {item.productNameSnapshot}
                          </Link>
                        ) : (
                          <p className="font-medium text-ink">{item.productNameSnapshot}</p>
                        )}
                        <p className="font-mono text-xs text-taupe-500">
                          {item.skuSnapshot} · {item.colorNameSnapshot ?? "Único"} · Talla{" "}
                          {item.sizeSnapshot ?? "Única"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-taupe-700">
                    {item.appliedPriceLabel}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-ink">
                    {item.quantity} uds.
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-ink">
                    {formatPEN(item.unitPriceSnapshot)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                    {formatPEN(item.lineSubtotalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Movimientos de Inventario y Reservas Asociadas al Pedido */}
      <section
        data-testid="admin-order-inventory-movements"
        className="border border-ink/15 bg-paper p-6 space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
          <Boxes className="size-5 text-cochinilla" aria-hidden />
          <div>
            <h2 className="font-display text-xl text-ink">
              Reservas y Movimientos de Inventario del Pedido
            </h2>
            <p className="text-xs text-taupe-500">
              Trazabilidad exacta de retención, confirmación de salida o reposición por cancelación/reembolso.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-mono text-xs font-semibold uppercase text-ink">
              Estado de Reservas ({reservations.length})
            </h3>
            <div className="mt-2 divide-y divide-ink/10 border border-ink/10 bg-[#fbfaf7] p-3 text-xs">
              {reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-mono font-bold text-ink">{r.skuSnapshot}</span>
                    <span className="ml-2 text-taupe-600">({r.quantity} uds.)</span>
                    {r.releaseReason && (
                      <p className="text-[0.68rem] text-taupe-500">{r.releaseReason}</p>
                    )}
                  </div>
                  <span className="border border-ink/20 bg-paper px-2 py-0.5 font-mono text-[0.62rem] uppercase text-ink">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs font-semibold uppercase text-ink">
              Kardex de Movimientos ({movements.length})
            </h3>
            <div className="mt-2 divide-y divide-ink/10 border border-ink/10 bg-[#fbfaf7] p-3 text-xs">
              {movements.map((m) => (
                <div key={m.id} className="py-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-ink">
                      {m.skuSnapshot} [{m.movementType}]
                    </span>
                    <span className="text-taupe-700">
                      Stock: {m.stockBefore} → <strong>{m.stockAfter}</strong> (
                      {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta})
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.68rem] text-taupe-600">{m.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transacciones de Pago, Webhooks y Registro de Auditoría */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-ink/15 bg-paper p-5 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-ink">
            <CreditCard className="size-4 text-cochinilla" />
            <span>Transacciones y Webhooks ({payments.length + webhooks.length})</span>
          </div>
          <div className="divide-y divide-ink/10 text-xs">
            {payments.map((tx) => (
              <div key={tx.id} className="py-2">
                <p className="font-mono font-semibold text-ink">
                  [{tx.status.toUpperCase()}] {tx.provider} — {formatPEN(tx.amount)} (Ref:{" "}
                  {tx.providerTransactionId ?? "N/A"})
                </p>
                <p className="text-[0.68rem] text-taupe-500">
                  IdempotencyKey: {tx.idempotencyKey} · {tx.providerStatusDetail}
                </p>
              </div>
            ))}
            {webhooks.map((wh) => (
              <div key={wh.id} className="py-2">
                <p className="font-mono text-emerald-900">
                  [WEBHOOK {wh.eventType}] EventID: {wh.eventId} (Firma válida:{" "}
                  {wh.signatureValid ? "Sí" : "No"})
                </p>
                <p className="text-[0.68rem] text-taupe-500">{wh.processingNotes}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-ink/15 bg-paper p-5 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-ink">
            <History className="size-4 text-cochinilla" />
            <span>Historial de Auditoría ({auditLogs.length})</span>
          </div>
          <div className="divide-y divide-ink/10 text-xs">
            {auditLogs.map((entry) => (
              <div key={entry.log.id} className="py-2">
                <div className="flex items-center justify-between font-mono text-[0.68rem] text-taupe-500">
                  <span>{entry.log.action}</span>
                  <span>{new Date(entry.log.createdAt).toLocaleString("es-PE")}</span>
                </div>
                <p className="mt-0.5 text-ink">{entry.log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

