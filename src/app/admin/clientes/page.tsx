import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCustomersCatalog } from "@/server/queries/admin-commerce";
import { formatPrice } from "@/lib/format";
import {
  Users,
  Search,
  Building2,
  Eye,
  ShieldCheck,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Clientes y Empresas Mayoristas — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

interface AdminCustomersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function AdminCustomersListPage({
  searchParams,
}: AdminCustomersPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const statusFilter =
    params.status === "active" || params.status === "suspended"
      ? params.status
      : "all";

  const customers = await getAdminCustomersCatalog({
    search: params.search,
    role: params.role || "all",
    status: statusFilter,
  });

  return (
    <div className="shell py-8 md:py-10 space-y-6">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker text-cochinilla">DIRECTORIO COMERCIAL B2C Y B2B</p>
          <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Clientes y Empresas Mayoristas
          </h1>
          <p className="mt-1 text-sm text-taupe-700">
            Busca por nombre, correo, teléfono o RUC y consulta el historial de pedidos, direcciones, cotizaciones y estado comercial.
          </p>
        </div>

        <Link
          href="/admin/solicitudes"
          className="inline-flex items-center gap-2 border border-ink/20 bg-paper px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-ink hover:border-ink"
        >
          <ShieldCheck className="size-4 text-cochinilla" aria-hidden />
          <span>Bandeja de Solicitudes RUC</span>
        </Link>
      </div>

      {/* Buscador y Filtros */}
      <form
        method="GET"
        action="/admin/clientes"
        className="grid gap-3 border border-ink/10 bg-paper p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label
            htmlFor="c-search"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Buscar por Nombre, Email, Teléfono o RUC
          </label>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-taupe-500"
              aria-hidden
            />
            <input
              id="c-search"
              name="search"
              type="text"
              defaultValue={params.search ?? ""}
              placeholder="Ej: 20554433221, cliente@empresa.pe, 999..."
              className="w-full border border-ink/20 bg-sand-50 py-2 pr-3 pl-8 text-xs text-ink"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="c-role"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Perfil Comercial
          </label>
          <select
            id="c-role"
            name="role"
            defaultValue={params.role ?? "all"}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="all">Todos los perfiles</option>
            <option value="customer">Cliente Minorista (B2C)</option>
            <option value="business_approved">Empresa Mayorista Aprobada (B2B)</option>
            <option value="business_pending">Empresa en Evaluación (Pendiente)</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="c-status"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Estado de Cuenta
          </label>
          <select
            id="c-status"
            name="status"
            defaultValue={statusFilter}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="all">Todas las cuentas</option>
            <option value="active">Cuentas activas</option>
            <option value="suspended">Cuentas suspendidas</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-paper hover:bg-cochinilla"
          >
            Filtrar
          </button>
          {(params.search || params.role || params.status) && (
            <Link
              href="/admin/clientes"
              className="border border-ink/20 px-3 py-2 font-mono text-xs text-taupe-700 hover:border-ink"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {/* Tabla de Clientes y Empresas */}
      <div className="border border-ink/10 bg-paper">
        <div className="border-b border-ink/10 px-5 py-3 font-mono text-xs text-taupe-700">
          Mostrando <strong>{customers.length}</strong> cuentas registradas
        </div>

        {customers.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="mx-auto size-8 text-taupe-400" aria-hidden />
            <p className="font-display text-xl text-ink">
              No se encontraron clientes con estos criterios
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 bg-sand-50/60 font-mono text-[0.65rem] uppercase tracking-wider text-taupe-600">
                  <th className="px-4 py-3">Cliente / Contacto</th>
                  <th className="px-4 py-3">Empresa / RUC Vinculado</th>
                  <th className="px-4 py-3">Rol Comercial</th>
                  <th className="px-4 py-3">Actividad (Pedidos / B2B)</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Ficha 360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-sand-50/40">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="font-semibold text-ink hover:text-cochinilla hover:underline"
                      >
                        {c.firstName} {c.lastName}
                      </Link>
                      <p className="font-mono text-[0.65rem] text-taupe-600">
                        {c.email} {c.phone ? `· ${c.phone}` : ""}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      {c.company ? (
                        <div>
                          <span className="inline-flex items-center gap-1 font-medium text-ink">
                            <Building2 className="size-3.5 text-cochinilla" aria-hidden />
                            {c.company.tradeName || c.company.legalName}
                          </span>
                          <span className="block font-mono text-[0.65rem] text-taupe-600">
                            RUC: {c.company.taxId} ({c.company.status})
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-[0.65rem] text-taupe-400">
                          Persona Natural (Sin RUC B2B)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[0.66rem]">
                      {c.role === "business_approved" ? (
                        <span className="rounded bg-cochinilla/15 px-2 py-0.5 font-bold text-cochinilla">
                          Mayorista B2B Aprobado
                        </span>
                      ) : c.role === "business_pending" ? (
                        <span className="rounded bg-amber-500/15 px-2 py-0.5 font-bold text-amber-800">
                          B2B en Evaluación
                        </span>
                      ) : c.role === "admin" ? (
                        <span className="rounded bg-ink px-2 py-0.5 font-bold text-paper">
                          Administrador
                        </span>
                      ) : (
                        <span className="rounded bg-ink/10 px-2 py-0.5 text-ink">
                          Minorista B2C
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[0.68rem]">
                      <div className="font-bold text-ink">
                        {formatPrice(c.totalSpentAmount)} ({c.confirmedOrdersCount}/
                        {c.ordersCount} pedidos)
                      </div>
                      {c.quotesCount > 0 && (
                        <div className="text-[0.64rem] text-indigo-700">
                          {c.quotesCount} cotizaciones B2B
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[0.65rem]">
                      {c.isActive ? (
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold uppercase text-emerald-800">
                          Activa
                        </span>
                      ) : (
                        <span className="rounded bg-rose-500/15 px-2 py-0.5 font-bold uppercase text-rose-800">
                          Suspendida
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="inline-flex items-center gap-1 border border-ink/20 px-2.5 py-1 font-mono text-[0.68rem] uppercase text-ink hover:border-ink"
                      >
                        <Eye className="size-3.5" aria-hidden />
                        <span>Ver Detalle</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

