import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminWholesaleQuotes } from "@/server/queries/quotes";
import { AdminQuotesWorkspace } from "@/components/admin/admin-quotes-workspace";

export const metadata: Metadata = {
  title: "Gestión de Cotizaciones B2B | Admin American Colt",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminCotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const quotes = await getAdminWholesaleQuotes({});

  return (
    <div className="space-y-6">
      <AdminQuotesWorkspace
        quotes={quotes}
        initialStatus={params.status}
        initialSearch={params.q}
      />
    </div>
  );
}
