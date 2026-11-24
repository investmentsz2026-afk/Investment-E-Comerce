import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  ArrowRight,
  ShieldCheck,
  MapPin,
  FileCheck2,
  BadgePercent,
  Sparkles,
} from "lucide-react";
import { FaBoxesStacked } from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import { siteConfig } from "@/config/site";

export interface WholesaleApplicationSummary {
  id: number;
  legalName: string;
  tradeName: string;
  taxId: string;
  businessType: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  district: string;
  province: string;
  department: string;
  estimatedVolume: string;
  additionalNotes: string | null;
  status: "pending" | "under_review" | "approved" | "rejected" | "suspended";
  rejectionReason: string | null;
  createdAt: Date | string;
}

interface WholesaleStatusViewProps {
  userRole: string;
  app: WholesaleApplicationSummary | null;
  quotesHref?: string;
}

export function WholesaleStatusView({
  userRole,
  app,
  quotesHref = "/mayorista/cotizaciones",
}: WholesaleStatusViewProps) {
  const isAdmin = userRole === "admin";

  if (!app) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0B1120] via-[#131C31] to-[#1E293B] p-7 text-white shadow-lg sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#EF233C]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#2563EB]/25 blur-3xl"
          />

          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-[#EF233C]/15 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-red-200">
                  <FaBoxesStacked className="size-3 text-[#EF233C]" aria-hidden />
                  Canal Mayorista B2B
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-300">
                    <ShieldCheck className="size-3" aria-hidden />
                    Acceso Administrativo Activo
                  </span>
                )}
              </div>

              <h1 className="font-sans text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                {isAdmin
                  ? "Estado de Canal Mayorista B2B"
                  : "No tienes solicitudes comerciales registradas"}
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                {isAdmin
                  ? "Esta cuenta es Administradora General (no tiene una postulación de cliente B2B asociada). Desde aquí puedes ir directo al configurador de cotizaciones B2B o registrar una empresa de prueba si lo necesitas."
                  : "Si representas a una tienda, boutique, distribuidora o empresa textil, completa nuestro formulario B2B con tu RUC para habilitar precios de fábrica y curvas de tallas completas."}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              {isAdmin ? (
                <Link
                  href={quotesHref}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D90429]"
                >
                  Ir a Cotizaciones B2B
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <Link
                  href="/mayorista/registro"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D90429]"
                >
                  Iniciar Solicitud B2B
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
              <Link
                href="/mayorista"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/20"
              >
                Beneficios B2B
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjetas informativas modernas (2 columnas en móvil) */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:rounded-2xl sm:p-5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-[#EF233C] sm:size-10 sm:rounded-xl">
              <BadgePercent className="size-4 sm:size-5" aria-hidden />
            </div>
            <h2 className="mt-2 text-xs font-extrabold uppercase text-slate-900 sm:mt-3 sm:text-sm">
              Tarifas Escalonadas
            </h2>
            <p className="mt-1 text-[0.64rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
              Descuentos desde 12, 50 y 200+ unidades por modelo.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:rounded-2xl sm:p-5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] sm:size-10 sm:rounded-xl">
              <FileCheck2 className="size-4 sm:size-5" aria-hidden />
            </div>
            <h2 className="mt-2 text-xs font-extrabold uppercase text-slate-900 sm:mt-3 sm:text-sm">
              Facturación SUNAT
            </h2>
            <p className="mt-1 text-[0.64rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
              Emisión formal con RUC 10 o 20 y desglose de IGV.
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:col-span-1 sm:rounded-2xl sm:p-5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:size-10 sm:rounded-xl">
              <Sparkles className="size-4 sm:size-5" aria-hidden />
            </div>
            <h2 className="mt-2 text-xs font-extrabold uppercase text-slate-900 sm:mt-3 sm:text-sm">
              Aprobación 24 – 48 hrs
            </h2>
            <p className="mt-1 text-[0.64rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
              Validamos tu ficha RUC rápidamente para activar tus cotizaciones corporativas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      label: "Solicitud Recibida",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      iconWrapClass: "bg-amber-500 text-slate-950",
      cardClass: "border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-white",
      icon: Clock,
      message:
        "Tu solicitud ha sido recibida y está en cola de evaluación por nuestro equipo comercial.",
    },
    under_review: {
      label: "En Evaluación",
      badgeClass: "bg-blue-50 text-[#2563EB] border-blue-200",
      iconWrapClass: "bg-[#2563EB] text-white",
      cardClass: "border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-white",
      icon: Clock,
      message:
        "Un asesor corporativo está revisando los datos tributarios y comerciales de tu empresa.",
    },
    approved: {
      label: "Aprobada",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconWrapClass: "bg-emerald-600 text-white",
      cardClass: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-white",
      icon: CheckCircle2,
      message:
        "¡Felicitaciones! Tu cuenta comercial mayorista está activa y ya tienes tarifas preferenciales en todo el catálogo.",
    },
    rejected: {
      label: "No aprobada",
      badgeClass: "bg-red-50 text-[#EF233C] border-red-200",
      iconWrapClass: "bg-[#EF233C] text-white",
      cardClass: "border-red-200/80 bg-gradient-to-br from-red-50/60 via-white to-white",
      icon: AlertCircle,
      message:
        "En este momento no fue posible autorizar la apertura de la cuenta comercial.",
    },
    suspended: {
      label: "Suspendida",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      iconWrapClass: "bg-rose-600 text-white",
      cardClass: "border-rose-200/80 bg-gradient-to-br from-rose-50/60 via-white to-white",
      icon: Ban,
      message:
        "El acceso mayorista para esta empresa ha sido suspendido temporalmente.",
    },
  }[app.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Cabecera moderna */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#EF233C]">
              <Building2 className="size-3.5" aria-hidden />
              Canal Corporativo B2B
            </span>
            <h1 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              Estado de Solicitud Comercial
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-500">
              Solicitud #{app.id} · Presentada el{" "}
              {new Date(app.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider ${statusConfig.badgeClass}`}
          >
            <StatusIcon className="size-4" aria-hidden />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Tarjeta de estado principal */}
      <div className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${statusConfig.cardClass}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${statusConfig.iconWrapClass}`}
            >
              <StatusIcon className="size-6" aria-hidden />
            </div>
            <div>
              <h2 className="font-sans text-xl font-black text-slate-900">
                {statusConfig.label}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700">
                {statusConfig.message}
              </p>

              {app.status === "rejected" && app.rejectionReason && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-white/90 p-4 text-xs leading-relaxed text-[#D90429]">
                  <p className="font-extrabold uppercase tracking-wider">
                    Observación comunicada:
                  </p>
                  <p className="mt-1 font-medium text-slate-700">{app.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2.5">
            {app.status === "approved" && (
              <>
                <Link
                  href={quotesHref}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#EF233C]"
                >
                  Ir a Cotizaciones B2B
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/catalogo"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-xs font-bold uppercase tracking-wider text-slate-800 transition-colors hover:border-slate-900"
                >
                  Catálogo B2B
                </Link>
              </>
            )}

            {app.status === "rejected" && (
              <Link
                href="/mayorista/registro"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#EF233C] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#D90429]"
              >
                Presentar nueva solicitud
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}

            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
                `Hola American Colt JEANS™, consulto por mi solicitud B2B #${app.id} (${app.legalName}).`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <SiWhatsapp className="size-4" aria-hidden />
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Datos comerciales registrados */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="border-b border-slate-100 pb-3 sm:pb-4">
          <h3 className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-900 sm:text-xs">
            Datos comerciales registrados
          </h3>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 text-[0.68rem] sm:mt-6 sm:gap-6 sm:text-xs">
          <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
              Razón Social
            </p>
            <p className="mt-0.5 truncate text-xs font-extrabold text-slate-900 sm:mt-1 sm:text-sm">{app.legalName}</p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
              Nombre Comercial
            </p>
            <p className="mt-0.5 truncate text-xs font-extrabold text-slate-900 sm:mt-1 sm:text-sm">{app.tradeName}</p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
              RUC
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-slate-900 sm:mt-1 sm:text-sm">{app.taxId}</p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
              Tipo de Negocio
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 sm:mt-1 sm:text-sm">{app.businessType}</p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
              Contacto
            </p>
            <p className="mt-0.5 truncate text-xs font-bold text-slate-900 sm:mt-1 sm:text-sm">{app.contactName}</p>
            <p className="mt-0.5 truncate font-mono text-[0.6rem] text-slate-600 sm:text-xs">{app.contactEmail}</p>
            <p className="font-mono text-[0.6rem] text-slate-600 sm:text-xs">{app.contactPhone}</p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
            <p className="flex items-center gap-1 text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
              <MapPin className="size-2.5 text-[#EF233C] sm:size-3" aria-hidden />
              Domicilio Fiscal
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs font-bold text-slate-900 sm:mt-1 sm:text-sm">{app.addressLine}</p>
            <p className="mt-0.5 truncate text-[0.6rem] text-slate-600 sm:text-xs">
              {app.district}, {app.province}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
              Volumen Mensual
            </p>
            <p className="mt-0.5 text-xs font-bold text-slate-900 sm:mt-1 sm:text-sm">{app.estimatedVolume}</p>
          </div>
          {app.additionalNotes && (
            <div className="rounded-xl bg-slate-50/70 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
                Adicional
              </p>
              <p className="mt-0.5 line-clamp-2 italic text-slate-700 sm:mt-1">{app.additionalNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
