import type { Metadata } from "next";
import { getCurrentSession } from "@/server/auth/session";
import { isUserAuthorizedForWholesale } from "@/server/pricing/engine";
import {
  getApprovedCompanyForUser,
  getUserWholesaleQuotes,
  getWholesaleCatalogSelectorItems,
} from "@/server/queries/quotes";
import { getCartSnapshot } from "@/server/cart/service";
import { WholesaleQuotesPortal } from "@/components/quotes/wholesale-quotes-portal";

export const metadata: Metadata = {
  title: "Cotizaciones Mayoristas B2B | American Colt JEANS™",
  description:
    "Solicita cotizaciones por volumen, selecciona tallas y colores de nuestro catálogo textil y gestiona tus propuestas comerciales en American Colt JEANS™.",
};

export const instant = false;

export default async function MayoristaCotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; productSlug?: string }>;
}) {
  const [{ user }, params] = await Promise.all([getCurrentSession(), searchParams]);
  const isAuthorized = isUserAuthorizedForWholesale(user);

  const [company, catalogProducts, userQuotes, cartSnapshot] = await Promise.all([
    user && isAuthorized ? getApprovedCompanyForUser(user.id) : Promise.resolve(null),
    getWholesaleCatalogSelectorItems(),
    user && isAuthorized ? getUserWholesaleQuotes(user.id) : Promise.resolve([]),
    user && params.from === "cart" ? getCartSnapshot() : Promise.resolve(null),
  ]);

  const initialLines =
    cartSnapshot && cartSnapshot.items.length > 0
      ? cartSnapshot.items.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
        }))
      : [];

  return (
    <div className="bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 pt-[7rem] pb-16 sm:pt-[7.25rem] lg:pt-[10.75rem] lg:pb-24">
      <div className="shell">
        <WholesaleQuotesPortal
          user={user ? { id: user.id, role: user.role } : null}
          isAuthorized={isAuthorized}
          company={company}
          catalogProducts={catalogProducts}
          userQuotes={userQuotes}
          initialLines={initialLines}
          preselectedProductSlug={params.productSlug}
          basePath="/mayorista/cotizaciones"
        />
      </div>
    </div>
  );
}
