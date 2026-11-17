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
    <div className="shell py-8 md:py-10 space-y-6">
      <div className="border-b border-ink/10 pb-5">
        <p className="kicker text-cochinilla">CLUB VIP AMERICAN COLT JEANS™ · MARKETING Y LEADS</p>
        <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          Módulo de Suscripciones
        </h1>
        <p className="mt-1 text-sm text-taupe-700">
          Visualiza y administra todas las personas que se suscriben en la tienda con su Nombre, Apellido, Celular (WhatsApp) y Correo Electrónico.
        </p>
      </div>

      <AdminSubscriptionsManager subscribers={subscribers} />
    </div>
  );
}
