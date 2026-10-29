import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getAdminApplicationById } from "@/server/queries/admin";
import { ReviewActionForm } from "@/components/admin/review-action-form";
import { Building2, User, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Detalle de Solicitud Comercial | Admin INVESTMENTS",
  robots: { index: false, follow: false },
};

export const instant = false;

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminApplicationDetailPage({ params }: DetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const appId = parseInt(id, 10);
  if (isNaN(appId)) notFound();

  const app = await getAdminApplicationById(appId);
  if (!app) notFound();

  const badgeStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900 border-amber-300",
    under_review: "bg-blue-100 text-blue-900 border-blue-300",
    approved: "bg-emerald-100 text-emerald-900 border-emerald-300",
    rejected: "bg-cochinilla/10 text-cochinilla border-cochinilla/30",
    suspended: "bg-rose-100 text-rose-900 border-rose-300",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente de revisión",
    under_review: "En evaluación comercial",
    approved: "Empresa Aprobada",
    rejected: "Solicitud Rechazada",
    suspended: "Acceso Suspendido",
  };

  return (
    <div className="py-8 sm:py-10">
      <div className="shell max-w-4xl space-y-8">
        {/* Enlace de regreso */}
        <div>
          <Link
            href="/admin/solicitudes"
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-taupe-600 hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver a la lista de solicitudes
          </Link>
        </div>

        {/* Cabecera del expediente */}
        <div className="border-b border-ink/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-taupe-400">Expediente #{app.id}</span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                  badgeStyles[app.status] ?? "bg-taupe-100"
                }`}
              >
                {statusLabels[app.status] ?? app.status}
              </span>
            </div>
            <h1 className="mt-2 font-display text-display-md text-ink">{app.legalName}</h1>
            <p className="mt-1 text-xs text-taupe-500">
              Nombre comercial: <strong className="text-ink">{app.tradeName}</strong> · RUC:{" "}
              <strong className="text-ink font-mono">{app.taxId}</strong>
            </p>
          </div>

          <div className="text-xs text-taupe-500 font-mono text-right">
            <p>
              Presentada:{" "}
              {new Date(app.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {app.reviewedAt && (
              <p className="mt-0.5 text-emerald-800">
                Última revisión:{" "}
                {new Date(app.reviewedAt).toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Expediente: Datos de la Empresa y Representante */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta Empresa */}
          <div className="border border-ink/10 bg-paper p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-2.5">
              <Building2 className="size-4 text-taupe-500" aria-hidden />
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                Datos de la Empresa
              </h2>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Razón Social</p>
                <p className="font-medium text-ink text-sm">{app.legalName}</p>
              </div>
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Nombre Comercial</p>
                <p className="font-medium text-ink">{app.tradeName}</p>
              </div>
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">RUC (Formato Validado)</p>
                <p className="font-mono text-ink text-sm">{app.taxId}</p>
                <p className="mt-0.5 text-[0.65rem] text-taupe-500">
                  Formato de 11 dígitos validado en sistema · Verificar condición Activo/Habido en consulta oficial SUNAT antes de aprobar.
                </p>
              </div>
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Tipo de Negocio</p>
                <p className="text-ink">{app.businessType}</p>
              </div>
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Volumen Mensual Estimado</p>
                <p className="font-semibold text-ink">{app.estimatedVolume}</p>
              </div>
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Domicilio Comercial</p>
                <p className="text-ink">{app.addressLine}</p>
                <p className="text-taupe-500">
                  {app.district}, {app.province}, {app.department}
                </p>
              </div>
              {app.additionalNotes && (
                <div>
                  <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Notas adicionales del cliente</p>
                  <p className="italic text-taupe-700 bg-ink/[0.02] p-2 border border-ink/5 mt-1">
                    &ldquo;{app.additionalNotes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta Contacto y Usuario */}
          <div className="border border-ink/10 bg-paper p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-2.5">
              <User className="size-4 text-taupe-500" aria-hidden />
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                Representante y Cuenta de Usuario
              </h2>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Contacto Comercial</p>
                <p className="font-medium text-ink text-sm">{app.contactName}</p>
              </div>
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Correo Corporativo</p>
                <p className="font-mono text-ink">{app.contactEmail}</p>
              </div>
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Teléfono de Contacto</p>
                <p className="font-mono text-ink">{app.contactPhone}</p>
              </div>
              <div className="border-t border-ink/10 pt-3">
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Usuario Responsable en Plataforma</p>
                <p className="font-medium text-ink">
                  {app.applicant.firstName} {app.applicant.lastName} (ID #{app.applicant.id})
                </p>
                <p className="font-mono text-taupe-500 text-[0.7rem]">{app.applicant.email}</p>
                <p className="text-[0.7rem] mt-1 text-taupe-600">
                  Rol actual en base de datos:{" "}
                  <code className="bg-ink/5 px-1 py-0.5 text-ink font-semibold">{app.applicant.role}</code>
                </p>
                <p className="text-[0.7rem] text-taupe-600 mt-0.5">
                  Correo verificado:{" "}
                  {app.applicant.emailVerifiedAt ? (
                    <span className="text-emerald-700 font-semibold">Sí ({new Date(app.applicant.emailVerifiedAt).toLocaleDateString("es-PE")})</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">No verificado</span>
                  )}
                </p>
              </div>

              {app.reviewer && (
                <div className="border-t border-ink/10 pt-3 text-[0.7rem] text-taupe-600">
                  <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Revisado Previamente Por</p>
                  <p className="font-medium text-ink">
                    {app.reviewer.firstName} {app.reviewer.lastName} ({app.reviewer.email})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de Dictamen */}
        <ReviewActionForm
          applicationId={app.id}
          currentStatus={app.status}
          defaultInternalNotes={app.internalNotes}
        />
      </div>
    </div>
  );
}
