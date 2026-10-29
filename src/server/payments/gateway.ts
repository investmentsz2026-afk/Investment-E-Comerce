import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  orders,
  paymentTransactions,
  paymentWebhookEvents,
  auditLogs,
} from "@/server/db/schema";
import {
  confirmInventorySaleForOrder,
  releaseInventoryForOrder,
} from "@/server/inventory/service";
import { ensureOrIssueTaxDocumentForOrder } from "@/server/tax/sunat-service";
import {
  sendOrderPaymentConfirmedEmail,
  sendOrderPaymentFailedEmail,
} from "@/server/email";

export type PaymentProviderName = "culqi" | "mercadopago" | "bank_transfer" | "sandbox";
export type PaymentTxStatus =
  | "pending"
  | "processing"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded";

export interface PaymentGatewayConfigStatus {
  culqiConfigured: boolean;
  culqiPublicKey: string | null;
  mercadopagoConfigured: boolean;
  mercadopagoEnvironment: "sandbox" | "production";
  mercadopagoPublicKey: string | null;
  mercadopagoWebhookSecretConfigured: boolean;
  webhookSecretConfigured: boolean;
  sandboxEnabled: boolean;
  bankTransferInstructions: {
    bankName: string;
    accountHolder: string;
    ruc: string;
    penAccountNumber: string;
    penCci: string;
  };
}

/**
 * Inspecciona el estado de las credenciales de pasarelas de pago peruanas en el servidor.
 * Nunca expone claves secretas (`CULQI_SECRET_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `PAYMENT_WEBHOOK_SECRET`).
 */
export function getPaymentGatewayConfigStatus(): PaymentGatewayConfigStatus {
  const culqiPub = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY?.trim() || null;
  const culqiSec = process.env.CULQI_SECRET_KEY?.trim() || null;
  const mpPub = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() || null;
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || null;
  const mpEnvRaw = process.env.MERCADOPAGO_ENV?.trim().toLowerCase();
  const mpEnvironment: "sandbox" | "production" =
    mpEnvRaw === "production" ? "production" : "sandbox";
  const mpWebhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || null;
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET?.trim() || null;

  return {
    culqiConfigured: Boolean(culqiPub && culqiSec),
    culqiPublicKey: culqiPub,
    mercadopagoConfigured: Boolean(mpPub && mpToken),
    mercadopagoEnvironment: mpEnvironment,
    mercadopagoPublicKey: mpPub,
    mercadopagoWebhookSecretConfigured: Boolean(mpWebhookSecret),
    webhookSecretConfigured: Boolean(webhookSecret || mpWebhookSecret),
    sandboxEnabled:
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_PAYMENT_SANDBOX?.trim().toLowerCase() === "true",
    bankTransferInstructions: {
      bankName:
        process.env.BANK_TRANSFER_BANK_NAME?.trim() ||
        "BCP / Interbank (Cuenta Corporativa Soles)",
      accountHolder:
        process.env.BANK_TRANSFER_HOLDER?.trim() || "INVESTMENTS S.A.C.",
      ruc:
        process.env.BANK_TRANSFER_RUC?.trim() ||
        "Pendiente de configurar en .env.local (BANK_TRANSFER_RUC)",
      penAccountNumber:
        process.env.BANK_TRANSFER_ACCOUNT_PEN?.trim() ||
        "Pendiente de configurar en .env.local (BANK_TRANSFER_ACCOUNT_PEN)",
      penCci:
        process.env.BANK_TRANSFER_CCI_PEN?.trim() ||
        "Pendiente de configurar en .env.local (BANK_TRANSFER_CCI_PEN)",
    },
  };
}

/**
 * Valida la consistencia entre el entorno declarado de Mercado Pago (`MERCADOPAGO_ENV`)
 * y el prefijo de las credenciales configuradas, evitando mezclar llaves de prueba (`TEST-...`)
 * en modo producción.
 */
export function validateMercadoPagoEnvironmentConsistency(params: {
  environment: "sandbox" | "production";
  accessToken: string | null | undefined;
  publicKey?: string | null | undefined;
}): { valid: boolean; error?: string } {
  const token = (params.accessToken ?? "").trim();
  const pub = (params.publicKey ?? "").trim();

  if (!token) {
    return {
      valid: false,
      error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN en las variables de entorno del servidor.",
    };
  }

  if (params.environment === "production") {
    if (token.startsWith("TEST-")) {
      return {
        valid: false,
        error:
          "Seguridad de producción: MERCADOPAGO_ENV está en 'production', pero MERCADOPAGO_ACCESS_TOKEN es una credencial de prueba (TEST-...). No se permite mezclar llaves de sandbox en producción.",
      };
    }
    if (pub && pub.startsWith("TEST-")) {
      return {
        valid: false,
        error:
          "Seguridad de producción: MERCADOPAGO_ENV está en 'production', pero NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY es una llave de prueba (TEST-...).",
      };
    }
  }

  return { valid: true };
}

export interface MercadoPagoPaymentPayload {
  transaction_amount: number;
  token?: string;
  description: string;
  installments: number;
  payment_method_id?: string;
  external_reference: string;
  statement_descriptor: string;
  notification_url?: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification: {
      type: "DNI" | "CE" | "RUC";
      number: string;
    };
  };
  metadata: {
    order_id: string;
    order_number: string;
    currency: "PEN";
  };
}

/**
 * Construye la solicitud oficial para la API `POST https://api.mercadopago.com/v1/payments`
 * tomando el importe exclusivamente del pedido recalculado en el servidor (`totalAmountCents / 100` en PEN).
 */
export function buildMercadoPagoPaymentPayload(params: {
  orderId: number;
  orderNumber: string;
  totalAmountCents: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  billingDocType: "DNI" | "CE" | "RUC";
  billingDocNumber: string;
  cardToken?: string;
  paymentMethodId?: string;
  installments?: number;
  notificationUrl?: string;
}): MercadoPagoPaymentPayload {
  const amountSoles = Number((Math.max(0, Math.trunc(params.totalAmountCents)) / 100).toFixed(2));

  return {
    transaction_amount: amountSoles,
    ...(params.cardToken ? { token: params.cardToken } : {}),
    description: `Pedido INVESTMENTS ${params.orderNumber}`,
    installments: Math.max(1, Math.trunc(params.installments ?? 1)),
    ...(params.paymentMethodId ? { payment_method_id: params.paymentMethodId } : {}),
    external_reference: String(params.orderId),
    statement_descriptor: "INVESTMENTS PERU",
    ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
    payer: {
      email: params.customerEmail.trim(),
      first_name: params.customerFirstName.trim(),
      last_name: params.customerLastName.trim(),
      identification: {
        type: params.billingDocType,
        number: params.billingDocNumber.trim(),
      },
    },
    metadata: {
      order_id: String(params.orderId),
      order_number: params.orderNumber,
      currency: "PEN",
    },
  };
}

/**
 * Construye la solicitud oficial de Checkout Pro (`POST https://api.mercadopago.com/checkout/preferences`)
 * con moneda `PEN`, `external_reference` vinculado al ID del pedido e importes calculados en servidor.
 * Nota de seguridad: las `back_urls` son solo informativas para el navegador; el pedido JAMÁS se da por pagado
 * al volver a `back_urls.success` sin verificación servidor-a-servidor o webhook firmado.
 */
export function buildMercadoPagoCheckoutPreferencePayload(params: {
  orderId: number;
  orderNumber: string;
  totalAmountCents: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  billingDocType: "DNI" | "CE" | "RUC";
  billingDocNumber: string;
  baseUrl: string;
}) {
  const cleanBase = params.baseUrl.replace(/\/$/, "");
  const amountSoles = Number((Math.max(0, Math.trunc(params.totalAmountCents)) / 100).toFixed(2));

  return {
    items: [
      {
        id: params.orderNumber,
        title: `Pedido INVESTMENTS ${params.orderNumber}`,
        description: `Compra de prendas INVESTMENTS (${params.orderNumber})`,
        category_id: "fashion",
        quantity: 1,
        currency_id: "PEN" as const,
        unit_price: amountSoles,
      },
    ],
    payer: {
      name: params.customerFirstName.trim(),
      surname: params.customerLastName.trim(),
      email: params.customerEmail.trim(),
      identification: {
        type: params.billingDocType,
        number: params.billingDocNumber.trim(),
      },
    },
    external_reference: String(params.orderId),
    statement_descriptor: "INVESTMENTS PERU",
    notification_url: `${cleanBase}/api/webhooks/payments`,
    back_urls: {
      success: `${cleanBase}/cuenta/pedidos/${params.orderId}?mp_return=success`,
      pending: `${cleanBase}/cuenta/pedidos/${params.orderId}?mp_return=pending`,
      failure: `${cleanBase}/cuenta/pedidos/${params.orderId}?mp_return=failure`,
    },
    auto_return: "approved" as const,
    metadata: {
      order_id: String(params.orderId),
      order_number: params.orderNumber,
    },
  };
}

/**
 * Valida que los datos de un pago reportado por Mercado Pago coincidan estrictamente con el pedido en INVESTMENTS:
 * 1. Moneda `PEN`.
 * 2. `external_reference` o `metadata.order_id` igual al ID o número del pedido.
 * 3. `transaction_amount` coincidente con `order.totalAmount / 100`.
 */
export function validateMercadoPagoPaymentAgainstOrder(params: {
  orderId: number;
  orderNumber: string;
  orderTotalCents: number;
  mpCurrencyId?: string | null;
  mpTransactionAmount?: number | null;
  mpExternalReference?: string | null;
  mpMetadataOrderId?: string | null;
}): { valid: boolean; reason?: string } {
  const currency = (params.mpCurrencyId ?? "").trim().toUpperCase();
  if (currency !== "PEN") {
    return {
      valid: false,
      reason: `Moneda de pago inválida en Mercado Pago: se esperaba PEN y se recibió "${currency || "vacío"}".`,
    };
  }

  const expectedAmount = Number((params.orderTotalCents / 100).toFixed(2));
  const actualAmount = Number(Number(params.mpTransactionAmount ?? -1).toFixed(2));
  if (Math.abs(expectedAmount - actualAmount) > 0.01) {
    return {
      valid: false,
      reason: `Importe pagado en Mercado Pago (${actualAmount.toFixed(2)} PEN) no coincide con el total oficial del pedido (${expectedAmount.toFixed(2)} PEN).`,
    };
  }

  const extRef = (params.mpExternalReference ?? "").trim();
  const metaOrdId = (params.mpMetadataOrderId ?? "").trim();
  const validRefs = [String(params.orderId), params.orderNumber];

  if (!validRefs.includes(extRef) && !validRefs.includes(metaOrdId)) {
    return {
      valid: false,
      reason: `Referencia externa de Mercado Pago ("${extRef || metaOrdId}") no corresponde al pedido #${params.orderId} (${params.orderNumber}).`,
    };
  }

  return { valid: true };
}

/**
 * Verifica la firma oficial de Webhooks de Mercado Pago (`x-signature: ts=...,v1=...`).
 *
 * Especificación oficial de Mercado Pago:
 * - El header `x-signature` contiene `ts=<timestamp>,v1=<hmac_hex>`.
 * - El manifiesto firmado se construye como:
 *   `id:[data.id_lower];request-id:[x-request-id];ts:[ts];`
 *   (omitiendo `request-id` si el header no fue enviado).
 */
export function verifyMercadoPagoWebhookSignature(params: {
  xSignatureHeader: string | null | undefined;
  xRequestIdHeader?: string | null | undefined;
  dataId: string | number | null | undefined;
  secret?: string | null | undefined;
}): boolean {
  const effectiveSecret =
    params.secret?.trim() || process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || "";

  if (!effectiveSecret || !params.xSignatureHeader || params.dataId === undefined || params.dataId === null) {
    return false;
  }

  const parts = params.xSignatureHeader.split(",");
  let ts = "";
  let v1 = "";

  for (const part of parts) {
    const [key, val] = part.split("=", 2);
    if (!key || !val) continue;
    const cleanKey = key.trim().toLowerCase();
    const cleanVal = val.trim();
    if (cleanKey === "ts") ts = cleanVal;
    if (cleanKey === "v1") v1 = cleanVal;
  }

  if (!ts || !v1) {
    return false;
  }

  const cleanDataId = String(params.dataId).trim().toLowerCase();
  const cleanRequestId = (params.xRequestIdHeader ?? "").trim();

  let manifest = `id:${cleanDataId};`;
  if (cleanRequestId) {
    manifest += `request-id:${cleanRequestId};`;
  }
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", effectiveSecret)
    .update(manifest, "utf8")
    .digest("hex");

  if (v1.length !== expected.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(v1, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

/**
 * Calcula la firma HMAC-SHA256 oficial para verificación de webhooks de pago.
 */
export function computeWebhookHmacSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/**
 * Verifica en tiempo constante la autenticidad de la firma HMAC-SHA256 de un webhook.
 */
export function verifyWebhookSignature(
  rawBody: string,
  providedSignature: string | null | undefined,
  secret?: string | null,
): boolean {
  const effectiveSecret =
    secret?.trim() ||
    process.env.PAYMENT_WEBHOOK_SECRET?.trim() ||
    (process.env.NODE_ENV !== "production" ? "investments_dev_webhook_secret_phase5" : "");

  if (!effectiveSecret || !providedSignature) {
    return false;
  }

  const cleanProvided = providedSignature.trim().replace(/^sha256=/i, "");
  const expected = computeWebhookHmacSignature(rawBody, effectiveSecret);

  if (cleanProvided.length !== expected.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(cleanProvided, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

export interface ProcessPaymentChargeInput {
  orderId: number;
  provider: PaymentProviderName;
  idempotencyKey: string;
  /** Token de cargo de Culqi/MercadoPago o escenario de Sandbox (`sandbox_approve`, `sandbox_reject`, `sandbox_pending`). */
  paymentToken?: string;
  paymentMethodBrand?: string;
  maskedCardLast4?: string;
  actorId?: number | null;
  baseUrl?: string;
}

export interface ProcessPaymentChargeResult {
  success: boolean;
  paymentStatus: PaymentTxStatus;
  orderStatus: string;
  providerTransactionId: string | null;
  checkoutRedirectUrl?: string | null;
  message: string;
  error?: string;
}

/**
 * Procesa o registra una operación de pago desde el servidor con idempotencia estricta.
 *
 * Seguridad (Módulo 4 y Auditoría de Cierre Fase 5):
 * - Nunca almacena números completos de tarjeta ni códigos CVV.
 * - En `NODE_ENV === "production"`, bloquea estrictamente el proveedor `sandbox` a menos que `ENABLE_PAYMENT_SANDBOX === "true"`.
 * - Si ya existe una transacción con el mismo `idempotencyKey`, devuelve su estado sin volver a cobrar.
 * - Si el pedido ya está `paid`, rechaza cobros duplicados.
 * - Soporta:
 *   1. `mercadopago`: API oficial `https://api.mercadopago.com/v1/payments` (con Card Token + `X-Idempotency-Key`) o creación de preferencia `https://api.mercadopago.com/checkout/preferences` cuando `MERCADOPAGO_ACCESS_TOKEN` está configurado.
 *   2. `culqi`: API real `https://api.culqi.com/v2/charges` cuando `CULQI_SECRET_KEY` está configurada.
 *   3. `bank_transfer`: Registra orden pendiente de verificación de transferencia bancaria/CCI.
 *   4. `sandbox`: Pasarela de pruebas controlada (`sandbox_approve`, `sandbox_reject`, `sandbox_pending`) claramente identificada con `isSandbox = true`.
 */
export async function processServerPaymentCharge(
  input: ProcessPaymentChargeInput,
): Promise<ProcessPaymentChargeResult> {
  const db = getDb();
  const now = new Date();
  const baseUrl = input.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, input.orderId))
    .limit(1);

  if (orderRows.length === 0) {
    return {
      success: false,
      paymentStatus: "rejected",
      orderStatus: "cancelled",
      providerTransactionId: null,
      message: "El pedido indicado no existe.",
      error: "El pedido indicado no existe.",
    };
  }

  const order = orderRows[0];

  // Si el pedido ya está pagado, no permitir un nuevo cobro (idempotencia de orden pagada)
  if (
    order.paymentStatus === "approved" ||
    ["paid", "preparing", "shipped", "delivered"].includes(order.status)
  ) {
    return {
      success: true,
      paymentStatus: "approved",
      orderStatus: order.status,
      providerTransactionId: order.paymentProviderReference,
      message: "Este pedido ya cuenta con un pago confirmado.",
    };
  }

  // Verificar si ya se procesó exactamente este idempotencyKey
  const existingTxRows = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.idempotencyKey, input.idempotencyKey))
    .limit(1);

  if (existingTxRows.length > 0) {
    const existingTx = existingTxRows[0];
    return {
      success:
        existingTx.status === "approved" ||
        existingTx.status === "pending" ||
        existingTx.status === "processing",
      paymentStatus: existingTx.status,
      orderStatus: order.status,
      providerTransactionId: existingTx.providerTransactionId,
      message: "Operación de pago recuperada de forma idempotente.",
      error: existingTx.errorMessage ?? undefined,
    };
  }

  let resolvedStatus: PaymentTxStatus = "pending";
  let providerTxId: string | null = null;
  let checkoutRedirectUrl: string | null = null;
  let statusDetail = "";
  let errMessage: string | null = null;
  let isSandbox = true;

  if (input.provider === "bank_transfer") {
    resolvedStatus = "pending";
    providerTxId = `TRF-${order.orderNumber}`;
    statusDetail =
      "Esperando constancia de transferencia bancaria / depósito en cuenta corporativa";
    isSandbox = false;
  } else if (input.provider === "mercadopago") {
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    const mpPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim();
    const mpEnv: "sandbox" | "production" =
      process.env.MERCADOPAGO_ENV?.trim().toLowerCase() === "production"
        ? "production"
        : "sandbox";

    const envCheck = validateMercadoPagoEnvironmentConsistency({
      environment: mpEnv,
      accessToken: mpAccessToken,
      publicKey: mpPublicKey,
    });

    if (!envCheck.valid || !mpAccessToken) {
      return {
        success: false,
        paymentStatus: "rejected",
        orderStatus: order.status,
        providerTransactionId: null,
        message:
          envCheck.error ??
          "Mercado Pago aún no tiene configurado MERCADOPAGO_ACCESS_TOKEN en el servidor.",
        error:
          envCheck.error ??
          "Mercado Pago pendiente de configuración en servidor (MERCADOPAGO_ACCESS_TOKEN).",
      };
    }

    isSandbox = mpEnv === "sandbox" || mpAccessToken.startsWith("TEST-");

    try {
      if (input.paymentToken && !input.paymentToken.startsWith("sandbox_")) {
        // Flujo 1: Pago directo API v1/payments con token de tarjeta / Yape y header X-Idempotency-Key
        const mpPayload = buildMercadoPagoPaymentPayload({
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmountCents: order.totalAmount,
          customerEmail: order.customerEmailSnapshot,
          customerFirstName: order.customerFirstNameSnapshot,
          customerLastName: order.customerLastNameSnapshot,
          billingDocType: (order.billingDocType as "DNI" | "CE" | "RUC") || "DNI",
          billingDocNumber: order.billingDocNumber,
          cardToken: input.paymentToken,
          paymentMethodId: input.paymentMethodBrand,
          notificationUrl: `${baseUrl.replace(/\/$/, "")}/api/webhooks/payments`,
        });

        const res = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": input.idempotencyKey,
          },
          body: JSON.stringify(mpPayload),
          signal: AbortSignal.timeout(15000),
        });

        const body = (await res.json()) as {
          id?: number | string;
          status?: string;
          status_detail?: string;
          currency_id?: string;
          transaction_amount?: number;
          external_reference?: string;
          metadata?: { order_id?: string };
          message?: string;
        };

        if (res.ok && body.id) {
          providerTxId = String(body.id);
          const integrity = validateMercadoPagoPaymentAgainstOrder({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderTotalCents: order.totalAmount,
            mpCurrencyId: body.currency_id,
            mpTransactionAmount: body.transaction_amount,
            mpExternalReference: body.external_reference,
            mpMetadataOrderId: body.metadata?.order_id,
          });

          if (!integrity.valid) {
            resolvedStatus = "rejected";
            errMessage = integrity.reason ?? "Inconsistencia de importe/moneda en Mercado Pago.";
            statusDetail = "amount_or_currency_mismatch";
          } else if (body.status === "approved") {
            resolvedStatus = "approved";
            statusDetail = body.status_detail ?? "Pago aprobado y verificado en Mercado Pago";
          } else if (body.status === "in_process" || body.status === "pending" || body.status === "authorized") {
            resolvedStatus = "processing";
            statusDetail = body.status_detail ?? "Pago en proceso de validación por Mercado Pago";
          } else {
            resolvedStatus = "rejected";
            errMessage = `Pago rechazado por Mercado Pago (${body.status_detail ?? body.status ?? "rejected"}).`;
            statusDetail = body.status_detail ?? "cc_rejected";
          }
        } else {
          resolvedStatus = "rejected";
          errMessage = body.message ?? `Error HTTP ${res.status} al procesar el pago en Mercado Pago.`;
          statusDetail = "mp_api_error";
        }
      } else {
        // Flujo 2: Creación de Preferencia Oficial Checkout Pro (POST /checkout/preferences)
        const prefPayload = buildMercadoPagoCheckoutPreferencePayload({
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmountCents: order.totalAmount,
          customerEmail: order.customerEmailSnapshot,
          customerFirstName: order.customerFirstNameSnapshot,
          customerLastName: order.customerLastNameSnapshot,
          billingDocType: (order.billingDocType as "DNI" | "CE" | "RUC") || "DNI",
          billingDocNumber: order.billingDocNumber,
          baseUrl,
        });

        const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": input.idempotencyKey,
          },
          body: JSON.stringify(prefPayload),
          signal: AbortSignal.timeout(15000),
        });

        const prefBody = (await prefRes.json()) as {
          id?: string;
          init_point?: string;
          sandbox_init_point?: string;
          message?: string;
        };

        if (prefRes.ok && prefBody.id) {
          resolvedStatus = "pending";
          providerTxId = prefBody.id;
          checkoutRedirectUrl = isSandbox
            ? (prefBody.sandbox_init_point ?? prefBody.init_point ?? null)
            : (prefBody.init_point ?? null);
          statusDetail =
            "Preferencia de pago creada en Mercado Pago. Esperando confirmación por Webhook firmado.";
        } else {
          resolvedStatus = "rejected";
          errMessage =
            prefBody.message ??
            `No se pudo inicializar la preferencia en Mercado Pago (HTTP ${prefRes.status}).`;
          statusDetail = "mp_preference_error";
        }
      }
    } catch (e) {
      resolvedStatus = "rejected";
      errMessage = `Error de red al conectar con Mercado Pago API: ${String(e).slice(0, 160)}`;
      statusDetail = "network_error";
    }
  } else if (input.provider === "culqi") {
    const culqiSecret = process.env.CULQI_SECRET_KEY?.trim();
    if (!culqiSecret) {
      return {
        success: false,
        paymentStatus: "rejected",
        orderStatus: order.status,
        providerTransactionId: null,
        message:
          "La pasarela Culqi aún no tiene configurada la clave privada CULQI_SECRET_KEY en el servidor.",
        error: "Pasarela Culqi pendiente de configuración en servidor (CULQI_SECRET_KEY).",
      };
    }

    isSandbox = culqiSecret.startsWith("sk_test_");

    try {
      const res = await fetch("https://api.culqi.com/v2/charges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${culqiSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: order.totalAmount,
          currency_code: "PEN",
          email: order.customerEmailSnapshot,
          source_id: input.paymentToken,
          description: `Pedido INVESTMENTS ${order.orderNumber}`,
          metadata: {
            order_id: String(order.id),
            order_number: order.orderNumber,
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      const body = (await res.json()) as {
        id?: string;
        outcome?: { type?: string; user_message?: string; merchant_message?: string };
        user_message?: string;
        merchant_message?: string;
      };

      if (res.ok && body.id) {
        resolvedStatus = "approved";
        providerTxId = body.id;
        statusDetail = body.outcome?.user_message ?? "Cargo aprobado en Culqi";
      } else {
        resolvedStatus = "rejected";
        errMessage =
          body.user_message ??
          body.outcome?.user_message ??
          body.merchant_message ??
          "El cargo fue denegado por Culqi.";
        statusDetail = "charge_rejected";
      }
    } catch (e) {
      resolvedStatus = "rejected";
      errMessage = `Error de comunicación con Culqi API: ${String(e).slice(0, 160)}`;
      statusDetail = "network_error";
    }
  } else if (input.provider === "sandbox") {
    const sandboxAllowed =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_PAYMENT_SANDBOX?.trim().toLowerCase() === "true";

    if (!sandboxAllowed) {
      return {
        success: false,
        paymentStatus: "rejected",
        orderStatus: order.status,
        providerTransactionId: null,
        message:
          "El simulador de pagos Sandbox está deshabilitado en el entorno de producción.",
        error:
          "Operación rechazada: no se permiten pagos simulados (sandbox) cuando NODE_ENV=production y ENABLE_PAYMENT_SANDBOX no está activo.",
      };
    }

    isSandbox = true;
    const tokenScenario = (input.paymentToken ?? "sandbox_approve").trim().toLowerCase();

    if (tokenScenario === "sandbox_reject" || tokenScenario === "reject") {
      resolvedStatus = "rejected";
      providerTxId = `SBX-REJ-${order.id}-${Date.now()}`;
      statusDetail =
        "Pago rechazado en simulador Sandbox (fondos insuficientes / tarjeta denegada)";
      errMessage = "La entidad emisora rechazó la operación en modo Sandbox de prueba.";
    } else if (tokenScenario === "sandbox_pending" || tokenScenario === "pending") {
      resolvedStatus = "processing";
      providerTxId = `SBX-PND-${order.id}-${Date.now()}`;
      statusDetail = "Pago en proceso de verificación asíncrona (Sandbox)";
    } else if (tokenScenario === "sandbox_error" || tokenScenario === "provider_error") {
      resolvedStatus = "rejected";
      providerTxId = null;
      statusDetail = "gateway_timeout";
      errMessage =
        "El proveedor de pagos experimentó un tiempo de espera agotado (Sandbox Error). Tu reserva de inventario sigue activa para que puedas reintentar.";
    } else {
      resolvedStatus = "approved";
      providerTxId = `SBX-APR-${order.id}-${Date.now()}`;
      statusDetail = "Cargo aprobado y verificado en entorno Sandbox";
    }
  }

  const cleanLast4 = input.maskedCardLast4
    ? input.maskedCardLast4.replace(/\D/g, "").slice(-4) || null
    : null;

  await db.insert(paymentTransactions).values({
    orderId: order.id,
    provider: input.provider,
    status: resolvedStatus,
    amount: order.totalAmount,
    currency: "PEN",
    idempotencyKey: input.idempotencyKey,
    providerTransactionId: providerTxId,
    providerStatusDetail: statusDetail.slice(0, 160),
    paymentMethodBrand:
      input.paymentMethodBrand?.slice(0, 60) ??
      (input.provider === "sandbox" ? "VISA Sandbox" : null),
    maskedCardLast4: cleanLast4,
    errorMessage: errMessage,
    isSandbox,
    confirmedAt: resolvedStatus === "approved" ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  if (resolvedStatus === "approved") {
    await applyVerifiedPaymentOutcome({
      orderId: order.id,
      outcome: "approved",
      provider: input.provider,
      providerReference: providerTxId ?? `REF-${order.orderNumber}`,
      actorId: input.actorId ?? null,
      notes: statusDetail,
      baseUrl,
    });

    return {
      success: true,
      paymentStatus: "approved",
      orderStatus: "paid",
      providerTransactionId: providerTxId,
      message: "Pago verificado y confirmado en el servidor.",
    };
  }

  if (resolvedStatus === "rejected") {
    await db
      .update(orders)
      .set({
        status: "payment_failed",
        paymentStatus: "rejected",
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      action: "order_payment_change",
      targetType: "order",
      targetId: order.id,
      details: `Intento de pago rechazado en ${input.provider} para ${order.orderNumber}: ${errMessage ?? statusDetail}`,
    });

    sendOrderPaymentFailedEmail({
      to: order.customerEmailSnapshot,
      customerName: order.customerFirstNameSnapshot,
      orderNumber: order.orderNumber,
      reason: errMessage ?? statusDetail,
      baseUrl,
      orderId: order.id,
    }).catch((e) => console.error("[Payment] Error al enviar correo de fallo de pago:", e));

    return {
      success: false,
      paymentStatus: "rejected",
      orderStatus: "payment_failed",
      providerTransactionId: providerTxId,
      message: errMessage ?? "El pago fue rechazado.",
      error: errMessage ?? "El pago fue rechazado.",
    };
  }

  // Estado pending / processing
  const nextOrderStatus =
    resolvedStatus === "processing" ? "payment_processing" : "pending_payment";
  await db
    .update(orders)
    .set({
      status: nextOrderStatus,
      paymentStatus: resolvedStatus,
      paymentProviderReference: providerTxId ?? order.paymentProviderReference,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

  return {
    success: true,
    paymentStatus: resolvedStatus,
    orderStatus: nextOrderStatus,
    providerTransactionId: providerTxId,
    checkoutRedirectUrl,
    message: statusDetail,
  };
}

/**
 * Consulta directamente en la API oficial de Mercado Pago (`GET https://api.mercadopago.com/v1/payments/{id}`)
 * el estado real de un pago y, si está aprobado y coincide en monto/moneda/referencia con el pedido,
 * aplica la confirmación de forma idempotente.
 * Sirve tanto para la verificación de webhooks de Mercado Pago como para la recuperación/conciliación ante fallos temporales de red.
 */
export async function verifyAndSyncMercadoPagoPaymentById(params: {
  mpPaymentId: string | number;
  expectedOrderId?: number | null;
  actorId?: number | null;
  baseUrl?: string;
}): Promise<{
  ok: boolean;
  orderId: number | null;
  outcome: "approved" | "rejected" | "cancelled" | "pending" | null;
  message: string;
}> {
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!mpAccessToken) {
    return {
      ok: false,
      orderId: params.expectedOrderId ?? null,
      outcome: null,
      message: "Falta MERCADOPAGO_ACCESS_TOKEN en el servidor para verificar el pago con Mercado Pago.",
    };
  }

  const cleanPaymentId = encodeURIComponent(String(params.mpPaymentId).trim());

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${cleanPaymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return {
        ok: false,
        orderId: params.expectedOrderId ?? null,
        outcome: null,
        message: `Mercado Pago API respondió HTTP ${res.status} al consultar el pago #${cleanPaymentId}.`,
      };
    }

    const paymentData = (await res.json()) as {
      id?: number | string;
      status?: string;
      status_detail?: string;
      currency_id?: string;
      transaction_amount?: number;
      external_reference?: string;
      metadata?: { order_id?: string; order_number?: string };
    };

    const db = getDb();
    let resolvedOrderId = params.expectedOrderId ?? null;

    if (!resolvedOrderId && paymentData.external_reference) {
      const parsedId = Number(paymentData.external_reference);
      if (Number.isInteger(parsedId) && parsedId > 0) {
        resolvedOrderId = parsedId;
      }
    }

    if (!resolvedOrderId && paymentData.metadata?.order_id) {
      const parsedId = Number(paymentData.metadata.order_id);
      if (Number.isInteger(parsedId) && parsedId > 0) {
        resolvedOrderId = parsedId;
      }
    }

    if (!resolvedOrderId) {
      return {
        ok: false,
        orderId: null,
        outcome: null,
        message: `El pago #${cleanPaymentId} en Mercado Pago no contiene un external_reference de pedido válido.`,
      };
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, resolvedOrderId))
      .limit(1);

    if (orderRows.length === 0) {
      return {
        ok: false,
        orderId: resolvedOrderId,
        outcome: null,
        message: `El pedido #${resolvedOrderId} referenciado en Mercado Pago no existe.`,
      };
    }

    const order = orderRows[0];
    const validation = validateMercadoPagoPaymentAgainstOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderTotalCents: order.totalAmount,
      mpCurrencyId: paymentData.currency_id,
      mpTransactionAmount: paymentData.transaction_amount,
      mpExternalReference: paymentData.external_reference,
      mpMetadataOrderId: paymentData.metadata?.order_id,
    });

    if (!validation.valid) {
      return {
        ok: false,
        orderId: order.id,
        outcome: "rejected",
        message: validation.reason ?? "Validación de monto/moneda fallida en Mercado Pago.",
      };
    }

    let mappedOutcome: "approved" | "rejected" | "cancelled" | "pending" = "pending";
    if (paymentData.status === "approved") {
      mappedOutcome = "approved";
    } else if (paymentData.status === "rejected") {
      mappedOutcome = "rejected";
    } else if (paymentData.status === "cancelled" || paymentData.status === "refunded") {
      mappedOutcome = "cancelled";
    }

    if (mappedOutcome === "pending") {
      return {
        ok: true,
        orderId: order.id,
        outcome: "pending",
        message: `El pago #${cleanPaymentId} sigue en estado "${paymentData.status}" (${paymentData.status_detail ?? "pendiente"}).`,
      };
    }

    const outcomeRes = await applyVerifiedPaymentOutcome({
      orderId: order.id,
      outcome: mappedOutcome,
      provider: "mercadopago",
      providerReference: `MP-${paymentData.id ?? cleanPaymentId}`,
      actorId: params.actorId ?? null,
      notes: `Verificado directamente en API Mercado Pago (${paymentData.status}: ${paymentData.status_detail ?? ""})`,
      baseUrl: params.baseUrl,
    });

    return {
      ok: true,
      orderId: order.id,
      outcome: mappedOutcome,
      message: outcomeRes.reason,
    };
  } catch (err) {
    return {
      ok: false,
      orderId: params.expectedOrderId ?? null,
      outcome: null,
      message: `Error de red al consultar pago en Mercado Pago: ${String(err).slice(0, 160)}`,
    };
  }
}

/**
 * Aplica de forma transaccional e idempotente el resultado verificado de un pago
 * (invocado tanto por cargo síncrono verificado como por webhook firmado o conciliación admin).
 *
 * Garantías contra eventos fuera de orden o repetidos:
 * - Si un pedido ya está `paid`, `preparing`, `shipped` o `delivered`, un evento tardío `rejected`
 *   o un segundo evento `approved` es ignorado sin corromper el estado ni descontar stock dos veces.
 */
export async function applyVerifiedPaymentOutcome(params: {
  orderId: number;
  outcome: "approved" | "rejected" | "cancelled";
  provider: PaymentProviderName;
  providerReference: string;
  actorId?: number | null;
  notes?: string;
  baseUrl?: string;
}): Promise<{ applied: boolean; reason: string }> {
  const db = getDb();
  const now = new Date();
  const baseUrl = params.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, params.orderId))
    .limit(1);

  if (rows.length === 0) {
    return { applied: false, reason: "Pedido no encontrado" };
  }

  const order = rows[0];

  if (params.outcome === "approved") {
    // Si ya estaba pagado o en etapa logística posterior, es idempotente
    if (
      order.paymentStatus === "approved" ||
      ["paid", "preparing", "shipped", "delivered", "refunded"].includes(order.status)
    ) {
      return {
        applied: false,
        reason: "El pedido ya tenía el pago confirmado previamente (idempotente).",
      };
    }

    // Confirmar salida definitiva de inventario (idempotente por variante)
    await confirmInventorySaleForOrder({
      orderId: order.id,
      actorId: params.actorId ?? null,
    });

    await db
      .update(orders)
      .set({
        status: "paid",
        paymentStatus: "approved",
        paymentProviderReference: params.providerReference,
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    await db.insert(auditLogs).values({
      actorId: params.actorId ?? null,
      action: "order_payment_change",
      targetType: "order",
      targetId: order.id,
      details: `Pago APROBADO para pedido ${order.orderNumber} (${params.provider}, ref: ${params.providerReference}). ${params.notes ?? ""}`,
    });

    // Registrar o transmitir el comprobante tributario electrónico
    await ensureOrIssueTaxDocumentForOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      isOrderPaid: true,
      billing: {
        documentType: order.taxDocumentType,
        customerDocType: (order.billingDocType as "DNI" | "CE" | "RUC") || "DNI",
        customerDocNumber: order.billingDocNumber,
        customerLegalName: order.billingCustomerName,
        customerFiscalAddress: order.billingFiscalAddress,
      },
      taxableAmount: order.taxableBaseAmount,
      igvAmount: order.igvAmount,
      totalAmount: order.totalAmount,
      actorId: params.actorId ?? null,
      baseUrl,
    });

    sendOrderPaymentConfirmedEmail({
      to: order.customerEmailSnapshot,
      customerName: order.customerFirstNameSnapshot,
      orderNumber: order.orderNumber,
      totalAmountCents: order.totalAmount,
      providerReference: params.providerReference,
      baseUrl,
      orderId: order.id,
    }).catch((e) => console.error("[Payment] Error al enviar confirmación de pago:", e));

    return { applied: true, reason: "Pago confirmado e inventario consolidado." };
  }

  // Si llega un evento fuera de orden (rejected/cancelled) cuando el pedido ya está pagado, no degradamos el pedido
  if (
    order.paymentStatus === "approved" ||
    ["paid", "preparing", "shipped", "delivered", "refunded"].includes(order.status)
  ) {
    return {
      applied: false,
      reason:
        "Evento fuera de orden ignorado: el pedido ya cuenta con un pago aprobado en firme.",
    };
  }

  if (params.outcome === "cancelled") {
    await releaseInventoryForOrder({
      orderId: order.id,
      reason: params.notes ?? "Pago cancelado por proveedor/usuario",
      actorId: params.actorId ?? null,
    });

    await db
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "cancelled",
        cancellationReason: params.notes ?? "Cancelado por notificación de pago",
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    await db.insert(auditLogs).values({
      actorId: params.actorId ?? null,
      action: "order_cancelled",
      targetType: "order",
      targetId: order.id,
      details: `Pedido ${order.orderNumber} cancelado y reserva liberada. Motivo: ${params.notes ?? "Cancelación de pago"}`,
    });

    return { applied: true, reason: "Pedido cancelado y reserva de inventario liberada." };
  }

  // outcome === "rejected"
  await db
    .update(orders)
    .set({
      status: "payment_failed",
      paymentStatus: "rejected",
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

  await db.insert(auditLogs).values({
    actorId: params.actorId ?? null,
    action: "order_payment_change",
    targetType: "order",
    targetId: order.id,
    details: `Pago rechazado para pedido ${order.orderNumber}: ${params.notes ?? "Rechazado por proveedor"}`,
  });

  return { applied: true, reason: "Estado de fallo de pago registrado." };
}

/**
 * Procesa una notificación de webhook entrante verificando:
 * 1. Autenticidad criptográfica de la firma:
 *    - Formato oficial de Mercado Pago (`x-signature: ts=...,v1=...` + `x-request-id` + `data.id`) con `MERCADOPAGO_WEBHOOK_SECRET`, o
 *    - Firma HMAC-SHA256 del cuerpo (`x-webhook-signature` / `x-culqi-signature`) con `PAYMENT_WEBHOOK_SECRET`.
 * 2. Idempotencia por `(provider, eventId)` en `payment_webhook_events`.
 * 3. Protección contra eventos fuera de orden.
 */
export async function handleIncomingPaymentWebhook(params: {
  rawBody: string;
  signatureHeader: string | null;
  xRequestIdHeader?: string | null;
  queryDataId?: string | null;
  secretOverride?: string | null;
}): Promise<{
  httpStatus: number;
  ok: boolean;
  duplicate?: boolean;
  message: string;
}> {
  let parsed: {
    id?: string | number;
    action?: string;
    type?: string;
    data?: { id?: string | number };
    eventId?: string;
    eventType?: string;
    provider?: PaymentProviderName;
    orderId?: number;
    orderNumber?: string;
    providerReference?: string;
    amount?: number;
  };

  try {
    parsed = JSON.parse(params.rawBody);
  } catch {
    return {
      httpStatus: 400,
      ok: false,
      message: "El cuerpo del webhook no es un JSON válido.",
    };
  }

  const isMercadoPagoFormat = Boolean(
    params.signatureHeader?.includes("ts=") &&
      params.signatureHeader?.includes("v1="),
  );

  const mpDataId = parsed.data?.id ?? params.queryDataId ?? parsed.id ?? null;

  const signatureValid = isMercadoPagoFormat
    ? verifyMercadoPagoWebhookSignature({
        xSignatureHeader: params.signatureHeader,
        xRequestIdHeader: params.xRequestIdHeader,
        dataId: mpDataId,
        secret: params.secretOverride,
      })
    : verifyWebhookSignature(
        params.rawBody,
        params.signatureHeader,
        params.secretOverride,
      );

  if (!signatureValid) {
    return {
      httpStatus: 401,
      ok: false,
      message: "Firma de webhook inválida o ausente.",
    };
  }

  const eventId = String(
    parsed.eventId ?? (parsed.id !== undefined ? `mp_${parsed.id}` : ""),
  ).trim();
  const eventType = String(
    parsed.eventType ?? parsed.action ?? parsed.type ?? "",
  ).trim();
  const provider: PaymentProviderName = isMercadoPagoFormat
    ? "mercadopago"
    : parsed.provider &&
        ["culqi", "mercadopago", "bank_transfer", "sandbox"].includes(
          parsed.provider,
        )
      ? parsed.provider
      : "sandbox";

  if (!eventId || !eventType) {
    return {
      httpStatus: 400,
      ok: false,
      message: "Faltan campos obligatorios en el webhook (eventId, eventType).",
    };
  }

  const db = getDb();
  const now = new Date();

  // Verificar si el evento ya fue procesado antes (idempotencia de webhook)
  const existingEvent = await db
    .select()
    .from(paymentWebhookEvents)
    .where(
      and(
        eq(paymentWebhookEvents.provider, provider),
        eq(paymentWebhookEvents.eventId, eventId),
      ),
    )
    .limit(1);

  if (existingEvent.length > 0) {
    return {
      httpStatus: 200,
      ok: true,
      duplicate: true,
      message: `Evento ${eventId} ya procesado anteriormente (idempotente).`,
    };
  }

  // Si es una notificación nativa de Mercado Pago (`payment.created` o `payment.updated`) con `data.id` y sin `orderId` directo,
  // consultamos el pago en la API oficial de Mercado Pago antes de dar por pagado el pedido.
  if (
    provider === "mercadopago" &&
    mpDataId &&
    !parsed.orderId &&
    !parsed.orderNumber &&
    ["payment.created", "payment.updated", "payment"].includes(eventType)
  ) {
    const syncResult = await verifyAndSyncMercadoPagoPaymentById({
      mpPaymentId: mpDataId,
    });

    await db.insert(paymentWebhookEvents).values({
      provider: "mercadopago",
      eventId,
      eventType,
      orderId: syncResult.orderId,
      signatureValid: true,
      processed: syncResult.ok,
      payloadSummary: params.rawBody.slice(0, 500),
      processingNotes: syncResult.message,
      createdAt: now,
      processedAt: syncResult.ok ? now : null,
    });

    return {
      httpStatus: syncResult.ok ? 200 : 422,
      ok: syncResult.ok,
      duplicate: false,
      message: syncResult.message,
    };
  }

  // Resolver pedido por orderId u orderNumber
  let targetOrderId: number | null = parsed.orderId ? Number(parsed.orderId) : null;
  if (!targetOrderId && parsed.orderNumber) {
    const foundOrd = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.orderNumber, String(parsed.orderNumber)))
      .limit(1);
    targetOrderId = foundOrd[0]?.id ?? null;
  }

  if (!targetOrderId) {
    await db.insert(paymentWebhookEvents).values({
      provider,
      eventId,
      eventType,
      orderId: null,
      signatureValid: true,
      processed: false,
      payloadSummary: params.rawBody.slice(0, 500),
      processingNotes: "Pedido referido en el webhook no existe.",
      createdAt: now,
    });

    return {
      httpStatus: 404,
      ok: false,
      message: "El pedido referenciado en el webhook no existe.",
    };
  }

  let outcome: "approved" | "rejected" | "cancelled" | null = null;
  if (["charge.succeeded", "payment.approved", "order.paid"].includes(eventType)) {
    outcome = "approved";
  } else if (["charge.failed", "payment.rejected"].includes(eventType)) {
    outcome = "rejected";
  } else if (["charge.cancelled", "payment.cancelled", "order.expired"].includes(eventType)) {
    outcome = "cancelled";
  }

  if (!outcome) {
    await db.insert(paymentWebhookEvents).values({
      provider,
      eventId,
      eventType,
      orderId: targetOrderId,
      signatureValid: true,
      processed: true,
      payloadSummary: params.rawBody.slice(0, 500),
      processingNotes: `Tipo de evento informativo ignorado: ${eventType}`,
      createdAt: now,
      processedAt: now,
    });

    return {
      httpStatus: 200,
      ok: true,
      message: `Evento informativo ${eventType} registrado.`,
    };
  }

  const outcomeResult = await applyVerifiedPaymentOutcome({
    orderId: targetOrderId,
    outcome,
    provider,
    providerReference: parsed.providerReference ?? `WHK-${eventId}`,
    actorId: null,
    notes: `Webhook verificado (${eventType})`,
  });

  await db.insert(paymentWebhookEvents).values({
    provider,
    eventId,
    eventType,
    orderId: targetOrderId,
    signatureValid: true,
    processed: true,
    payloadSummary: params.rawBody.slice(0, 500),
    processingNotes: outcomeResult.reason,
    createdAt: now,
    processedAt: now,
  });

  return {
    httpStatus: 200,
    ok: true,
    duplicate: false,
    message: outcomeResult.reason,
  };
}
