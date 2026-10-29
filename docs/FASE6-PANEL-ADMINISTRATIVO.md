# FASE 6 — PANEL ADMINISTRATIVO COMERCIAL Y GESTIÓN INTEGRAL DE INVESTMENTS

Este documento describe la arquitectura, reglas de negocio, seguridad y operación del **Panel Administrativo Comercial Integral** implementado en la **Fase 6** sobre la plataforma B2C/B2B **INVESTMENTS** (Next.js App Router, TypeScript, Drizzle ORM y Neon PostgreSQL).

---

## 1. Arquitectura de Módulos Administrativos

Todas las rutas bajo `/admin/*` están protegidas en el servidor por [`AdminLayout`](file:///d:/InvestementPag/src/app/admin/layout.tsx) y [`requireAdmin()`](file:///d:/InvestementPag/src/server/auth/session.ts), además de contar con directivas `robots: { index: false, follow: false }` y bloqueo explícito en [`src/app/robots.ts`](file:///d:/InvestementPag/src/app/robots.ts).

| Módulo | Ruta | Consultas de Servidor | Acciones de Servidor |
| :--- | :--- | :--- | :--- |
| **6.1 Centro de Control Principal** | `/admin` | [`getAdminCommercialDashboard`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts) | Filtros dinámicos por rango de fechas, canal (`retail` / `wholesale`) y estado |
| **6.2 Gestión de Productos** | `/admin/productos`, `/admin/productos/nuevo`, `/admin/productos/[id]` | [`getAdminProductsCatalog`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts), [`getAdminProductDetail`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts) | [`adminSaveProductAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts), [`adminSetProductStatusAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts) |
| **6.3 Categorías y Subcategorías** | `/admin/categorias` | [`getAdminCategoriesCatalog`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts) | [`adminSaveCategoryAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts), [`adminDeleteOrArchiveCategoryAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts) |
| **6.4 Precios, Promociones y Reglas B2B/B2C** | `/admin/promociones` | [`getAdminPromotionsCatalog`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts) | [`adminSavePromotionAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts), [`adminTogglePromotionStatusAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts) |
| **6.5 Inventario y Kardex de Stock** | `/admin/inventario` | [`getAdminInventoryCatalog`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts) | [`adminAdjustInventoryAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts), [`recordAdminInventoryAdjustment`](file:///d:/InvestementPag/src/server/inventory/service.ts) |
| **6.6 Clientes y Empresas Mayoristas** | `/admin/clientes`, `/admin/clientes/[id]`, `/admin/solicitudes` | [`getAdminCustomersCatalog`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts), [`getAdminCustomerDetail`](file:///d:/InvestementPag/src/server/queries/admin-commerce.ts) | [`adminSetCustomerActiveStateAction`](file:///d:/InvestementPag/src/server/actions/admin-commerce.ts), [`reviewApplicationAction`](file:///d:/InvestementPag/src/server/actions/admin.ts) |
| **6.7 Gestión Comercial de Pedidos** | `/admin/pedidos`, `/admin/pedidos/[id]` | [`getAdminOrdersList`](file:///d:/InvestementPag/src/server/queries/orders.ts), [`getOrderDetailForUser`](file:///d:/InvestementPag/src/server/queries/orders.ts) | [`adminUpdateOrderAction`](file:///d:/InvestementPag/src/server/actions/orders.ts), [`adminUpdateShippingZoneAction`](file:///d:/InvestementPag/src/server/actions/orders.ts) |

---

## 2. Reglas de Precios B2C, Escalas B2B y Promociones (`src/server/pricing/engine.ts`)

1. **Autoridad exclusiva en el servidor**: Todos los precios se almacenan y calculan en céntimos enteros de Soles (`PEN`). El cliente jamás puede enviar ni manipular importes ni porcentajes de descuento.
2. **Clientes Minoristas (`customer` / visitante)**:
   - Reciben el precio minorista (`retail`) o, si existe una promoción activa en la tabla `promotions` dentro del rango `[startsAt, endsAt]` que aplique al producto o categoría, reciben automáticamente el descuento porcentual vigente.
3. **Empresas Mayoristas Aprobadas (`business_approved` activas)**:
   - Acceden a las escalas mayoristas por volumen (`wholesale`) configuradas por producto, acumulando unidades entre distintas tallas y colores del mismo modelo.
   - **Prevención de conflictos B2C/B2B**: Los descuentos promocionales minoristas (`retail`) no se apilan sobre los tramos mayoristas negociados. Si excepcionalmente una promoción vigente ofreciera un precio unitario inferior al tramo mayorista alcanzado, el motor otorga siempre el precio autorizado más favorable para el comprador.
4. **Inmutabilidad histórica**: Los pedidos creados en `orders` y `order_items` guardan snapshots inmutables (`retailUnitPriceSnapshot`, `unitPriceSnapshot`, `lineSubtotalAmount`, `appliedPriceLabel`). Cambiar precios o promociones nunca altera órdenes pasadas.

---

## 3. Reglas de Inventario, Reservas y Kardex (`src/server/inventory/service.ts`)

1. **Operaciones administrativas soportadas**:
   - `entry` (Entrada de lote / reposición): incrementa el stock disponible (`+delta`).
   - `shrinkage` (Baja por merma / pérdida): descuenta stock disponible (`-delta`) verificando atómicamente `WHERE stock >= abs(delta)`.
   - `adjustment` (Ajuste manual de conteo): aplica delta positivo o negativo verificando que el stock resultante nunca sea menor que `0`.
2. **Respeto a reservas activas de pedidos**: Las operaciones administrativas modifican `product_variants.stock` mediante actualizaciones SQL atómicas sin sobrescribir ni destruir los registros activos en `inventory_reservations`.
3. **Auditoría doble**: Cada ajuste administrativo exige un motivo obligatorio y registra una fila en `inventory_movements` (kardex con `stockBefore`, `stockAfter`, `quantityDelta`, `actorId` e `idempotencyKey`) y un evento en `audit_logs`.

