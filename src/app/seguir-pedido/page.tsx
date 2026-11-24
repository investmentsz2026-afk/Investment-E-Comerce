import type { Metadata } from "next";
import { getCurrentSession } from "@/server/auth/session";
import {
  getPublicOrderTracking,
  getRecentOrderNumbersForUser,
} from "@/server/queries/orders";
import { OrderTrackerClient } from "@/components/orders/order-tracker-client";

export const metadata: Metadata = {
  title: "Seguir mi Pedido — Rastreo en Vivo | American Colt JEANS™",
  description:
    "Consulta en tiempo real el estado de tu pedido American Colt JEANS™: validación de pago, preparación en almacén, número de seguimiento courier y evidencia de entrega.",
};

export const instant = false;

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const [{ user }, params] = await Promise.all([
    getCurrentSession(),
    searchParams,
  ]);

  const rawCode = (params.codigo ?? "").trim();

  const [initialOrder, recentOrders] = await Promise.all([
    rawCode
      ? getPublicOrderTracking(
          rawCode,
          user ? { id: user.id, role: user.role } : null,
        )
      : Promise.resolve(null),
    user ? getRecentOrderNumbersForUser(user.id) : Promise.resolve([]),
  ]);

  const initialNotFound = Boolean(rawCode && !initialOrder);

  return (
    <div className="bg-gradient-to-b from-slate-50/80 via-white to-slate-50/60 pt-[7rem] pb-16 sm:pt-[7.25rem] lg:pt-[10.75rem] lg:pb-20">
      <div className="shell">
        <OrderTrackerClient
          initialQuery={rawCode}
          initialOrder={initialOrder}
          initialNotFound={initialNotFound}
          recentOrders={recentOrders}
        />
      </div>
    </div>
  );
}
