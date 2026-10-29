import { requireAuth } from "@/server/auth/session";
import { getUserAddresses } from "@/server/queries/account";
import { AddressList } from "@/components/auth/address-list";

export const instant = false;

export default async function AddressesPage() {
  const { user } = await requireAuth("/cuenta/direcciones");
  const addresses = await getUserAddresses(user.id);

  return <AddressList addresses={addresses} />;
}
