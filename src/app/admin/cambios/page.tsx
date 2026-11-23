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
    <div className="space-y-6">
      <AdminExchangesManager exchanges={exchanges} />
    </div>
  );
}
