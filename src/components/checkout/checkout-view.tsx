"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  placeCheckoutOrderAction,
  quoteCheckoutShippingAction,
} from "@/server/actions/orders";
import type { CheckoutSessionContext } from "@/server/queries/orders";
import type { ShippingCalculationResult } from "@/server/shipping/service";
import type { TaxDocumentType } from "@/server/tax/sunat-service";
import type { PaymentProviderName } from "@/server/payments/gateway";
import { useCart } from "@/components/cart/cart-provider";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Truck,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Building2,
  MapPin,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const PERU_DEPARTMENTS = [
  "Amazonas",
  "Áncash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
];

interface CheckoutViewProps {
  context: CheckoutSessionContext;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
  };
  initialIdempotencyKey: string;
}

export function CheckoutView({
  context,
  user,
  initialIdempotencyKey,
}: CheckoutViewProps) {
  const router = useRouter();
  const { refreshCart } = useCart();

  // Clave de idempotencia única por sesión de formulario para impedir pedidos duplicados
  const [idempotencyKey] = useState(initialIdempotencyKey);

  // Selección de dirección guardada vs nueva dirección
  const defaultAddress = context.savedAddresses[0] ?? null;
  const [addressMode, setAddressMode] = useState<"saved" | "new">(
    defaultAddress ? "saved" : "new",
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    defaultAddress?.id ?? null,
  );
  const [saveNewAddressToBook, setSaveNewAddressToBook] = useState(true);

  const [recipientName, setRecipientName] = useState(
    defaultAddress?.recipientName ?? `${user.firstName} ${user.lastName}`,
  );
  const [recipientPhone, setRecipientPhone] = useState(
    defaultAddress?.recipientPhone ??
    context.approvedCompany?.contactPhone ??
    user.phone ??
    "",
  );
  const [department, setDepartment] = useState(
    defaultAddress?.department ?? context.approvedCompany?.department ?? "Lima",
  );
  const [province, setProvince] = useState(
    defaultAddress?.province ?? context.approvedCompany?.province ?? "Lima",
  );
  const [district, setDistrict] = useState(
    defaultAddress?.district ?? context.approvedCompany?.district ?? "Miraflores",
  );
  const [addressLine1, setAddressLine1] = useState(
    defaultAddress?.addressLine1 ?? context.approvedCompany?.addressLine ?? "",
  );
  const [addressLine2] = useState(
    defaultAddress?.addressLine2 ?? "",
  );
  const [reference, setReference] = useState(defaultAddress?.reference ?? "");

  // Datos de comprobante tributario (Boleta / Factura Perú)
  const isB2BCompany = Boolean(context.approvedCompany);
  const [taxDocumentType, setTaxDocumentType] = useState<TaxDocumentType>(
    isB2BCompany ? "factura" : "boleta",
  );
  const [billingDocType, setBillingDocType] = useState<"DNI" | "CE" | "RUC">(
    isB2BCompany ? "RUC" : "DNI",
  );
  const [billingDocNumber, setBillingDocNumber] = useState(
    context.approvedCompany?.taxId ?? "",
  );
  const [billingCustomerName, setBillingCustomerName] = useState(
    context.approvedCompany?.legalName ?? `${user.firstName} ${user.lastName}`,
  );
  const [billingFiscalAddress, setBillingFiscalAddress] = useState(
    context.approvedCompany
      ? `${context.approvedCompany.addressLine}, ${context.approvedCompany.district}, ${context.approvedCompany.department}`
      : "",
  );

  // Método de pago
  const [paymentProvider, setPaymentProvider] = useState<PaymentProviderName>(
    context.paymentConfig.culqiConfigured ? "culqi" : "sandbox",
  );
  const [sandboxScenario, setSandboxScenario] = useState<
    "sandbox_approve" | "sandbox_pending" | "sandbox_reject"
  >("sandbox_approve");
  const [maskedCardLast4, setMaskedCardLast4] = useState("4242");
  const [customerNotes, setCustomerNotes] = useState("");

  // Estado vivo de envío e impuestos calculados en el servidor
  const [shippingCalc, setShippingCalc] = useState<ShippingCalculationResult>(
    context.defaultShipping,
  );
  const [taxBreakdown, setTaxBreakdown] = useState(context.taxBreakdown);
  const [isRecalculatingShipping, setIsRecalculatingShipping] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerShippingRecalculation = async (
    nextDept: string,
    nextProv: string,
    nextDist: string,
  ) => {
    setIsRecalculatingShipping(true);
    try {
      const res = await quoteCheckoutShippingAction({
        department: nextDept,
        province: nextProv,
        district: nextDist,
        subtotalAfterDiscountCents: context.subtotalAfterDiscountAmount,
      });
      if (res.success && res.data) {
        setShippingCalc(res.data.shipping);
        setTaxBreakdown({
          taxableBaseAmount: res.data.taxableBaseAmount,
          igvAmount: res.data.igvAmount,
          totalAmount: res.data.totalAmount,
        });
      }
    } finally {
      setIsRecalculatingShipping(false);
    }
  };

  const handleSelectSavedAddress = (addrId: number) => {
    setSelectedAddressId(addrId);
    const found = context.savedAddresses.find((a) => a.id === addrId);
    if (found) {
      setDepartment(found.department);
      setProvince(found.province);
      setDistrict(found.district);
      void triggerShippingRecalculation(
        found.department,
        found.province,
        found.district,
      );
    }
  };

  const handleTaxDocTypeChange = (type: TaxDocumentType) => {
    setTaxDocumentType(type);
    if (type === "factura") {
      setBillingDocType("RUC");
      if (context.approvedCompany) {
        setBillingDocNumber(context.approvedCompany.taxId);
        setBillingCustomerName(context.approvedCompany.legalName);
        setBillingFiscalAddress(
          `${context.approvedCompany.addressLine}, ${context.approvedCompany.district}, ${context.approvedCompany.department}`,
        );
      }
    } else {
      setBillingDocType("DNI");
      if (!context.approvedCompany) {
        setBillingCustomerName(`${user.firstName} ${user.lastName}`);
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await placeCheckoutOrderAction({
        idempotencyKey,
        source: context.source,
        quoteId: context.quoteId,
        savedAddressId: addressMode === "saved" ? selectedAddressId : null,
        saveNewAddressToBook: addressMode === "new" ? saveNewAddressToBook : false,
        shippingRecipientName: recipientName,
        shippingRecipientPhone: recipientPhone,
        shippingDepartment: department,
        shippingProvince: province,
        shippingDistrict: district,
        shippingAddressLine1: addressLine1,
        shippingAddressLine2: addressLine2,
        shippingReference: reference,
        taxDocumentType,
        billingDocType,
        billingDocNumber,
        billingCustomerName,
        billingFiscalAddress,
        paymentProvider,
        paymentToken:
          paymentProvider === "sandbox" ? sandboxScenario : undefined,
        maskedCardLast4,
        customerNotes,
      });

      if (!res.success || !res.data) {
        setErrorMessage(
          res.error ?? "No se pudo procesar tu pedido. Verifica los datos ingresados.",
        );
        setIsSubmitting(false);
        return;
      }

      await refreshCart();
      router.push(`/cuenta/pedidos/${res.data.orderId}?created=1`);
    } catch {
      setErrorMessage(
        "Ocurrió un problema de conexión al confirmar tu pedido. Intenta nuevamente.",
      );
      setIsSubmitting(false);
    }
  };

  // Si la cuenta está bloqueada (ej. business_pending, suspendida o cotización ya convertida)
  if (context.isBlockedRole) {
    return (
      <div
        data-testid="checkout-blocked-banner"
        className="border border-amber-400 bg-amber-50/90 p-8 text-amber-950 sm:p-12"
      >
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-1 size-6 shrink-0 text-amber-800" aria-hidden />
          <div className="space-y-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
                Validación Comercial de Checkout
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                No es posible iniciar esta operación
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-amber-900">
              {context.blockedReason}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {context.alreadyConvertedOrderId ? (
                <Link
                  href={`/cuenta/pedidos/${context.alreadyConvertedOrderId}`}
                  data-testid="checkout-already-converted-link"
                  className="inline-flex h-11 items-center justify-center gap-2 bg-ink px-6 text-xs font-medium uppercase tracking-[0.16em] text-paper hover:bg-cochinilla"
                >
                  Ver Pedido Generado
                </Link>
              ) : null}
              <Link
                href="/cuenta"
                className="inline-flex h-11 items-center justify-center gap-2 border border-ink/25 bg-paper px-6 text-xs font-medium uppercase tracking-[0.16em] text-ink hover:border-ink"
              >
                Ir a Mi Cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (context.lines.length === 0) {
    return (
      <div className="border border-ink/15 bg-[#fbfaf7] p-12 text-center">
        <h2 className="font-display text-2xl text-ink">
          No hay prendas seleccionadas para el checkout
        </h2>
        <p className="mt-2 text-sm text-taupe-600">
          Agrega prendas desde nuestro catálogo antes de proceder a la confirmación del pedido.
        </p>
        <div className="mt-6">
          <Link
            href="/catalogo"
            className="inline-flex h-11 items-center justify-center bg-ink px-6 text-xs font-medium uppercase tracking-[0.16em] text-paper hover:bg-cochinilla"
          >
            Explorar Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitOrder} className="space-y-8">
      {/* Banner si se está convirtiendo una cotización B2B aceptada */}
      {context.source === "quote" && context.quoteNumber && (
        <div
          data-testid="checkout-quote-conversion-banner"
          className="border border-emerald-400 bg-emerald-50/90 p-5 text-emerald-950"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-emerald-800" aria-hidden />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
                Conversión Oficial de Cotización Aceptada: {context.quoteNumber}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                Las cantidades aprobadas y los precios unitarios especiales están congelados e inmutables conforme al expediente autorizado.
                {context.quotePaymentTerms
                  ? ` Condición comercial aprobada: ${context.quotePaymentTerms}.`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          data-testid="checkout-error-alert"
          className="flex items-start gap-3 border-l-2 border-cochinilla bg-cochinilla/10 p-4 text-xs text-cochinilla"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Columna Izquierda: Dirección, Comprobante SUNAT y Pago */}
        <div className="space-y-8 lg:col-span-7">
          {/* SECCIÓN 1: DIRECCIÓN DE ENTREGA EN PERÚ */}
          <section
            aria-labelledby="checkout-shipping-heading"
            className="border border-ink/15 bg-paper p-6 sm:p-8"
          >
            <div className="flex items-center gap-2.5 border-b border-ink/10 pb-4">
              <MapPin className="size-5 text-cochinilla" aria-hidden />
              <div>
                <h2
                  id="checkout-shipping-heading"
                  className="font-display text-2xl text-ink"
                >
                  1. Dirección de Entrega (Perú)
                </h2>
                <p className="text-xs text-taupe-500">
                  El costo de envío se calcula en el servidor según el departamento, provincia y distrito.
                </p>
              </div>
            </div>

            {context.savedAddresses.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddressMode("saved");
                    if (selectedAddressId) handleSelectSavedAddress(selectedAddressId);
                  }}
                  className={cn(
                    "px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors",
                    addressMode === "saved"
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 bg-[#fbfaf7] text-ink hover:border-ink",
                  )}
                >
                  Usar dirección guardada ({context.savedAddresses.length})
                </button>
                <button
                  type="button"
                  data-testid="checkout-new-address-tab"
                  onClick={() => setAddressMode("new")}
                  className={cn(
                    "px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors",
                    addressMode === "new"
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 bg-[#fbfaf7] text-ink hover:border-ink",
                  )}
                >
                  + Registrar nueva dirección
                </button>
              </div>
            )}

            {addressMode === "saved" && context.savedAddresses.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {context.savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={cn(
                        "cursor-pointer border p-4 transition-colors",
                        isSelected
                          ? "border-ink bg-[#fbfaf7] ring-1 ring-ink"
                          : "border-ink/15 bg-paper hover:border-ink/40",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold uppercase text-ink">
                          {addr.title}
                        </span>
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={isSelected}
                          onChange={() => handleSelectSavedAddress(addr.id)}
                          className="accent-ink"
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium text-ink">
                        {addr.recipientName} · {addr.recipientPhone}
                      </p>
                      <p className="mt-1 text-xs text-taupe-600">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                      </p>
                      <p className="mt-1 font-mono text-[0.68rem] uppercase text-taupe-500">
                        {addr.district}, {addr.province} — {addr.department}
                      </p>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="shippingRecipientName"
                      className="block font-mono text-xs uppercase tracking-wider text-ink"
                    >
                      Persona que recibe *
                    </label>
                    <input
                      id="shippingRecipientName"
                      name="shippingRecipientName"
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shippingRecipientPhone"
                      className="block font-mono text-xs uppercase tracking-wider text-ink"
                    >
                      Teléfono de contacto (Perú) *
                    </label>
                    <input
                      id="shippingRecipientPhone"
                      name="shippingRecipientPhone"
                      type="tel"
                      required
                      placeholder="987 654 321"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="shippingDepartment"
                      className="block font-mono text-xs uppercase tracking-wider text-ink"
                    >
                      Departamento *
                    </label>
                    <select
                      id="shippingDepartment"
                      name="shippingDepartment"
                      value={department}
                      onChange={(e) => {
                        const nextDept = e.target.value;
                        setDepartment(nextDept);
                        void triggerShippingRecalculation(nextDept, province, district);
                      }}
                      className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                    >
                      {PERU_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="shippingProvince"
                      className="block font-mono text-xs uppercase tracking-wider text-ink"
                    >
                      Provincia *
                    </label>
                    <input
                      id="shippingProvince"
                      name="shippingProvince"
                      type="text"
                      required
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      onBlur={() =>
                        void triggerShippingRecalculation(department, province, district)
                      }
                      className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="shippingDistrict"
                      className="block font-mono text-xs uppercase tracking-wider text-ink"
                    >
                      Distrito *
                    </label>
                    <input
                      id="shippingDistrict"
                      name="shippingDistrict"
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      onBlur={() =>
                        void triggerShippingRecalculation(department, province, district)
                      }
                      className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="shippingAddressLine1"
                    className="block font-mono text-xs uppercase tracking-wider text-ink"
                  >
                    Dirección exacta (Av. / Calle / Jr. / N° / Dpto.) *
                  </label>
                  <input
                    id="shippingAddressLine1"
                    name="shippingAddressLine1"
                    type="text"
                    required
                    placeholder="Ej: Av. Conquistadores 450, Dpto. 302"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="shippingReference"
                    className="block font-mono text-xs uppercase tracking-wider text-ink"
                  >
                    Referencia para el courier (opcional)
                  </label>
                  <input
                    id="shippingReference"
                    name="shippingReference"
                    type="text"
                    placeholder="Ej: Frente al parque, edificio de ladrillo visto, recepción 24h"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-taupe-700">
                  <input
                    type="checkbox"
                    checked={saveNewAddressToBook}
                    onChange={(e) => setSaveNewAddressToBook(e.target.checked)}
                    className="accent-ink"
                  />
                  <span>Guardar esta dirección en mi libreta para futuras compras</span>
                </label>
              </div>
            )}

            {/* Resultado vivo de tarifa de envío calculada en el servidor */}
            <div
              data-testid="checkout-shipping-status-box"
              className={cn(
                "mt-5 border p-4 text-xs",
                shippingCalc.isAvailable
                  ? "border-ink/15 bg-[#fbfaf7] text-ink"
                  : "border-cochinilla bg-cochinilla/10 text-cochinilla",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-mono font-semibold uppercase">
                  <Truck className="size-4 shrink-0" aria-hidden />
                  {isRecalculatingShipping
                    ? "Calculando cobertura en servidor..."
                    : shippingCalc.zoneName}
                </span>
                {shippingCalc.isAvailable && (
                  <span
                    data-testid="checkout-shipping-cost"
                    className="font-mono text-sm font-bold tabular-nums"
                  >
                    {shippingCalc.shippingAmount === 0
                      ? "GRATIS"
                      : formatPEN(shippingCalc.shippingAmount)}
                  </span>
                )}
              </div>
              {shippingCalc.isAvailable ? (
                <p className="mt-1 text-taupe-600">
                  Tiempo estimado de entrega: <strong>{shippingCalc.estimatedDaysLabel}</strong>.
                  {shippingCalc.isFreeShippingApplied
                    ? " ¡Beneficio de envío gratuito aplicado por superar el monto mínimo!"
                    : shippingCalc.freeShippingMinSubtotal
                      ? ` (Envío gratis en esta zona desde ${formatPEN(shippingCalc.freeShippingMinSubtotal)})`
                      : ""}
                </p>
              ) : (
                <p className="mt-1 font-medium">{shippingCalc.unavailableReason}</p>
              )}
            </div>
          </section>

          {/* SECCIÓN 2: COMPROBANTE ELECTRÓNICO (BOLETA / FACTURA PERÚ) */}
          <section
            aria-labelledby="checkout-billing-heading"
            className="border border-ink/15 bg-paper p-6 sm:p-8"
          >
            <div className="flex items-center gap-2.5 border-b border-ink/10 pb-4">
              <FileText className="size-5 text-cochinilla" aria-hidden />
              <div>
                <h2
                  id="checkout-billing-heading"
                  className="font-display text-2xl text-ink"
                >
                  2. Comprobante Tributario (Perú)
                </h2>
                <p className="text-xs text-taupe-500">
                  Selecciona Boleta de Venta (DNI / CE) o Factura Electrónica Comercial (RUC 11 dígitos).
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="tax-doc-boleta-btn"
                onClick={() => handleTaxDocTypeChange("boleta")}
                className={cn(
                  "flex items-center justify-center gap-2 border py-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
                  taxDocumentType === "boleta"
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 bg-[#fbfaf7] text-ink hover:border-ink",
                )}
              >
                Boleta de Venta
              </button>
              <button
                type="button"
                data-testid="tax-doc-factura-btn"
                onClick={() => handleTaxDocTypeChange("factura")}
                className={cn(
                  "flex items-center justify-center gap-2 border py-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
                  taxDocumentType === "factura"
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 bg-[#fbfaf7] text-ink hover:border-ink",
                )}
              >
                <Building2 className="size-3.5" aria-hidden />
                Factura Electrónica (RUC)
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="billingDocType"
                  className="block font-mono text-xs uppercase tracking-wider text-ink"
                >
                  Documento *
                </label>
                <select
                  id="billingDocType"
                  name="billingDocType"
                  disabled={taxDocumentType === "factura"}
                  value={billingDocType}
                  onChange={(e) =>
                    setBillingDocType(e.target.value as "DNI" | "CE" | "RUC")
                  }
                  className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-xs text-ink disabled:opacity-60"
                >
                  {taxDocumentType === "factura" ? (
                    <option value="RUC">RUC (11 dígitos)</option>
                  ) : (
                    <>
                      <option value="DNI">DNI (8 dígitos)</option>
                      <option value="CE">Carnet de Extranjería</option>
                      <option value="RUC">RUC Personal (10...)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="billingDocNumber"
                  className="block font-mono text-xs uppercase tracking-wider text-ink"
                >
                  {taxDocumentType === "factura"
                    ? "Número de RUC (11 dígitos) *"
                    : `Número de ${billingDocType} *`}
                </label>
                <input
                  id="billingDocNumber"
                  name="billingDocNumber"
                  type="text"
                  required
                  placeholder={
                    taxDocumentType === "factura" ? "20XXXXXXXXX" : "8 dígitos numéricos"
                  }
                  value={billingDocNumber}
                  onChange={(e) => setBillingDocNumber(e.target.value)}
                  className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="billingCustomerName"
                className="block font-mono text-xs uppercase tracking-wider text-ink"
              >
                {taxDocumentType === "factura"
                  ? "Razón Social Completa *"
                  : "Nombres y Apellidos del Titular *"}
              </label>
              <input
                id="billingCustomerName"
                name="billingCustomerName"
                type="text"
                required
                value={billingCustomerName}
                onChange={(e) => setBillingCustomerName(e.target.value)}
                className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {taxDocumentType === "factura" && (
              <div className="mt-4">
                <label
                  htmlFor="billingFiscalAddress"
                  className="block font-mono text-xs uppercase tracking-wider text-ink"
                >
                  Domicilio Fiscal Registrado *
                </label>
                <input
                  id="billingFiscalAddress"
                  name="billingFiscalAddress"
                  type="text"
                  required
                  placeholder="Dirección fiscal completa para el comprobante"
                  value={billingFiscalAddress}
                  onChange={(e) => setBillingFiscalAddress(e.target.value)}
                  className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            )}
          </section>

          {/* SECCIÓN 3: MÉTODO DE PAGO DESACOPLADO */}
          <section
            aria-labelledby="checkout-payment-heading"
            className="border border-ink/15 bg-paper p-6 sm:p-8"
          >
            <div className="flex items-center gap-2.5 border-b border-ink/10 pb-4">
              <CreditCard className="size-5 text-cochinilla" aria-hidden />
              <div>
                <h2
                  id="checkout-payment-heading"
                  className="font-display text-2xl text-ink"
                >
                  3. Método de Pago Seguro
                </h2>
                <p className="text-xs text-taupe-500">
                  Las operaciones se verifican en el servidor. Nunca almacenamos números completos de tarjeta ni códigos CVV.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {/* Opción 1: Pasarela Sandbox de Pruebas (Verificada) */}
              {context.paymentConfig.sandboxEnabled && (
                <label
                  className={cn(
                    "block cursor-pointer border p-4 transition-colors",
                    paymentProvider === "sandbox"
                      ? "border-ink bg-[#fbfaf7] ring-1 ring-ink"
                      : "border-ink/15 bg-paper hover:border-ink/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentProvider"
                        value="sandbox"
                        checked={paymentProvider === "sandbox"}
                        onChange={() => setPaymentProvider("sandbox")}
                        className="accent-ink"
                      />
                      <span className="font-mono text-xs font-semibold uppercase text-ink">
                        Pasarela de Pruebas Interactiva (Sandbox Oficial de Desarrollo)
                      </span>
                    </div>
                    <span className="border border-emerald-400 bg-emerald-50 px-2 py-0.5 font-mono text-[0.6rem] uppercase text-emerald-900">
                      Activo en Entorno
                    </span>
                  </div>

                  {paymentProvider === "sandbox" && (
                    <div className="mt-4 space-y-3 border-t border-ink/10 pt-3 text-xs">
                      <p className="text-taupe-600">
                        Selecciona el resultado de pago que deseas simular en el servidor (sin cargos reales):
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          data-testid="sandbox-scenario-approve"
                          onClick={() => setSandboxScenario("sandbox_approve")}
                          className={cn(
                            "border px-3 py-2 text-left font-mono text-[0.68rem]",
                            sandboxScenario === "sandbox_approve"
                              ? "border-emerald-700 bg-emerald-50 font-semibold text-emerald-950"
                              : "border-ink/15 bg-paper text-taupe-700",
                          )}
                        >
                          ✓ Aprobar Pago Inmediato
                        </button>
                        <button
                          type="button"
                          data-testid="sandbox-scenario-pending"
                          onClick={() => setSandboxScenario("sandbox_pending")}
                          className={cn(
                            "border px-3 py-2 text-left font-mono text-[0.68rem]",
                            sandboxScenario === "sandbox_pending"
                              ? "border-sky-700 bg-sky-50 font-semibold text-sky-950"
                              : "border-ink/15 bg-paper text-taupe-700",
                          )}
                        >
                          ⏳ Dejar en Proceso (Webhook)
                        </button>
                        <button
                          type="button"
                          data-testid="sandbox-scenario-reject"
                          onClick={() => setSandboxScenario("sandbox_reject")}
                          className={cn(
                            "border px-3 py-2 text-left font-mono text-[0.68rem]",
                            sandboxScenario === "sandbox_reject"
                              ? "border-rose-700 bg-rose-50 font-semibold text-rose-950"
                              : "border-ink/15 bg-paper text-taupe-700",
                          )}
                        >
                          ✕ Simular Tarjeta Denegada
                        </button>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <label
                          htmlFor="maskedCardLast4"
                          className="font-mono text-[0.68rem] uppercase text-taupe-600"
                        >
                          Últimos 4 dígitos referenciales:
                        </label>
                        <input
                          id="maskedCardLast4"
                          type="text"
                          maxLength={4}
                          value={maskedCardLast4}
                          onChange={(e) => setMaskedCardLast4(e.target.value)}
                          className="h-8 w-20 border border-ink/20 bg-paper px-2 font-mono text-xs text-ink"
                        />
                      </div>
                    </div>
                  )}
                </label>
              )}

              {/* Opción 2: Transferencia Bancaria / CCI Corporativo */}
              <label
                className={cn(
                  "block cursor-pointer border p-4 transition-colors",
                  paymentProvider === "bank_transfer"
                    ? "border-ink bg-[#fbfaf7] ring-1 ring-ink"
                    : "border-ink/15 bg-paper hover:border-ink/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentProvider"
                      value="bank_transfer"
                      checked={paymentProvider === "bank_transfer"}
                      onChange={() => setPaymentProvider("bank_transfer")}
                      className="accent-ink"
                    />
                    <span className="font-mono text-xs font-semibold uppercase text-ink">
                      Transferencia Bancaria / CCI en Soles (B2C y B2B)
                    </span>
                  </div>
                  <span className="border border-ink/20 bg-paper px-2 py-0.5 font-mono text-[0.6rem] uppercase text-taupe-700">
                    Reserva 30 min
                  </span>
                </div>
                {paymentProvider === "bank_transfer" && (
                  <div className="mt-3 border-t border-ink/10 pt-3 text-xs text-taupe-700 space-y-1">
                    <p>
                      Tu inventario quedará reservado por 30 minutos mientras realizas la transferencia a nombre de{" "}
                      <strong>{context.paymentConfig.bankTransferInstructions.accountHolder}</strong>:
                    </p>
                    <p className="font-mono text-[0.7rem]">
                      Banco: {context.paymentConfig.bankTransferInstructions.bankName}
                    </p>
                  </div>
                )}
              </label>

              {/* Opción 3: Mercado Pago Perú (Tarjetas, Yape, PagoEfectivo) */}
              <div className="border border-ink/15 bg-[#fbfaf7] p-4 opacity-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {context.paymentConfig.mercadopagoConfigured ? (
                      <input
                        type="radio"
                        name="paymentProvider"
                        value="mercadopago"
                        checked={paymentProvider === "mercadopago"}
                        onChange={() => setPaymentProvider("mercadopago")}
                        className="accent-ink"
                      />
                    ) : null}
                    <span className="font-mono text-xs font-semibold uppercase text-ink">
                      Mercado Pago Perú (Tarjetas Visa / Mastercard / Yape / PagoEfectivo)
                    </span>
                  </div>
                  <span className="border border-amber-400 bg-amber-50 px-2 py-0.5 font-mono text-[0.6rem] uppercase text-amber-900">
                    {context.paymentConfig.mercadopagoConfigured
                      ? `Configurado (${context.paymentConfig.mercadopagoEnvironment})`
                      : "Pendiente de credenciales"}
                  </span>
                </div>
                {!context.paymentConfig.mercadopagoConfigured && (
                  <p className="mt-1.5 text-[0.7rem] text-taupe-600">
                    El adaptador oficial para <code>api.mercadopago.com</code> y verificación HMAC <code>x-signature</code> está implementado. Para habilitar cobros en vivo, configura <code>NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY</code>, <code>MERCADOPAGO_ACCESS_TOKEN</code> y <code>MERCADOPAGO_WEBHOOK_SECRET</code> en el servidor.
                  </p>
                )}
              </div>

              {/* Opción 4: Culqi Perú (muestra estado real de configuración) */}
              <div className="border border-ink/15 bg-[#fbfaf7] p-4 opacity-90">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-ink">
                    Culqi Perú (Tarjetas Visa / Mastercard / Yape)
                  </span>
                  <span className="border border-amber-400 bg-amber-50 px-2 py-0.5 font-mono text-[0.6rem] uppercase text-amber-900">
                    {context.paymentConfig.culqiConfigured
                      ? "Configurado"
                      : "Pendiente de claves API"}
                  </span>
                </div>
                {!context.paymentConfig.culqiConfigured && (
                  <p className="mt-1.5 text-[0.7rem] text-taupe-600">
                    El adaptador de servidor para <code>api.culqi.com/v2/charges</code> está implementado. Para habilitar cobros en vivo con Culqi, configura <code>NEXT_PUBLIC_CULQI_PUBLIC_KEY</code> y <code>CULQI_SECRET_KEY</code> en <code>.env.local</code>.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="customerNotes"
                className="block font-mono text-xs uppercase tracking-wider text-ink"
              >
                Notas o instrucciones adicionales del pedido (opcional)
              </label>
              <textarea
                id="customerNotes"
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Indicaciones especiales de horario o empaque..."
                className="mt-1.5 block w-full border border-ink/25 bg-[#fbfaf7] p-3 text-xs text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </section>
        </div>

        {/* Columna Derecha: Resumen Final de Prendas, Envío, IGV y Confirmación */}
        <aside className="lg:col-span-5">
          <div className="sticky top-28 border border-ink/15 bg-[#fbfaf7] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div>
                <h2 className="font-display text-2xl text-ink">
                  Resumen del Pedido
                </h2>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-500">
                  Modalidad:{" "}
                  {context.orderMode === "wholesale"
                    ? "Mayorista B2B Autorizado"
                    : "Minorista B2C"}
                </p>
              </div>
              {context.source === "cart" && (
                <Link
                  href="/carrito"
                  className="inline-flex items-center gap-1 font-mono text-xs underline text-taupe-600 hover:text-ink"
                >
                  <ArrowLeft className="size-3" aria-hidden />
                  Editar bolsa
                </Link>
              )}
            </div>

            {/* Lista de prendas */}
            <div className="max-h-80 divide-y divide-ink/10 overflow-y-auto pr-1">
              {context.lines.map((line) => (
                <div key={line.variantId} className="flex gap-3.5 py-3.5">
                  <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-taupe-100">
                    <Image
                      src={line.imageUrl}
                      alt={line.productName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-medium text-ink">{line.productName}</p>
                    <p className="font-mono text-[0.65rem] text-taupe-500">
                      SKU: {line.sku} · {line.colorName ?? "Único"} · Talla{" "}
                      {line.size ?? "Única"}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-taupe-700">
                        {line.quantity} × {formatPEN(line.effectiveUnitAmount)}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-ink">
                        {formatPEN(line.lineSubtotalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desglose financiero en servidor */}
            <dl className="space-y-2.5 border-t border-ink/15 pt-4 text-xs">
              <div className="flex justify-between text-taupe-600">
                <dt>Subtotal a precio minorista ({context.totalUnits} uds.)</dt>
                <dd className="font-mono tabular-nums text-ink">
                  {formatPEN(context.retailSubtotalAmount)}
                </dd>
              </div>

              {context.discountAmount > 0 && (
                <div className="flex justify-between font-medium text-emerald-800">
                  <dt>Descuento comercial B2B autorizado</dt>
                  <dd className="font-mono tabular-nums">
                    −{formatPEN(context.discountAmount)}
                  </dd>
                </div>
              )}

              <div className="flex justify-between text-taupe-700">
                <dt>Subtotal de prendas</dt>
                <dd className="font-mono font-medium tabular-nums text-ink">
                  {formatPEN(context.subtotalAfterDiscountAmount)}
                </dd>
              </div>

              <div className="flex justify-between text-taupe-700">
                <dt>Costo de envío ({shippingCalc.zoneName})</dt>
                <dd className="font-mono font-medium tabular-nums text-ink">
                  {!shippingCalc.isAvailable
                    ? "No disponible"
                    : shippingCalc.shippingAmount === 0
                      ? "S/ 0.00 (Gratis)"
                      : formatPEN(shippingCalc.shippingAmount)}
                </dd>
              </div>

              <div className="border-t border-ink/10 pt-2.5 text-[0.7rem] text-taupe-500 space-y-1">
                <div className="flex justify-between">
                  <dt>Operación Gravada (Base Imponible sin IGV)</dt>
                  <dd
                    data-testid="checkout-taxable-base"
                    className="font-mono tabular-nums"
                  >
                    {formatPEN(taxBreakdown.taxableBaseAmount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>IGV (18% incluido según ley peruana)</dt>
                  <dd
                    data-testid="checkout-igv-amount"
                    className="font-mono tabular-nums"
                  >
                    {formatPEN(taxBreakdown.igvAmount)}
                  </dd>
                </div>
              </div>

              <div className="flex items-baseline justify-between border-t border-ink/20 pt-3">
                <dt className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink">
                  Total a Pagar (PEN)
                </dt>
                <dd
                  data-testid="checkout-grand-total"
                  className="font-display text-3xl font-bold tabular-nums text-ink"
                >
                  {formatPEN(taxBreakdown.totalAmount)}
                </dd>
              </div>
            </dl>

            <button
              type="submit"
              data-testid="checkout-confirm-order-btn"
              disabled={
                isSubmitting ||
                !shippingCalc.isAvailable ||
                context.hasStockIssues
              }
              className="flex h-13 w-full items-center justify-center gap-2 bg-ink px-6 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Procesando y reservando stock...
                </>
              ) : (
                <>
                  <Lock className="size-4" aria-hidden />
                  Confirmar Pedido ({formatPEN(taxBreakdown.totalAmount)})
                </>
              )}
            </button>

            <div className="space-y-2 border-t border-ink/10 pt-4 text-[0.68rem] text-taupe-600">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0 text-emerald-800" aria-hidden />
                <span>
                  Protección anti-duplicados activa (Idempotency Key:{" "}
                  <code className="font-mono">{idempotencyKey.slice(0, 12)}...</code>)
                </span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-ink" aria-hidden />
                <span>
                  Reserva atómica de inventario por variante (talla y color) en Neon PostgreSQL.
                </span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}