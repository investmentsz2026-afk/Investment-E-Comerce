"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  adminManageOrderAction,
  adminRetryOrSyncTaxDocumentAction,
  adminReconcileMercadoPagoPaymentAction,
} from "@/server/actions/orders";
import type { OrderStatus } from "@/server/queries/orders";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Truck,
  FileText,
  RefreshCw,
  Clock,
  CreditCard,
  PackageOpen,
  PackageCheck,
  Camera,
  ImagePlus,
  Trash2,
} from "lucide-react";

interface AdminOrderManagementFormProps {
  orderId: number;
  orderNumber: string;
  currentStatus: OrderStatus;
  paymentStatus: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  deliveryProofImageUrl?: string | null;
  paymentReference: string | null;
  adminNotes: string | null;
}

const STEPPER_STAGES: {
  status: OrderStatus;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    status: "pending_payment",
    label: "Recibido",
    sublabel: "Reserva creada",
    icon: Clock,
  },
  {
    status: "paid",
    label: "Pagado",
    sublabel: "Pago aprobado",
    icon: CreditCard,
  },
  {
    status: "preparing",
    label: "Empacando",
    sublabel: "En preparación",
    icon: PackageOpen,
  },
  {
    status: "shipped",
    label: "Enviado",
    sublabel: "En ruta",
    icon: Truck,
  },
  {
    status: "delivered",
    label: "Entregado",
    sublabel: "Completado",
    icon: PackageCheck,
  },
];

function getStageIndex(status: OrderStatus): number {
  if (status === "pending_payment" || status === "payment_processing") return 0;
  if (status === "paid") return 1;
  if (status === "preparing") return 2;
  if (status === "shipped") return 3;
  if (status === "delivered") return 4;
  return -1;
}

export function AdminOrderManagementForm({
  orderId,
  orderNumber,
  currentStatus,
  paymentStatus,
  carrierName: initialCarrier,
  trackingNumber: initialTracking,
  trackingUrl: initialTrackingUrl,
  deliveryProofImageUrl: initialDeliveryProof,
  paymentReference: initialPaymentRef,
  adminNotes: initialAdminNotes,
}: AdminOrderManagementFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isTerminal =
    currentStatus === "cancelled" || currentStatus === "refunded";

  const [nextStatus, setNextStatus] = useState<OrderStatus>(currentStatus);
  const [carrierName, setCarrierName] = useState(initialCarrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? "");
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl ?? "");
  const [deliveryProofImageUrl, setDeliveryProofImageUrl] = useState(
    initialDeliveryProof ?? "",
  );
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const [paymentReference, setPaymentReference] = useState(
    initialPaymentRef ?? "",
  );
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes ?? "");
  const [reason, setReason] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [isSyncingTax, setIsSyncingTax] = useState(false);
  const [mpPaymentIdInput, setMpPaymentIdInput] = useState("");
  const [isSyncingMp, setIsSyncingMp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUploadProof = async (file: File | undefined) => {
    if (!file) return;
    setErrorMessage(null);
    setIsUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.success || !json.url) {
        setErrorMessage(
          json.error ?? "No se pudo subir la imagen de evidencia.",
        );
        return;
      }
      setDeliveryProofImageUrl(json.url);
    } catch {
      setErrorMessage("Error de conexión al cargar la fotografía.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSyncTaxDocument = async (
    op: "emit_or_retry" | "query_status",
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSyncingTax(true);
    try {
      const res = await adminRetryOrSyncTaxDocumentAction({
        orderId,
        operation: op,
      });
      if (!res.success) {
        setErrorMessage(
          res.error ?? "No se pudo sincronizar el comprobante tributario.",
        );
        return;
      }
      setSuccessMessage(
        res.data?.summary ??
          `Estado del comprobante tributario actualizado: ${res.data?.status}.`,
      );
      router.refresh();
    } finally {
      setIsSyncingTax(false);
    }
  };

  const handleReconcileMp = async () => {
    if (!mpPaymentIdInput.trim()) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSyncingMp(true);
    try {
      const res = await adminReconcileMercadoPagoPaymentAction({
        orderId,
        mpPaymentId: mpPaymentIdInput.trim(),
      });
      if (!res.success) {
        setErrorMessage(
          res.error ?? "No se pudo verificar el pago en Mercado Pago.",
        );
        return;
      }
      setSuccessMessage(
        res.data?.message ??
          "Pago verificado en la API oficial de Mercado Pago.",
      );
      router.refresh();
    } finally {
      setIsSyncingMp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const res = await adminManageOrderAction({
        orderId,
        nextStatus,
        carrierName,
        trackingNumber,
        trackingUrl,
        deliveryProofImageUrl,
        paymentReference,
        adminNotes,
        reason,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "No se pudo actualizar el pedido.");
        return;
      }

      setSuccessMessage(
        `Pedido ${orderNumber} actualizado al estado "${res.data?.status}" y registrado en el historial de auditoría.`,
      );
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  const currentStageIdx = getStageIndex(currentStatus);
  const showCourierFields =
    nextStatus === "shipped" ||
    currentStatus === "shipped" ||
    Boolean(carrierName || trackingNumber);
  const showDeliveryProofFields =
    nextStatus === "delivered" ||
    currentStatus === "delivered" ||
    Boolean(deliveryProofImageUrl);

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 font-sans shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
            <Truck className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900">
              Control Logístico, Conciliación y Reembolsos
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Los importes financieros del pedido son inmutables. Todo cambio de
              estado queda registrado en auditoría.
            </p>
          </div>
        </div>
      </div>

      {/* STEPPER VISUAL 3D DEL FLUJO LOGÍSTICO */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
        <p className="mb-3 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">
          Línea de Progreso del Pedido (Haz clic en una etapa para
          preseleccionarla)
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {STEPPER_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const reached = currentStageIdx >= idx;
            const isSelected = nextStatus === stage.status;

            return (
              <button
                key={stage.status}
                type="button"
                disabled={isTerminal}
                onClick={() => setNextStatus(stage.status)}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-[#DC2626] bg-red-50/70 shadow-sm ring-2 ring-[#DC2626]/20"
                    : reached
                      ? "border-emerald-300 bg-emerald-50/50 hover:border-emerald-400"
                      : "border-slate-200 bg-white hover:border-blue-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex size-7 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-[#DC2626] text-white"
                        : reached
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-[0.68rem] font-black tabular-nums text-slate-400">
                    0{idx + 1}
                  </span>
                </div>
                <p className="mt-2 text-xs font-extrabold text-slate-900">
                  {stage.label}
                </p>
                <p className="text-[0.68rem] font-medium text-slate-500">
                  {stage.sublabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {isTerminal && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <span>
            Este pedido se encuentra en estado definitivo (
            <strong>{currentStatus}</strong>). Su inventario ya fue
            liberado/repuesto y no admite nuevas transiciones.
          </span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs font-bold text-red-900"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-950">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="admin-order-next-status"
            className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
          >
            Estado del Pedido *
          </label>
          <select
            id="admin-order-next-status"
            name="nextStatus"
            disabled={isTerminal}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            className="mt-1.5 block h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15 disabled:opacity-60"
          >
            <option value="pending_payment">
              Pendiente de Pago (pending_payment)
            </option>
            <option value="payment_processing">
              Pago en Proceso (payment_processing)
            </option>
            <option value="paid">Pagado / Confirmado (paid)</option>
            <option value="preparing">
              Preparando Pedido en Almacén (preparing)
            </option>
            <option value="shipped">Enviado / Despachado (shipped)</option>
            <option value="delivered">Entregado al Cliente (delivered)</option>
            <option value="payment_failed">
              Pago Fallido (payment_failed)
            </option>
            <option value="cancelled">
              Cancelar Pedido No Pagado (cancelled)
            </option>
            <option value="refunded">
              Reembolsar Pedido Pagado y Reponer Stock (refunded)
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="admin-payment-ref"
            className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
          >
            Referencia de Pago / Operación Bancaria
          </label>
          <input
            id="admin-payment-ref"
            name="paymentReference"
            type="text"
            disabled={isTerminal}
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Ej: N° operación BCP / ID cargo Mercado Pago"
            className="mt-1.5 block h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          />
          {paymentStatus !== "approved" && nextStatus === "paid" && (
            <p className="mt-1.5 text-[0.68rem] font-bold text-emerald-700">
              Al pasar a &ldquo;Pagado&rdquo;, se confirmará la salida de stock
              y se activará el comprobante tributario.
            </p>
          )}
        </div>
      </div>

      {/* CAMPOS DE COURIER: SOLO CUANDO ESTÁ EN ENVIADO O YA TIENE COURIER */}
      <AnimatePresence>
        {showCourierFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 gap-4 rounded-3xl border border-indigo-200 bg-indigo-50/40 p-5 md:grid-cols-3"
          >
            <div>
              <label
                htmlFor="admin-carrier-name"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                Operador Logístico / Transportista
              </label>
              <input
                id="admin-carrier-name"
                name="carrierName"
                type="text"
                disabled={isTerminal}
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="Ej: Olva Courier / Shalom / Urbano"
                className="mt-1.5 block h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="admin-tracking-number"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                Código de Seguimiento (Tracking)
              </label>
              <input
                id="admin-tracking-number"
                name="trackingNumber"
                type="text"
                disabled={isTerminal}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Código real de guía"
                className="mt-1.5 block h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="admin-tracking-url"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                URL de Seguimiento (opcional)
              </label>
              <input
                id="admin-tracking-url"
                name="trackingUrl"
                type="url"
                disabled={isTerminal}
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1.5 block h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOTO OPCIONAL DE ENTREGA CON EL CLIENTE */}
      <AnimatePresence>
        {showDeliveryProofFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 rounded-3xl border border-emerald-200 bg-emerald-50/45 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                <Camera className="size-4" />
                <span>Evidencia Fotográfica de Entrega con el Cliente</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-emerald-800">
                Opcional
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => void handleUploadProof(e.target.files?.[0])}
              className="sr-only"
            />

            {deliveryProofImageUrl ? (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-300 bg-white p-3.5 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={deliveryProofImageUrl}
                  alt="Evidencia de entrega"
                  className="size-24 rounded-2xl border border-slate-200 object-cover"
                />
                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-emerald-800">
                    Fotografía adjunta al pedido
                  </p>
                  {!isTerminal && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isUploadingProof}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Camera className="size-3.5" />
                        <span>Cambiar foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryProofImageUrl("")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-[#DC2626] hover:bg-red-100"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              !isTerminal && (
                <button
                  type="button"
                  disabled={isUploadingProof}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-emerald-300 bg-white px-4 py-4 text-xs font-extrabold text-emerald-800 hover:border-emerald-500 disabled:opacity-60"
                >
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Subiendo fotografía...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="size-4" />
                      <span>
                        Subir Foto de Entrega desde Celular o PC (Opcional)
                      </span>
                    </>
                  )}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {(nextStatus === "cancelled" || nextStatus === "refunded") && (
        <div>
          <label
            htmlFor="admin-cancel-refund-reason"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#DC2626]"
          >
            Motivo Obligatorio de Cancelación o Reembolso (Auditable) *
          </label>
          <input
            id="admin-cancel-refund-reason"
            name="reason"
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica el motivo del reembolso o cancelación para el registro de auditoría e inventario..."
            className="mt-1.5 block h-11 w-full rounded-2xl border border-red-300 bg-red-50/40 px-3.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/20"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="admin-order-notes"
          className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
        >
          Notas Internas de Administración (Confidencial — No visible para el
          cliente)
        </label>
        <textarea
          id="admin-order-notes"
          name="adminNotes"
          rows={2}
          disabled={isTerminal}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Observaciones internas de despacho o verificación contable..."
          className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSyncingTax}
            onClick={() => void handleSyncTaxDocument("emit_or_retry")}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[0.7rem] font-extrabold uppercase text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
          >
            {isSyncingTax ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5 text-[#DC2626]" />
            )}
            <span>Emitir / Reintentar Comprobante PSE</span>
          </button>

          <button
            type="button"
            disabled={isSyncingTax}
            onClick={() => void handleSyncTaxDocument("query_status")}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[0.7rem] font-extrabold uppercase text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
          >
            <RefreshCw className="size-3.5" />
            <span>Consultar Estado SUNAT</span>
          </button>
        </div>

        <button
          type="submit"
          data-testid="admin-save-order-btn"
          disabled={isPending || isTerminal || isUploadingProof}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-7 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_5px_0_#7F1D1D,0_12px_24px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Actualizar Estado y Registrar Auditoría
            </>
          )}
        </button>
      </div>

      {/* Herramienta de conciliación directa con API Mercado Pago ante incidencias de red */}
      {paymentStatus !== "approved" && !isTerminal && (
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 text-xs">
          <p className="text-[0.7rem] font-extrabold uppercase text-blue-900">
            Conciliación / Recuperación por ID de Pago en Mercado Pago API
            (Opcional):
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={mpPaymentIdInput}
              onChange={(e) => setMpPaymentIdInput(e.target.value)}
              placeholder="ID de pago Mercado Pago (ej. 8899112233)"
              className="h-10 w-full rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-slate-900 sm:w-64"
            />
            <button
              type="button"
              disabled={isSyncingMp || !mpPaymentIdInput.trim()}
              onClick={() => void handleReconcileMp()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-700 px-4 text-[0.7rem] font-extrabold uppercase text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isSyncingMp ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              <span>Verificar en API Mercado Pago</span>
            </button>
          </div>
        </div>
      )}
    </motion.form>
  );
}
