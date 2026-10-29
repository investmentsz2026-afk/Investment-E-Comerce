import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminApplications, getAdminAuditLogs } from "@/server/queries/admin";
import { ApplicationFilterBar } from "@/components/admin/application-filter-bar";
import { Building2, ArrowRight, ShieldCheck, History } from "lucide-react";

export const metadata: Metadata = {
  title: "Panel Administrativo — Solicitudes B2B | INVESTMENTS",
  description: "Gestión y evaluación de solicitudes comerciales mayoristas.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface AdminPageProps {
  searchParams: Promise<{ estado?: string; q?: string; pagina?: string }>;
}

export default async function AdminApplicationsPage({ searchParams }: AdminPageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const page = sp.pagina ? parseInt(sp.pagina, 10) : 1;

  const [{ items, total, totalPages, page: currentPage }, auditLogs] = await Promise.all([
    getAdminApplications({
      status: sp.estado,
      search: sp.q,
      page,
      pageSize: 15,
    }),
    getAdminAuditLogs(10),
  ]);

  const badgeStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900 border-amber-300",
    under_review: "bg-blue-100 text-blue-900 border-blue-300",
    approved: "bg-emerald-100 text-emerald-900 border-emerald-300",
    rejected: "bg-cochinilla/10 text-cochinilla border-cochinilla/30",
    suspended: "bg-rose-100 text-rose-900 border-rose-300",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    under_review: "En evaluación",
    approved: "Aprobada",
    rejected: "Rechazada",
    suspended: "Suspendida",
  };

  return (
    <div className="py-8 sm:py-10">
      <div className="shell space-y-8">
        {/* Cabecera */}
        <div className="border-b border-ink/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cochinilla">
              <ShieldCheck className="size-4" aria-hidden />
              <span>Administración de Plataforma</span>
            </div>
            <h1 className="mt-2 font-display text-display-md text-ink">
              Solicitudes Mayoristas B2B
            </h1>
            <p className="mt-1 text-xs text-taupe-500">
              Evaluación comercial, verificación de RUC y control de acceso mayorista.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cuenta"
              className="border border-ink/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-ink hover:border-ink"
            >
              Volver a mi cuenta
            </Link>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <ApplicationFilterBar />

        {/* Tabla de solicitudes */}
        <div className="border border-ink/15 bg-paper shadow-sm overflow-hidden">
          <div className="p-4 bg-paper/60 border-b border-ink/10 flex items-center justify-between text-xs text-taupe-600">
            <span>
              Total: <strong className="text-ink font-mono">{total}</strong>{" "}
              {total === 1 ? "solicitud" : "solicitudes"}
            </span>
            {totalPages > 1 && (
              <span className="font-mono">
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-16 text-center">
              <Building2 className="mx-auto size-10 text-taupe-400" aria-hidden />
              <p className="mt-4 text-sm font-medium text-ink">No se encontraron solicitudes</p>
              <p className="mt-1 text-xs text-taupe-500">
                Prueba cambiando los filtros de estado o el término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/[0.02] text-[0.68rem] font-medium uppercase tracking-[0.12em] text-taupe-500">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Empresa / Razón Social</th>
                    <th className="py-3 px-4">RUC</th>
                    <th className="py-3 px-4">Contacto / Correo</th>
                    <th className="py-3 px-4">Volumen Estimado</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-ink/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-taupe-400">#{item.id}</td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/solicitudes/${item.id}`}
                          className="font-medium text-ink hover:underline text-sm block"
                        >
                          {item.legalName}
                        </Link>
                        <span className="text-taupe-500 text-[0.72rem]">{item.tradeName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-ink">{item.taxId}</td>
                      <td className="py-3.5 px-4">
                        <p className="text-ink">{item.contactName}</p>
                        <p className="text-taupe-500 font-mono text-[0.7rem]">{item.contactEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 text-taupe-700">{item.estimatedVolume}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider ${
                            badgeStyles[item.status] ?? "bg-taupe-100"
                          }`}
                        >
                          {statusLabels[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-taupe-500 font-mono text-[0.72rem]">
                        {new Date(item.createdAt).toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/solicitudes/${item.id}`}
                          className="inline-flex items-center gap-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-ink hover:text-cochinilla"
                        >
                          Revisar
                          <ArrowRight className="size-3" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Registro de Auditoría Reciente */}
        <div className="border border-ink/10 bg-paper p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
            <History className="size-4 text-taupe-500" aria-hidden />
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
              Registro reciente de decisiones y seguridad (Auditoría)
            </h2>
          </div>

          <div className="space-y-3 divide-y divide-ink/5 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <span className="font-mono uppercase font-semibold text-[0.65rem] text-cochinilla bg-cochinilla/5 px-2 py-0.5 mr-2">
                    {log.action}
                  </span>
                  <span className="text-ink">{log.details}</span>
                </div>
                <div className="text-taupe-400 font-mono text-[0.68rem] shrink-0">
                  {new Date(log.createdAt).toLocaleString("es-PE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
