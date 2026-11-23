import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminApplications, getAdminAuditLogs } from "@/server/queries/admin";
import { AdminB2BApplicationsWorkspace } from "@/components/admin/admin-b2b-applications-workspace";

export const metadata: Metadata = {
  title: "Panel Administrativo — Solicitudes B2B | American Colt JEANS™",
  description: "Gestión y evaluación de solicitudes comerciales mayoristas.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface AdminPageProps {
  searchParams: Promise<{ estado?: string; q?: string }>;
}

export default async function AdminApplicationsPage({
  searchParams,
}: AdminPageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const [{ items }, auditLogs] = await Promise.all([
    getAdminApplications({
      page: 1,
      pageSize: 500,
    }),
    getAdminAuditLogs(20),
  ]);

  return (
    <div className="space-y-6">
      <AdminB2BApplicationsWorkspace
        applications={items}
        auditLogs={auditLogs}
        initialStatus={sp.estado}
        initialSearch={sp.q}
      />
    </div>
  );
}
