"use client";

import { useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { Check, Copy, ExternalLink, X, ShieldCheck } from "lucide-react";
import { formatPEN } from "@/lib/format";

export interface OrderWhatsAppDetails {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethodLabel: string;
  totalAmount: number;
  deliveryMethod?: "delivery" | "express" | "store_pickup";
  shippingRecipientName: string;
  shippingDepartment: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingAddressLine1: string;
  taxDocumentType: string;
  billingDocNumber: string;
  pickupStoreName?: string;
  pickupStoreAddress?: string;
  paymentOperationCode?: string;
  items: Array<{
    title: string;
    size?: string | null;
    color?: string | null;
    quantity: number;
    priceCents: number;
  }>;
}

interface CheckoutWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWhatsAppDetails | null;
}

export const OFFICIAL_WHATSAPP_NUMBER = "51926922583";
export const OFFICIAL_WHATSAPP_DISPLAY = "+51 926 922 583";

export function buildOrderWhatsAppText(order: OrderWhatsAppDetails): string {
  const isPickup = order.deliveryMethod === "store_pickup";
  const deliveryInfo = isPickup
    ? `Recojo en Tienda Oficial: ${order.pickupStoreName ?? "American Colt"} (${order.pickupStoreAddress ?? ""})`
    : `Envío a Domicilio: ${order.shippingAddressLine1}, ${order.shippingDistrict}, ${order.shippingDepartment}`;

  const itemsList = order.items
    .map(
      (it) =>
        `• ${it.title} (Talla: ${it.size ?? "Estándar"}, Color: ${it.color ?? "Original"}) x${it.quantity} — ${formatPEN(it.priceCents * it.quantity)}`,
    )
    .join("\n");

  const paymentInfo =
    order.paymentStatus === "approved"
      ? `Pago con Tarjeta Aprobado (${order.paymentMethodLabel})`
      : `Transferencia / Yape / Plin (N° Operación: ${order.paymentOperationCode || "Por adjuntar"})`;

  return [
    `Hola American Colt JEANS™ (${OFFICIAL_WHATSAPP_DISPLAY}), acabo de realizar mi compra oficial:`,
    ``,
    `🏷️ *N° de Pedido:* ${order.orderNumber}`,
    `👤 *Cliente:* ${order.shippingRecipientName}`,
    `📄 *Documento:* ${order.taxDocumentType === "factura" ? "Factura Electrónica RUC" : "Boleta de Venta"} (${order.billingDocNumber})`,
    `📦 *Modalidad de Entrega:* ${deliveryInfo}`,
    `💳 *Método de Pago:* ${paymentInfo}`,
    ``,
    `🛍️ *Prendas del Pedido:*`,
    itemsList,
    ``,
    `💰 *Monto Total:* ${formatPEN(order.totalAmount)}`,
    ``,
    `Deseo confirmar el seguimiento de mi pedido y asegurar mi despacho prioritario. ¡Muchas gracias!`,
  ].join("\n");
}

export function CheckoutWhatsAppModal({
  isOpen,
  onClose,
  order,
}: CheckoutWhatsAppModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const rawMessage = buildOrderWhatsAppText(order);
  const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(rawMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Cabecera Verde WhatsApp */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
              <SiWhatsapp className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 leading-tight">
                Seguimiento por WhatsApp Oficial
              </h3>
              <p className="text-[0.68rem] text-emerald-700 font-bold">
                Línea oficial verificada: {OFFICIAL_WHATSAPP_DISPLAY}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Pregunta Principal y Motivo de Confianza */}
        <div className="space-y-1 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 text-xs">
          <p className="font-extrabold text-emerald-950 flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-[#25D366] shrink-0" />
            ¿Deseas dar seguimiento o enviar el comprobante de tu compra por WhatsApp?
          </p>
          <p className="text-[0.72rem] text-emerald-800 leading-relaxed pl-5.5">
            Para brindarte mayor seguridad y atención inmediata, puedes conectar directamente con nuestro equipo de atención oficial con todos los detalles de tu pedido listos.
          </p>
        </div>

        {/* Previsualización del Mensaje que se Enviará */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
          <div className="flex items-center justify-between text-xs text-neutral-600 font-bold">
            <span>Mensaje preparado para enviar:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[0.68rem] text-[#0055FF] hover:underline"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-600" />
                  <span className="text-emerald-600">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
          </div>

          <pre className="w-full rounded-2xl border border-neutral-200 bg-[#FAF8F5] p-3 text-[0.7rem] font-mono text-neutral-800 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
            {rawMessage}
          </pre>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-3.5 px-4 font-sans text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-[1.01] hover:bg-[#1ebe5b] active:scale-[0.99]"
          >
            <SiWhatsapp className="size-4" />
            <span>Continuar por WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})</span>
            <ExternalLink className="size-3.5 opacity-80" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cerrar y ver mi pedido
          </button>
        </div>
      </div>
    </div>
  );
}
