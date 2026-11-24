import type { Metadata } from "next";
import { requireAuth } from "@/server/auth/session";
import { getUserBusinessApplication } from "@/server/queries/account";
import { WholesaleStatusView } from "@/components/wholesale/wholesale-status-view";

export const metadata: Metadata = {
  title: "Estado Mayorista B2B | Mi Cuenta · American Colt JEANS™",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AccountWholesaleStatusPage() {
  const { user } = await requireAuth("/cuenta/mayorista");
  const app = await getUserBusinessApplication(user.id);

  return (
    <WholesaleStatusView
      userRole={user.role}
      app={app}
      quotesHref="/cuenta/cotizaciones"
    />
  );
}
