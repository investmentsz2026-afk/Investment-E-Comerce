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
    <div className="space-y-4 text-slate-900 sm:space-y-6">
      <div className="flex flex-col justify-between gap-2.5 border-b border-slate-200/80 pb-3.5 sm:flex-row sm:items-center sm:gap-4 sm:pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
            Historial de Pedidos
          </h2>
          <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:mt-1 sm:text-xs">
            Revisa tus compras, pagos y despacho oficial de American Colt JEANS™.
          </p>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-[0.66rem] font-bold uppercase tracking-wider text-slate-700 shadow-xs transition-colors hover:border-[#0055FF] hover:text-[#0055FF] sm:h-10 sm:gap-2 sm:px-4 sm:text-xs"
        >
          <FaBagShopping className="size-3 text-[#0055FF] sm:size-3.5" />
          <span>Explorar Catálogo</span>
        </Link>
      </div>

      {ordersList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs sm:rounded-3xl sm:p-16">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#0055FF] shadow-xs sm:size-16">
            <FaBoxArchive className="size-6 sm:size-8" aria-hidden />
          </div>
          <h3 className="mt-4 text-lg font-black uppercase tracking-tight text-slate-900 sm:mt-5 sm:text-xl">
            Aún no tienes pedidos registrados
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 sm:mt-2">
            Cuando compres en nuestra tienda, aquí podrás seguir el despacho y consultar tus comprobantes SUNAT.
          </p>
          <div className="mt-5 sm:mt-6">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:bg-blue-700 sm:py-3.5"
            >
              <span>Explorar Prendas</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {ordersList.map((ord) => (
            <article
              key={ord.id}
              data-testid={`customer-order-card-${ord.orderNumber}`}
              className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-md sm:space-y-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-slate-100 pb-3 sm:gap-4 sm:pb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
                      {ord.orderNumber}
                    </span>
                    <OrderStatusBadge status={ord.status} />
                    <PaymentStatusBadge status={ord.paymentStatus} />
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[0.54rem] font-bold uppercase tracking-wider text-[#0055FF] sm:px-2.5 sm:text-[0.62rem]">
                      {ord.orderMode === "wholesale" ? "B2B" : "B2C"}
                    </span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[0.65rem] text-slate-500 sm:mt-2 sm:gap-2 sm:text-xs">
                    <FaCalendarDays className="size-3 text-[#0055FF]" aria-hidden />
                    <span>
                      {new Date(ord.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span>
                      {ord.totalUnits} {ord.totalUnits === 1 ? "prenda" : "prendas"}
                    </span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="block font-mono text-[0.54rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.62rem]">
                    Total
                  </span>
                  <span className="text-lg font-black tabular-nums text-slate-900 sm:text-2xl">
                    {formatPEN(ord.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-2.5 text-[0.7rem] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:text-xs">
                <div className="space-y-1 text-slate-600 sm:space-y-1.5">
                  <p className="flex items-center gap-1.5 sm:gap-2">
                    <FaTruckFast className="size-3 shrink-0 text-[#0055FF] sm:size-3.5" aria-hidden />
                    <span className="truncate">
                      <strong className="text-slate-900">{ord.shippingDistrict}, {ord.shippingProvince}</strong> ({ord.shippingDepartment})
                    </span>
                  </p>
                  {ord.taxDocument && (
                    <p className="flex items-center gap-1.5 sm:gap-2">
                      <FaFileInvoice className="size-3 shrink-0 text-emerald-600 sm:size-3.5" aria-hidden />
                      <span className="truncate">
                        SUNAT:{" "}
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
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0055FF] px-4 font-mono text-[0.66rem] font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-blue-700 sm:h-10 sm:w-auto sm:gap-2 sm:px-5 sm:text-xs"
                >
                  <span>Ver Detalle y SUNAT</span>
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
