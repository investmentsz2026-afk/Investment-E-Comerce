"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
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
  getPeruDepartments,
  getPeruProvinces,
  getPeruDistricts,
} from "@/data/peru-locations";
import {
  Truck,
  CreditCard,
  AlertCircle,
  Loader2,
  Lock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Store,
  Clock,
  Phone,
  Check,
  X,
  Zap,
  HelpCircle,
  Receipt,
  Copy,
  UploadCloud,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  CheckoutCardPreview,
  detectCardBrand,
  formatCardNumberInput,
  formatExpInput,
} from "./checkout-card-preview";
import { CheckoutPaymentProcessing } from "./checkout-payment-processing";
import {
  CheckoutWhatsAppModal,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_NUMBER,
  type OrderWhatsAppDetails,
} from "./checkout-whatsapp-modal";
import { CheckoutSuccessView } from "./checkout-success-view";

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
  const { refreshCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // Clave de idempotencia única por sesión de checkout
  const [idempotencyKey] = useState(initialIdempotencyKey);

  // Stepper: 1: Entrega, 2: Comprobante, 3: Método de Pago
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Modalidad de entrega:
  // "delivery": Envío a domicilio (Lima Metropolitana y Callao / Provincias)
  // "express": Envío Express Provincias (Agencia Shalom / Olva Courier / Despacho Nacional)
  // "store_pickup": Recojo en Tienda Oficial American Colt (Gratis)
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "express" | "store_pickup">("delivery");

  // Tienda física seleccionada para recojo
  const activeStores = context.activeStores ?? [];
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
    activeStores[0]?.id ?? null,
  );
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Dirección guardada vs nueva dirección
  const defaultAddress = context.savedAddresses[0] ?? null;
  const [addressMode, setAddressMode] = useState<"saved" | "new">(
    defaultAddress ? "saved" : "new",
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    defaultAddress?.id ?? null,
  );
  const [saveNewAddressToBook, setSaveNewAddressToBook] = useState(true);

  // Campos de Entrega
  const [recipientName, setRecipientName] = useState(
    defaultAddress?.recipientName ?? `${user.firstName} ${user.lastName}`.trim(),
  );
  const [recipientPhone, setRecipientPhone] = useState(
    defaultAddress?.recipientPhone ??
      context.approvedCompany?.contactPhone ??
      user.phone ??
      "",
  );

  const [department, setDepartment] = useState(defaultAddress?.department ?? "Lima");
  const [province, setProvince] = useState(defaultAddress?.province ?? "Lima");
  const [district, setDistrict] = useState(defaultAddress?.district ?? "Miraflores");
  const [addressLine1, setAddressLine1] = useState(defaultAddress?.addressLine1 ?? "");
  const [reference, setReference] = useState(defaultAddress?.reference ?? "");

  // Cálculos de flete e IGV en vivo desde el servidor
  const [shippingCalc, setShippingCalc] = useState<ShippingCalculationResult>(
    context.defaultShipping,
  );
  const [isQuotingShipping, setIsQuotingShipping] = useState(false);
  const [taxBreakdown, setTaxBreakdown] = useState({
    taxableBaseAmount: context.taxBreakdown.taxableBaseAmount,
    igvAmount: context.taxBreakdown.igvAmount,
    totalAmount: context.taxBreakdown.totalAmount,
  });

  // Campos de Comprobante Fiscal (Boleta vs Factura con RUC)
  const isCompany = context.orderMode === "wholesale" && context.approvedCompany;
  const [taxDocumentType, setTaxDocumentType] = useState<TaxDocumentType>(
    isCompany ? "factura" : "boleta",
  );
  const [billingDocType, setBillingDocType] = useState<"DNI" | "CE" | "RUC">(
    isCompany ? "RUC" : "DNI",
  );
  const [billingDocNumber, setBillingDocNumber] = useState(
    isCompany ? (context.approvedCompany?.taxId ?? "") : "",
  );
  const [billingCustomerName, setBillingCustomerName] = useState(
    isCompany
      ? (context.approvedCompany?.legalName ?? "")
      : `${user.firstName} ${user.lastName}`.trim(),
  );
  const [billingFiscalAddress, setBillingFiscalAddress] = useState(
    isCompany ? (context.approvedCompany?.addressLine ?? "") : "",
  );

  // Método de pago: "card" (Tarjeta Crédito/Débito) | "transfer" (Transferencia / Yape / Plin)
  const [paymentType, setPaymentType] = useState<"card" | "transfer">("card");

  // Configuración de Tarjeta: Modo Simulación vs Real Mercado Pago
  const [cardMode, setCardMode] = useState<"simulation" | "real">("simulation");
  const [simulationScenario, setSimulationScenario] = useState<"sandbox_approve" | "sandbox_reject">("sandbox_approve");

  // Formulario de Tarjeta
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardDni, setCardDni] = useState("");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Formulario de Transferencia / Yape / Plin
  const [operationCode, setOperationCode] = useState("");
  const [voucherPreviewUrl, setVoucherPreviewUrl] = useState<string | null>(null);
  const [voucherFileName, setVoucherFileName] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Notas adicionales del cliente
  const [customerNotes, setCustomerNotes] = useState("");

  // Errores por paso
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Animación Formal de Pago
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Pantalla de Éxito y Pedido Confirmado
  const [orderSuccessData, setOrderSuccessData] = useState<OrderWhatsAppDetails | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);

  // Modal de WhatsApp
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Catálogos geográficos del Perú
  const departments = getPeruDepartments();
  const provinces = getPeruProvinces(department);
  const districts = getPeruDistricts(department, province);

  // Tienda seleccionada actual
  const selectedStore = activeStores.find((s) => s.id === selectedStoreId) ?? activeStores[0];

  // Disparar cotización de envío en el servidor
  const triggerShippingQuote = async (
    dept: string,
    prov: string,
    dist: string,
    method: "delivery" | "express" | "store_pickup" = deliveryMethod,
    storeId: number | null = selectedStoreId,
  ) => {
    setIsQuotingShipping(true);
    setStep1Error(null);
    try {
      const res = await quoteCheckoutShippingAction({
        department: dept,
        province: prov,
        district: dist,
        subtotalAfterDiscountCents: context.subtotalAfterDiscountAmount,
        deliveryMethod: method,
        pickupStoreId: storeId,
      });

      if (res.success && res.data) {
        setShippingCalc(res.data.shipping);
        setTaxBreakdown({
          taxableBaseAmount: res.data.taxableBaseAmount,
          igvAmount: res.data.igvAmount,
          totalAmount: res.data.totalAmount,
        });
      } else {
        setStep1Error(res.error ?? "No se pudo cotizar el envío para este destino.");
      }
    } catch {
      setStep1Error("Error de comunicación al calcular costo de envío.");
    } finally {
      setIsQuotingShipping(false);
    }
  };

  // Manejar cambio de Departamento
  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const newProvinces = getPeruProvinces(newDept);
    const firstProv = newProvinces[0] ?? "";
    setProvince(firstProv);

    const newDistricts = getPeruDistricts(newDept, firstProv);
    const firstDist = newDistricts[0] ?? "";
    setDistrict(firstDist);

    void triggerShippingQuote(newDept, firstProv, firstDist);
  };

  // Manejar cambio de Provincia
  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const newDistricts = getPeruDistricts(department, newProv);
    const firstDist = newDistricts[0] ?? "";
    setDistrict(firstDist);

    void triggerShippingQuote(department, newProv, firstDist);
  };

  // Manejar cambio de Distrito
  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    void triggerShippingQuote(department, province, newDist);
  };

  // Manejar cambio de Modalidad de Entrega
  const handleDeliveryMethodChange = (newMethod: "delivery" | "express" | "store_pickup") => {
    setDeliveryMethod(newMethod);
    if (newMethod === "store_pickup") {
      void triggerShippingQuote(
        selectedStore?.department ?? "Lima",
        selectedStore?.province ?? "Lima",
        selectedStore?.district ?? "La Victoria",
        "store_pickup",
        selectedStoreId,
      );
    } else {
      void triggerShippingQuote(department, province, district, newMethod);
    }
  };

  // Manejar selección de dirección guardada
  const handleSelectSavedAddress = (id: number) => {
    setSelectedAddressId(id);
    const addr = context.savedAddresses.find((a) => a.id === id);
    if (addr) {
      setRecipientName(addr.recipientName);
      setRecipientPhone(addr.recipientPhone);
      setDepartment(addr.department);
      setProvince(addr.province);
      setDistrict(addr.district);
      setAddressLine1(addr.addressLine1);
      setReference(addr.reference ?? "");
      void triggerShippingQuote(addr.department, addr.province, addr.district);
    }
  };

  // Avanzar de Paso 1 (Entrega) a Paso 2 (Comprobante)
  const handleProceedToStep2 = () => {
    setStep1Error(null);

    if (!recipientName.trim()) {
      setStep1Error("Ingresa el nombre completo de la persona que recibe o retira el pedido.");
      return;
    }

    const cleanPhone = recipientPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setStep1Error("Ingresa un número telefónico de contacto válido en el Perú (9 dígitos).");
      return;
    }

    if (deliveryMethod === "store_pickup") {
      if (!selectedStoreId) {
        setStep1Error("Por favor selecciona en qué tienda oficial retirarás tus prendas.");
        return;
      }
    } else {
      if (!addressLine1.trim()) {
        setStep1Error("Ingresa la dirección exacta de entrega (Avenida, Jirón, Calle, N° o Dpto).");
        return;
      }
      if (!shippingCalc.isAvailable) {
        setStep1Error(shippingCalc.unavailableReason ?? "No contamos con cobertura de entrega en este distrito.");
        return;
      }
    }

    setCurrentStep(2);
  };

  // Avanzar de Paso 2 (Comprobante) a Paso 3 (Método de Pago)
  const handleProceedToStep3 = () => {
    setStep2Error(null);

    if (taxDocumentType === "factura") {
      const cleanRuc = billingDocNumber.replace(/\D/g, "");
      if (cleanRuc.length !== 11 || (!cleanRuc.startsWith("10") && !cleanRuc.startsWith("20"))) {
        setStep2Error("El RUC debe tener 11 dígitos y comenzar con 10 o 20 conforme a SUNAT.");
        return;
      }
      if (!billingCustomerName.trim()) {
        setStep2Error("Ingresa la Razón Social de la empresa tal como está registrada en SUNAT.");
        return;
      }
      if (!billingFiscalAddress.trim()) {
        setStep2Error("Ingresa el Domicilio Fiscal de la empresa en el Perú.");
        return;
      }
    } else {
      const cleanDoc = billingDocNumber.replace(/\D/g, "");
      if (billingDocType === "DNI" && cleanDoc.length !== 8) {
        setStep2Error("El DNI debe tener 8 dígitos numéricos.");
        return;
      }
      if (billingDocType === "CE" && (cleanDoc.length < 8 || cleanDoc.length > 12)) {
        setStep2Error("El Carné de Extranjería debe tener entre 8 y 12 caracteres.");
        return;
      }
      if (!billingCustomerName.trim()) {
        setStep2Error("Ingresa los nombres y apellidos del titular del comprobante.");
        return;
      }
    }

    setCurrentStep(3);
  };

  // Llenar tarjeta de prueba en 1 clic
  const handleFillTestCard = (outcome: "approve" | "reject" = "approve") => {
    setCardNumber("4557 8421 9012 3456");
    setCardHolder((recipientName || "JHOSEP COLCHADO").toUpperCase());
    setCardExp("12/28");
    setCardCvv("789");
    setCardDni(billingDocType === "DNI" && billingDocNumber ? billingDocNumber : "12345678");
    setCardMode("simulation");
    setSimulationScenario(outcome === "approve" ? "sandbox_approve" : "sandbox_reject");
    setCardError(null);
  };

  // Subir imagen de voucher / constancia
  const handleVoucherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setGeneralError("Por favor selecciona un archivo de imagen válido (JPG, PNG o WEBP).");
      return;
    }
    setVoucherFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setVoucherPreviewUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Copiar cuenta bancaria
  const handleCopyAccount = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAccount(label);
      setTimeout(() => setCopiedAccount(null), 2000);
    });
  };

  // Confirmar y pagar pedido
  const handleConfirmOrder = async () => {
    setGeneralError(null);
    setCardError(null);

    // Validación según método
    if (paymentType === "card") {
      const cleanNum = cardNumber.replace(/\D/g, "");
      if (cleanNum.length < 15) {
        setCardError("Ingresa un número de tarjeta válido (15 o 16 dígitos).");
        return;
      }
      if (!cardHolder.trim() || cardHolder.trim().length < 3) {
        setCardError("Ingresa el nombre del titular tal como figura en la tarjeta.");
        return;
      }
      const expClean = cardExp.replace(/\D/g, "");
      if (expClean.length !== 4) {
        setCardError("Ingresa la fecha de vencimiento completa en formato MM/AA.");
        return;
      }
      const month = parseInt(expClean.slice(0, 2), 10);
      if (month < 1 || month > 12) {
        setCardError("El mes de vencimiento debe estar entre 01 y 12.");
        return;
      }
      if (cardCvv.trim().length < 3) {
        setCardError("Ingresa el código CVV de seguridad (3 o 4 dígitos al reverso).");
        return;
      }
      if (cardDni.trim().length < 8) {
        setCardError("Ingresa el DNI del titular de la tarjeta (8 dígitos).");
        return;
      }
    }

    if (paymentType === "transfer") {
      if (!operationCode.trim() || operationCode.trim().length < 4) {
        setGeneralError("Por favor ingresa el número o código de operación de tu transferencia o Yape.");
        return;
      }
    }

    // Activar animación formal bancaria
    setIsProcessingPayment(true);

    const detectedBrand = detectCardBrand(cardNumber);
    const brandLabel =
      detectedBrand === "visa"
        ? "Visa Débito / Crédito"
        : detectedBrand === "mastercard"
        ? "Mastercard Débito / Crédito"
        : detectedBrand === "amex"
        ? "American Express"
        : "Tarjeta Bancaria";

    const resolvedProvider: PaymentProviderName =
      paymentType === "transfer"
        ? "bank_transfer"
        : cardMode === "real" && context.paymentConfig.mercadopagoConfigured
        ? "mercadopago"
        : "sandbox";

    const tokenPayload =
      paymentType === "card"
        ? cardMode === "simulation"
          ? simulationScenario
          : "real_card_token"
        : undefined;

    startTransition(async () => {
      const res = await placeCheckoutOrderAction({
        idempotencyKey,
        source: context.source,
        quoteId: context.quoteId,
        deliveryMethod,
        pickupStoreId: deliveryMethod === "store_pickup" ? selectedStoreId : null,
        savedAddressId: addressMode === "saved" && deliveryMethod !== "store_pickup" ? selectedAddressId : null,
        saveNewAddressToBook: addressMode === "new" && deliveryMethod !== "store_pickup" ? saveNewAddressToBook : false,
        shippingRecipientName: recipientName,
        shippingRecipientPhone: recipientPhone,
        shippingDepartment: deliveryMethod === "store_pickup" ? (selectedStore?.department ?? "Lima") : department,
        shippingProvince: deliveryMethod === "store_pickup" ? (selectedStore?.province ?? "Lima") : province,
        shippingDistrict: deliveryMethod === "store_pickup" ? (selectedStore?.district ?? "La Victoria") : district,
        shippingAddressLine1: deliveryMethod === "store_pickup" ? (selectedStore?.address ?? "Tienda Oficial") : addressLine1,
        shippingAddressLine2: "",
        shippingReference: deliveryMethod === "store_pickup" ? (selectedStore?.reference ?? "") : reference,
        taxDocumentType,
        billingDocType,
        billingDocNumber,
        billingCustomerName,
        billingFiscalAddress,
        paymentProvider: resolvedProvider,
        paymentToken: tokenPayload,
        paymentMethodBrand: paymentType === "card" ? brandLabel : "Transferencia / Yape Oficial",
        maskedCardLast4: paymentType === "card" ? cardNumber.replace(/\D/g, "").slice(-4) : undefined,
        paymentOperationCode: paymentType === "transfer" ? operationCode.trim() : undefined,
        voucherImageUrl: voucherPreviewUrl ?? undefined,
        customerNotes,
      });

      if (res.success && res.data) {
        const orderData = res.data;
        await refreshCart();

        // Breve pausa para completar la animación bancaria con elegancia
        setTimeout(() => {
          setIsProcessingPayment(false);
          setConfirmedOrderId(orderData.orderId);
          setOrderSuccessData({
            orderNumber: orderData.orderNumber,
            orderStatus: orderData.orderStatus,
            paymentStatus: orderData.paymentStatus,
            paymentMethodLabel:
              orderData.paymentMethodLabel ||
              (paymentType === "card" ? brandLabel : "Transferencia Bancaria / Yape"),
            totalAmount: orderData.totalAmount ?? taxBreakdown.totalAmount,
            deliveryMethod,
            shippingRecipientName: orderData.shippingRecipientName || recipientName,
            shippingDepartment: orderData.shippingDepartment || department,
            shippingProvince: orderData.shippingProvince || province,
            shippingDistrict: orderData.shippingDistrict || district,
            shippingAddressLine1: orderData.shippingAddressLine1 || addressLine1,
            taxDocumentType: orderData.taxDocumentType || taxDocumentType,
            billingDocNumber: orderData.billingDocNumber || billingDocNumber,
            pickupStoreName: selectedStore?.name,
            pickupStoreAddress: selectedStore?.address,
            paymentOperationCode: operationCode || undefined,
            items: context.lines.map((l) => ({
              title: l.productName,
              size: l.size,
              color: l.colorName,
              quantity: l.quantity,
              priceCents: l.effectiveUnitAmount,
            })),
          });
          setIsWhatsAppModalOpen(true);
        }, 1200);
      } else {
        setIsProcessingPayment(false);
        setGeneralError(res.error ?? "No se pudo procesar tu pedido. Verifica la información ingresada.");
      }
    });
  };

  // ═════════════════════════════════════════════════════════════════════════
  // VISTA FINAL: PANTALLA DE ÉXITO DE COMPRA (DENTRO DEL CHECKOUT)
  // ═════════════════════════════════════════════════════════════════════════
  if (orderSuccessData && confirmedOrderId) {
    return (
      <div className="text-neutral-900 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-neutral-200/90 pb-3 mb-4 sm:pb-4 sm:mb-6">
          <Link href="/" className="text-base sm:text-lg font-black tracking-tighter text-neutral-900">
            AMERICAN COLT<span className="text-[#DC2626]">.</span>
          </Link>
          <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[0.68rem] sm:text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Compra Protegida
          </span>
        </div>

        <CheckoutSuccessView
          order={orderSuccessData}
          orderId={confirmedOrderId}
          userRole={user.role}
          voucherPreviewUrl={voucherPreviewUrl}
          onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        />

        <CheckoutWhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          order={orderSuccessData}
        />
      </div>
    );
  }

  return (
    <div className="text-neutral-900">
      {/* ─── Encabezado de Navegación Rápida y Marca ─── */}
      <div className="flex items-center justify-between border-b border-neutral-200/90 pb-2.5 mb-4 sm:pb-4 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="text-sm sm:text-lg font-black tracking-tighter text-neutral-900 transition-opacity hover:opacity-80"
          >
            AMERICAN COLT<span className="text-[#DC2626]">.</span>
          </Link>
          <span className="hidden sm:inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-neutral-600">
            JEANS™ PERÚ
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-[0.7rem] sm:text-xs">
          <span className="inline-flex items-center gap-1 font-bold text-neutral-700">
            <Lock className="size-3.5 text-emerald-600" />
            <span className="hidden min-[400px]:inline">Checkout seguro</span>
          </span>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1 font-semibold text-[#0055FF] hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver a la bolsa</span>
          </Link>
        </div>
      </div>

      {/* Título Principal */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
          Finaliza tu compra
        </h1>
        <p className="mt-0.5 sm:mt-1 text-[0.7rem] sm:text-xs text-neutral-500">
          Revisa tus prendas, selecciona tu dirección en el Perú y elige tu comprobante electrónico.
        </p>
      </div>

      {/* Grid de 2 Columnas (Izquierda: Pasos, Derecha: Resumen de Pedido) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-10 items-start">
        {/* ═══════════════════════════════════════════════════════════════════
            COLUMNA IZQUIERDA: STEPPER DE 3 PASOS (ENTREGA, COMPROBANTE, PAGO)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
          {/* ────────────────────────────────────────────────────────────────
              PASO 1: ENTREGA Y MODALIDAD
              ──────────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-6 shadow-2xs transition-all">
            {currentStep === 1 ? (
              <div className="space-y-3.5 sm:space-y-5">
                <div className="border-b border-neutral-100 pb-2.5 sm:pb-3">
                  <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-neutral-900">
                    <MapPin className="size-4 sm:size-5 text-[#DC2626]" />
                    <span>1. Entrega</span>
                  </h2>
                  <p className="mt-0.5 text-[0.68rem] sm:text-xs text-neutral-500">
                    El costo de envío se calcula según el departamento, provincia y distrito.
                  </p>
                </div>

                {step1Error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 sm:p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-600" />
                    <span>{step1Error}</span>
                  </div>
                )}

                {/* Modalidad de entrega: 3 opciones con tarjetas */}
                <div>
                  <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-800 mb-1.5 sm:mb-2">
                    Modalidad de Entrega *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    {/* Opción 1: Domicilio */}
                    <button
                      type="button"
                      onClick={() => handleDeliveryMethodChange("delivery")}
                      className={cn(
                        "rounded-xl border p-2 sm:p-3 text-left transition-all relative flex flex-col justify-between",
                        deliveryMethod === "delivery"
                          ? "border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]"
                          : "border-neutral-200 hover:border-neutral-400 bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Truck className={cn("size-3.5 sm:size-4", deliveryMethod === "delivery" ? "text-[#DC2626]" : "text-neutral-500")} />
                        {deliveryMethod === "delivery" && <Check className="size-3 sm:size-3.5 text-[#DC2626]" />}
                      </div>
                      <span className="font-bold text-[0.65rem] sm:text-xs text-neutral-900 block leading-tight">A Domicilio</span>
                      <span className="text-[0.58rem] sm:text-[0.68rem] text-neutral-500 leading-tight mt-0.5 line-clamp-2">Lima y Provincias</span>
                    </button>

                    {/* Opción 2: Express / Provincias */}
                    <button
                      type="button"
                      onClick={() => handleDeliveryMethodChange("express")}
                      className={cn(
                        "rounded-xl border p-2 sm:p-3 text-left transition-all relative flex flex-col justify-between",
                        deliveryMethod === "express"
                          ? "border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]"
                          : "border-neutral-200 hover:border-neutral-400 bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Zap className={cn("size-3.5 sm:size-4", deliveryMethod === "express" ? "text-[#DC2626]" : "text-neutral-500")} />
                        {deliveryMethod === "express" && <Check className="size-3 sm:size-3.5 text-[#DC2626]" />}
                      </div>
                      <span className="font-bold text-[0.65rem] sm:text-xs text-neutral-900 block leading-tight">Envío Express</span>
                      <span className="text-[0.58rem] sm:text-[0.68rem] text-neutral-500 leading-tight mt-0.5 line-clamp-2">Shalom / Olva Perú</span>
                    </button>

                    {/* Opción 3: Recojo en Tienda */}
                    <button
                      type="button"
                      onClick={() => handleDeliveryMethodChange("store_pickup")}
                      className={cn(
                        "rounded-xl border p-2 sm:p-3 text-left transition-all relative flex flex-col justify-between",
                        deliveryMethod === "store_pickup"
                          ? "border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]"
                          : "border-neutral-200 hover:border-neutral-400 bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1 gap-1">
                        <Store className={cn("size-3.5 sm:size-4 shrink-0", deliveryMethod === "store_pickup" ? "text-[#DC2626]" : "text-neutral-500")} />
                        <span className="rounded bg-emerald-100 px-1 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-bold text-emerald-800 leading-none">
                          Gratis
                        </span>
                      </div>
                      <span className="font-bold text-[0.65rem] sm:text-xs text-neutral-900 block leading-tight">En Tienda</span>
                      <span className="text-[0.58rem] sm:text-[0.68rem] text-neutral-500 leading-tight mt-0.5 line-clamp-2">Tiendas American Colt</span>
                    </button>
                  </div>
                </div>

                {/* Sub-formulario Persona que Recibe y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 pt-0.5">
                  <div>
                    <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                      Persona que recibe / recoge *
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Ej: Jhosep Colchado"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                      Teléfono de contacto (Perú) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="987 654 321"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-mono text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contenido condicional según Modalidad */}
                {deliveryMethod === "store_pickup" ? (
                  /* Modo: Recojo en Tienda */
                  <div className="rounded-xl border border-neutral-200 bg-[#FAF8F5] p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.7rem] sm:text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <Store className="size-3.5 sm:size-4 text-[#DC2626]" />
                        Tienda para retiro gratuito
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsStoreModalOpen(true)}
                        className="text-[0.7rem] sm:text-xs font-bold text-[#0055FF] hover:underline"
                      >
                        Cambiar tienda
                      </button>
                    </div>

                    {selectedStore ? (
                      <div className="rounded-xl border border-neutral-200/80 bg-white p-2.5 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs font-extrabold text-neutral-900">
                            {selectedStore.name}
                          </strong>
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-800 border border-emerald-200 shrink-0">
                            Costo: S/ 0.00
                          </span>
                        </div>
                        <p className="text-[0.7rem] sm:text-xs text-neutral-700 flex items-start gap-1.5">
                          <MapPin className="size-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                          <span>{selectedStore.address} — {selectedStore.district}, {selectedStore.department}</span>
                        </p>
                        {selectedStore.reference && (
                          <p className="text-[0.65rem] sm:text-[0.7rem] text-neutral-500 pl-5">
                            Ref: {selectedStore.reference}
                          </p>
                        )}
                        <p className="text-[0.65rem] sm:text-[0.7rem] text-neutral-600 flex items-center gap-1.5 pt-0.5 pl-5">
                          <Clock className="size-3 text-neutral-400 shrink-0" />
                          <span>{selectedStore.openingHours}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">
                        No hay tiendas disponibles actualmente.
                      </p>
                    )}

                    <p className="text-[0.65rem] sm:text-[0.7rem] text-neutral-500">
                      ℹ️ Retira tus prendas presentando tu DNI y código de pedido confirmado.
                    </p>
                  </div>
                ) : (
                  /* Modo: Domicilio o Express */
                  <div className="space-y-3 sm:space-y-4 pt-0.5">
                    {/* Selector de direcciones guardadas si el usuario tiene alguna */}
                    {context.savedAddresses.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[0.72rem] sm:text-xs pb-0.5">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-neutral-800">
                          <input
                            type="radio"
                            name="addressMode"
                            checked={addressMode === "saved"}
                            onChange={() => {
                              setAddressMode("saved");
                              if (defaultAddress) handleSelectSavedAddress(defaultAddress.id);
                            }}
                            className="accent-[#DC2626]"
                          />
                          <span>Usar dirección guardada</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-neutral-800">
                          <input
                            type="radio"
                            name="addressMode"
                            checked={addressMode === "new"}
                            onChange={() => setAddressMode("new")}
                            className="accent-[#DC2626]"
                          />
                          <span>Nueva dirección</span>
                        </label>
                      </div>
                    )}

                    {addressMode === "saved" && context.savedAddresses.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                        {context.savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr.id)}
                              className={cn(
                                "rounded-xl border p-2.5 sm:p-3 cursor-pointer transition-all text-[0.7rem] sm:text-xs",
                                isSelected
                                  ? "border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]"
                                  : "border-neutral-200 bg-white hover:border-neutral-300",
                              )}
                            >
                              <div className="flex items-center justify-between mb-0.5 sm:mb-1 gap-1">
                                <span className="font-extrabold text-neutral-900 truncate">{addr.title}</span>
                                {isSelected && <Check className="size-3.5 text-[#DC2626] shrink-0" />}
                              </div>
                              <p className="text-neutral-600 line-clamp-1">{addr.addressLine1}</p>
                              <p className="text-[0.62rem] sm:text-[0.68rem] text-neutral-400 line-clamp-1">
                                {addr.district}, {addr.province} ({addr.department})
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Formulario de Nueva Dirección Completa de Perú */
                      <div className="space-y-2.5 sm:space-y-3.5">
                        {/* Selectores de 3 niveles: Departamento -> Provincia -> Distrito */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                          <div>
                            <label className="block text-[0.6rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-neutral-600 mb-1 truncate">
                              Depto. *
                            </label>
                            <select
                              value={department}
                              onChange={(e) => handleDepartmentChange(e.target.value)}
                              className="w-full rounded-xl border border-neutral-300 bg-white px-2 py-2 sm:px-3 text-[0.7rem] sm:text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                            >
                              {departments.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[0.6rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-neutral-600 mb-1 truncate">
                              Provincia *
                            </label>
                            <select
                              value={province}
                              onChange={(e) => handleProvinceChange(e.target.value)}
                              className="w-full rounded-xl border border-neutral-300 bg-white px-2 py-2 sm:px-3 text-[0.7rem] sm:text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                            >
                              {provinces.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[0.6rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-neutral-600 mb-1 truncate">
                              Distrito *
                            </label>
                            <select
                              value={district}
                              onChange={(e) => handleDistrictChange(e.target.value)}
                              className="w-full rounded-xl border border-neutral-300 bg-white px-2 py-2 sm:px-3 text-[0.7rem] sm:text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                            >
                              {districts.map((dst) => (
                                <option key={dst} value={dst}>
                                  {dst}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Dirección Exacta */}
                        <div>
                          <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                            Dirección exacta (Av. / Calle / Jr. / N° / Dpto.) *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            placeholder="Ej: Av. Conquistadores 450, Dpto. 302"
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                          />
                        </div>

                        {/* Referencia */}
                        <div>
                          <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                            Referencia para el courier (opcional)
                          </label>
                          <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Ej: Frente al parque, edificio de ladrillo visto"
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                          />
                        </div>

                        {/* Guardar en libreta */}
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={saveNewAddressToBook}
                            onChange={(e) => setSaveNewAddressToBook(e.target.checked)}
                            className="rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626]"
                          />
                          <span className="text-xs text-neutral-700 font-medium">
                            Guardar esta dirección en mi libreta para futuras compras
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Resumen de flete en vivo */}
                    <div className="rounded-xl border border-neutral-200 bg-[#FAF8F5] p-3 text-xs">
                      {isQuotingShipping ? (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Calculando costo de flete exacto...</span>
                        </div>
                      ) : shippingCalc.isAvailable ? (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                            <Truck className="size-4 text-[#DC2626]" />
                            {shippingCalc.isFreeShippingApplied ? "Envío gratis aplicado" : shippingCalc.zoneName}
                          </span>
                          <span className="font-extrabold text-neutral-900">
                            {shippingCalc.isFreeShippingApplied ? "Gratis" : formatPEN(shippingCalc.shippingAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-red-700 font-medium">
                          ⚠️ {shippingCalc.unavailableReason ?? "Destino sin cobertura directa."}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón de Continuar a Paso 2 */}
                <div className="pt-2.5 sm:pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-2.5 sm:px-6 sm:py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#DC2626]/20 hover:bg-[#B91C1C] active:scale-[0.99] transition-all"
                  >
                    <span>Continuar al comprobante</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Paso 1 Contraído (Resumen con botón Editar) */
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-start gap-2.5 sm:gap-3 text-xs min-w-0">
                  <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <Check className="size-3.5 sm:size-4 stroke-[3]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold uppercase tracking-wider text-neutral-900 text-[0.68rem] sm:text-[0.72rem]">
                      1. Entrega
                    </h3>
                    <p className="text-neutral-700 font-medium text-[0.72rem] sm:text-xs line-clamp-2">
                      {deliveryMethod === "store_pickup"
                        ? `Recojo en Tienda Oficial: ${selectedStore?.name ?? "American Colt"} (${selectedStore?.district ?? ""})`
                        : `${department}, ${province}, ${district} — ${addressLine1}`}
                    </p>
                    <p className="text-[0.64rem] sm:text-[0.68rem] text-neutral-500">
                      Destinatario: {recipientName} ({recipientPhone})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[0.7rem] sm:text-xs font-bold text-[#0055FF] hover:bg-neutral-50 transition-colors"
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          {/* ────────────────────────────────────────────────────────────────
              PASO 2: COMPROBANTE TRIBUTARIO (BOLETA O FACTURA)
              ──────────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-6 shadow-2xs transition-all">
            {currentStep === 2 ? (
              <div className="space-y-3.5 sm:space-y-5">
                <div className="border-b border-neutral-100 pb-2.5 sm:pb-3">
                  <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-neutral-900">
                    <Receipt className="size-4 sm:size-5 text-[#DC2626]" />
                    <span>2. Comprobante</span>
                  </h2>
                  <p className="mt-0.5 text-[0.68rem] sm:text-xs text-neutral-500">
                    Selecciona Boleta de Venta (DNI / CE) o Factura Electrónica Comercial (RUC 11 dígitos).
                  </p>
                </div>

                {step2Error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-600" />
                    <span>{step2Error}</span>
                  </div>
                )}

                {/* Tabs Boleta vs Factura */}
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTaxDocumentType("boleta");
                      setBillingDocType("DNI");
                    }}
                    className={cn(
                      "rounded-lg py-2 text-xs font-bold transition-all",
                      taxDocumentType === "boleta"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900",
                    )}
                  >
                    Boleta de venta
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTaxDocumentType("factura");
                      setBillingDocType("RUC");
                    }}
                    className={cn(
                      "rounded-lg py-2 text-xs font-bold transition-all",
                      taxDocumentType === "factura"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900",
                    )}
                  >
                    Factura electrónica (RUC)
                  </button>
                </div>

                {taxDocumentType === "boleta" ? (
                  /* Formulario de Boleta */
                  <div className="space-y-2.5 sm:space-y-3.5">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="col-span-1">
                        <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                          Doc. *
                        </label>
                        <select
                          value={billingDocType}
                          onChange={(e) => setBillingDocType(e.target.value as "DNI" | "CE")}
                          className="w-full rounded-xl border border-neutral-300 bg-white px-2 py-2 sm:px-3 text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">C.E.</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                          Número de {billingDocType} *
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDocNumber}
                          onChange={(e) => setBillingDocNumber(e.target.value)}
                          placeholder="Ej: 12345678"
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 text-xs font-mono text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                        Nombres y apellidos del titular *
                      </label>
                      <input
                        type="text"
                        required
                        value={billingCustomerName}
                        onChange={(e) => setBillingCustomerName(e.target.value)}
                        placeholder="Ej: Jhosep Colchado"
                        className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  /* Formulario de Factura */
                  <div className="space-y-2.5 sm:space-y-3.5">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="col-span-1">
                        <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                          Tipo
                        </label>
                        <input
                          type="text"
                          disabled
                          value="RUC"
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-2.5 py-2 text-xs font-semibold text-neutral-600"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                          Número de RUC (10 o 20) *
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDocNumber}
                          onChange={(e) => setBillingDocNumber(e.target.value)}
                          placeholder="Ej: 20601234567"
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 text-xs font-mono text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                        Razón Social registrada en SUNAT *
                      </label>
                      <input
                        type="text"
                        required
                        value={billingCustomerName}
                        onChange={(e) => setBillingCustomerName(e.target.value)}
                        placeholder="Ej: TEXTILES Y MODA DEL PERU S.A.C."
                        className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 text-xs uppercase text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                        Domicilio Fiscal en el Perú *
                      </label>
                      <input
                        type="text"
                        required
                        value={billingFiscalAddress}
                        onChange={(e) => setBillingFiscalAddress(e.target.value)}
                        placeholder="Ej: Av. Gamarra 1043, La Victoria, Lima"
                        className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Botones de Navegación del Paso 2 */}
                <div className="pt-2.5 sm:pt-3 border-t border-neutral-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Volver a Entrega</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToStep3}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-2.5 sm:px-6 sm:py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#DC2626]/20 hover:bg-[#B91C1C] active:scale-[0.99] transition-all"
                  >
                    <span>Continuar al método de pago</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            ) : currentStep === 3 ? (
              /* Paso 2 Contraído cuando estamos en el Paso 3 */
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 text-xs">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <Check className="size-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold uppercase tracking-wider text-neutral-900 text-[0.72rem]">
                      2. Comprobante
                    </h3>
                    <p className="text-neutral-700 font-medium">
                      {taxDocumentType === "factura" ? "Factura electrónica" : "Boleta de venta"} —{" "}
                      {billingDocType}: {billingDocNumber} — {billingCustomerName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold text-[#0055FF] hover:bg-neutral-50 transition-colors"
                >
                  Editar
                </button>
              </div>
            ) : (
              /* Paso 2 Inactivo (esperando paso 1) */
              <div className="flex items-center gap-3 opacity-60">
                <div className="flex size-7 items-center justify-center rounded-full border border-neutral-300 text-xs font-bold text-neutral-500">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-700">Comprobante</h3>
                  <p className="text-[0.68rem] text-neutral-400">Boleta de venta o Factura electrónica con RUC</p>
                </div>
              </div>
            )}
          </div>

          {/* ────────────────────────────────────────────────────────────────
              PASO 3: MÉTODO DE PAGO, TARJETA INTERACTIVA Y CONFIRMACIÓN
              ──────────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-6 shadow-2xs transition-all">
            {currentStep === 3 ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="border-b border-neutral-100 pb-2.5 sm:pb-3">
                  <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-neutral-900">
                    <CreditCard className="size-4 sm:size-5 text-[#DC2626]" />
                    <span>3. Método de pago</span>
                  </h2>
                  <p className="mt-0.5 text-[0.68rem] sm:text-xs text-neutral-500">
                    Operaciones seguras con verificación bancaria SSL 256-Bit.
                  </p>
                </div>

                {generalError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-600" />
                    <span>{generalError}</span>
                  </div>
                )}

                {/* Selector de Método de Pago Principal */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {/* Opción 1: Tarjeta Crédito o Débito */}
                  <button
                    type="button"
                    onClick={() => setPaymentType("card")}
                    className={cn(
                      "rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 text-left transition-all relative flex flex-col justify-between",
                      paymentType === "card"
                        ? "border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]"
                        : "border-neutral-200 bg-white hover:border-neutral-300",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                      <CreditCard className={cn("size-4 sm:size-5 shrink-0", paymentType === "card" ? "text-[#DC2626]" : "text-neutral-500")} />
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-bold text-[#0055FF] truncate">
                        Visa / MC / Amex
                      </span>
                    </div>
                    <strong className="text-[0.72rem] sm:text-xs font-extrabold text-neutral-900 block leading-tight">
                      Tarjeta Crédito / Débito
                    </strong>
                    <span className="text-[0.6rem] sm:text-[0.68rem] text-neutral-500 leading-tight mt-0.5 line-clamp-2">
                      Aprobación instantánea
                    </span>
                  </button>

                  {/* Opción 2: Transferencia Bancaria / Yape / Plin */}
                  <button
                    type="button"
                    onClick={() => setPaymentType("transfer")}
                    className={cn(
                      "rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 text-left transition-all relative flex flex-col justify-between",
                      paymentType === "transfer"
                        ? "border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]"
                        : "border-neutral-200 bg-white hover:border-neutral-300",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                      <div className="size-4 sm:size-5 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                        <SiWhatsapp className="size-2.5 sm:size-3" />
                      </div>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-bold text-emerald-700 truncate">
                        0% comisión
                      </span>
                    </div>
                    <strong className="text-[0.72rem] sm:text-xs font-extrabold text-neutral-900 block leading-tight">
                      Transferencia / Yape / Plin
                    </strong>
                    <span className="text-[0.6rem] sm:text-[0.68rem] text-neutral-500 leading-tight mt-0.5 line-clamp-2">
                      BCP, BBVA, Interbank
                    </span>
                  </button>
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    PAGO CON TARJETA (CON TARJETA 3D INTERACTIVA Y SIMULADOR)
                    ══════════════════════════════════════════════════════════════ */}
                {paymentType === "card" && (
                  <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-[#FAF8F5] p-3 sm:p-5 space-y-3.5 sm:space-y-5">
                    {/* Switch de Modo: Simulación vs Mercado Pago Real */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-800">Modo de Pasarela:</span>
                        <div className="inline-flex rounded-lg bg-neutral-200 p-0.5 text-[0.68rem] font-bold">
                          <button
                            type="button"
                            onClick={() => setCardMode("simulation")}
                            className={cn(
                              "rounded-md px-2.5 py-1 transition-all",
                              cardMode === "simulation"
                                ? "bg-white text-neutral-900 shadow-xs"
                                : "text-neutral-600 hover:text-black",
                            )}
                          >
                            🧪 Simulación Bancaria
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardMode("real")}
                            className={cn(
                              "rounded-md px-2.5 py-1 transition-all",
                              cardMode === "real"
                                ? "bg-white text-neutral-900 shadow-xs"
                                : "text-neutral-600 hover:text-black",
                            )}
                          >
                            💳 Mercado Pago (Real)
                          </button>
                        </div>
                      </div>

                      {cardMode === "simulation" && (
                        <button
                          type="button"
                          onClick={() => handleFillTestCard("approve")}
                          className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-[#DC2626] bg-white border border-[#DC2626]/30 px-2.5 py-1 rounded-lg hover:bg-[#DC2626]/5 transition-colors"
                        >
                          <Sparkles className="size-3 text-amber-500" />
                          <span>Llenar tarjeta Visa de prueba</span>
                        </button>
                      )}
                    </div>

                    {cardMode === "real" && !context.paymentConfig.mercadopagoConfigured && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-950 flex items-start gap-2">
                        <Info className="size-4 text-[#0055FF] shrink-0 mt-0.5" />
                        <div>
                          <strong className="block">Listo para Producción con Mercado Pago Perú</strong>
                          <span>
                            Solo debes ingresar tus credenciales oficiales (<code className="font-mono text-[0.68rem] bg-white px-1 py-0.5 rounded border border-blue-200">MERCADOPAGO_ACCESS_TOKEN</code> y <code className="font-mono text-[0.68rem] bg-white px-1 py-0.5 rounded border border-blue-200">NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY</code>) en tu archivo de entorno. Puedes utilizar el Modo Simulación mientras tanto.
                          </span>
                        </div>
                      </div>
                    )}

                    {cardError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0 text-red-600" />
                        <span>{cardError}</span>
                      </div>
                    )}

                    {/* Previsualización 3D de la Tarjeta */}
                    <div className="py-1">
                      <CheckoutCardPreview
                        cardNumber={cardNumber}
                        cardHolder={cardHolder}
                        cardExp={cardExp}
                        cardCvv={cardCvv}
                        isFlipped={isCardFlipped}
                      />
                    </div>

                    {/* Formulario de Datos de Tarjeta */}
                    <div className="space-y-3.5 bg-white p-4 rounded-xl border border-neutral-200">
                      {/* Número de Tarjeta */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Número de Tarjeta *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                            onFocus={() => setIsCardFlipped(false)}
                            placeholder="4557 •••• •••• ••••"
                            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-mono text-neutral-900 tracking-wider focus:border-[#DC2626] focus:outline-none pl-10"
                          />
                          <CreditCard className="size-4 text-neutral-400 absolute left-3.5 top-3" />
                        </div>
                      </div>

                      {/* Nombre del Titular */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Nombre del Titular (tal como figura en la tarjeta) *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          onFocus={() => setIsCardFlipped(false)}
                          placeholder="JHOSEP COLCHADO"
                          className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs uppercase text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                        />
                      </div>

                      {/* Fila: Expiración + CVV + DNI */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-[0.68rem] sm:text-xs font-bold text-neutral-700 mb-1 truncate">
                            Vence *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExp}
                            onChange={(e) => setCardExp(formatExpInput(e.target.value))}
                            onFocus={() => setIsCardFlipped(false)}
                            placeholder="12/28"
                            className="w-full rounded-xl border border-neutral-300 px-2 py-2 sm:px-3.5 sm:py-2.5 text-xs font-mono text-center text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[0.68rem] sm:text-xs font-bold text-neutral-700 mb-1 flex items-center justify-between">
                            <span>CVV *</span>
                            <span className="hidden sm:inline text-[0.62rem] text-neutral-400 font-normal">3 dígitos</span>
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                              onFocus={() => setIsCardFlipped(true)}
                              onBlur={() => setIsCardFlipped(false)}
                              placeholder="123"
                              className="w-full rounded-xl border border-neutral-300 px-2 py-2 sm:px-3.5 sm:py-2.5 text-xs font-mono text-center text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                            />
                            <Lock className="hidden sm:block size-3 text-neutral-400 absolute right-3 top-3.5" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[0.68rem] sm:text-xs font-bold text-neutral-700 mb-1 truncate">
                            DNI Titular *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            value={cardDni}
                            onChange={(e) => setCardDni(e.target.value.replace(/\D/g, ""))}
                            onFocus={() => setIsCardFlipped(false)}
                            placeholder="12345678"
                            className="w-full rounded-xl border border-neutral-300 px-2 py-2 sm:px-3.5 sm:py-2.5 text-xs font-mono text-center text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    PAGO POR TRANSFERENCIA BANCARIA / YAPE / PLIN
                    ══════════════════════════════════════════════════════════════ */}
                {paymentType === "transfer" && (
                  <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-[#FAF8F5] p-3 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="border-b border-neutral-200 pb-2">
                      <span className="font-extrabold text-xs text-neutral-900 block">
                        Cuentas Oficiales de American Colt JEANS S.A.C.
                      </span>
                      <p className="text-[0.65rem] sm:text-[0.68rem] text-neutral-500">
                        Transfiere el monto exacto de {formatPEN(taxBreakdown.totalAmount)} y registra tu operación.
                      </p>
                    </div>

                    {/* Cuentas en Rejilla */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 text-[0.68rem] sm:text-xs">
                      {/* Yape / Plin */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 sm:p-3 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-emerald-950 font-extrabold truncate">Yape / Plin</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(OFFICIAL_WHATSAPP_DISPLAY, "yape")}
                            className="text-[0.6rem] sm:text-[0.65rem] font-bold text-emerald-800 hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            {copiedAccount === "yape" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                            <span>{copiedAccount === "yape" ? "Listo" : "Copiar"}</span>
                          </button>
                        </div>
                        <p className="font-mono font-black text-xs sm:text-sm text-emerald-900 break-all">{OFFICIAL_WHATSAPP_DISPLAY}</p>
                        <p className="text-[0.58rem] sm:text-[0.65rem] text-emerald-800 line-clamp-1">American Colt JEANS</p>
                      </div>

                      {/* BCP */}
                      <div className="rounded-xl border border-neutral-200 bg-white p-2.5 sm:p-3 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-neutral-900 font-extrabold truncate">BCP</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount("191-94829104-0-32", "bcp")}
                            className="text-[0.6rem] sm:text-[0.65rem] font-bold text-[#0055FF] hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            {copiedAccount === "bcp" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                            <span>{copiedAccount === "bcp" ? "Listo" : "Copiar"}</span>
                          </button>
                        </div>
                        <p className="font-mono font-bold text-[0.65rem] sm:text-xs text-neutral-800 break-all">191-94829104-0-32</p>
                        <p className="font-mono text-[0.56rem] sm:text-[0.65rem] text-neutral-500 break-all">CCI: 002-191009482910403254</p>
                      </div>

                      {/* BBVA */}
                      <div className="rounded-xl border border-neutral-200 bg-white p-2.5 sm:p-3 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-neutral-900 font-extrabold truncate">BBVA Perú</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount("0011-0175-0100049281", "bbva")}
                            className="text-[0.6rem] sm:text-[0.65rem] font-bold text-[#0055FF] hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            {copiedAccount === "bbva" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                            <span>{copiedAccount === "bbva" ? "Listo" : "Copiar"}</span>
                          </button>
                        </div>
                        <p className="font-mono font-bold text-[0.65rem] sm:text-xs text-neutral-800 break-all">0011-0175-0100049281</p>
                        <p className="font-mono text-[0.56rem] sm:text-[0.65rem] text-neutral-500 break-all">CCI: 011-17500010004928173</p>
                      </div>

                      {/* Interbank */}
                      <div className="rounded-xl border border-neutral-200 bg-white p-2.5 sm:p-3 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-neutral-900 font-extrabold truncate">Interbank</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount("200-3001849201", "interbank")}
                            className="text-[0.6rem] sm:text-[0.65rem] font-bold text-[#0055FF] hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            {copiedAccount === "interbank" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                            <span>{copiedAccount === "interbank" ? "Listo" : "Copiar"}</span>
                          </button>
                        </div>
                        <p className="font-mono font-bold text-[0.65rem] sm:text-xs text-neutral-800 break-all">200-3001849201</p>
                        <p className="font-mono text-[0.56rem] sm:text-[0.65rem] text-neutral-500 break-all">CCI: 003-20000300184920188</p>
                      </div>
                    </div>

                    {/* Inputs de Operación y Voucher */}
                    <div className="space-y-2.5 sm:space-y-3 pt-1.5 bg-white p-3 sm:p-4 rounded-xl border border-neutral-200">
                      <div>
                        <label className="block text-[0.7rem] sm:text-xs font-bold text-neutral-700 mb-1">
                          Número o Código de Operación del Voucher *
                        </label>
                        <input
                          type="text"
                          required
                          value={operationCode}
                          onChange={(e) => setOperationCode(e.target.value)}
                          placeholder="Ej: 849201 ó OP-948291"
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-mono text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                        />
                      </div>

                      {/* Adjuntar Foto del Comprobante / Voucher */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Foto del Comprobante o Voucher (Opcional para agilizar despacho)
                        </label>
                        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 p-4 text-center cursor-pointer hover:border-[#DC2626] bg-neutral-50 transition-colors">
                          <UploadCloud className="size-6 text-neutral-400 mb-1" />
                          <span className="text-xs font-bold text-neutral-700">
                            {voucherFileName ?? "Haz clic para subir foto del voucher"}
                          </span>
                          <span className="text-[0.65rem] text-neutral-400 mt-0.5">
                            Formatos soportados: JPG, PNG o WEBP
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleVoucherFileChange}
                            className="hidden"
                          />
                        </label>

                        {voucherPreviewUrl && (
                          <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs">
                            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                              <Check className="size-3.5 text-emerald-600" />
                              Voucher adjunto listo para enviar
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setVoucherPreviewUrl(null);
                                setVoucherFileName(null);
                              }}
                              className="text-[0.68rem] text-red-600 hover:underline"
                            >
                              Quitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notas o Instrucciones Adicionales */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Notas o instrucciones adicionales del pedido (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Indicaciones especiales de horario, empaque o referencia adicional..."
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 focus:border-[#DC2626] focus:outline-none"
                  />
                </div>

                {/* Botones de Navegación del Paso 3 */}
                <div className="pt-2.5 sm:pt-3 border-t border-neutral-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Volver a Comprobante</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={isPending || isProcessingPayment}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 py-3 sm:px-8 sm:py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#DC2626]/25 hover:bg-[#B91C1C] active:scale-[0.99] disabled:opacity-50 transition-all"
                  >
                    {isPending || isProcessingPayment ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Procesando pago seguro...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        <span>
                          {paymentType === "card"
                            ? `Pagar con Tarjeta (${formatPEN(taxBreakdown.totalAmount)})`
                            : `Confirmar Pedido (${formatPEN(taxBreakdown.totalAmount)})`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Paso 3 Inactivo */
              <div className="flex items-center gap-3 opacity-60">
                <div className="flex size-7 items-center justify-center rounded-full border border-neutral-300 text-xs font-bold text-neutral-500">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-700">Método de pago</h3>
                  <p className="text-[0.68rem] text-neutral-400">Tarjeta de crédito / débito o transferencia bancaria / Yape</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            COLUMNA DERECHA: RESUMEN DEL PEDIDO CON PRENDAS Y CÁLCULOS
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 sm:pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-neutral-900">
                  Resumen del pedido
                </h2>
                <span className="font-mono text-[0.6rem] sm:text-[0.62rem] font-bold uppercase tracking-wider text-neutral-500">
                  {context.orderMode === "wholesale" ? "MODALIDAD: MAYORISTA B2B" : "MODALIDAD: MINORISTA B2C"}
                </span>
              </div>

              <Link
                href="/catalogo"
                className="text-[0.72rem] sm:text-xs font-bold text-[#0055FF] hover:underline shrink-0"
              >
                ✏️ Editar bolsa
              </Link>
            </div>

            {/* Lista de Prendas en el Checkout */}
            <div className="max-h-64 sm:max-h-80 overflow-y-auto divide-y divide-neutral-100 pr-1 no-scrollbar">
              {context.lines.map((line) => (
                <div key={line.variantId} className="flex gap-2.5 sm:gap-3 py-2 sm:py-3 items-center">
                  <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                    <Image
                      src={line.imageUrl}
                      alt={line.productName}
                      fill
                      unoptimized={line.imageUrl.startsWith("/api/media/")}
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <strong className="text-[0.74rem] sm:text-xs font-bold text-neutral-900 line-clamp-1">
                      {line.productName}
                    </strong>
                    <div className="font-mono text-[0.6rem] sm:text-[0.65rem] text-neutral-500 line-clamp-1">
                      SKU: {line.sku} {line.colorName ? `· ${line.colorName}` : ""} {line.size ? `· Talla ${line.size}` : ""}
                    </div>
                    <div className="text-[0.68rem] sm:text-[0.72rem] text-neutral-700 font-semibold mt-0.5">
                      {line.quantity} × {formatPEN(line.effectiveUnitAmount)}
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[0.74rem] sm:text-xs font-extrabold text-neutral-900">
                    {formatPEN(line.lineSubtotalAmount)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desglose de Totales */}
            <div className="border-t border-neutral-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal de prendas ({context.totalUnits} {context.totalUnits === 1 ? "ud." : "uds."})</span>
                <span className="font-mono font-bold text-neutral-900">
                  {formatPEN(context.subtotalAfterDiscountAmount)}
                </span>
              </div>

              {context.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Descuento aplicado</span>
                  <span className="font-mono">-{formatPEN(context.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>
                  Costo de envío ({deliveryMethod === "store_pickup" ? "Recojo en Tienda Oficial" : shippingCalc.zoneName})
                </span>
                <span className="font-mono font-bold text-neutral-900">
                  {shippingCalc.isFreeShippingApplied ? (
                    <span className="text-emerald-700 font-extrabold">Gratis</span>
                  ) : (
                    formatPEN(shippingCalc.shippingAmount)
                  )}
                </span>
              </div>

              <div className="border-t border-neutral-200/80 pt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-extrabold text-neutral-900 block">
                    Total a pagar (PEN)
                  </span>
                  <span className="text-[0.68rem] text-neutral-400 block">
                    Incluye IGV (18%): {formatPEN(taxBreakdown.igvAmount)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-neutral-900 font-mono">
                    {formatPEN(taxBreakdown.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer de Ayuda y Soporte con WhatsApp Oficial Actualizado */}
            <div className="border-t border-neutral-100 pt-3 text-center">
              <a
                href={`https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  "Hola American Colt JEANS™, tengo una consulta con mi compra.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
              >
                <HelpCircle className="size-3.5 text-[#0055FF]" />
                <span>¿Necesitas ayuda? Escríbenos por WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL DE SELECCIÓN DE TIENDAS OFICIALES ─── */}
      {isStoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 sm:pb-3">
              <div className="flex items-center gap-2">
                <Store className="size-4 sm:size-5 text-[#DC2626] shrink-0" />
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                  Selecciona Tienda de Recojo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="size-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Elige en cuál de nuestras tiendas oficiales en el Perú deseas retirar tus prendas de forma gratuita.
            </p>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {activeStores.map((st) => {
                const isSelected = selectedStoreId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelectedStoreId(st.id);
                      setIsStoreModalOpen(false);
                      void triggerShippingQuote(
                        st.department,
                        st.province,
                        st.district,
                        "store_pickup",
                        st.id,
                      );
                    }}
                    className={cn(
                      "rounded-2xl border p-4 cursor-pointer transition-all hover:border-[#DC2626]",
                      isSelected
                        ? "border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]"
                        : "border-neutral-200 bg-white",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-xs font-extrabold text-neutral-900">
                        {st.name}
                      </strong>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-[#DC2626]">
                          <Check className="size-3.5" />
                          Seleccionada
                        </span>
                      ) : (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[0.62rem] font-semibold text-neutral-600">
                          {st.district}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-700 flex items-start gap-1.5">
                      <MapPin className="size-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                      <span>{st.address} ({st.district}, {st.department})</span>
                    </p>

                    {st.reference && (
                      <p className="text-[0.68rem] text-neutral-500 pl-5 mt-0.5 italic">
                        Ref: {st.reference}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[0.68rem] text-neutral-500 pl-5 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-neutral-400" />
                        {st.openingHours}
                      </span>
                      {st.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3 text-neutral-400" />
                          {st.phone}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="rounded-xl border border-neutral-300 bg-neutral-900 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ANIMACIÓN FORMAL DE PROCESAMIENTO DE PAGO ─── */}
      <CheckoutPaymentProcessing
        isOpen={isProcessingPayment}
        paymentMethod={paymentType}
        cardBrand={detectCardBrand(cardNumber).toUpperCase()}
        maskedLast4={cardNumber.replace(/\D/g, "").slice(-4) || "4557"}
      />
    </div>
  );
}
