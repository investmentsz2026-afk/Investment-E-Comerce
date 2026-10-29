/**
 * Registro de funcionalidades planificadas.
 * Toda acción visible que dependa de una fase futura debe referenciar una clave de este registro,
 * para que la interfaz comunique con claridad que aún no está operativa.
 *
 * Las funcionalidades de la Fase 2 (catálogo, producto, búsqueda) ya están implementadas
 * y se han removido de este registro.
 */
export const roadmap = {
  account: { label: "Tu cuenta INVESTMENTS", phase: 3 },
  "business-signup": { label: "El registro de cuentas empresariales", phase: 3 },
  favorites: { label: "La lista de favoritos", phase: 3 },
  cart: { label: "La bolsa de compras", phase: 4 },
  quotes: { label: "Las cotizaciones mayoristas", phase: 4 },
  newsletter: { label: "La suscripción al newsletter", phase: 5 },
  orders: { label: "El seguimiento de pedidos", phase: 5 },
  "customer-care": { label: "El centro de atención al cliente", phase: 5 },
  policies: { label: "Las políticas comerciales", phase: 5 },
  "complaints-book": { label: "El Libro de Reclamaciones virtual", phase: 5 },
} as const satisfies Record<string, { label: string; phase: number }>;

export type FeatureKey = keyof typeof roadmap;
