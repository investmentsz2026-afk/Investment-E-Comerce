import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCommercialDashboard } from "@/server/queries/admin-commerce";
import { formatPEN } from "@/lib/format";
import {
  Package,
  Users,
  FileText,
  Plus,
  Layers,
  ArrowRight,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Inicio — Panel Administrativo | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminInicioPage() {
  const { user } = await requireAdmin();
  const dashboard = await getAdminCommercialDashboard();

  const {
    salesGlobal,
    filteredSummary,
    customersAndB2B,
    taxDocumentsSummary,
    quotesSummary,
    inventoryAlerts,
  } = dashboard;

  // Pedidos pagados pendientes de despacho/preparación
  const ordersToDispatch =
    (filteredSummary.statusBreakdown["paid"] ?? 0) +
    (filteredSummary.statusBreakdown["preparing"] ?? 0);

  // Solicitudes B2B pendientes de validación
  const pendingB2B = customersAndB2B.pendingCompaniesCount;

  // Comprobantes o cotizaciones pendientes
  const pendingDocs =
    taxDocumentsSummary.pendingTotalCount > 0
      ? taxDocumentsSummary.pendingTotalCount
      : quotesSummary.pendingCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── Hero Banner: Bienvenido, Administrador (Estilo Elegante American Colt) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-gradient-to-br from-[#FBF8F6] via-[#FAF6F3] to-[#F5ECE8] p-6 sm:p-8 md:p-10 shadow-xs">
        {/* Curvas artísticas SVG decorativas en color carmesí */}
        <div className="pointer-events-none absolute -right-10 -top-10 bottom-0 w-1/2 opacity-35 sm:opacity-45">
          <svg
            viewBox="0 0 500 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-full stroke-[#DC2626]"
          >
            <path
              d="M 50,0 Q 200,180 500,80"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              fill="none"
            />
            <path d="M 100,0 Q 250,220 500,120" strokeWidth="1.8" fill="none" />
            <path d="M 150,0 Q 300,260 500,160" strokeWidth="2.2" fill="none" />
            <path d="M 200,0 Q 350,300 500,200" strokeWidth="1.5" fill="none" />
            <path d="M 250,0 Q 400,340 500,240" strokeWidth="1.2" fill="none" />
          </svg>
        </div>

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DC2626]/10 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-widest text-[#DC2626]">
            <Sparkles className="size-3" />
            <span>Panel Oficial de Control</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-neutral-900 leading-tight">
            Bienvenido, {user.firstName || "administrador"}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
            Revisa lo pendiente y accede a tus herramientas de gestión comercial, pedidos, catálogo e inventario.
          </p>

          <div className="pt-2">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-6 py-3 text-xs font-extrabold tracking-wide text-white shadow-md shadow-[#DC2626]/25 hover:bg-[#B91C1C] hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <span>Ir al Dashboard</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Sección: Requiere tu atención ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            Requiere tu atención
          </h2>
          <span className="text-[0.7rem] text-neutral-500 font-medium">
            Tareas operativas prioritarias
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Tarjeta 1: Pedidos por despachar */}
          <Link
            href="/admin/pedidos?status=paid"
            className="group relative flex items-center justify-between rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-[#DC2626]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-[#DC2626] border border-rose-100 group-hover:bg-[#DC2626] group-hover:text-white transition-colors duration-200 shrink-0">
                <Package className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-neutral-900 leading-snug">
                  {ordersToDispatch} {ordersToDispatch === 1 ? "pedido" : "pedidos"} por despachar
                </p>
                <p className="text-[0.68rem] text-neutral-500 truncate">
                  Confirmados y pagados listos para empaque
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-neutral-400 group-hover:text-[#DC2626] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </Link>

          {/* Tarjeta 2: Solicitudes B2B pendientes */}
          <Link
            href="/admin/solicitudes"
            className="group relative flex items-center justify-between rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-[#DC2626]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200 shrink-0">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-neutral-900 leading-snug">
                  {pendingB2B} {pendingB2B === 1 ? "solicitud B2B pendiente" : "solicitudes B2B pendientes"}
                </p>
                <p className="text-[0.68rem] text-neutral-500 truncate">
                  Empresas con RUC en espera de aprobación
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-neutral-400 group-hover:text-[#DC2626] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </Link>

          {/* Tarjeta 3: Comprobantes / Cotizaciones pendientes */}
          <Link
            href="/admin/pedidos"
            className="group relative flex items-center justify-between rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-[#DC2626]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shrink-0">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-neutral-900 leading-snug">
                  {pendingDocs} {pendingDocs === 1 ? "comprobante pendiente" : "comprobantes pendientes"}
                </p>
                <p className="text-[0.68rem] text-neutral-500 truncate">
                  Boletas, facturas o cotizaciones por revisar
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-neutral-400 group-hover:text-[#DC2626] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </Link>
        </div>
      </section>

      {/* ─── Sección: Accesos rápidos ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            Accesos rápidos
          </h2>
          <span className="text-[0.7rem] text-neutral-500 font-medium">
            Acciones directas más utilizadas
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* 1. Nuevo producto */}
          <Link
            href="/admin/productos/nuevo"
            className="group rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:border-[#DC2626]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 block text-center"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-[#DC2626] border border-rose-100 group-hover:bg-[#DC2626] group-hover:text-white transition-all duration-200 mb-3">
              <Plus className="size-6" />
            </div>
            <p className="text-xs font-bold text-neutral-900 group-hover:text-[#DC2626] transition-colors">
              Nuevo producto
            </p>
            <p className="text-[0.65rem] text-neutral-400 mt-0.5">Crear prenda en catálogo</p>
          </Link>

          {/* 2. Ajustar stock */}
          <Link
            href="/admin/inventario"
            className="group rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:border-[#DC2626]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 block text-center"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-[#DC2626] border border-rose-100 group-hover:bg-[#DC2626] group-hover:text-white transition-all duration-200 mb-3">
              <Layers className="size-6" />
            </div>
            <p className="text-xs font-bold text-neutral-900 group-hover:text-[#DC2626] transition-colors">
              Ajustar stock
            </p>
            <p className="text-[0.65rem] text-neutral-400 mt-0.5">Kardex y disponibilidad</p>
          </Link>

          {/* 3. Gestionar pedidos */}
          <Link
            href="/admin/pedidos"
            className="group rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:border-[#DC2626]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 block text-center"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-[#DC2626] border border-rose-100 group-hover:bg-[#DC2626] group-hover:text-white transition-all duration-200 mb-3">
              <Package className="size-6" />
            </div>
            <p className="text-xs font-bold text-neutral-900 group-hover:text-[#DC2626] transition-colors">
              Gestionar pedidos
            </p>
            <p className="text-[0.65rem] text-neutral-400 mt-0.5">Envíos y estados de pago</p>
          </Link>

          {/* 4. Revisar solicitudes B2B */}
          <Link
            href="/admin/solicitudes"
            className="group rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:border-[#DC2626]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 block text-center"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-[#DC2626] border border-rose-100 group-hover:bg-[#DC2626] group-hover:text-white transition-colors duration-200 mb-3">
              <Users className="size-6" />
            </div>
            <p className="text-xs font-bold text-neutral-900 group-hover:text-[#DC2626] transition-colors">
              Revisar solicitudes B2B
            </p>
            <p className="text-[0.65rem] text-neutral-400 mt-0.5">Empresas mayoristas</p>
          </Link>
        </div>
      </section>

      {/* ─── Resumen de Actividad Ejecutiva y Estado del Sistema ─── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Tarjeta de Ventas de Hoy */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Ventas de hoy
            </span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900 tracking-tight">
            {formatPEN(salesGlobal.todayAmount)}
          </p>
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
            <span>{salesGlobal.todayOrders} pedidos confirmados</span>
            <Link
              href="/admin/dashboard"
              className="text-[#DC2626] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Ver reporte</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Tarjeta de Estado del Inventario */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Salud de Inventario
            </span>
            <div className="size-8 rounded-lg bg-rose-50 text-[#DC2626] flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-neutral-900 tracking-tight">
              {inventoryAlerts.lowStockCount + inventoryAlerts.outOfStockCount}
            </p>
            <span className="text-xs text-neutral-500 font-medium">alertas de stock</span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
            <span>
              {inventoryAlerts.outOfStockCount} agotados · {inventoryAlerts.lowStockCount} bajos
            </span>
            <Link
              href="/admin/inventario"
              className="text-[#DC2626] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Ver kardex</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Tarjeta de Clientes y Empresas B2B */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Empresas y Clientes
            </span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900 tracking-tight">
            {customersAndB2B.totalRegisteredCustomers}
          </p>
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
            <span>
              {customersAndB2B.approvedCompaniesCount} B2B activas · {customersAndB2B.pendingCompaniesCount} pendientes
            </span>
            <Link
              href="/admin/solicitudes"
              className="text-[#DC2626] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Gestionar</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
