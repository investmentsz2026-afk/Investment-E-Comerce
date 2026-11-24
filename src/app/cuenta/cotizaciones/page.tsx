import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { isUserAuthorizedForWholesale } from "@/server/pricing/engine";
import {
  getApprovedCompanyForUser,
  getUserWholesaleQuotes,
  getWholesaleCatalogSelectorItems,
} from "@/server/queries/quotes";
import { getCartSnapshot } from "@/server/cart/service";
import { WholesaleQuotesPortal } from "@/components/quotes/wholesale-quotes-portal";

export const metadata: Metadata = {
  title: "Cotizaciones B2B | Mi Cuenta · American Colt JEANS™",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AccountQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; productSlug?: string }>;
}) {
  const [{ user }, params] = await Promise.all([
    requireAuth("/cuenta/cotizaciones"),
    searchParams,
  ]);
  const isAuthorized = isUserAuthorizedForWholesale(user);

  if (!isAuthorized) {
    redirect("/cuenta/mayorista");
  }

  const [company, catalogProducts, userQuotes, cartSnapshot] = await Promise.all([
    getApprovedCompanyForUser(user.id),
    getWholesaleCatalogSelectorItems(),
    getUserWholesaleQuotes(user.id),
    params.from === "cart" ? getCartSnapshot() : Promise.resolve(null),
  ]);

  const initialLines =
    cartSnapshot && cartSnapshot.items.length > 0
      ? cartSnapshot.items.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
        }))
      : [];

  return (
    <WholesaleQuotesPortal
      user={{ id: user.id, role: user.role }}
      isAuthorized={isAuthorized}
      company={company}
      catalogProducts={catalogProducts}
      userQuotes={userQuotes}
      initialLines={initialLines}
      preselectedProductSlug={params.productSlug}
      embedded
      basePath="/cuenta/cotizaciones"
    />
  );
}
