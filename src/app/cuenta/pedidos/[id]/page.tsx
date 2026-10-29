import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { getOrderDetailForUser } from "@/server/queries/orders";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import { OrderCustomerActions } from "@/components/orders/order-customer-actions";
import { formatPEN } from "@/lib/format";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  FileText,
  Truck,
  CreditCard,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export const instant = false;

export default async function CustomerOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ user }, { id }, query] = await Promise.all([
    requireAuth("/cuenta/pedidos"),
    params,
    searchParams,
  ]);

  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    notFound();
  }

  // Aislamiento estricto por usuario (IDOR protection)
  const detail = await getOrderDetailForUser(orderId, user.id, false);
  if (!detail) {
    notFound();
  }

  const { order, items, payments, taxDocument, paymentConfig } = detail;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/cuenta/pedidos"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-taupe-600 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Volver al historial de pedidos
        </Link>
      </div>

      {query.created === "1" && (
        <div
          data-testid="order-created-confirmation-banner"
          className="flex items-start gap-3 border border-emerald-400 bg-emerald-50 p-5 text-emerald-950"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-900">
              Pedido {order.orderNumber} Registrado Exitosamente
            </p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              Hemos congelado tus precios históricos y reservado el stock de las variantes seleccionadas. A continuación puedes revisar el estado de tu pago, el desglose de IGV y tu comprobante electrónico.
            </p>
          </div>
        </div>
      )}

      {/* Cabecera del Pedido */}
      <header className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              data-testid="order-detail-number"
              className="font-display text-3xl text-ink"
            >
              Pedido {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="mt-2 font-mono text-xs text-taupe-500">
            Registrado el{" "}
            {new Date(order.createdAt).toLocaleString("es-PE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · Modalidad:{" "}
            <strong className="uppercase text-ink">
              {order.orderMode === "wholesale" ? "Mayorista B2B" : "Minorista B2C"}
            </strong>
          </p>
        </div>

        <div className="border border-ink/15 bg-[#fbfaf7] px-5 py-3 text-right">
          <span className="block font-mono text-[0.65rem] uppercase text-taupe-500">
            Total Oficial (PEN)
          </span>
          <span
            data-testid="order-detail-total"
            className="font-display text-2xl font-bold tabular-nums text-ink"
          >
            {formatPEN(order.totalAmount)}
          </span>
        </div>
      </header>

      {/* Panel de Reintento / Cancelación cuando el pago aún está pendiente o falló */}
      <OrderCustomerActions
        orderId={order.id}
        orderNumber={order.orderNumber}
        status={order.status}
        paymentStatus={order.paymentStatus}
      />

      {/* Instrucciones de Transferencia Bancaria si aplica */}
      {order.paymentProvider === "bank_transfer" && order.paymentStatus !== "approved" && (
        <div className="border border-ink/20 bg-[#fbfaf7] p-6 text-xs space-y-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
            Instrucciones de Transferencia Bancaria / CCI Corporativo
          </p>
          <p className="text-taupe-700">
            Titular: <strong>{paymentConfig.bankTransferInstructions.accountHolder}</strong> · Banco:{" "}
            <strong>{paymentConfig.bankTransferInstructions.bankName}</strong>
          </p>
          <p className="font-mono text-taupe-600">
            Cuenta Soles: {paymentConfig.bankTransferInstructions.penAccountNumber} · CCI:{" "}
            {paymentConfig.bankTransferInstructions.penCci}
          </p>
          <p className="text-taupe-500">
            Indica como referencia el número de pedido <strong>{order.orderNumber}</strong>.
          </p>
        </div>
      )}

      {/* Información de Seguimiento Logístico (solo muestra datos reales si existen) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-ink/15 bg-paper p-5 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink">
            <MapPin className="size-4 text-cochinilla" aria-hidden />
            <span>Dirección y Despacho</span>
          </div>
          <div className="text-xs text-taupe-700 space-y-1">
            <p className="font-medium text-ink">
              Recibe: {order.shippingRecipientName} ({order.shippingRecipientPhone})
            </p>
            <p>
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
            </p>
            {order.shippingReference && <p>Referencia: {order.shippingReference}</p>}
            <p className="font-mono text-[0.7rem] uppercase text-taupe-600">
              {order.shippingDistrict}, {order.shippingProvince} — {order.shippingDepartment}
            </p>
            <p className="pt-1 text-[0.7rem] text-taupe-500">
              Zona aplicada: {order.shippingZoneNameSnapshot} ({order.shippingEstimatedLabel})
            </p>
          </div>

          <div className="border-t border-ink/10 pt-3 text-xs">
            <p className="flex items-center gap-1.5 font-mono text-[0.68rem] uppercase text-taupe-600">
              <Truck className="size-3.5 text-ink" aria-hidden />
              <span>Seguimiento de Envío:</span>
            </p>
            {order.carrierName || order.trackingNumber ? (
              <div className="mt-1.5 space-y-1">
                {order.carrierName && (
                  <p>
                    Operador logístico: <strong className="text-ink">{order.carrierName}</strong>
                  </p>
                )}
                {order.trackingNumber && (
                  <p data-testid="order-tracking-number" className="font-mono text-ink">
                    Código de tracking: <strong>{order.trackingNumber}</strong>
                  </p>
                )}
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-cochinilla underline"
                  >
                    Abrir seguimiento del operador <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-1 text-taupe-500">
                El número de seguimiento y transportista se mostrarán aquí en cuanto el almacén despache tu paquete.
              </p>
            )}
          </div>
        </div>

        {/* Comprobante Electrónico Tributario (Boleta / Factura Perú) */}
        <div
          data-testid="order-tax-document-card"
          className="border border-ink/15 bg-paper p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink">
              <FileText className="size-4 text-cochinilla" aria-hidden />
              <span>
                {order.taxDocumentType === "factura"
                  ? "Factura Electrónica"
                  : "Boleta de Venta Electrónica"}
              </span>
            </div>
            {taxDocument && (
              <span className="border border-ink/20 bg-[#fbfaf7] px-2 py-0.5 font-mono text-[0.62rem] uppercase text-ink">
                {taxDocument.status === "issued"
                  ? "Emitido"
                  : taxDocument.status === "pending_config"
                    ? "Pendiente Config. PSE/SUNAT"
                    : "En Cola de Emisión"}
              </span>
            )}
          </div>

          <div className="text-xs text-taupe-700 space-y-1">
            <p>
              Titular / Razón Social:{" "}
              <strong className="text-ink">{order.billingCustomerName}</strong>
            </p>
            <p className="font-mono">
              {order.billingDocType}: <strong className="text-ink">{order.billingDocNumber}</strong>
            </p>
            {order.billingFiscalAddress && (
              <p>Domicilio Fiscal: {order.billingFiscalAddress}</p>
            )}
          </div>

          {taxDocument && (
            <div className="border-t border-ink/10 pt-3 text-xs space-y-1.5">
              {taxDocument.series && taxDocument.correlativeNumber ? (
                <p className="font-mono font-semibold text-emerald-900">
                  Comprobante Oficial: {taxDocument.series}-{taxDocument.correlativeNumber}
                </p>
              ) : (
                <p className="text-[0.7rem] leading-relaxed text-taupe-600">
                  {taxDocument.providerResponseSummary}
                </p>
              )}

              {taxDocument.pdfUrl && (
                <a
                  href={taxDocument.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-cochinilla underline"
                >
                  Descargar representación impresa (PDF) <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tabla Histórica de Prendas del Pedido */}
      <section className="border border-ink/15 bg-paper">
        <div className="border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl text-ink">
            Prendas del Pedido ({items.length} {items.length === 1 ? "línea" : "líneas"})
          </h2>
          <p className="text-xs text-taupe-500">
            Fotografía histórica de precios y variantes al momento de la compra.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-[#fbfaf7] font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600">
              <tr>
                <th className="px-5 py-3">Prenda / SKU</th>
                <th className="px-5 py-3">Condición Aplicada</th>
                <th className="px-5 py-3">Cantidad</th>
                <th className="px-5 py-3">Precio Unit.</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative aspect-[3/4] w-11 shrink-0 overflow-hidden bg-taupe-100">
                        <Image
                          src={item.imageUrlSnapshot ?? "/placeholder.jpg"}
                          alt={item.productNameSnapshot}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-ink">{item.productNameSnapshot}</p>
                        <p className="font-mono text-xs text-taupe-500">
                          SKU: {item.skuSnapshot} · {item.colorNameSnapshot ?? "Único"} · Talla{" "}
                          {item.sizeSnapshot ?? "Única"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-taupe-700">
                    {item.appliedPriceLabel}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs tabular-nums text-ink">
                    {item.quantity} uds.
                  </td>
                  <td className="px-5 py-4 font-mono text-xs tabular-nums text-ink">
                    {formatPEN(item.unitPriceSnapshot)}
                    {item.retailUnitPriceSnapshot > item.unitPriceSnapshot && (
                      <span className="ml-1.5 text-taupe-400 line-through">
                        {formatPEN(item.retailUnitPriceSnapshot)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                    {formatPEN(item.lineSubtotalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero e Impuestos */}
        <div className="border-t border-ink/15 bg-[#fbfaf7] p-5 sm:p-6">
          <div className="ml-auto max-w-sm space-y-2 text-xs">
            <div className="flex justify-between text-taupe-600">
              <span>Subtotal a precio minorista:</span>
              <span className="font-mono tabular-nums text-ink">
                {formatPEN(order.retailSubtotalAmount)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between font-medium text-emerald-800">
                <span>Descuento mayorista / cotización aplicado:</span>
                <span className="font-mono tabular-nums">
                  −{formatPEN(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-taupe-700">
              <span>Subtotal de prendas:</span>
              <span className="font-mono tabular-nums text-ink">
                {formatPEN(order.subtotalAfterDiscountAmount)}
              </span>
            </div>
            <div className="flex justify-between text-taupe-700">
              <span>Costo de envío ({order.shippingZoneNameSnapshot}):</span>
              <span className="font-mono tabular-nums text-ink">
                {formatPEN(order.shippingAmount)}
              </span>
            </div>
            <div className="border-t border-ink/10 pt-2 text-[0.7rem] text-taupe-500 space-y-1">
              <div className="flex justify-between">
                <span>Operación Gravada (Base Imponible):</span>
                <span className="font-mono tabular-nums">
                  {formatPEN(order.taxableBaseAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>IGV (18%):</span>
                <span className="font-mono tabular-nums">{formatPEN(order.igvAmount)}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink/20 pt-2.5">
              <span className="font-mono text-xs font-bold uppercase text-ink">
                Total del Pedido (PEN):
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-ink">
                {formatPEN(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Historial de Transacciones de Pago */}
      <section className="border border-ink/15 bg-paper p-5 space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink">
          <CreditCard className="size-4 text-cochinilla" aria-hidden />
          <span>Referencias de Pago ({order.paymentMethodLabel})</span>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-taupe-500">No hay intentos de cobro registrados aún.</p>
        ) : (
          <div className="divide-y divide-ink/10 text-xs">
            {payments.map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <span className="font-mono font-semibold uppercase text-ink">
                    {tx.provider} {tx.isSandbox ? "(Sandbox)" : ""}
                  </span>{" "}
                  · Ref: <code className="font-mono text-taupe-700">{tx.providerTransactionId ?? "N/A"}</code>
                  {tx.maskedCardLast4 && (
                    <span className="ml-2 text-taupe-500">
                      (Tarjeta •••• {tx.maskedCardLast4})
                    </span>
                  )}
                  <p className="text-[0.7rem] text-taupe-500">
                    {tx.providerStatusDetail}
                    {tx.errorMessage ? ` — ${tx.errorMessage}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <PaymentStatusBadge status={tx.status} />
                  <span className="mt-1 block font-mono text-[0.68rem] text-taupe-500">
                    {new Date(tx.createdAt).toLocaleString("es-PE")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="flex items-center gap-1.5 border-t border-ink/10 pt-3 text-[0.68rem] text-taupe-500">
          <ShieldCheck className="size-3.5 text-emerald-800" aria-hidden />
          <span>
            Confirmación verificada en el servidor de INVESTMENTS. Nunca almacenamos números completos de tarjeta ni códigos CVV.
          </span>
        </p>
      </section>
    </div>
  );
}

