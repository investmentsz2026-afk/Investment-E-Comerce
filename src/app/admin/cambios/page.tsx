import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { productReturns } from "@/server/db/schema";
import {
  AdminExchangesManager,
  type ExchangeRecord,
} from "@/components/admin/admin-exchanges-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Gestión de Cambios y Devoluciones — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminExchangesPage() {
  await requireAdmin();

  const db = getDb();
  const rows = await db
    .select()
    .from(productReturns)
    .orderBy(desc(productReturns.createdAt));

  const exchanges: ExchangeRecord[] = rows.map((r) => {
    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(r.images || "[]");
    } catch {
      parsedImages = [];
    }

    return {
      id: r.id,
      ticketNumber: r.ticketNumber,
      userId: r.userId,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      orderNumber: r.orderNumber,
      taxDocNumber: r.taxDocNumber,
      requestType: r.requestType,
      reason: r.reason,
      currentProductDetails: r.currentProductDetails,
      requestedProductDetails: r.requestedProductDetails,
      customerNotes: r.customerNotes,
      images: Array.isArray(parsedImages) ? parsedImages : [],
      status: r.status,
      adminNotes: r.adminNotes,
      createdAtIso: r.createdAt.toISOString(),
      updatedAtIso: r.updatedAt.toISOString(),
    };
  });

  return (
    <div className="shell py-8 md:py-10 space-y-6">
      <div className="border-b border-ink/10 pb-5">
        <p className="kicker text-cochinilla">
          POST-VENTA Y ATENCIÓN AL CLIENTE · AMERICAN COLT JEANS™
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          Módulo de Cambios y Devoluciones
        </h1>
        <p className="mt-1 text-sm text-taupe-700">
          Administra las solicitudes de cambio de talla o modelo registradas por los clientes con su número de pedido, boleta, motivo, fotos de sustento y botón directo de WhatsApp.
        </p>
      </div>

      <AdminExchangesManager exchanges={exchanges} />
    </div>
  );
}
