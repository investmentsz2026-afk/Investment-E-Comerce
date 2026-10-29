import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCustomerDetail } from "@/server/queries/admin-commerce";
import { AdminCustomerStatusControls } from "@/components/admin/admin-customer-status-controls";
import { formatPrice } from "@/lib/format";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Package,
  FileSpreadsheet,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Ficha 360° de Cliente / Empresa — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

interface AdminCustomerDetailPageProps {
  params: Promise<{ id: string }>;
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

  const { customer, addresses, applications, orders, quotes, metrics } = detail;
  const latestApp = applications[0] ?? null;

  return (
    <div className="shell py-8 md:py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <Link
            href="/admin/clientes"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-taupe-700 hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            <span>Volver al directorio de clientes y empresas</span>
          </Link>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            {customer.firstName} {customer.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-4 font-mono text-xs text-taupe-700">
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3.5 text-cochinilla" aria-hidden />
              {customer.email}
            </span>
            {customer.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5 text-cochinilla" aria-hidden />
                {customer.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5 text-cochinilla" aria-hidden />
              Registrado: {new Date(customer.createdAt).toLocaleDateString("es-PE")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="border border-ink/10 bg-paper px-4 py-2.5 text-right">
            <span className="block font-mono text-[0.62rem] uppercase text-taupe-500">
              Compras Confirmadas
            </span>
            <span className="font-display text-xl text-ink">
              {formatPrice(metrics.totalSpentAmount)}
            </span>
          </div>
        </div>
      </div>

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

      {/* Solicitudes de Empresa Mayorista (B2B) y Libreta de Direcciones */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                REGISTRO EMPRESARIAL B2B
              </p>
              <h2 className="font-display text-xl text-ink">
                Solicitudes y Datos Fiscales ({applications.length})
              </h2>
            </div>
            <Building2 className="size-5 text-cochinilla" aria-hidden />
          </div>

          {applications.length === 0 ? (
            <p className="text-xs text-taupe-700">
              Este usuario no ha presentado solicitudes de registro mayorista B2B.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="border border-ink/10 bg-sand-50/50 p-4 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-ink">
                      RUC: {app.taxId} · {app.legalName}
                    </span>
                    <span className="rounded bg-ink/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-ink">
                      {app.status}
                    </span>
                  </div>
                  <p className="text-taupe-800">
                    Nombre comercial: <strong>{app.tradeName}</strong> · Rubro:{" "}
                    {app.businessType}
                  </p>
                  <p className="text-taupe-700">
                    Ubicación fiscal: {app.addressLine} ({app.district},{" "}
                    {app.province}, {app.department})
                  </p>
                  <p className="font-mono text-[0.68rem] text-taupe-600">
                    Contacto: {app.contactName} · {app.contactEmail} ·{" "}
                    {app.contactPhone} · Volumen est.: {app.estimatedVolume}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Libreta de Direcciones Autorizadas */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                DESPACHO Y LOGÍSTICA
              </p>
              <h2 className="font-display text-xl text-ink">
                Direcciones Autorizadas ({addresses.length})
              </h2>
            </div>
            <MapPin className="size-5 text-cochinilla" aria-hidden />
          </div>

          {addresses.length === 0 ? (
            <p className="text-xs text-taupe-700">
              El cliente aún no tiene direcciones guardadas en su libreta.
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="border border-ink/10 bg-sand-50/50 p-3.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-ink">{addr.title}</span>
                    {addr.isDefault && (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[0.62rem] font-bold uppercase text-emerald-800">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-ink">
                    Recibe: {addr.recipientName} ({addr.recipientPhone})
                  </p>
                  <p className="text-taupe-700">
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
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                TRAZABILIDAD COMERCIAL
              </p>
              <h2 className="font-display text-xl text-ink">
                Historial de Pedidos ({orders.length})
              </h2>
            </div>
            <Package className="size-5 text-cochinilla" aria-hidden />
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-taupe-700">
              Este cliente aún no registra pedidos en la plataforma.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 font-mono text-[0.64rem] uppercase text-taupe-500">
                    <th className="py-2 pr-3">N.° Pedido</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Modalidad</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 text-right">Importe Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-sand-50/50">
                      <td className="py-2.5 pr-3 font-mono font-bold">
                        <Link
                          href={`/admin/pedidos/${ord.id}`}
                          className="text-cochinilla underline"
                        >
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[0.68rem]">
                        {new Date(ord.createdAt).toLocaleDateString("es-PE")}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[0.65rem] uppercase">
                        {ord.orderMode}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[0.68rem]">
                        {ord.status} ({ord.paymentStatus})
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-ink">
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
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                NEGOCIACIONES MAYORISTAS
              </p>
              <h2 className="font-display text-xl text-ink">
                Cotizaciones B2B ({quotes.length})
              </h2>
            </div>
            <FileSpreadsheet className="size-5 text-cochinilla" aria-hidden />
          </div>

          {quotes.length === 0 ? (
            <p className="text-xs text-taupe-700">
              No existen cotizaciones B2B asociadas a esta cuenta.
            </p>
          ) : (
            <div className="space-y-2.5">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between border border-ink/10 bg-sand-50/50 p-3 text-xs"
                >
                  <div>
                    <Link
                      href={`/admin/cotizaciones/${q.id}`}
                      className="font-mono font-bold text-cochinilla underline"
                    >
                      {q.quoteNumber}
                    </Link>
                    <p className="font-mono text-[0.65rem] text-taupe-700">
                      Estado: {q.status} ·{" "}
                      {new Date(q.createdAt).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-ink">
                      {formatPrice(q.quotedTotalAmount ?? q.requestedSubtotalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

