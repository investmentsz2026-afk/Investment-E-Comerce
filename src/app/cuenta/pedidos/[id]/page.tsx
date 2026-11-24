import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { getOrderDetailForUser } from "@/server/queries/orders";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import { OrderCustomerActions } from "@/components/orders/order-customer-actions";
import { formatPEN } from "@/lib/format";
import {
  FaArrowLeft,
  FaCircleCheck,
  FaLocationDot,
  FaFileInvoice,
  FaTruckFast,
  FaCreditCard,
  FaShieldHalved,
  FaArrowUpRightFromSquare,
  FaCalendarDays,
  FaBuildingColumns,
} from "react-icons/fa6";

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
    <div className="space-y-6 text-slate-900">
      <div>
        <Link
          href="/cuenta/pedidos"
          className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#0055FF] transition-colors"
        >
          <FaArrowLeft className="size-3" aria-hidden />
          <span>Volver al historial de pedidos</span>
        </Link>
      </div>

      {query.created === "1" && (
        <div
          data-testid="order-created-confirmation-banner"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-xs"
        >
          <FaCircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-900">
              Pedido {order.orderNumber} Registrado Exitosamente
            </p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              Hemos congelado tus precios históricos y reservado el stock de las prendas seleccionadas en nuestro almacén central. A continuación puedes revisar el estado de tu pago y tu comprobante electrónico SUNAT.
            </p>
          </div>
        </div>
      )}

      {/* Cabecera del Pedido */}
      <header className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:gap-4 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <h1
              data-testid="order-detail-number"
              className="text-lg font-black uppercase tracking-tight text-slate-900 sm:text-2xl"
            >
              Pedido {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[0.66rem] text-slate-500 sm:mt-2 sm:gap-2 sm:text-xs">
            <FaCalendarDays className="size-3 text-[#0055FF]" />
            <span>
              {new Date(order.createdAt).toLocaleString("es-PE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>·</span>
            <span>
              <strong className="uppercase text-[#0055FF]">
                {order.orderMode === "wholesale" ? "Mayorista B2B" : "Minorista B2C"}
              </strong>
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 sm:block sm:px-5 sm:py-3 sm:text-right">
          <span className="block font-mono text-[0.58rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.62rem]">
            Total Oficial (PEN)
          </span>
          <span
            data-testid="order-detail-total"
            className="text-lg font-black tabular-nums text-slate-900 sm:text-2xl"
          >
            {formatPEN(order.totalAmount)}
          </span>
        </div>
      </header>

      {/* Panel de Reintento / Cancelación */}
      <OrderCustomerActions
        orderId={order.id}
        orderNumber={order.orderNumber}
        status={order.status}
        paymentStatus={order.paymentStatus}
      />

      {/* Instrucciones de Transferencia Bancaria */}
      {order.paymentProvider === "bank_transfer" && order.paymentStatus !== "approved" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-xs text-amber-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider font-mono">
            <FaBuildingColumns className="size-4 text-amber-700" />
            <span>Instrucciones de Transferencia Bancaria / CCI Corporativo</span>
          </div>
          <p className="text-amber-900">
            Titular: <strong className="text-slate-900">{paymentConfig.bankTransferInstructions.accountHolder}</strong> · Banco:{" "}
            <strong className="text-slate-900">{paymentConfig.bankTransferInstructions.bankName}</strong>
          </p>
          <p className="font-mono text-amber-900 font-bold">
            Cuenta Soles: {paymentConfig.bankTransferInstructions.penAccountNumber} · CCI:{" "}
            {paymentConfig.bankTransferInstructions.penCci}
          </p>
          <p className="text-amber-800">
            Indica como referencia de la transferencia tu número de pedido <strong className="text-slate-900 font-mono">{order.orderNumber}</strong>.
          </p>
        </div>
      )}

      {/* Información de Despacho y Comprobante */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-50 text-[#EF233C]">
              <FaLocationDot className="size-3.5" aria-hidden />
            </div>
            <span>Dirección y Despacho</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">
              Recibe: {order.shippingRecipientName} ({order.shippingRecipientPhone})
            </p>
            <p>
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
            </p>
            {order.shippingReference && <p className="text-slate-500">Referencia: {order.shippingReference}</p>}
            <p className="font-mono text-[0.7rem] uppercase text-[#0055FF] font-semibold">
              {order.shippingDistrict}, {order.shippingProvince} — {order.shippingDepartment}
            </p>
            <p className="pt-1 text-[0.7rem] text-slate-500">
              Zona aplicada: {order.shippingZoneNameSnapshot} ({order.shippingEstimatedLabel})
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3 text-xs">
            <p className="flex items-center gap-2 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
              <FaTruckFast className="size-3.5 text-[#0055FF]" aria-hidden />
              <span>Seguimiento Logístico de Envío:</span>
            </p>
            {order.carrierName || order.trackingNumber ? (
              <div className="mt-2 space-y-1">
                {order.carrierName && (
                  <p className="text-slate-700">
                    Operador logístico: <strong className="text-slate-900">{order.carrierName}</strong>
                  </p>
                )}
                {order.trackingNumber && (
                  <p data-testid="order-tracking-number" className="font-mono text-slate-900">
                    Código de tracking: <strong className="text-[#0055FF]">{order.trackingNumber}</strong>
                  </p>
                )}
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-[#EF233C] hover:underline"
                  >
                    <span>Abrir seguimiento del operador</span>
                    <FaArrowUpRightFromSquare className="size-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-1 text-slate-500">
                El número de seguimiento y transportista se mostrarán aquí en cuanto el almacén despache tu paquete.
              </p>
            )}
          </div>
        </div>

        {/* Comprobante Electrónico Tributario */}
        <div
          data-testid="order-tax-document-card"
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FaFileInvoice className="size-3.5" aria-hidden />
              </div>
              <span>
                {order.taxDocumentType === "factura"
                  ? "Factura Electrónica SUNAT"
                  : "Boleta de Venta Electrónica"}
              </span>
            </div>
            {taxDocument && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[0.62rem] font-bold uppercase text-emerald-800">
                {taxDocument.status === "issued"
                  ? "Emitido"
                  : taxDocument.status === "pending_config"
                    ? "Pendiente PSE/SUNAT"
                    : "En Cola de Emisión"}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Titular / Razón Social:{" "}
              <strong className="text-slate-900">{order.billingCustomerName}</strong>
            </p>
            <p className="font-mono">
              {order.billingDocType}: <strong className="text-slate-900">{order.billingDocNumber}</strong>
            </p>
            {order.billingFiscalAddress && (
              <p className="text-slate-500">Domicilio Fiscal: {order.billingFiscalAddress}</p>
            )}
          </div>

          {taxDocument && (
            <div className="border-t border-slate-100 pt-3 text-xs space-y-1.5">
              {taxDocument.series && taxDocument.correlativeNumber ? (
                <p className="font-mono font-bold text-emerald-800">
                  Comprobante Oficial: {taxDocument.series}-{taxDocument.correlativeNumber}
                </p>
              ) : (
                <p className="text-[0.7rem] leading-relaxed text-slate-500">
                  {taxDocument.providerResponseSummary}
                </p>
              )}

              {taxDocument.pdfUrl && (
                <a
                  href={taxDocument.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0055FF] hover:underline"
                >
                  <span>Descargar representación impresa (PDF)</span>
                  <FaArrowUpRightFromSquare className="size-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tabla Histórica de Prendas del Pedido */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
            Prendas del Pedido ({items.length} {items.length === 1 ? "línea" : "líneas"})
          </h2>
          <p className="text-xs text-slate-500">
            Fotografía histórica de precios, calce y variantes al momento de la compra.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Prenda / SKU</th>
                <th className="px-6 py-3.5">Condición</th>
                <th className="px-6 py-3.5">Cantidad</th>
                <th className="px-6 py-3.5">Precio Unit.</th>
                <th className="px-6 py-3.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <Image
                          src={item.imageUrlSnapshot ?? "/placeholder.jpg"}
                          alt={item.productNameSnapshot}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                        <p className="font-mono text-xs text-slate-500">
                          SKU: {item.skuSnapshot} · {item.colorNameSnapshot ?? "Único"} · Talla{" "}
                          <span className="text-slate-900 font-bold">{item.sizeSnapshot ?? "Única"}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {item.appliedPriceLabel}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs tabular-nums text-slate-900">
                    {item.quantity} uds.
                  </td>
                  <td className="px-6 py-4 font-mono text-xs tabular-nums text-slate-800">
                    {formatPEN(item.unitPriceSnapshot)}
                    {item.retailUnitPriceSnapshot > item.unitPriceSnapshot && (
                      <span className="ml-1.5 text-slate-400 line-through">
                        {formatPEN(item.retailUnitPriceSnapshot)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold tabular-nums text-slate-900">
                    {formatPEN(item.lineSubtotalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero e Impuestos */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-6">
          <div className="ml-auto max-w-sm space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal a precio minorista:</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatPEN(order.retailSubtotalAmount)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Descuento aplicado:</span>
                <span className="font-mono tabular-nums">
                  −{formatPEN(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Subtotal de prendas:</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatPEN(order.subtotalAfterDiscountAmount)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Costo de envío ({order.shippingZoneNameSnapshot}):</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatPEN(order.shippingAmount)}
              </span>
            </div>
            <div className="border-t border-slate-200/80 pt-2 text-[0.7rem] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Base Imponible (Operación Gravada):</span>
                <span className="font-mono tabular-nums text-slate-700">
                  {formatPEN(order.taxableBaseAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>IGV (18%):</span>
                <span className="font-mono tabular-nums text-slate-700">{formatPEN(order.igvAmount)}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                Total del Pedido (PEN):
              </span>
              <span className="text-2xl font-black tabular-nums text-slate-900">
                {formatPEN(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Historial de Transacciones de Pago */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-[#0055FF]">
            <FaCreditCard className="size-3.5" aria-hidden />
          </div>
          <span>Referencias de Pago ({order.paymentMethodLabel})</span>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-slate-500">No hay intentos de cobro registrados aún.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {payments.map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className="font-mono font-bold uppercase text-slate-900">
                    {tx.provider} {tx.isSandbox ? "(Sandbox)" : ""}
                  </span>{" "}
                  · Ref: <code className="font-mono text-blue-700">{tx.providerTransactionId ?? "N/A"}</code>
                  {tx.maskedCardLast4 && (
                    <span className="ml-2 text-slate-500">
                      (Tarjeta •••• {tx.maskedCardLast4})
                    </span>
                  )}
                  <p className="text-[0.7rem] text-slate-500">
                    {tx.providerStatusDetail}
                    {tx.errorMessage ? ` — ${tx.errorMessage}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <PaymentStatusBadge status={tx.status} />
                  <span className="mt-1 block font-mono text-[0.68rem] text-slate-400">
                    {new Date(tx.createdAt).toLocaleString("es-PE")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="flex items-center gap-2 border-t border-slate-100 pt-3 text-[0.68rem] text-slate-500">
          <FaShieldHalved className="size-3.5 text-emerald-600" aria-hidden />
          <span>
            Confirmación verificada en el servidor seguro de American Colt JEANS™. Nunca almacenamos números completos de tarjeta ni códigos CVV.
          </span>
        </p>
      </section>
    </div>
  );
}
