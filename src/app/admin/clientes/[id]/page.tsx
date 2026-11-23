import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiWhatsapp } from "react-icons/si";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCustomerDetail } from "@/server/queries/admin-commerce";
import { AdminCustomerStatusControls } from "@/components/admin/admin-customer-status-controls";
import { formatPrice } from "@/lib/format";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  FileSpreadsheet,
  History,
  Mail,
  MapPin,
  Package,
  Phone,
  Sparkles,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Ficha 360° de Cliente / Empresa — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

interface AdminCustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

function getInitials(firstName: string, lastName: string, email: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  if (f || l) return `${f}${l}`.toUpperCase();
  return email.trim().slice(0, 2).toUpperCase() || "CL";
}

function buildWaHref(phone: string | null, firstName: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.startsWith("51") ? digits : `51${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(
    `Hola ${firstName.trim() || "Cliente"}, te saludamos de American Colt JEANS™.`,
  )}`;
}

function getRoleBadge(role: string) {
  switch (role) {
    case "business_approved":
      return "Mayorista B2B Aprobado";
    case "business_pending":
      return "B2B en Evaluación";
    case "admin":
      return "Administrador";
    default:
      return "Cliente Minorista B2C";
  }
}

export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    notFound();
  }

  const detail = await getAdminCustomerDetail(userId);
  if (!detail) {
    notFound();
  }

  const { customer, addresses, applications, orders, quotes, auditLogs, metrics } =
    detail;
  const latestApp = applications[0] ?? null;
  const initials = getInitials(
    customer.firstName,
    customer.lastName,
    customer.email,
  );
  const waHref = buildWaHref(customer.phone, customer.firstName);

  return (
    <div className="shell py-6 md:py-8 space-y-6 font-sans text-slate-900">
      {/* HERO 3D DE CLIENTE */}
      <section className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white shadow-[0_22px_50px_-14px_rgba(220,38,38,0.42)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-56 rounded-full bg-black/15 blur-3xl" />

        <div className="relative space-y-5">
          <Link
            href="/admin/clientes"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white/25"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Directorio de Clientes</span>
          </Link>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-3xl border border-white/30 bg-white/20 text-2xl font-black backdrop-blur-md shadow-lg">
                {initials}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-wider">
                    <Sparkles className="size-3" />
                    Ficha 360° #{customer.id}
                  </span>
                  <span className="rounded-full bg-white px-3 py-0.5 text-[0.68rem] font-extrabold text-[#991B1B]">
                    {getRoleBadge(customer.role)}
                  </span>
                  {customer.emailVerifiedAt && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/25 px-2.5 py-0.5 text-[0.68rem] font-extrabold text-emerald-50">
                      <BadgeCheck className="size-3" />
                      Verificado
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  {customer.firstName} {customer.lastName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/90">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {customer.email}
                  </span>
                  {customer.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      {customer.phone}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Registrado:{" "}
                    {new Date(customer.createdAt).toLocaleDateString("es-PE")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1ebe5d]"
                >
                  <SiWhatsapp className="size-4" />
                  <span>Contactar WhatsApp</span>
                </a>
              )}

              <div className="rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-right backdrop-blur-md">
                <span className="block text-[0.65rem] font-extrabold uppercase tracking-wider text-white/80">
                  Compras Confirmadas
                </span>
                <span className="text-2xl font-black tabular-nums">
                  {formatPrice(metrics.totalSpentAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 TARJETAS KPI DEL CLIENTE */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.14)]">
          <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
            Pedidos Totales
          </span>
          <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">
            {metrics.totalOrders}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-700">
            {metrics.confirmedOrders} confirmados
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.14)]">
          <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
            Cotizaciones B2B
          </span>
          <p className="mt-2 text-3xl font-black tabular-nums text-blue-700">
            {metrics.totalQuotes}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Negociaciones registradas
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.14)]">
          <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
            Direcciones
          </span>
          <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">
            {addresses.length}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Destinos guardados
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.14)]">
          <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
            Solicitudes RUC
          </span>
          <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">
            {applications.length}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {latestApp ? `RUC ${latestApp.taxId}` : "Sin empresa asociada"}
          </p>
        </div>
      </section>

      {/* Controles de Activación / Suspensión y Revisión Mayorista */}
      <AdminCustomerStatusControls
        customer={customer}
        latestApplication={
          latestApp
            ? {
                id: latestApp.id,
                legalName: latestApp.legalName,
                taxId: latestApp.taxId,
                status: latestApp.status,
              }
            : null
        }
      />

      {/* Solicitudes B2B y Libreta de Direcciones */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.14)] lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#DC2626]">
                Registro Empresarial B2B
              </p>
              <h2 className="text-xl font-black text-slate-900">
                Solicitudes y Datos Fiscales ({applications.length})
              </h2>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Building2 className="size-5" />
            </span>
          </div>

          {applications.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
              Este usuario no ha presentado solicitudes de registro mayorista B2B.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900">
                      RUC: {app.taxId} · {app.legalName}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-blue-900">
                      {app.status}
                    </span>
                  </div>
                  <p className="font-medium text-slate-700">
                    Nombre comercial: <strong>{app.tradeName}</strong> · Rubro:{" "}
                    {app.businessType}
                  </p>
                  <p className="text-slate-600">
                    Ubicación fiscal: {app.addressLine} ({app.district},{" "}
                    {app.province}, {app.department})
                  </p>
                  <p className="font-semibold text-slate-500">
                    Contacto: {app.contactName} · {app.contactEmail} ·{" "}
                    {app.contactPhone} · Volumen est.: {app.estimatedVolume}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Libreta de Direcciones Autorizadas */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.14)] lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#DC2626]">
                Despacho y Logística
              </p>
              <h2 className="text-xl font-black text-slate-900">
                Direcciones Autorizadas ({addresses.length})
              </h2>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <MapPin className="size-5" />
            </span>
          </div>

          {addresses.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
              El cliente aún no tiene direcciones guardadas en su libreta.
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">{addr.title}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-emerald-800">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-800">
                    Recibe: {addr.recipientName} ({addr.recipientPhone})
                  </p>
                  <p className="text-slate-600">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ""} —{" "}
                    {addr.district}, {addr.province}, {addr.department}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial de Pedidos y Cotizaciones B2B */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.14)] lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#DC2626]">
                Trazabilidad Comercial
              </p>
              <h2 className="text-xl font-black text-slate-900">
                Historial de Pedidos ({orders.length})
              </h2>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <Package className="size-5" />
            </span>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
              Este cliente aún no registra pedidos en la plataforma.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[0.68rem] font-extrabold uppercase text-slate-400">
                    <th className="py-2.5 pr-3">N.° Pedido</th>
                    <th className="py-2.5 pr-3">Fecha</th>
                    <th className="py-2.5 pr-3">Modalidad</th>
                    <th className="py-2.5 pr-3">Estado</th>
                    <th className="py-2.5 text-right">Importe Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-extrabold">
                        <Link
                          href={`/admin/pedidos/${ord.id}`}
                          className="text-[#DC2626] hover:underline"
                        >
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 font-medium text-slate-600">
                        {new Date(ord.createdAt).toLocaleDateString("es-PE")}
                      </td>
                      <td className="py-3 pr-3 font-extrabold uppercase text-slate-700">
                        {ord.orderMode}
                      </td>
                      <td className="py-3 pr-3 font-semibold text-slate-600">
                        {ord.status} ({ord.paymentStatus})
                      </td>
                      <td className="py-3 text-right font-black tabular-nums text-slate-900">
                        {formatPrice(ord.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cotizaciones B2B Relacionadas */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.14)] lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-blue-700">
                Negociaciones Mayoristas
              </p>
              <h2 className="text-xl font-black text-slate-900">
                Cotizaciones B2B ({quotes.length})
              </h2>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileSpreadsheet className="size-5" />
            </span>
          </div>

          {quotes.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
              No existen cotizaciones B2B asociadas a esta cuenta.
            </p>
          ) : (
            <div className="space-y-2.5">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs"
                >
                  <div>
                    <Link
                      href={`/admin/cotizaciones/${q.id}`}
                      className="font-black text-blue-700 hover:underline"
                    >
                      {q.quoteNumber}
                    </Link>
                    <p className="mt-0.5 font-semibold text-slate-500">
                      Estado: <span className="uppercase">{q.status}</span> ·{" "}
                      {new Date(q.createdAt).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <div className="text-right font-black tabular-nums text-slate-900">
                    {formatPrice(q.quotedTotalAmount ?? q.requestedSubtotalAmount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bitácora de Auditoría de Cuenta */}
      {auditLogs.length > 0 && (
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.14)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                Seguridad e Historial
              </p>
              <h2 className="text-xl font-black text-slate-900">
                Auditoría de Cambios de Cuenta ({auditLogs.length})
              </h2>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <History className="size-5" />
            </span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <span className="inline-block rounded-lg bg-slate-200/80 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-slate-700">
                    {log.action}
                  </span>
                  <p className="font-semibold text-slate-800">{log.details}</p>
                </div>
                <span className="shrink-0 font-bold text-slate-500">
                  {new Date(log.createdAt).toLocaleString("es-PE")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
