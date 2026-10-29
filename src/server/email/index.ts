import { siteConfig } from "@/config/site";

export interface SendEmailResult {
  sent: boolean;
  provider: "resend" | "none";
  messageId: string | null;
  reason?: string;
  previewUrl?: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "INVESTMENTS <no-reply@investments.pe>";

/**
 * Motor central de envío de correos transaccionales.
 * Si RESEND_API_KEY está configurado, realiza el envío real vía HTTP API.
 * Si no está configurado, registra el evento de forma segura en el servidor sin engañar al sistema.
 */
async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: DEFAULT_FROM,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Email] Error en Resend API:", res.status, errorText);
        return {
          sent: false,
          provider: "resend",
          messageId: null,
          reason: `HTTP ${res.status}: ${errorText.slice(0, 200)}`,
        };
      }

      const data = (await res.json()) as { id?: string };
      return {
        sent: true,
        provider: "resend",
        messageId: data.id ?? null,
      };
    } catch (err) {
      console.error("[Email] Excepción al enviar correo:", err);
      return {
        sent: false,
        provider: "resend",
        messageId: null,
        reason: String(err),
      };
    }
  }

  // Sin proveedor configurado: Registrar en consola para desarrollo
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[Email Service (Modo Desarrollo - Sin RESEND_API_KEY)]\nPara: ${payload.to}\nAsunto: ${payload.subject}\nMensaje: ${payload.text.slice(0, 300)}...`,
    );
  }

  return {
    sent: false,
    provider: "none",
    messageId: null,
    reason: "Proveedor de correo no configurado (configure RESEND_API_KEY en .env.local)",
  };
}

/**
 * Plantilla base HTML con la identidad visual editorial de INVESTMENTS.
 */
function wrapTemplate(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FAF8F5; color: #141312; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E8E5E0; }
    .header { padding: 36px 40px 24px; border-bottom: 1px solid #E8E5E0; text-align: center; }
    .brand { font-size: 20px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #141312; }
    .content { padding: 40px; line-height: 1.6; font-size: 15px; color: #2E2B27; }
    .btn { display: inline-block; background-color: #141312; color: #FAF8F5 !important; text-decoration: none; padding: 14px 28px; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; margin: 24px 0; }
    .footer { padding: 24px 40px; background-color: #F4F1EA; border-top: 1px solid #E8E5E0; font-size: 12px; color: #8F8A81; text-align: center; }
    .link-alt { font-size: 12px; color: #8F8A81; word-break: break-all; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">INVESTMENTS</div>
      <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #8F8A81; margin-top: 6px;">Lima, Perú · ${siteConfig.season}</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px;">Este es un mensaje transaccional enviado automáticamente por INVESTMENTS.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} INVESTMENTS S.A.C. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────
// Plantillas Transaccionales Específicas
// ──────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string,
  baseUrl: string,
): Promise<SendEmailResult> {
  const url = `${baseUrl}/verificar-correo?token=${token}`;
  const subject = "Confirma tu cuenta en INVESTMENTS";
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Bienvenido, ${firstName}</h1>
    <p>Gracias por registrarte en INVESTMENTS. Para completar la activación de tu cuenta de cliente y mantenerla protegida, confirma tu dirección de correo electrónico pulsando el siguiente enlace:</p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Confirmar mi correo</a>
    </div>
    <p class="link-alt">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br><a href="${url}" style="color: #6E1A24;">${url}</a></p>
    <p style="margin-top: 32px; font-size: 13px; color: #8F8A81;">Este enlace expirará en 24 horas. Si no creaste esta cuenta, puedes desestimar este mensaje con total seguridad.</p>
  `,
  );
  const text = `Hola ${firstName},\n\nGracias por registrarte en INVESTMENTS. Para activar tu cuenta, ingresa al siguiente enlace:\n${url}\n\nEste enlace expira en 24 horas.`;
  return sendEmail({ to, subject, html, text });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string,
  baseUrl: string,
): Promise<SendEmailResult> {
  const url = `${baseUrl}/restablecer-contrasena?token=${token}`;
  const subject = "Recuperación de contraseña — INVESTMENTS";
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Hola, ${firstName}</h1>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en INVESTMENTS.</p>
    <p>Para definir una nueva contraseña segura, haz clic en el siguiente botón:</p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Restablecer mi contraseña</a>
    </div>
    <p class="link-alt">Si el botón no funciona, ingresa a:<br><a href="${url}" style="color: #6E1A24;">${url}</a></p>
    <p style="margin-top: 32px; font-size: 13px; color: #8F8A81;">Este enlace tiene una validez de 1 hora y puede utilizarse solo una vez. Si no solicitaste este cambio, tu contraseña actual permanece segura y no se requiere ninguna acción de tu parte.</p>
  `,
  );
  const text = `Hola ${firstName},\n\nPara restablecer tu contraseña en INVESTMENTS, visita el siguiente enlace:\n${url}\n\nVálido por 1 hora.`;
  return sendEmail({ to, subject, html, text });
}

export async function sendWholesaleReceivedEmail(
  to: string,
  contactName: string,
  legalName: string,
): Promise<SendEmailResult> {
  const subject = "Solicitud de cuenta empresarial recibida — INVESTMENTS B2B";
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Solicitud Recibida</h1>
    <p>Estimado(a) ${contactName},</p>
    <p>Hemos recibido correctamente la solicitud de cuenta comercial mayorista para <strong>${legalName}</strong>.</p>
    <p>Nuestro equipo de cuentas corporativas revisará los datos comerciales y crediticios presentados. El plazo habitual de evaluación es de 24 a 48 horas hábiles.</p>
    <p>Te notificaremos por este mismo medio en cuanto tu cuenta sea aprobada para que puedas comenzar a acceder a las tarifas y volúmenes mayoristas autorizados.</p>
  `,
  );
  const text = `Estimado(a) ${contactName},\n\nHemos recibido la solicitud de cuenta empresarial para ${legalName}. Te notificaremos en cuanto concluya la evaluación.`;
  return sendEmail({ to, subject, html, text });
}

export async function sendWholesaleApprovedEmail(
  to: string,
  contactName: string,
  legalName: string,
  baseUrl: string,
): Promise<SendEmailResult> {
  const subject = "¡Cuenta empresarial aprobada! — INVESTMENTS B2B";
  const url = `${baseUrl}/catalogo`;
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Cuenta Empresarial Aprobada</h1>
    <p>Estimado(a) ${contactName},</p>
    <p>Nos complace informarte que la cuenta comercial de <strong>${legalName}</strong> ha sido verificada y <strong>aprobada exitosamente</strong>.</p>
    <p>A partir de este momento, al iniciar sesión con tu cuenta podrás visualizar el catálogo con precios mayoristas preferenciales, escalas mínimas por lote y disponibilidad para pedidos al por mayor.</p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Explorar catálogo mayorista</a>
    </div>
  `,
  );
  const text = `Estimado(a) ${contactName},\n\nLa cuenta comercial de ${legalName} ha sido aprobada. Inicia sesión en INVESTMENTS para acceder a precios mayoristas:\n${url}`;
  return sendEmail({ to, subject, html, text });
}

export async function sendWholesaleRejectedEmail(
  to: string,
  contactName: string,
  legalName: string,
  rejectionReason?: string,
): Promise<SendEmailResult> {
  const subject = "Actualización de tu solicitud empresarial — INVESTMENTS B2B";
  const reasonText = rejectionReason
    ? `<div style="background-color: #F4F1EA; padding: 16px; border-left: 3px solid #8F8A81; margin: 20px 0; font-size: 14px;"><strong>Motivo comunicado:</strong><br>${rejectionReason}</div>`
    : "";
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Estado de tu solicitud</h1>
    <p>Estimado(a) ${contactName},</p>
    <p>Agradecemos tu interés en operar comercialmente con INVESTMENTS para <strong>${legalName}</strong>.</p>
    <p>Tras evaluar la información presentada, en este momento no ha sido posible autorizar la apertura de la cuenta mayorista bajo los criterios comerciales solicitados.</p>
    ${reasonText}
    <p>Puedes acceder a tu perfil para revisar tus datos o presentar una nueva solicitud si tus condiciones comerciales se han actualizado.</p>
  `,
  );
  const text = `Estimado(a) ${contactName},\n\nEn este momento no fue posible aprobar la cuenta mayorista para ${legalName}.${rejectionReason ? ` Motivo: ${rejectionReason}` : ""}`;
  return sendEmail({ to, subject, html, text });
}

export async function sendWholesaleSuspendedEmail(
  to: string,
  contactName: string,
  legalName: string,
  reason?: string,
): Promise<SendEmailResult> {
  const subject = "Aviso de suspensión de cuenta mayorista — INVESTMENTS";
  const reasonText = reason
    ? `<div style="background-color: #F4F1EA; padding: 16px; border-left: 3px solid #6E1A24; margin: 20px 0; font-size: 14px;"><strong>Motivo:</strong><br>${reason}</div>`
    : "";
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Cuenta Comercial Suspendida</h1>
    <p>Estimado(a) ${contactName},</p>
    <p>Te comunicamos que el acceso a condiciones comerciales mayoristas para la empresa <strong>${legalName}</strong> ha sido suspendido temporalmente por nuestro departamento de administración.</p>
    ${reasonText}
    <p>Si consideras que se trata de un error o deseas regularizar tu situación comercial, por favor comunícate con tu asesor corporativo de INVESTMENTS.</p>
  `,
  );
  const text = `Estimado(a) ${contactName},\n\nEl acceso mayorista para ${legalName} ha sido suspendido.${reason ? ` Motivo: ${reason}` : ""}`;
  return sendEmail({ to, subject, html, text });
}

// ──────────────────────────────────────────────────────────────
// Phase 5: Notificaciones Transaccionales de Pedidos, Pagos y Envíos
// ──────────────────────────────────────────────────────────────

function formatCentsPEN(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`;
}

export async function sendOrderReceivedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalAmountCents: number;
  paymentMethodLabel: string;
  paymentStatus: string;
  baseUrl: string;
  orderId: number;
}): Promise<SendEmailResult> {
  const url = `${params.baseUrl}/cuenta/pedidos/${params.orderId}`;
  const subject = `Pedido recibido ${params.orderNumber} — INVESTMENTS`;
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Hemos recibido tu pedido ${params.orderNumber}</h1>
    <p>Hola, ${params.customerName}:</p>
    <p>Tu orden ha sido registrada en INVESTMENTS con un importe total de <strong>${formatCentsPEN(params.totalAmountCents)}</strong>.</p>
    <div style="background-color: #FAF8F5; padding: 16px; border: 1px solid #E8E5E0; margin: 20px 0; font-size: 14px;">
      <p style="margin: 0 0 6px;"><strong>Número de pedido:</strong> ${params.orderNumber}</p>
      <p style="margin: 0 0 6px;"><strong>Método de pago:</strong> ${params.paymentMethodLabel}</p>
      <p style="margin: 0;"><strong>Estado actual del pago:</strong> ${params.paymentStatus}</p>
    </div>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Ver detalle de mi pedido</a>
    </div>
  `,
  );
  const text = `Hola ${params.customerName},\n\nHemos recibido tu pedido ${params.orderNumber} por ${formatCentsPEN(params.totalAmountCents)}. Consulta el estado en:\n${url}`;
  return sendEmail({ to: params.to, subject, html, text });
}

export async function sendOrderPaymentConfirmedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalAmountCents: number;
  providerReference: string;
  baseUrl: string;
  orderId: number;
}): Promise<SendEmailResult> {
  const url = `${params.baseUrl}/cuenta/pedidos/${params.orderId}`;
  const subject = `Pago confirmado — Pedido ${params.orderNumber} — INVESTMENTS`;
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Pago Confirmado</h1>
    <p>Hola, ${params.customerName}:</p>
    <p>Te confirmamos la recepción y verificación del pago de tu pedido <strong>${params.orderNumber}</strong> por <strong>${formatCentsPEN(params.totalAmountCents)}</strong>.</p>
    <p style="font-size: 13px; color: #5C574F;">Referencia de transacción: <code>${params.providerReference}</code></p>
    <p>Nuestro taller e inventario ya han asignado tus prendas en firme y comenzaremos la preparación del despacho.</p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Consultar mi pedido</a>
    </div>
  `,
  );
  const text = `Hola ${params.customerName},\n\nConfirmamos el pago de tu pedido ${params.orderNumber} (${formatCentsPEN(params.totalAmountCents)}). Referencia: ${params.providerReference}.\nDetalle: ${url}`;
  return sendEmail({ to: params.to, subject, html, text });
}

export async function sendOrderPaymentFailedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  reason: string;
  baseUrl: string;
  orderId: number;
}): Promise<SendEmailResult> {
  const url = `${params.baseUrl}/cuenta/pedidos/${params.orderId}`;
  const subject = `Acción requerida en el pago de tu pedido ${params.orderNumber} — INVESTMENTS`;
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #6E1A24; font-weight: 600;">No se pudo procesar el pago</h1>
    <p>Hola, ${params.customerName}:</p>
    <p>La transacción asociada a tu pedido <strong>${params.orderNumber}</strong> no pudo completarse.</p>
    <div style="background-color: #F4F1EA; padding: 14px; border-left: 3px solid #6E1A24; margin: 16px 0; font-size: 14px;">
      <strong>Detalle informado:</strong> ${params.reason}
    </div>
    <p>Puedes ingresar al detalle de tu pedido para reintentar el pago mientras tu reserva siga vigente o generar una nueva compra.</p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Revisar y reintentar pago</a>
    </div>
  `,
  );
  const text = `Hola ${params.customerName},\n\nNo se pudo completar el pago de tu pedido ${params.orderNumber}: ${params.reason}.\nRevisa tu pedido en: ${url}`;
  return sendEmail({ to: params.to, subject, html, text });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  carrierName: string | null;
  trackingNumber: string | null;
  baseUrl: string;
  orderId: number;
}): Promise<SendEmailResult> {
  const url = `${params.baseUrl}/cuenta/pedidos/${params.orderId}`;
  const subject = `Tu pedido ${params.orderNumber} está en camino — INVESTMENTS`;
  const trackingHtml =
    params.carrierName || params.trackingNumber
      ? `<div style="background-color: #FAF8F5; padding: 16px; border: 1px solid #E8E5E0; margin: 20px 0; font-size: 14px;">
          ${params.carrierName ? `<p style="margin: 0 0 6px;"><strong>Operador logístico:</strong> ${params.carrierName}</p>` : ""}
          ${params.trackingNumber ? `<p style="margin: 0;"><strong>Código de seguimiento:</strong> ${params.trackingNumber}</p>` : ""}
         </div>`
      : "";
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Pedido Despachado</h1>
    <p>Hola, ${params.customerName}:</p>
    <p>Tu pedido <strong>${params.orderNumber}</strong> ha salido de nuestro centro de distribución y se encuentra en ruta hacia la dirección de entrega indicada.</p>
    ${trackingHtml}
    <div style="text-align: center;">
      <a href="${url}" class="btn">Seguimiento del pedido</a>
    </div>
  `,
  );
  const text = `Hola ${params.customerName},\n\nTu pedido ${params.orderNumber} ha sido enviado.${params.trackingNumber ? ` Seguimiento: ${params.trackingNumber}` : ""}\nVer en: ${url}`;
  return sendEmail({ to: params.to, subject, html, text });
}

export async function sendOrderDeliveredEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  baseUrl: string;
  orderId: number;
}): Promise<SendEmailResult> {
  const url = `${params.baseUrl}/cuenta/pedidos/${params.orderId}`;
  const subject = `Pedido entregado ${params.orderNumber} — INVESTMENTS`;
  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Pedido Entregado</h1>
    <p>Hola, ${params.customerName}:</p>
    <p>Confirmamos que tu pedido <strong>${params.orderNumber}</strong> ha sido marcado como entregado satisfactoriamente.</p>
    <p>Gracias por confiar en la confección y sastrería de INVESTMENTS.</p>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Ver resumen del pedido</a>
    </div>
  `,
  );
  const text = `Hola ${params.customerName},\n\nTu pedido ${params.orderNumber} ha sido entregado. Gracias por elegir INVESTMENTS.\nDetalle: ${url}`;
  return sendEmail({ to: params.to, subject, html, text });
}

export async function sendTaxDocumentAvailableEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  documentType: "boleta" | "factura";
  seriesAndNumber: string;
  totalAmountCents: number;
  pdfUrl?: string | null;
  xmlUrl?: string | null;
  baseUrl: string;
  orderId: number;
}): Promise<SendEmailResult> {
  const url = `${params.baseUrl}/cuenta/pedidos/${params.orderId}`;
  const docLabel =
    params.documentType === "factura"
      ? "Factura Electrónica"
      : "Boleta de Venta Electrónica";
  const subject = `${docLabel} disponible (${params.seriesAndNumber}) — Pedido ${params.orderNumber} — INVESTMENTS`;

  const linksHtml =
    params.pdfUrl || params.xmlUrl
      ? `<p style="margin-top: 12px; font-size: 13px;">
          ${params.pdfUrl ? `<a href="${params.pdfUrl}" style="color: #6E1A24; font-weight: 600; margin-right: 16px;">Descargar PDF</a>` : ""}
          ${params.xmlUrl ? `<a href="${params.xmlUrl}" style="color: #6E1A24; font-weight: 600;">Descargar XML</a>` : ""}
         </p>`
      : "";

  const html = wrapTemplate(
    subject,
    `
    <h1 style="font-size: 22px; margin-top: 0; color: #141312; font-weight: 600;">Comprobante Electrónico Emitido</h1>
    <p>Hola, ${params.customerName}:</p>
    <p>Te informamos que tu <strong>${docLabel}</strong> correspondiente al pedido <strong>${params.orderNumber}</strong> ha sido emitida exitosamente.</p>
    <div style="background-color: #FAF8F5; padding: 16px; border: 1px solid #E8E5E0; margin: 20px 0; font-size: 14px;">
      <p style="margin: 0 0 6px;"><strong>Comprobante:</strong> ${docLabel} ${params.seriesAndNumber}</p>
      <p style="margin: 0;"><strong>Importe Total:</strong> ${formatCentsPEN(params.totalAmountCents)}</p>
      ${linksHtml}
    </div>
    <div style="text-align: center;">
      <a href="${url}" class="btn">Ver comprobante en mi cuenta</a>
    </div>
  `,
  );
  const text = `Hola ${params.customerName},\n\nTu ${docLabel} ${params.seriesAndNumber} del pedido ${params.orderNumber} (${formatCentsPEN(params.totalAmountCents)}) ya está disponible en:\n${url}`;
  return sendEmail({ to: params.to, subject, html, text });
}


