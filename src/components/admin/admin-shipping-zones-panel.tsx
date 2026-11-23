"use client";

import type { ShippingZoneRecord } from "@/server/shipping/service";
import { AdminShippingManager } from "@/components/admin/admin-shipping-manager";

export function AdminShippingZonesPanel({
  zones,
}: {
  zones: ShippingZoneRecord[];
}) {
  return <AdminShippingManager initialZones={zones} mode="provinces_only" />;
}
