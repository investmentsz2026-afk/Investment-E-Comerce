import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getAdminApplicationById } from "@/server/queries/admin";
import { ReviewActionForm } from "@/components/admin/review-action-form";
import {
  Building2,
  User,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  MapPin,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Detalle de Solicitud Comercial | Admin American Colt",
  robots: { index: false, follow: false },
};

export const instant = false;

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminApplicationDetailPage({
  params,
}: DetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const appId = parseInt(id, 10);
  if (isNaN(appId)) notFound();

  const app = await getAdminApplicationById(appId);
  if (!app) notFound();

  const badgeStyles: Record<string, string> = {
    pending: "border-amber-300 bg-amber-50 text-amber-950",
    under_review: "border-blue-300 bg-blue-50 text-blue-950",
    approved: "border-emerald-300 bg-emerald-50 text-emerald-950",
    rejected: "border-red-300 bg-red-50 text-red-950",
    suspended: "border-rose-300 bg-rose-100 text-rose-950",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente de Revisión",
    under_review: "En Evaluación Comercial",
    approved: "Empresa Aprobada",
    rejected: "Solicitud Rechazada",
    suspended: "Acceso Suspendido",
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <Link
          href="/admin/solicitudes"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:text-[#DC2626]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a la lista de solicitudes
        </Link>
      </div>

      {/* CABECERA HERO 3D DEL EXPEDIENTE B2B */}
      <header className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white shadow-[0_20px_48px_-14px_rgba(220,38,38,0.42)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
                <Sparkles className="size-3.5" />
                Expediente B2B #{app.id}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider ${
                  badgeStyles[app.status] ?? "bg-white text-slate-900"
                }`}
              >
                {statusLabels[app.status] ?? app.status}
              </span>
            </div>

            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              {app.legalName}
            </h1>

            <p className="text-xs font-semibold text-white/90">
              Nombre comercial:{" "}
              <strong className="font-extrabold text-white">
                {app.tradeName}
              </strong>{" "}
              · RUC: <strong className="font-black text-white">{app.taxId}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-white/25 bg-white/95 px-5 py-4 text-right text-slate-900 shadow-lg">
            <span className="block text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
              Fecha de Presentación
            </span>
            <span className="mt-0.5 block text-lg font-black text-slate-900">
              {new Date(app.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {app.reviewedAt && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Revisado:{" "}
                {new Date(app.reviewedAt).toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Expediente: Datos de la Empresa y Representante */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Tarjeta Empresa */}
        <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-16px_rgba(15,23,42,0.16)]">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-[#DC2626]">
              <Building2 className="size-4" aria-hidden />
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Datos de la Empresa
            </h2>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                Razón Social
              </p>
              <p className="text-sm font-extrabold text-slate-900">
                {app.legalName}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                Nombre Comercial
              </p>
              <p className="font-bold text-slate-800">{app.tradeName}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                RUC (Formato Validado)
              </p>
              <p className="text-sm font-black text-slate-900">{app.taxId}</p>
              <p className="mt-0.5 text-[0.68rem] font-medium text-slate-500">
                Verificar condición Activo/Habido en consulta oficial SUNAT
                antes de aprobar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                  Tipo de Negocio
                </p>
                <p className="font-bold text-slate-900">{app.businessType}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                  Volumen Mensual
                </p>
                <p className="font-extrabold text-[#991B1B]">
                  {app.estimatedVolume}
                </p>
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                <MapPin className="size-3 text-[#DC2626]" />
                Domicilio Comercial
              </p>
              <p className="mt-0.5 font-bold text-slate-900">
                {app.addressLine}
              </p>
              <p className="font-medium text-slate-500">
                {app.district}, {app.province}, {app.department}
              </p>
            </div>
            {app.additionalNotes && (
              <div>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                  Notas del cliente
                </p>
                <p className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 font-medium italic text-slate-700">
                  &ldquo;{app.additionalNotes}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta Contacto y Usuario */}
        <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-16px_rgba(15,23,42,0.16)]">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <User className="size-4" aria-hidden />
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Representante y Cuenta de Usuario
            </h2>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                Contacto Comercial
              </p>
              <p className="text-sm font-extrabold text-slate-900">
                {app.contactName}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                Correo Corporativo
              </p>
              <p className="font-bold text-slate-800">{app.contactEmail}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                Teléfono de Contacto
              </p>
              <p className="font-bold text-slate-900">{app.contactPhone}</p>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                Usuario Responsable en Plataforma
              </p>
              <p className="font-extrabold text-slate-900">
                {app.applicant.firstName} {app.applicant.lastName} (ID #
                {app.applicant.id})
              </p>
              <p className="font-medium text-slate-500">
                {app.applicant.email}
              </p>
              <p className="pt-1 font-semibold text-slate-700">
                Rol actual:{" "}
                <code className="rounded-lg bg-white px-2 py-0.5 font-extrabold text-slate-900 shadow-2xs">
                  {app.applicant.role}
                </code>
              </p>
              <p className="font-semibold text-slate-700">
                Correo verificado:{" "}
                {app.applicant.emailVerifiedAt ? (
                  <span className="font-extrabold text-emerald-700">
                    Sí (
                    {new Date(app.applicant.emailVerifiedAt).toLocaleDateString(
                      "es-PE",
                    )}
                    )
                  </span>
                ) : (
                  <span className="font-extrabold text-amber-700">
                    No verificado
                  </span>
                )}
              </p>
            </div>

            {app.reviewer && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 text-xs text-slate-600">
                <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                  Revisado Previamente Por
                </p>
                <p className="mt-0.5 font-bold text-slate-900">
                  {app.reviewer.firstName} {app.reviewer.lastName} (
                  {app.reviewer.email})
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
  );
}
