import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { newsletterSubscribers } from "@/server/db/schema";
import {
  AdminSubscriptionsManager,
  type SubscriberItem,
} from "@/components/admin/admin-subscriptions-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Módulo de Suscripciones (Club VIP) — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminSubscriptionsPage() {
  await requireAdmin();

  const db = getDb();
  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt));

  const subscribers: SubscriberItem[] = rows.map((r) => ({
    id: r.id,
    firstName: r.firstName ?? "",
    lastName: r.lastName ?? "",
    phone: r.phone ?? "",
    email: r.email,
    isActive: r.isActive,
    createdAtIso: r.createdAt.toISOString(),
    updatedAtIso: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminSubscriptionsManager subscribers={subscribers} />
    </div>
  );
}
