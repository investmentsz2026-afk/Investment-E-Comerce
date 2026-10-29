import { asc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { orders, orderItems, taxDocuments, auditLogs } from "@/server/db/schema";
import { validateRucFormat, type ValidationResult } from "@/server/auth/validators";
import { sendTaxDocumentAvailableEmail } from "@/server/email";

export type TaxDocumentType = "boleta" | "factura";
export type TaxDocumentStatus =
  | "pending_config"
  | "pending_submission"
  | "issued"
  | "error"
  | "voided";

export interface BillingInput {
  documentType: TaxDocumentType;
  customerDocType: "DNI" | "CE" | "RUC";
  customerDocNumber: string;
  customerLegalName: string;
  customerFiscalAddress?: string | null;
}

export interface TaxDocumentItemLineInput {
  sku: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineSubtotalCents: number;
}

/**
 * Calcula el desglose oficial de IGV (18%) en el Perú a partir de un total en céntimos de PEN
 * que ya incluye el impuesto (convención de precios minoristas y mayoristas de INVESTMENTS).
 *
 * Fórmula:
 * - Base imponible = Math.round(totalCents / 1.18)
 * - IGV (18%) = totalCents - Base imponible
 * Garantiza siempre que `taxableBaseAmount + igvAmount === totalCents` sin pérdida de céntimos.
 */
export function calculatePeruIgvBreakdown(totalCents: number): {
  taxableBaseAmount: number;
  igvAmount: number;
  totalAmount: number;
} {
  const safeTotal = Math.max(0, Math.trunc(totalCents));
  const taxableBaseAmount = Math.round(safeTotal / 1.18);
  const igvAmount = safeTotal - taxableBaseAmount;
  return {
    taxableBaseAmount,
    igvAmount,
    totalAmount: safeTotal,
  };
}

/**
 * Valida los datos tributarios para emisión de Boleta de Venta o Factura Electrónica en Perú.
 * - Boleta: requiere DNI (8 dígitos) o Carnet de Extranjería / Pasaporte (6 a 12 caracteres) y nombre completo.
 * - Factura: exige obligatoriamente RUC peruano válido de 11 dígitos (10, 20, 15 o 17), Razón Social y Domicilio Fiscal.
 */
export function validateBillingInput(input: BillingInput): ValidationResult {
  const docNum = (input.customerDocNumber ?? "").trim();
  const legalName = (input.customerLegalName ?? "").trim();
  const fiscalAddr = (input.customerFiscalAddress ?? "").trim();

  if (!legalName || legalName.length < 3) {
    return {
      valid: false,
      error:
        input.documentType === "factura"
          ? "La razón social es obligatoria para emitir Factura Electrónica."
          : "El nombre completo del titular es obligatorio para la Boleta de Venta.",
    };
  }

  if (input.documentType === "factura") {
    if (input.customerDocType !== "RUC") {
      return {
        valid: false,
        error: "Para solicitar Factura Electrónica el tipo de documento debe ser RUC.",
      };
    }
    const rucCheck = validateRucFormat(docNum);
    if (!rucCheck.valid) {
      return rucCheck;
    }
    if (!fiscalAddr || fiscalAddr.length < 5) {
      return {
        valid: false,
        error: "El domicilio fiscal es obligatorio para emitir Factura Electrónica.",
      };
    }
    return { valid: true };
  }

  // Boleta de Venta
  if (input.customerDocType === "DNI") {
    if (!/^\d{8}$/.test(docNum)) {
      return {
        valid: false,
        error: "El número de DNI para Boleta de Venta debe tener exactamente 8 dígitos numéricos.",
      };
    }
    return { valid: true };
  }

  if (input.customerDocType === "CE") {
    if (!/^[A-Za-z0-9]{6,12}$/.test(docNum)) {
      return {
        valid: false,
        error: "El Carnet de Extranjería debe contener entre 6 y 12 caracteres alfanuméricos.",
      };
    }
    return { valid: true };
  }

  if (input.customerDocType === "RUC") {
    return validateRucFormat(docNum);
  }

  return { valid: false, error: "Tipo de documento de identidad no reconocido." };
}

/**
 * Convierte el tipo de documento de identidad de INVESTMENTS al código oficial del Catálogo N° 06 de SUNAT / Nubefact:
 * - "6" = RUC (Registro Único de Contribuyentes)
 * - "1" = DNI (Documento Nacional de Identidad)
 * - "4" = Carnet de Extranjería
 */
export function mapSunatCatalog06DocType(docType: "DNI" | "CE" | "RUC" | string): "1" | "4" | "6" {
  if (docType === "RUC") return "6";
  if (docType === "CE") return "4";
  return "1";
}

export interface SunatProviderConfig {
  enabled: boolean;
  environment: "sandbox" | "production";
  configured: boolean;
  readyToIssue: boolean;
  providerName: string;
  apiUrl: string | null;
  apiToken: string | null;
  serieBoleta: string | null;
  serieFactura: string | null;
  missingVariables: string[];
}

/**
 * Inspecciona la configuración del proveedor PSE/OSE de facturación electrónica SUNAT.
 * Nunca expone el valor de `SUNAT_PSE_API_TOKEN` hacia clientes ni logs públicos.
 *
 * Para emitir comprobantes oficiales se requiere:
 * 1. `SUNAT_PSE_ENABLED=true` (activación explícita de seguridad)
 * 2. `SUNAT_PSE_API_URL` y `SUNAT_PSE_API_TOKEN`
 * 3. `SUNAT_PSE_SERIE_BOLETA` y `SUNAT_PSE_SERIE_FACTURA` (nunca se inventan series por defecto en producción)
 */
export function getSunatProviderConfig(): SunatProviderConfig {
  const enabledFlag = process.env.SUNAT_PSE_ENABLED?.trim().toLowerCase() === "true";
  const envRaw = process.env.SUNAT_PSE_ENV?.trim().toLowerCase();
  const environment: "sandbox" | "production" =
    envRaw === "production" ? "production" : "sandbox";

  const apiUrl = process.env.SUNAT_PSE_API_URL?.trim() || null;
  const apiToken = process.env.SUNAT_PSE_API_TOKEN?.trim() || null;
  const providerName =
    process.env.SUNAT_PSE_PROVIDER_NAME?.trim() || "Nubefact PSE/OSE";
  const serieBoleta = process.env.SUNAT_PSE_SERIE_BOLETA?.trim() || null;
  const serieFactura = process.env.SUNAT_PSE_SERIE_FACTURA?.trim() || null;

  const missingVariables: string[] = [];
  if (!enabledFlag) missingVariables.push("SUNAT_PSE_ENABLED=true");
  if (!apiUrl) missingVariables.push("SUNAT_PSE_API_URL");
  if (!apiToken) missingVariables.push("SUNAT_PSE_API_TOKEN");
  if (!serieBoleta) missingVariables.push("SUNAT_PSE_SERIE_BOLETA");
  if (!serieFactura) missingVariables.push("SUNAT_PSE_SERIE_FACTURA");

  const configured = Boolean(apiUrl && apiToken && serieBoleta && serieFactura);
  const readyToIssue = Boolean(enabledFlag && configured);

  return {
    enabled: enabledFlag,
    environment,
    configured,
    readyToIssue,
    providerName,
    apiUrl,
    apiToken,
    serieBoleta,
    serieFactura,
    missingVariables,
  };
}

export interface NubefactItemPayload {
  unidad_de_medida: "NIU" | "ZZ";
  codigo: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  precio_unitario: number;
  descuento: string;
  subtotal: number;
  tipo_de_igv: 1;
  igv: number;
  total: number;
  anticipo_regularizacion: false;
}

export interface NubefactGenerarComprobantePayload {
  operacion: "generar_comprobante";
  tipo_de_comprobante: 1 | 2;
  serie: string;
  numero?: number;
  sunat_transaction: 1;
  cliente_tipo_de_documento: "1" | "4" | "6";
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion: string;
  cliente_email: string;
  fecha_de_emision: string;
  moneda: 1;
  porcentaje_de_igv: 18.0;
  total_gravada: number;
  total_igv: number;
  total: number;
  enviar_automaticamente_a_la_sunat: boolean;
  enviar_automaticamente_al_cliente: boolean;
  codigo_unico: string;
  observaciones: string;
  items: NubefactItemPayload[];
}

/**
 * Construye el payload JSON oficial compatible con el estándar PSE/OSE de Nubefact (`generar_comprobante`),
 * incluyendo el detalle de ítems gravados (Catálogo SUNAT: `unidad_de_medida: "NIU"`, `tipo_de_igv: 1`, `moneda: 1` PEN)
 * y agregando una línea de despacho logístico si el pedido incluye costo de envío (`shippingAmountCents > 0`).
 * Función pura exportada también para pruebas unitarias deterministas.
 */
export function buildNubefactComprobantePayload(params: {
  orderNumber: string;
  documentType: TaxDocumentType;
  serie: string;
  correlativeNumber?: number | null;
  customerDocType: "DNI" | "CE" | "RUC";
  customerDocNumber: string;
  customerLegalName: string;
  customerFiscalAddress?: string | null;
  customerEmail?: string | null;
  taxableAmountCents: number;
  igvAmountCents: number;
  totalAmountCents: number;
  shippingAmountCents?: number;
  items: TaxDocumentItemLineInput[];
  issueDate?: Date;
}): NubefactGenerarComprobantePayload {
  const dateObj = params.issueDate ?? new Date();
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  const fechaEmision = `${dd}-${mm}-${yyyy}`;

  const nubefactItems: NubefactItemPayload[] = params.items.map((line) => {
    const qty = Math.max(1, Math.trunc(line.quantity));
    const unitPriceSoles = Number((line.unitPriceCents / 100).toFixed(2));
    const unitBaseValue = Number((unitPriceSoles / 1.18).toFixed(6));
    const lineTotalSoles = Number((line.lineSubtotalCents / 100).toFixed(2));
    const lineSubtotalBase = Number((lineTotalSoles / 1.18).toFixed(2));
    const lineIgv = Number((lineTotalSoles - lineSubtotalBase).toFixed(2));

    return {
      unidad_de_medida: "NIU",
      codigo: line.sku.slice(0, 50),
      descripcion: line.description.slice(0, 250),
      cantidad: qty,
      valor_unitario: unitBaseValue,
      precio_unitario: unitPriceSoles,
      descuento: "",
      subtotal: lineSubtotalBase,
      tipo_de_igv: 1,
      igv: lineIgv,
      total: lineTotalSoles,
      anticipo_regularizacion: false,
    };
  });

  if (params.shippingAmountCents && params.shippingAmountCents > 0) {
    const shipTotalSoles = Number((params.shippingAmountCents / 100).toFixed(2));
    const shipSubtotalBase = Number((shipTotalSoles / 1.18).toFixed(2));
    const shipIgv = Number((shipTotalSoles - shipSubtotalBase).toFixed(2));
    const shipUnitBase = Number((shipTotalSoles / 1.18).toFixed(6));

    nubefactItems.push({
      unidad_de_medida: "ZZ",
      codigo: "ENVIO-LOG",
      descripcion: "Servicio de despacho y entrega logística",
      cantidad: 1,
      valor_unitario: shipUnitBase,
      precio_unitario: shipTotalSoles,
      descuento: "",
      subtotal: shipSubtotalBase,
      tipo_de_igv: 1,
      igv: shipIgv,
      total: shipTotalSoles,
      anticipo_regularizacion: false,
    });
  }

  const payload: NubefactGenerarComprobantePayload = {
    operacion: "generar_comprobante",
    tipo_de_comprobante: params.documentType === "factura" ? 1 : 2,
    serie: params.serie.trim().toUpperCase(),
    ...(params.correlativeNumber && params.correlativeNumber > 0
      ? { numero: params.correlativeNumber }
      : {}),
    sunat_transaction: 1,
    cliente_tipo_de_documento: mapSunatCatalog06DocType(params.customerDocType),
    cliente_numero_de_documento: params.customerDocNumber.trim(),
    cliente_denominacion: params.customerLegalName.trim(),
    cliente_direccion: (params.customerFiscalAddress ?? "").trim(),
    cliente_email: (params.customerEmail ?? "").trim(),
    fecha_de_emision: fechaEmision,
    moneda: 1,
    porcentaje_de_igv: 18.0,
    total_gravada: Number((params.taxableAmountCents / 100).toFixed(2)),
    total_igv: Number((params.igvAmountCents / 100).toFixed(2)),
    total: Number((params.totalAmountCents / 100).toFixed(2)),
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: Boolean(params.customerEmail),
    codigo_unico: params.orderNumber,
    observaciones: `Pedido INVESTMENTS ${params.orderNumber}`,
    items: nubefactItems,
  };

  return payload;
}

/**
 * Construye el payload JSON para consultar el estado de un comprobante ya enviado al PSE/OSE (`consultar_comprobante`).
 */
export function buildNubefactStatusQueryPayload(params: {
  documentType: TaxDocumentType;
  serie: string;
  correlativeNumber: number | string;
}): {
  operacion: "consultar_comprobante";
  tipo_de_comprobante: 1 | 2;
  serie: string;
  numero: number;
} {
  return {
    operacion: "consultar_comprobante",
    tipo_de_comprobante: params.documentType === "factura" ? 1 : 2,
    serie: params.serie.trim().toUpperCase(),
    numero: Math.max(1, Number(params.correlativeNumber) || 1),
  };
}

/**
 * Registra o intenta emitir el comprobante tributario electrónico asociado a un pedido.
 *
 * Reglas estrictas (Módulo 9 y Auditoría de Cierre Fase 5):
 * - Nunca inventa series (`B001`, `F001`), numeración correlativa, hash CPE ni respuestas CDR de SUNAT.
 * - Garantiza unicidad por pedido (`uniqueIndex("tax_documents_order_unique_idx")`): nunca emite dos comprobantes para la misma operación.
 * - Si `SUNAT_PSE_ENABLED !== "true"` o faltan credenciales (`SUNAT_PSE_API_URL`, `SUNAT_PSE_API_TOKEN`, `SUNAT_PSE_SERIE_*`),
 *   conserva el registro en estado `pending_config` explicando qué variables faltan configurar.
 * - Si el proveedor está configurado y habilitado pero el pedido aún no está pagado, registra `pending_submission`.
 * - Cuando el pedido está pagado y `readyToIssue === true`, transmite el payload completo con líneas (`items`) al PSE/OSE.
 */
export async function ensureOrIssueTaxDocumentForOrder(params: {
  orderId: number;
  orderNumber: string;
  isOrderPaid: boolean;
  billing: BillingInput;
  taxableAmount: number;
  igvAmount: number;
  totalAmount: number;
  actorId?: number | null;
  baseUrl?: string;
}): Promise<{
  id: number;
  status: TaxDocumentStatus;
  series: string | null;
  correlativeNumber: string | null;
  providerResponseSummary: string | null;
}> {
  const db = getDb();
  const now = new Date();
  const config = getSunatProviderConfig();

  const existingRows = await db
    .select()
    .from(taxDocuments)
    .where(eq(taxDocuments.orderId, params.orderId))
    .limit(1);

  let doc = existingRows[0];

  if (!doc) {
    const initialStatus: TaxDocumentStatus = config.readyToIssue
      ? "pending_submission"
      : "pending_config";

    const initialSummary = config.readyToIssue
      ? `Comprobante registrado y en cola para transmisión a ${config.providerName} (${config.environment}) cuando el pago esté confirmado.`
      : `Emisión oficial ante SUNAT pendiente de activación/credenciales del PSE/OSE (${config.missingVariables.join(", ")}). No se generan series ni numeraciones simuladas.`;

    const [created] = await db
      .insert(taxDocuments)
      .values({
        orderId: params.orderId,
        documentType: params.billing.documentType,
        status: initialStatus,
        customerDocType: params.billing.customerDocType,
        customerDocNumber: params.billing.customerDocNumber.trim(),
        customerLegalName: params.billing.customerLegalName.trim(),
        customerFiscalAddress: params.billing.customerFiscalAddress?.trim() || null,
        currency: "PEN",
        taxableAmount: params.taxableAmount,
        igvAmount: params.igvAmount,
        totalAmount: params.totalAmount,
        series: null,
        correlativeNumber: null,
        providerName: config.readyToIssue ? config.providerName : null,
        providerResponseSummary: initialSummary,
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    doc = created;
  }

  // Si ya fue emitido anteriormente, retornar de inmediato (idempotencia tributaria)
  if (doc.status === "issued") {
    return {
      id: doc.id,
      status: doc.status,
      series: doc.series,
      correlativeNumber: doc.correlativeNumber,
      providerResponseSummary: doc.providerResponseSummary,
    };
  }

  const targetSerie =
    doc.documentType === "factura" ? config.serieFactura : config.serieBoleta;

  // Si el pedido aún no está pagado o el adaptador PSE no está habilitado/configurado, no transmitimos a SUNAT
  if (
    !params.isOrderPaid ||
    !config.readyToIssue ||
    !config.apiUrl ||
    !config.apiToken ||
    !targetSerie
  ) {
    const nextStatus: TaxDocumentStatus = config.readyToIssue
      ? "pending_submission"
      : "pending_config";
    const summary = !config.readyToIssue
      ? `Pendiente de configuración externa del proveedor PSE/OSE (${config.missingVariables.join(", ")}). No se inventan series ni correlativos.`
      : "Esperando confirmación definitiva de pago para transmitir al PSE/OSE.";

    if (doc.status !== nextStatus || doc.providerResponseSummary !== summary) {
      await db
        .update(taxDocuments)
        .set({
          status: nextStatus,
          providerResponseSummary: summary,
          updatedAt: now,
        })
        .where(eq(taxDocuments.id, doc.id));
    }

    return {
      id: doc.id,
      status: nextStatus,
      series: null,
      correlativeNumber: null,
      providerResponseSummary: summary,
    };
  }

  // Cargar líneas históricas del pedido y datos del cliente para armar el comprobante electrónico completo
  const [orderRowRows, orderLineRows] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, params.orderId)).limit(1),
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, params.orderId))
      .orderBy(asc(orderItems.id)),
  ]);

  const orderRow = orderRowRows[0];
  const itemInputs: TaxDocumentItemLineInput[] =
    orderLineRows.length > 0
      ? orderLineRows.map((item) => ({
          sku: item.skuSnapshot,
          description: `${item.productNameSnapshot}${item.colorNameSnapshot ? ` - ${item.colorNameSnapshot}` : ""}${item.sizeSnapshot ? ` Talla ${item.sizeSnapshot}` : ""}`,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceSnapshot,
          lineSubtotalCents: item.lineSubtotalAmount,
        }))
      : [
          {
            sku: `ORD-${params.orderNumber}`,
            description: `Prendas correspondientes al pedido ${params.orderNumber}`,
            quantity: 1,
            unitPriceCents: doc.totalAmount,
            lineSubtotalCents: doc.totalAmount,
          },
        ];

  const nubefactPayload = buildNubefactComprobantePayload({
    orderNumber: params.orderNumber,
    documentType: doc.documentType,
    serie: targetSerie,
    customerDocType: (doc.customerDocType as "DNI" | "CE" | "RUC") || "DNI",
    customerDocNumber: doc.customerDocNumber,
    customerLegalName: doc.customerLegalName,
    customerFiscalAddress: doc.customerFiscalAddress,
    customerEmail: orderRow?.customerEmailSnapshot ?? null,
    taxableAmountCents: doc.taxableAmount,
    igvAmountCents: doc.igvAmount,
    totalAmountCents: doc.totalAmount,
    shippingAmountCents: orderRow?.shippingAmount ?? 0,
    items: itemInputs,
    issueDate: now,
  });

  // Invocación real al adaptador PSE/OSE cuando las credenciales y SUNAT_PSE_ENABLED=true están presentes
  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nubefactPayload),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errBody = await response.text();
      const errMsg = `PSE HTTP ${response.status}: ${errBody.slice(0, 250)}`;
      await db
        .update(taxDocuments)
        .set({
          status: "error",
          errorMessage: errMsg,
          attemptCount: doc.attemptCount + 1,
          updatedAt: now,
        })
        .where(eq(taxDocuments.id, doc.id));

      return {
        id: doc.id,
        status: "error",
        series: null,
        correlativeNumber: null,
        providerResponseSummary: errMsg,
      };
    }

    const data = (await response.json()) as {
      errors?: string;
      serie?: string;
      numero?: string | number;
      codigo_hash?: string;
      enlace_del_pdf?: string;
      enlace_del_xml?: string;
      enlace_del_cdr?: string;
      external_id?: string;
      aceptada_por_sunat?: boolean;
      sunat_description?: string;
    };

    if (data.errors) {
      const errMsg = `Rechazo PSE/OSE: ${String(data.errors).slice(0, 250)}`;
      await db
        .update(taxDocuments)
        .set({
          status: "error",
          errorMessage: errMsg,
          attemptCount: doc.attemptCount + 1,
          updatedAt: now,
        })
        .where(eq(taxDocuments.id, doc.id));

      return {
        id: doc.id,
        status: "error",
        series: null,
        correlativeNumber: null,
        providerResponseSummary: errMsg,
      };
    }

    const series = data.serie ? String(data.serie).slice(0, 12) : targetSerie.slice(0, 12);
    const correlative = data.numero !== undefined ? String(data.numero).slice(0, 24) : null;
    const summary =
      data.sunat_description ??
      `Comprobante electrónico emitido por ${config.providerName} (${config.environment}).`;

    await db
      .update(taxDocuments)
      .set({
        status: "issued",
        series,
        correlativeNumber: correlative,
        providerName: config.providerName,
        providerExternalId: data.external_id ?? null,
        sunatHash: data.codigo_hash ?? null,
        pdfUrl: data.enlace_del_pdf ?? null,
        xmlUrl: data.enlace_del_xml ?? null,
        cdrUrl: data.enlace_del_cdr ?? null,
        providerResponseSummary: summary,
        errorMessage: null,
        attemptCount: doc.attemptCount + 1,
        issuedAt: now,
        updatedAt: now,
      })
      .where(eq(taxDocuments.id, doc.id));

    await db.insert(auditLogs).values({
      actorId: params.actorId ?? null,
      action: "tax_document_event",
      targetType: "order",
      targetId: params.orderId,
      details: `Comprobante ${doc.documentType.toUpperCase()} emitido vía ${config.providerName}: ${series ?? ""}-${correlative ?? ""}`,
    });

    if (orderRow && series && correlative) {
      const baseUrl =
        params.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      sendTaxDocumentAvailableEmail({
        to: orderRow.customerEmailSnapshot,
        customerName: orderRow.customerFirstNameSnapshot,
        orderNumber: params.orderNumber,
        documentType: doc.documentType,
        seriesAndNumber: `${series}-${correlative}`,
        totalAmountCents: doc.totalAmount,
        pdfUrl: data.enlace_del_pdf ?? null,
        xmlUrl: data.enlace_del_xml ?? null,
        baseUrl,
        orderId: params.orderId,
      }).catch((e) =>
        console.error("[Tax] Error al enviar correo de comprobante disponible:", e),
      );
    }

    return {
      id: doc.id,
      status: "issued",
      series,
      correlativeNumber: correlative,
      providerResponseSummary: summary,
    };
  } catch (err) {
    const errMsg = `Error de red al conectar con PSE/OSE: ${String(err).slice(0, 200)}`;
    await db
      .update(taxDocuments)
      .set({
        status: "error",
        errorMessage: errMsg,
        attemptCount: doc.attemptCount + 1,
        updatedAt: now,
      })
      .where(eq(taxDocuments.id, doc.id));

    return {
      id: doc.id,
      status: "error",
      series: null,
      correlativeNumber: null,
      providerResponseSummary: errMsg,
    };
  }
}

/**
 * Permite consultar el estado de un comprobante ya numerado ante el PSE/OSE (`consultar_comprobante`)
 * sin volver a timbrar ni duplicar numeración.
 */
export async function querySunatDocumentStatusForOrder(params: {
  orderId: number;
  actorId?: number | null;
}): Promise<{
  ok: boolean;
  status: TaxDocumentStatus;
  message: string;
}> {
  const config = getSunatProviderConfig();
  if (!config.readyToIssue || !config.apiUrl || !config.apiToken) {
    return {
      ok: false,
      status: "pending_config",
      message: `El proveedor PSE/OSE no está habilitado o faltan variables (${config.missingVariables.join(", ")}).`,
    };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(taxDocuments)
    .where(eq(taxDocuments.orderId, params.orderId))
    .limit(1);

  if (rows.length === 0) {
    return {
      ok: false,
      status: "pending_config",
      message: "No existe registro tributario para este pedido.",
    };
  }

  const doc = rows[0];
  if (!doc.series || !doc.correlativeNumber) {
    return {
      ok: false,
      status: doc.status,
      message:
        "El comprobante aún no cuenta con serie y número asignados; utiliza la acción de emitir/reintentar transmisión.",
    };
  }

  const queryPayload = buildNubefactStatusQueryPayload({
    documentType: doc.documentType,
    serie: doc.series,
    correlativeNumber: doc.correlativeNumber,
  });

  try {
    const res = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        status: doc.status,
        message: `Error HTTP ${res.status} al consultar comprobante en PSE/OSE: ${text.slice(0, 180)}`,
      };
    }

    const data = (await res.json()) as {
      aceptada_por_sunat?: boolean;
      sunat_description?: string;
      enlace_del_pdf?: string;
      enlace_del_xml?: string;
      enlace_del_cdr?: string;
      codigo_hash?: string;
    };

    const summary =
      data.sunat_description ??
      (data.aceptada_por_sunat
        ? "Aceptado oficialmente por SUNAT."
        : "En proceso de validación por SUNAT.");

    await db
      .update(taxDocuments)
      .set({
        status: "issued",
        sunatHash: data.codigo_hash ?? doc.sunatHash,
        pdfUrl: data.enlace_del_pdf ?? doc.pdfUrl,
        xmlUrl: data.enlace_del_xml ?? doc.xmlUrl,
        cdrUrl: data.enlace_del_cdr ?? doc.cdrUrl,
        providerResponseSummary: summary,
        updatedAt: new Date(),
      })
      .where(eq(taxDocuments.id, doc.id));

    return {
      ok: true,
      status: "issued",
      message: summary,
    };
  } catch (err) {
    return {
      ok: false,
      status: doc.status,
      message: `Fallo de red al consultar estado en PSE/OSE: ${String(err).slice(0, 160)}`,
    };
  }
}
