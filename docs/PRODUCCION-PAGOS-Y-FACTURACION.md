# Guía de Configuración y Puesta en Producción: Pagos (Mercado Pago) y Facturación Electrónica (SUNAT / PSE / OSE)

Este documento técnico describe la arquitectura implementada en **INVESTMENTS** para el procesamiento de pagos y la emisión de comprobantes electrónicos en el Perú, las variables de entorno exactas que lee el servidor y los pasos verificables para activar los entornos de pruebas (*sandbox*) y producción.

> **Estado actual de las integraciones externas:**
> - **Código, adaptadores de servidor, validaciones de seguridad, firmas HMAC y persistencia en Neon PostgreSQL:** Implementados y verificados mediante pruebas unitarias y E2E.
> - **Conectividad en vivo con credenciales reales de producción:** **PENDIENTE DE CONFIGURACIÓN EXTERNA** (a la espera de que el propietario configure los secretos en `.env.local` o en las variables de entorno del servidor de despliegue).

---

## 1. Qué está implementado hoy en el código

1. **Pasarela de Pagos Desacoplada ([`src/server/payments/gateway.ts`](../src/server/payments/gateway.ts)):**
   - **Mercado Pago Perú (`mercadopago`):**
     - Construcción de solicitudes oficiales para `POST https://api.mercadopago.com/v1/payments` (pagos directos con token y encabezado `X-Idempotency-Key`) y `POST https://api.mercadopago.com/checkout/preferences` (preferencias de Checkout Pro).
     - Consulta y conciliación directa servidor-a-servidor mediante `GET https://api.mercadopago.com/v1/payments/{id}` (`verifyAndSyncMercadoPagoPaymentById`).
     - Validación estricta de moneda (`PEN`), monto exacto recalculado en el servidor (`order.totalAmount / 100`) y referencia externa (`external_reference === String(order.id)`).
     - Verificación criptográfica del encabezado oficial `x-signature` (`ts=...,v1=...`) junto con `x-request-id` y `data.id` usando `MERCADOPAGO_WEBHOOK_SECRET` (`verifyMercadoPagoWebhookSignature`).
     - Validación de separación de entornos (`validateMercadoPagoEnvironmentConsistency`) que impide usar tokens `TEST-...` cuando `MERCADOPAGO_ENV=production`.
   - **Culqi Perú (`culqi`):** Adaptador listo para `POST https://api.culqi.com/v2/charges` en céntimos de `PEN`.
   - **Transferencia Bancaria Corporativa (`bank_transfer`):** Reserva inventario por 30 minutos y permite conciliación administrativa auditada.
   - **Simulador Sandbox (`sandbox`):** Exclusivo para desarrollo y pruebas E2E; queda bloqueado automáticamente cuando `NODE_ENV=production` y `ENABLE_PAYMENT_SANDBOX=false`.

2. **Facturación Electrónica Peruana SUNAT vía PSE / OSE ([`src/server/tax/sunat-service.ts`](../src/server/tax/sunat-service.ts)):**
   - Adaptador alineado con la especificación JSON oficial de **Nubefact PSE/OSE** (`operacion: "generar_comprobante"` y `operacion: "consultar_comprobante"`).
   - Mapeo oficial del Catálogo N° 06 de SUNAT: `1` = DNI, `4` = Carnet de Extranjería, `6` = RUC.
   - Desglose matemático exacto de Base Imponible (Operación Gravada) e IGV (18%) por ítem (`unidad_de_medida: "NIU"`, `tipo_de_igv: 1`) y por servicio de despacho logístico (`unidad_de_medida: "ZZ"`).
   - Garantía de no falsificación: si `SUNAT_PSE_ENABLED` es `false` o faltan credenciales/series, el comprobante se guarda como `pending_config` sin inventar series (`B001`/`F001`), correlativos ni respuestas CDR de SUNAT.
   - Botones administrativos en `/admin/pedidos/[id]` para **Emitir / Reintentar Comprobante PSE** y **Consultar Estado SUNAT**.

---

## 2. Qué está probado con pruebas automatizadas vs. qué requiere credenciales reales

### Probado y verificado localmente (`npm run test` y `node scripts/test-phase5-e2e.mjs`)
- Recálculo de precios minoristas, mayoristas, descuentos por cotización B2B, tarifas de envío por departamento/provincia/distrito e IGV 18% exclusivamente en el servidor.
- Construcción del payload oficial de Mercado Pago (`v1/payments` y `checkout/preferences`) y validación contra adulteración de monto, moneda (`PEN`) o referencia de pedido.
- Verificación criptográfica de firmas HMAC-SHA256 tanto para el formato oficial de Mercado Pago (`x-signature: ts=...,v1=...`) como para webhooks firmados en `/api/webhooks/payments`.
- Rechazo de eventos con firma falsa (`HTTP 401`), idempotencia ante webhooks repetidos (`duplicate: true`) y protección frente a eventos fuera de orden.
- Bloqueo de pagos `sandbox` cuando el entorno es `production` y bloqueo de llaves `TEST-...` cuando `MERCADOPAGO_ENV=production`.
- Construcción del payload JSON de Boleta (`tipo_de_comprobante: 2`, DNI `1`) y Factura (`tipo_de_comprobante: 1`, RUC `6`) con detalle de ítems para Nubefact PSE/OSE.
- Reserva atómica de stock, descuento idempotente al confirmar pago, liberación automática al vencer/cancelar y reposición por reembolso (`refund_restock`).

### Pendiente de prueba con credenciales reales externas
- Cobro real con tarjeta / Yape en los servidores de Mercado Pago (Sandbox y Producción).
- Recepción desde internet público del webhook saliente de Mercado Pago hacia el dominio productivo de INVESTMENTS.
- Timbrado real de CPE (XML firmado, PDF y CDR de SUNAT) contra la URL y Token activos contratados en Nubefact (u otro PSE/OSE).

---

## 3. Variables de Entorno Exactas

Configura estas variables en `.env.local` (desarrollo) o en el panel de variables de entorno de tu servidor de producción. **Nunca agregues el prefijo `NEXT_PUBLIC_` a un token privado o secreto de webhook.**

### 3.1 Pasarela de Pagos — Mercado Pago Perú
| Variable | Tipo | Ejemplo / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `ENABLE_PAYMENT_SANDBOX` | Servidor | `false` (en producción) / `true` (en local) | Habilita o deshabilita la pasarela simulada interna de pruebas. En producción debe ser `false`. |
| `MERCADOPAGO_ENV` | Servidor | `sandbox` \| `production` | Define el entorno activo de Mercado Pago. En `production` rechaza tokens `TEST-...`. |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Pública | `TEST-...` o `APP_USR-...` | Public Key de tu aplicación en Mercado Pago Developers (segura para el navegador). |
| `MERCADOPAGO_ACCESS_TOKEN` | **Privada (Servidor)** | `TEST-...` o `APP_USR-...` | Access Token privado para invocar `api.mercadopago.com`. **Jamás exponer en el cliente.** |
| `MERCADOPAGO_WEBHOOK_SECRET` | **Privada (Servidor)** | Cadena hexadecimal secreta | Clave secreta generada en el panel de Webhooks de Mercado Pago para verificar el header `x-signature`. |
| `PAYMENT_WEBHOOK_SECRET` | **Privada (Servidor)** | Cadena aleatoria de 32+ bytes | Secreto HMAC-SHA256 para webhooks genéricos o de Culqi (`x-webhook-signature`). |

### 3.2 Transferencia Bancaria Corporativa (Opcional)
| Variable | Tipo | Descripción |
| :--- | :--- | :--- |
| `BANK_TRANSFER_BANK_NAME` | Servidor | Nombre del banco recaudador (ej. `BCP Soles`). |
| `BANK_TRANSFER_HOLDER` | Servidor | Razón social titular de la cuenta (ej. `INVESTMENTS S.A.C.`). |
| `BANK_TRANSFER_RUC` | Servidor | Número de RUC de INVESTMENTS S.A.C. |
| `BANK_TRANSFER_ACCOUNT_PEN` | Servidor | Número de cuenta corriente en Soles (`PEN`). |
| `BANK_TRANSFER_CCI_PEN` | Servidor | Código de Cuenta Interbancario (CCI de 20 dígitos). |

### 3.3 Facturación Electrónica — SUNAT vía PSE / OSE (Nubefact)
| Variable | Tipo | Ejemplo / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `SUNAT_PSE_ENABLED` | Servidor | `false` \| `true` | Interruptor maestro. Solo transmite comprobantes al PSE/OSE cuando es exactamente `true`. |
| `SUNAT_PSE_ENV` | Servidor | `sandbox` \| `production` | Indica si las credenciales apuntan al entorno de pruebas/homologación o a producción oficial SUNAT. |
| `SUNAT_PSE_PROVIDER_NAME` | Servidor | `Nubefact PSE/OSE` | Nombre descriptivo del proveedor registrado en auditoría. |
| `SUNAT_PSE_API_URL` | **Privada (Servidor)** | `https://api.nubefact.com/api/v1/...` | Ruta REST API única asignada a tu RUC en Nubefact (` Ver Ruta y Token`). |
| `SUNAT_PSE_API_TOKEN` | **Privada (Servidor)** | Token alfanumérico | Token de autorización Bearer provisto por Nubefact. **Jamás exponer en el cliente.** |
| `SUNAT_PSE_SERIE_BOLETA` | Servidor | `BBB1` o `B001` | Serie autorizada en tu cuenta PSE/OSE para Boletas de Venta Electrónicas. |
| `SUNAT_PSE_SERIE_FACTURA` | Servidor | `FFF1` o `F001` | Serie autorizada en tu cuenta PSE/OSE para Facturas Electrónicas. |

### 3.4 Correo Transaccional y Sitio
| Variable | Tipo | Descripción |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | **Privada (Servidor)** | API Key de Resend para el despacho real de correos de pedido recibido, pago confirmado, envío, entrega y comprobante emitido. |
| `EMAIL_FROM` | Servidor | Remitente verificado (ej. `"INVESTMENTS <no-reply@investments.pe>"`). |
| `NEXT_PUBLIC_SITE_URL` | Pública | URL base canónica con `https://` en producción (usada para enlaces en correos y `notification_url` de webhooks). |

---

## 4. Cómo configurar Mercado Pago en Sandbox y pasar a Producción

### Paso A: Pruebas en Sandbox de Mercado Pago
1. Ingresa a [Mercado Pago Developers Perú](https://www.mercadopago.com.pe/developers/panel) y selecciona tu aplicación.
2. En **Credenciales de prueba**, copia la `Public Key` (`TEST-...`) y el `Access Token` (`TEST-...`).
3. En la sección **Webhooks → Configurar notificaciones**, registra la URL de tu servidor:
   `https://TU-DOMINIO/api/webhooks/payments`
   Selecciona el evento **Pagos (`payment`)** y copia la **Clave secreta** (`MERCADOPAGO_WEBHOOK_SECRET`).
4. En `.env.local`, configura:
   ```env
   MERCADOPAGO_ENV=sandbox
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key
   MERCADOPAGO_ACCESS_TOKEN=TEST-tu-access-token
   MERCADOPAGO_WEBHOOK_SECRET=tu-clave-secreta-webhook
   ```
5. Reinicia el servidor y realiza una compra de prueba en `/checkout` seleccionando **Mercado Pago Perú**.
6. Verifica en `/admin/pedidos/[id]` que la transacción y el webhook entrante aparezcan con `Firma válida: Sí` y que el pedido pase a `paid` únicamente tras la confirmación del servidor.

### Paso B: Paso a Producción de Mercado Pago
1. Activa tus **Credenciales de producción** (`APP_USR-...`) en el panel de Mercado Pago.
2. Cambia en las variables de entorno del servidor de producción:
   ```env
   ENABLE_PAYMENT_SANDBOX=false
   MERCADOPAGO_ENV=production
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key-prod
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token-prod
   MERCADOPAGO_WEBHOOK_SECRET=tu-clave-secreta-webhook-prod
   ```
3. El validador `validateMercadoPagoEnvironmentConsistency` bloqueará automáticamente cualquier intento de operar si detecta por error una llave `TEST-...` cuando `MERCADOPAGO_ENV=production`.

---

## 5. Cómo configurar el proveedor PSE/OSE (Nubefact) en Pruebas y pasar a Producción

### Paso A: Pruebas / Homologación en Nubefact
1. Ingresa a tu cuenta de **Nubefact** con el RUC de la empresa.
2. Ve a **API - Integración** y copia la **Ruta (URL)** y el **Token** de tu entorno de demostración/pruebas.
3. Verifica cuáles son las series habilitadas en modo demo (por ejemplo, `BBB1` para Boletas y `FFF1` para Facturas).
4. En `.env.local`, configura:
   ```env
   SUNAT_PSE_ENABLED=true
   SUNAT_PSE_ENV=sandbox
   SUNAT_PSE_PROVIDER_NAME="Nubefact PSE/OSE"
   SUNAT_PSE_API_URL=https://api.nubefact.com/api/v1/tu-ruta
   SUNAT_PSE_API_TOKEN=tu-token-privado
   SUNAT_PSE_SERIE_BOLETA=BBB1
   SUNAT_PSE_SERIE_FACTURA=FFF1
   ```
5. Para probar la emisión controlada sin afectar otros pedidos:
   - Entra como administrador a `/admin/pedidos/[id]` de un pedido pagado.
   - Haz clic en **Emitir / Reintentar Comprobante PSE**.
   - Verifica que el estado del comprobante cambie a `issued`, que se guarden la serie, el número correlativo, el hash CPE y los enlaces reales a PDF/XML/CDR devueltos por Nubefact.

### Paso B: Paso a Producción Oficial ante SUNAT
1. Una vez dado de alta el PSE/OSE en tu Clave SOL de SUNAT y creadas las series oficiales (ej. `B001` y `F001`) en el panel de producción de Nubefact:
2. Actualiza las variables del servidor de producción:
   ```env
   SUNAT_PSE_ENABLED=true
   SUNAT_PSE_ENV=production
   SUNAT_PSE_API_URL=https://api.nubefact.com/api/v1/tu-ruta-produccion
   SUNAT_PSE_API_TOKEN=tu-token-produccion
   SUNAT_PSE_SERIE_BOLETA=B001
   SUNAT_PSE_SERIE_FACTURA=F001
   ```
3. A partir de ese momento, todo pedido cuyo pago sea confirmado (`paid`) emitirá su Boleta o Factura Electrónica automáticamente y enviará el correo `sendTaxDocumentAvailableEmail` al cliente con el enlace de descarga del PDF y XML.
4. Si en algún momento el servidor del PSE/OSE experimenta una caída temporal, el pedido **no se pierde**: el comprobante queda registrado con estado `error` y el administrador puede reintentar la transmisión o consultar su estado desde `/admin/pedidos/[id]` con un clic.

---

## 6. Revisión de Tarifas de Envío antes de Producción

Las zonas de envío iniciales sembradas en PostgreSQL (`LIMA_METRO`, `CALLAO_METRO`, `LIMA_PROVINCIAS`, `COSTA_SUR_NORTE`, `PERU_NACIONAL_GENERAL`, `ZONA_NO_DISPONIBLE_ISLAS`) contienen tarifas y umbrales de envío gratis referenciales. Antes de abrir el sitio al público:
1. Ingresa como administrador a `/admin/pedidos`.
2. En el panel **Tarifas de Envío Configurables por Zona (Perú)**, actualiza los importes en Soles (`S/`), los montos mínimos para envío gratuito y los plazos de entrega según el tarifario vigente de tus operadores logísticos (Olva Courier, Shalom, Urbano, etc.).
3. Haz clic en **Guardar** en cada zona; cada modificación queda registrada en el historial de auditoría.

