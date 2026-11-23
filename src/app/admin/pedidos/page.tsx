import { requireAdmin } from "@/server/auth/session";
import { getAdminOrdersList } from "@/server/queries/orders";
import { getOrSeedShippingZones } from "@/server/shipping/service";
import { AdminOrdersWorkspace } from "@/components/admin/admin-orders-workspace";

export const instant = false;

export const metadata = {
  title: "Pedidos, Despachos y SUNAT — Admin | American Colt",
  description:
    "Centro operativo de pedidos minoristas B2C y mayoristas B2B, actualización rápida de estados, SUNAT y zonas de envío.",
};

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const userIdRaw = typeof sp.userId === "string" ? Number(sp.userId) : undefined;
  const userIdFilter =
    userIdRaw && Number.isInteger(userIdRaw) && userIdRaw > 0
      ? userIdRaw
      : undefined;

  const initialFilters = {
    search: typeof sp.search === "string" ? sp.search : undefined,
    orderMode: typeof sp.orderMode === "string" ? sp.orderMode : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    paymentStatus:
      typeof sp.paymentStatus === "string" ? sp.paymentStatus : undefined,
    dateFrom: typeof sp.dateFrom === "string" ? sp.dateFrom : undefined,
    dateTo: typeof sp.dateTo === "string" ? sp.dateTo : undefined,
  };

  const [ordersList, shippingZones] = await Promise.all([
    getAdminOrdersList(userIdFilter ? { userId: userIdFilter } : undefined),
    getOrSeedShippingZones(),
  ]);

  return (
    <div className="space-y-6">
      <AdminOrdersWorkspace
        orders={ordersList}
        shippingZones={shippingZones}
        initialFilters={initialFilters}
      />
    </div>
  );
}
