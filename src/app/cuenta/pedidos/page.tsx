import Link from "next/link";
import { requireAuth } from "@/server/auth/session";
import { getUserOrdersList } from "@/server/queries/orders";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import { formatPEN } from "@/lib/format";
import {
  FaBoxArchive,
  FaArrowRight,
  FaFileInvoice,
  FaTruckFast,
  FaCalendarDays,
  FaBagShopping,
} from "react-icons/fa6";

export const instant = false;

export default async function OrdersPage() {
  const { user } = await requireAuth("/cuenta/pedidos");
  const ordersList = await getUserOrdersList(user.id);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Historial de Pedidos
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Revisa el estado de tus compras, pagos con pasarela y despacho oficial de American Colt JEANS™.
          </p>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-mono text-xs font-bold uppercase tracking-wider text-slate-700 hover:border-[#0055FF] hover:text-[#0055FF] shadow-xs transition-colors"
        >
          <FaBagShopping className="size-3.5 text-[#0055FF]" />
          <span>Explorar Catálogo</span>
        </Link>
      </div>

      {ordersList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center sm:p-16 shadow-xs">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0055FF] border border-blue-100 shadow-xs">
            <FaBoxArchive className="size-8" aria-hidden />
          </div>
          <h3 className="mt-5 text-xl font-black uppercase tracking-tight text-slate-900">
            Aún no tienes pedidos registrados
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
            Cuando realices una compra de nuestras colecciones minoristas o lotes mayoristas, aquí podrás seguir el despacho en tiempo real y consultar tus comprobantes de SUNAT.
          </p>
          <div className="mt-6">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] hover:bg-blue-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <span>Explorar Prendas Ahora</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersList.map((ord) => (
            <article
              key={ord.id}
              data-testid={`customer-order-card-${ord.orderNumber}`}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-shadow hover:shadow-md space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                      {ord.orderNumber}
                    </span>
                    <OrderStatusBadge status={ord.status} />
                    <PaymentStatusBadge status={ord.paymentStatus} />
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-[#0055FF]">
                      {ord.orderMode === "wholesale" ? "Mayorista B2B" : "Minorista B2C"}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-500">
                    <FaCalendarDays className="size-3 text-[#0055FF]" aria-hidden />
                    <span>
                      Emitido el{" "}
                      {new Date(ord.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span>
                      {ord.totalUnits} {ord.totalUnits === 1 ? "prenda" : "prendas"} ({ord.lineCount}{" "}
                      {ord.lineCount === 1 ? "variante" : "variantes"})
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="block font-mono text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">
                    Total del Pedido
                  </span>
                  <span className="text-2xl font-black tabular-nums text-slate-900">
                    {formatPEN(ord.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5 text-slate-600">
                  <p className="flex items-center gap-2">
                    <FaTruckFast className="size-3.5 text-[#0055FF]" aria-hidden />
                    <span>
                      Destino: <strong className="text-slate-900">{ord.shippingDistrict}, {ord.shippingProvince} ({ord.shippingDepartment})</strong>
                    </span>
                  </p>
                  {ord.taxDocument && (
                    <p className="flex items-center gap-2">
                      <FaFileInvoice className="size-3.5 text-emerald-600" aria-hidden />
                      <span>
                        Comprobante SUNAT:{" "}
                        <strong className="uppercase text-slate-900">
                          {ord.taxDocument.documentType} ({ord.billingDocType} {ord.billingDocNumber})
                        </strong>
                      </span>
                    </p>
                  )}
                </div>

                <Link
                  href={`/cuenta/pedidos/${ord.id}`}
                  data-testid={`view-order-detail-${ord.orderNumber}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0055FF] hover:bg-blue-700 px-5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors"
                >
                  <span>Ver Detalle y Comprobante</span>
                  <FaArrowRight className="size-3" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
