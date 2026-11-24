"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Store,
  Receipt,
  CreditCard,
  Truck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { formatPEN } from "@/lib/format";
import {
  OFFICIAL_WHATSAPP_DISPLAY,
  type OrderWhatsAppDetails,
} from "./checkout-whatsapp-modal";

interface CheckoutSuccessViewProps {
  order: OrderWhatsAppDetails;
  orderId: number;
  userRole?: string;
  voucherPreviewUrl?: string | null;
  onOpenWhatsAppModal: () => void;
}

export function CheckoutSuccessView({
  order,
  orderId,
  userRole,
  voucherPreviewUrl,
  onOpenWhatsAppModal,
}: CheckoutSuccessViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isPaid = order.paymentStatus === "approved";
  const isPickup = order.deliveryMethod === "store_pickup";

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 py-2 sm:py-6">
      {/* ─── BANNER PRINCIPAL DE ÉXITO ─── */}
      <div className="rounded-2xl sm:rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 via-white to-white p-4 sm:p-8 text-center shadow-lg shadow-emerald-500/5 space-y-3 sm:space-y-4">
        <div className="mx-auto size-12 sm:size-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
          <CheckCircle2 className="size-7 sm:size-12 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[0.62rem] sm:text-[0.68rem] font-bold uppercase tracking-wider text-emerald-800">
            <ShieldCheck className="size-3.5" />
            {isPaid ? "Pago Confirmado y Verificado" : "Pedido Registrado Oficialmente"}
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-neutral-900">
            {isPaid ? "¡Pago exitoso y pedido confirmado!" : "¡Gracias por tu compra!"}
          </h1>
          <p className="text-[0.72rem] sm:text-sm text-neutral-600 max-w-lg mx-auto">
            {isPaid
              ? "Tu pago ha sido procesado de forma segura y tus prendas han quedado reservadas en nuestros almacenes."
              : "Hemos recibido tu solicitud de pedido. Tus prendas están reservadas mientras validamos tu comprobante de pago."}
          </p>
        </div>

        {/* Recuadro de Código de Pedido */}
        <div className="inline-flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 sm:px-5 sm:py-3 shadow-xs">
          <div className="text-left">
            <span className="text-[0.6rem] sm:text-[0.65rem] uppercase font-bold text-neutral-400 block tracking-wider">
              Código de Pedido Oficial
            </span>
            <strong className="font-mono text-sm sm:text-lg font-black text-neutral-900">
              {order.orderNumber}
            </strong>
          </div>

          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-1.5 sm:p-2 text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="Copiar código de pedido"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>

        {/* Botón Destacado de WhatsApp */}
        <div className="pt-1 sm:pt-2">
          <button
            type="button"
            onClick={onOpenWhatsAppModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#25D366] px-4 sm:px-8 py-3 sm:py-3.5 font-sans text-[0.7rem] sm:text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#25D366]/25 transition-transform hover:scale-105 hover:bg-[#1ebe5b] active:scale-[0.99]"
          >
            <SiWhatsapp className="size-4 shrink-0" />
            <span>Seguimiento WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})</span>
            <ExternalLink className="size-3.5 opacity-80 shrink-0" />
          </button>
        </div>
      </div>

      {/* ─── GRID DE DETALLES DEL PEDIDO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
        {/* Tarjeta 1: Modalidad de Entrega */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-5 shadow-2xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
            {isPickup ? <Store className="size-4 text-[#DC2626]" /> : <Truck className="size-4 text-[#DC2626]" />}
            <span>Modalidad de Entrega</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">
                {isPickup ? "Recojo en Tienda Oficial American Colt" : "Envío a Domicilio / Courier"}
              </span>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-700 border border-emerald-200">
                {isPickup ? "Gratis" : "Despacho Express"}
              </span>
            </div>

            <p className="text-neutral-700 flex items-start gap-1.5 pt-1">
              <MapPin className="size-3.5 text-[#DC2626] shrink-0 mt-0.5" />
              <span>
                {isPickup
                  ? `${order.pickupStoreName ?? "Tienda Oficial"} — ${order.pickupStoreAddress ?? ""}`
                  : `${order.shippingAddressLine1}, ${order.shippingDistrict}, ${order.shippingProvince} (${order.shippingDepartment})`}
              </span>
            </p>

            <p className="text-[0.72rem] text-neutral-500 pt-1">
              <strong>Destinatario:</strong> {order.shippingRecipientName}
            </p>
          </div>
        </div>

        {/* Tarjeta 2: Pago y Comprobante */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
            <Receipt className="size-4 text-[#DC2626]" />
            <span>Pago y Comprobante</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-neutral-500" />
                {order.paymentMethodLabel}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[0.62rem] font-bold border ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isPaid ? "Pagado" : "Pendiente de Validación"}
              </span>
            </div>

            {order.paymentOperationCode && (
              <p className="text-[0.72rem] font-mono text-neutral-700">
                <strong>N° de Operación:</strong> {order.paymentOperationCode}
              </p>
            )}

            {voucherPreviewUrl && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[0.7rem] text-neutral-500">Voucher adjunto:</span>
                <span className="text-[0.68rem] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Registrado en servidor ✓
                </span>
              </div>
            )}

            <div className="pt-1 text-[0.72rem] text-neutral-600">
              <strong>Comprobante emitido:</strong>{" "}
              {order.taxDocumentType === "factura" ? "Factura Electrónica con RUC" : "Boleta de Venta Electrónica"} (
              {order.billingDocNumber})
            </div>
          </div>
        </div>
      </div>

      {/* ─── RESUMEN ECONÓMICO Y PRENDAS ─── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
        <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 border-b border-neutral-100 pb-2">
          Prendas Compradas ({order.items.length} {order.items.length === 1 ? "artículo" : "artículos"})
        </h3>

        <div className="divide-y divide-neutral-100 max-h-64 sm:max-h-72 overflow-y-auto pr-1 no-scrollbar">
          {order.items.map((it, idx) => (
            <div key={idx} className="py-2.5 sm:py-3 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <strong className="text-neutral-900 block truncate">{it.title}</strong>
                <span className="text-[0.65rem] sm:text-[0.7rem] text-neutral-500">
                  Talla: {it.size ?? "Estándar"} · Color: {it.color ?? "Original"} · Cant: {it.quantity}
                </span>
              </div>
              <span className="font-mono font-bold text-neutral-900 shrink-0">
                {formatPEN(it.priceCents * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-200 pt-2.5 sm:pt-3 flex items-center justify-between text-sm sm:text-base font-extrabold text-neutral-900">
          <span>Total Pagado (PEN)</span>
          <span className="text-lg sm:text-xl font-black text-[#DC2626]">
            {formatPEN(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* ─── ENLACES DE ACCIÓN FINAL ─── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 pt-1">
        <Link
          href={`/cuenta/pedidos/${orderId}`}
          className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-[#0055FF] hover:underline py-1.5"
        >
          <span>Ver este pedido en Mi Cuenta</span>
          <ArrowRight className="size-3.5" />
        </Link>

        {userRole === "admin" && (
          <Link
            href={`/admin/pedidos/${orderId}`}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-2 sm:py-1.5 rounded-lg transition-colors"
          >
            <span>Ver en Panel Admin</span>
            <ExternalLink className="size-3.5" />
          </Link>
        )}

        <Link
          href="/catalogo"
          className="text-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors"
        >
          Explorar más prendas
        </Link>
      </div>
    </div>
  );
}
