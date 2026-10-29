import { NextResponse } from "next/server";
import { handleIncomingPaymentWebhook } from "@/server/payments/gateway";
import { checkRateLimit, recordFailedAttempt } from "@/server/auth/rate-limit";

/**
 * Endpoint oficial de Webhooks de Pago (Módulo 4).
 *
 * Seguridad:
 * - Verifica firma HMAC-SHA256 en el encabezado `x-webhook-signature` (o `x-culqi-signature` / `x-signature`).
 * - Aplica límite de solicitudes por IP para evitar inundación.
 * - Garantiza idempotencia estricta por `(provider, eventId)` en `payment_webhook_events`.
 */
export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "local";

  const rl = checkRateLimit(`webhook:${ip}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Límite de notificaciones alcanzado temporalmente." },
      { status: 429 },
    );
  }
  recordFailedAttempt(`webhook:${ip}`, 120, 60 * 1000);

  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-culqi-signature") ??
    request.headers.get("x-signature");
  const xRequestIdHeader = request.headers.get("x-request-id");
  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const result = await handleIncomingPaymentWebhook({
    rawBody,
    signatureHeader,
    xRequestIdHeader,
    queryDataId,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      duplicate: result.duplicate ?? false,
      message: result.message,
    },
    { status: result.httpStatus },
  );
}

