"use client";

import { useState, useTransition, useId, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  FaArrowRight,
  FaCamera,
  FaCircleCheck,
  FaCircleExclamation,
  FaEnvelope,
  FaFileInvoice,
  FaImage,
  FaLock,
  FaMobileScreenButton,
  FaPaperPlane,
  FaRotateLeft,
  FaRulerCombined,
  FaShieldHalved,
  FaSpinner,
  FaTrashCan,
  FaUser,
  FaXmark,
} from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import {
  submitProductReturnAction,
  type ReturnTicketData,
} from "@/server/actions/returns";

interface OrderSummaryItem {
  orderNumber: string;
  date: string;
  itemsSummary: string;
  totalText: string;
}

interface ProductReturnFormProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  recentOrders?: OrderSummaryItem[];
}

const REASONS = [
  "Me quedó grande (deseo una talla menor)",
  "Me quedó chica (deseo una talla mayor)",
  "Deseo cambiar de color o silueta",
  "Falla de confección o costura",
  "Prenda distinta a la solicitada",
  "Otro motivo específico",
] as const;

export function ProductReturnForm({ user, recentOrders = [] }: ProductReturnFormProps) {
  const [orderNumber, setOrderNumber] = useState(recentOrders[0]?.orderNumber ?? "");
  const [taxDocNumber, setTaxDocNumber] = useState("");
  const [requestType, setRequestType] = useState("cambio_talla");
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [currentProductDetails, setCurrentProductDetails] = useState("");
  const [requestedProductDetails, setRequestedProductDetails] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [customerName, setCustomerName] = useState(
    user ? `${user.firstName} ${user.lastName}`.trim() : "",
  );
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? "");

  // Gestión de imágenes adjuntas (hasta 4 fotos)
  const [images, setImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [ticketResult, setTicketResult] = useState<ReturnTicketData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const orderId = useId();
  const taxId = useId();

  // Si el usuario no ha iniciado sesión, mostramos la pantalla de bloqueo seguro
  if (!user) {
    return (
      <div className="rounded-3xl border-2 border-blue-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#1D4ED8] text-white shadow-lg">
            <FaLock className="size-7" aria-hidden />
          </span>

          <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-0.5 font-mono text-[0.62rem] font-black uppercase tracking-wider text-[#0055FF]">
            ZONA DE CLIENTES REGISTRADOS · AMERICAN COLT JEANS™
          </span>

          <h2 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
            Inicia sesión para gestionar tu cambio de producto
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Para validar tu compra, asociar tu boleta o factura SUNAT y ofrecerte garantía de cambio en tiempo récord, es necesario que ingreses a tu cuenta.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/iniciar-sesion?next=/cambios-y-devoluciones"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#0F3299] px-6 font-sans text-xs font-black uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105"
            >
              <FaUser className="size-3.5" aria-hidden />
              <span>Iniciar Sesión Ahora</span>
            </Link>

            <Link
              href="/registro?next=/cambios-y-devoluciones"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-slate-50 px-6 font-sans text-xs font-black uppercase tracking-wider text-slate-800 transition-colors hover:border-[#0055FF] hover:bg-white hover:text-[#0055FF]"
            >
              <span>Crear una Cuenta</span>
            </Link>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <p className="flex items-center justify-center gap-1.5">
              <span>¿Realizaste una compra presencial o necesitas ayuda inmediata?</span>
              <a
                href="https://wa.me/51926922583?text=Hola%20American%20Colt,%20deseo%20coordinar%20un%20cambio%20de%20talla%20de%20mi%20prenda."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-[#25D366] hover:underline"
              >
                <SiWhatsapp className="size-3" aria-hidden />
                <span>Escríbenos por WhatsApp</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Manejo de carga de fotos
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setImageError("Puedes adjuntar como máximo 4 fotos.");
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setImageError("Solo se permiten archivos de imagen (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Cada imagen debe pesar menos de 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => (prev.length < 4 ? [...prev, reader.result as string] : prev));
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (idxToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const selectedReason = reason === "Otro motivo específico" ? customReason.trim() : reason;
    if (!selectedReason) {
      setErrorMessage("Por favor indica el motivo del cambio.");
      return;
    }

    startTransition(async () => {
      const res = await submitProductReturnAction({
        orderNumber: orderNumber.trim(),
        taxDocNumber: taxDocNumber.trim(),
        requestType,
        reason: selectedReason,
        currentProductDetails: currentProductDetails.trim(),
        requestedProductDetails: requestedProductDetails.trim(),
        customerNotes: customerNotes.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        images,
      });

      if (res.success && res.data) {
        setTicketResult(res.data);
        setIsModalOpen(true);
      } else {
        setErrorMessage(res.error ?? "No se pudo procesar tu solicitud. Intenta nuevamente.");
      }
    });
  };

  // Construir mensaje oficial estructurado para WhatsApp
  const waMessage = ticketResult
    ? encodeURIComponent(
        `Hola American Colt JEANS™, acabo de registrar una solicitud de cambio de producto en la web:\n\n` +
          `*Ticket:* #${ticketResult.ticketNumber}\n` +
          `*Cliente:* ${ticketResult.customerName}\n` +
          `*Celular:* ${ticketResult.customerPhone}\n` +
          `*N.° de Pedido:* ${ticketResult.orderNumber}${ticketResult.taxDocNumber ? ` (Comprobante: ${ticketResult.taxDocNumber})` : ""}\n` +
          `*Prenda actual:* ${ticketResult.currentProductDetails}\n` +
          `*Cambio solicitado:* ${ticketResult.requestedProductDetails}\n` +
          `*Motivo:* ${ticketResult.reason}\n\n` +
          `Adjunté fotos en la plataforma y deseo coordinar el recojo o despacho de mi nueva talla. ¡Muchas gracias!`,
      )
    : "";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-xl sm:p-8"
      >
        {/* Encabezado del Formulario */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EF233C] px-3 py-0.5 font-mono text-[0.6rem] font-black uppercase tracking-wider text-white">
              <FaRotateLeft className="size-2.5" aria-hidden />
              <span>GARANTÍA DE CAMBIO DE TALLA</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-[#0055FF]">
              <FaShieldHalved className="size-2.5" aria-hidden />
              <span>Compras Protegidas</span>
            </span>
          </div>
          <h2 className="mt-2 font-sans text-xl font-black uppercase text-slate-900 sm:text-2xl">
            Formulario de Cambio o Devolución
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Completa los datos de tu compra y prenda. Te garantizamos cambio rápido de talla o modelo.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* SECCIÓN 1: Datos de Contacto */}
          <div>
            <h3 className="flex items-center gap-2 font-sans text-xs font-black uppercase tracking-wider text-[#0055FF]">
              <FaUser className="size-3.5" aria-hidden />
              <span>1. Datos del Comprador</span>
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor={nameId} className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                  Nombre Completo *
                </label>
                <input
                  id={nameId}
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor={emailId} className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                  Correo Electrónico *
                </label>
                <div className="relative flex items-center">
                  <FaEnvelope className="pointer-events-none absolute left-3 size-3 text-slate-400" aria-hidden />
                  <input
                    id={emailId}
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={phoneId} className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                  Celular / WhatsApp *
                </label>
                <div className="relative flex items-center">
                  <FaMobileScreenButton className="pointer-events-none absolute left-3 size-3 text-[#25D366]" aria-hidden />
                  <input
                    id={phoneId}
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 987 654 321"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Datos de la Compra (Pedido y Comprobante) */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="flex items-center gap-2 font-sans text-xs font-black uppercase tracking-wider text-[#0055FF]">
              <FaFileInvoice className="size-3.5" aria-hidden />
              <span>2. Identificación del Pedido o Boleta</span>
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={orderId} className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                  Número de Pedido *
                </label>
                {recentOrders.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      id={orderId}
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                    >
                      {recentOrders.map((ord) => (
                        <option key={ord.orderNumber} value={ord.orderNumber}>
                          {ord.orderNumber} ({ord.date} - {ord.totalText})
                        </option>
                      ))}
                      <option value="otro">Ingresar otro número manualmente...</option>
                    </select>
                    {orderNumber === "otro" && (
                      <input
                        type="text"
                        placeholder="Escribe tu N.° de Pedido (Ej: ORD-2026-0042)"
                        onChange={(e) => setOrderNumber(e.target.value)}
                        required
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF]"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    id={orderId}
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Ej: ORD-2026-0042"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                  />
                )}
              </div>

              <div>
                <label htmlFor={taxId} className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                  N.° de Boleta o Factura (Opcional)
                </label>
                <input
                  id={taxId}
                  type="text"
                  value={taxDocNumber}
                  onChange={(e) => setTaxDocNumber(e.target.value)}
                  placeholder="Ej: B001-000123 o F001-000045"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Detalle del Cambio (Talla actual vs Talla solicitada) */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="flex items-center gap-2 font-sans text-xs font-black uppercase tracking-wider text-[#0055FF]">
              <FaRulerCombined className="size-3.5" aria-hidden />
              <span>3. Detalle de la Prenda y Talla Solicitada</span>
            </h3>

            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                    Tipo de Trámite
                  </label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                  >
                    <option value="cambio_talla">Cambio de Talla (Mismo modelo)</option>
                    <option value="cambio_modelo">Cambio por otro Modelo o Color</option>
                    <option value="falla_fabrica">Garantía por Falla de Confección</option>
                    <option value="devolucion">Devolución / Nota de Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                    Motivo Principal *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {reason === "Otro motivo específico" && (
                <div>
                  <input
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Especifica el motivo de tu solicitud..."
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055FF]"
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                    Prenda que recibiste y Talla actual *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentProductDetails}
                    onChange={(e) => setCurrentProductDetails(e.target.value)}
                    placeholder="Ej: Pantalón Drill King 767 - Talla 34 - Camello"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                    Nueva Talla o Prenda que deseas *
                  </label>
                  <input
                    type="text"
                    required
                    value={requestedProductDetails}
                    onChange={(e) => setRequestedProductDetails(e.target.value)}
                    placeholder="Ej: Deseo Talla 32 en el mismo color"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[0.6rem] font-bold uppercase text-slate-600">
                  Comentarios adicionales o dirección de entrega (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Detalla cualquier información adicional sobre la entrega, cambio de agencia o preferencia horaria..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 outline-none focus:border-[#0055FF] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Subida de Imágenes / Fotos de la Prenda */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="flex items-center gap-2 font-sans text-xs font-black uppercase tracking-wider text-[#0055FF]">
              <FaCamera className="size-3.5" aria-hidden />
              <span>4. Fotos de la Prenda o Comprobante (Hasta 4 fotos)</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Sube fotos claras de la prenda recibida, etiquetas y/o tu comprobante de compra para agilizar la aprobación inmediata.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group/img relative size-20 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 shadow-xs"
                >
                  <Image
                    src={img}
                    alt={`Foto adjunta ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label={`Eliminar foto ${idx + 1}`}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs transition-transform hover:scale-110"
                  >
                    <FaTrashCan className="size-2.5" aria-hidden />
                  </button>
                </div>
              ))}

              {images.length < 4 && (
                <label className="flex size-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 text-center transition-colors hover:border-[#0055FF] hover:bg-blue-50">
                  <FaImage className="size-5 text-[#0055FF]" aria-hidden />
                  <span className="mt-1 font-mono text-[0.55rem] font-bold text-[#0055FF]">
                    + Subir foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            {imageError && (
              <p className="mt-2 text-xs font-bold text-rose-600">{imageError}</p>
            )}
          </div>

          {/* Mensaje de Error si falla la validación */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              <FaCircleExclamation className="size-3.5 shrink-0" aria-hidden />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Botón de Envío */}
          <div className="border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#EF233C] via-[#D90429] to-[#DC2626] font-sans text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/25 transition-all hover:scale-[1.01] hover:from-[#0055FF] hover:via-[#1D4ED8] hover:to-[#0F3299] hover:shadow-blue-500/30 disabled:opacity-50 sm:text-sm"
            >
              {isPending ? (
                <>
                  <FaSpinner className="size-4 animate-spin" aria-hidden />
                  <span>Enviando Solicitud al Sistema...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane className="size-4" aria-hidden />
                  <span>Enviar Solicitud de Cambio</span>
                  <FaArrowRight className="size-3.5" aria-hidden />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* MODAL DE ÉXITO INTERACTIVO CON BOTÓN DIRECTO DE WHATSAPP */}
      <AnimatePresence>
        {isModalOpen && ticketResult && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Fondo oscuro con desenfoque */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Tarjeta del Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border-2 border-white/60 bg-white p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <FaXmark className="size-4" aria-hidden />
              </button>

              <div className="text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
                  <FaCircleCheck className="size-7" aria-hidden />
                </span>

                <span className="mt-3 block font-mono text-[0.62rem] font-black uppercase tracking-widest text-emerald-700">
                  ¡SOLICITUD REGISTRADA EXITOSAMENTE!
                </span>

                <h3 className="mt-1 font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
                  Ticket de Cambio #{ticketResult.ticketNumber}
                </h3>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed sm:text-sm">
                  Tu solicitud ha sido guardada en nuestro sistema de atención al cliente y enviada al equipo comercial de American Colt JEANS™.
                </p>
              </div>

              {/* Resumen de lo que se llenó */}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-900">{ticketResult.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">N.° de Pedido:</span>
                  <span className="font-mono font-bold text-[#0055FF]">{ticketResult.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prenda actual:</span>
                  <span className="font-semibold text-slate-800">{ticketResult.currentProductDetails}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
                  <span className="text-slate-500">Cambio solicitado:</span>
                  <span className="font-bold text-[#EF233C]">{ticketResult.requestedProductDetails}</span>
                </div>
              </div>

              {/* Pregunta destacada para hablar por WhatsApp */}
              <div className="mt-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 text-center">
                <p className="font-sans text-xs font-black uppercase text-emerald-950 sm:text-sm">
                  ¿Deseas hablar ahora mismo con un asesor por WhatsApp para coordinar tu cambio más rápido?
                </p>
                <p className="mt-1 text-[0.72rem] text-emerald-800">
                  Al hacer clic se enviará automáticamente a nuestro WhatsApp todo lo que llenaste en este formulario.
                </p>

                <a
                  href={`https://wa.me/51926922583?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] font-sans text-xs font-black uppercase tracking-wider text-white shadow-md shadow-green-500/30 transition-transform hover:scale-[1.02] hover:bg-[#1ebe5b]"
                >
                  <SiWhatsapp className="size-4" aria-hidden />
                  <span>Contactar por WhatsApp ahora</span>
                  <FaArrowRight className="size-3" aria-hidden />
                </a>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 pt-2">
                <Link
                  href="/cuenta/pedidos"
                  className="font-mono text-xs font-bold text-[#0055FF] underline hover:text-[#DC2626]"
                >
                  Ver mis pedidos en mi cuenta
                </Link>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-mono text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
