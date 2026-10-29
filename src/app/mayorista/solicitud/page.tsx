import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/session";
import { getUserBusinessApplication } from "@/server/queries/account";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Estado de Solicitud Mayorista | INVESTMENTS B2B",
  description: "Consulta el estado de tu solicitud de cuenta comercial mayorista en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function WholesaleStatusPage() {
  const { user } = await requireAuth("/mayorista/solicitud");
  const app = await getUserBusinessApplication(user.id);

  if (!app) {
    return (
      <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
        <div className="shell max-w-3xl text-center py-12">
          <Building2 className="mx-auto size-12 text-taupe-400" aria-hidden />
          <h1 className="mt-4 font-display text-display-md text-ink">
            No tienes solicitudes comerciales registradas
          </h1>
          <p className="mt-2 text-sm text-taupe-600 leading-relaxed max-w-md mx-auto">
            Si representas a una tienda, distribuidora o empresa textil y deseas acceder a condiciones mayoristas, completa nuestro formulario de registro B2B.
          </p>
          <div className="mt-6">
            <Link
              href="/mayorista/registro"
              className="inline-flex items-center gap-2 bg-ink px-6 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
            >
              Iniciar solicitud B2B
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      label: "Solicitud Recibida",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
      icon: Clock,
      message: "Tu solicitud ha sido recibida y está en cola de evaluación por el equipo comercial.",
    },
    under_review: {
      label: "En Evaluación",
      badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
      icon: Clock,
      message: "Un asesor corporativo está revisando los datos tributarios y comerciales de tu empresa.",
    },
    approved: {
      label: "Aprobada",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
      icon: CheckCircle2,
      message: "¡Felicitaciones! Tu cuenta comercial mayorista está activa. Tienes tarifas preferenciales en el catálogo.",
    },
    rejected: {
      label: "No aprobada",
      badgeClass: "bg-cochinilla/10 text-cochinilla border-cochinilla/30",
      icon: AlertCircle,
      message: "En este momento no fue posible autorizar la apertura de la cuenta comercial.",
    },
    suspended: {
      label: "Suspendida",
      badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
      icon: Ban,
      message: "El acceso mayorista para esta empresa ha sido suspendido temporalmente.",
    },
  }[app.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell max-w-4xl space-y-8">
        {/* Cabecera */}
        <div className="border-b border-ink/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="eyebrow text-cochinilla">Canal Corporativo B2B</p>
            <h1 className="mt-2 font-display text-display-md text-ink">
              Estado de Solicitud Comercial
            </h1>
            <p className="mt-1 text-xs text-taupe-500 font-mono">
              Solicitud #{app.id} · Presentada el{" "}
              {new Date(app.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusConfig.badgeClass}`}
            >
              <StatusIcon className="size-3.5" aria-hidden />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Tarjeta de estado principal */}
        <div className="border border-ink/15 bg-paper p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <StatusIcon className="size-6 shrink-0 mt-0.5 text-ink" aria-hidden />
            <div>
              <h2 className="font-display text-xl text-ink">{statusConfig.label}</h2>
              <p className="mt-1 text-sm text-taupe-700 leading-relaxed">{statusConfig.message}</p>
            </div>
          </div>

          {app.status === "rejected" && app.rejectionReason && (
            <div className="mt-4 border-l-2 border-cochinilla bg-cochinilla/5 p-4 text-xs text-cochinilla leading-relaxed">
              <p className="font-semibold uppercase tracking-wider">Observación comunicada:</p>
              <p className="mt-1">{app.rejectionReason}</p>
            </div>
          )}

          {app.status === "approved" && (
            <div className="pt-2">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
              >
                Explorar catálogo con tarifas B2B
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}

          {app.status === "rejected" && (
            <div className="pt-2">
              <Link
                href="/mayorista/registro"
                className="inline-flex items-center gap-2 border border-ink px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Presentar nueva solicitud
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>

        {/* Resumen de los datos presentados */}
        <div className="border border-ink/10 bg-paper p-6 sm:p-8 space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink border-b border-ink/10 pb-3">
            Datos comerciales registrados
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs">
            <div>
              <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Razón Social</p>
              <p className="mt-1 font-medium text-ink text-sm">{app.legalName}</p>
            </div>
            <div>
              <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Nombre Comercial</p>
              <p className="mt-1 font-medium text-ink text-sm">{app.tradeName}</p>
            </div>
            <div>
              <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">RUC</p>
              <p className="mt-1 font-mono text-ink text-sm">{app.taxId}</p>
            </div>
            <div>
              <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Tipo de Negocio</p>
              <p className="mt-1 text-ink">{app.businessType}</p>
            </div>
            <div>
              <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Representante / Contacto</p>
              <p className="mt-1 text-ink">{app.contactName}</p>
              <p className="text-taupe-500 font-mono mt-0.5">{app.contactEmail}</p>
              <p className="text-taupe-500 font-mono">{app.contactPhone}</p>
            </div>
            <div>
              <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Domicilio Fiscal</p>
              <p className="mt-1 text-ink">{app.addressLine}</p>
              <p className="text-taupe-500">
                {app.district}, {app.province}, {app.department}
              </p>
            </div>
            <div>
              <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Volumen Mensual Estimado</p>
              <p className="mt-1 text-ink font-medium">{app.estimatedVolume}</p>
            </div>
            {app.additionalNotes && (
              <div>
                <p className="text-taupe-400 uppercase tracking-wider text-[0.65rem]">Información Adicional</p>
                <p className="mt-1 text-taupe-700 italic">{app.additionalNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
