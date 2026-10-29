import Link from "next/link";
import { requireAuth } from "@/server/auth/session";
import { getUserOrdersList } from "@/server/queries/orders";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import { formatPEN } from "@/lib/format";
import { Package, ArrowRight, FileText, Truck, Calendar } from "lucide-react";

export const instant = false;

export default async function OrdersPage() {
  const { user } = await requireAuth("/cuenta/pedidos");
  const ordersList = await getUserOrdersList(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <h2 className="font-display text-2xl text-ink">Historial de Pedidos</h2>
          <p className="mt-1 text-xs text-taupe-500">
            Revisa el estado de tus compras, pagos, seguimiento de despacho y comprobantes electrónicos.
          </p>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex h-10 items-center justify-center border border-ink/20 bg-paper px-4 font-mono text-xs uppercase tracking-wider text-ink hover:border-ink"
        >
          Explorar catálogo
        </Link>
      </div>

      {ordersList.length === 0 ? (
        <div className="border border-dashed border-ink/20 bg-paper/50 p-12 text-center sm:p-16">
          <Package className="mx-auto size-10 text-taupe-400" aria-hidden />
          <h3 className="mt-4 font-display text-lg text-ink">
            Aún no tienes pedidos registrados
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-taupe-500">
            Cuando realices una compra de nuestras colecciones minoristas o mayoristas, aquí podrás dar seguimiento a tu paquete y consultar tus comprobantes.
          </p>
          <div className="mt-6">
            <Link
              href="/catalogo"
              className="group inline-flex items-center gap-2 bg-ink px-5 py-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
            >
              Explorar catálogo
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersList.map((ord) => (
            <article
              key={ord.id}
              data-testid={`customer-order-card-${ord.orderNumber}`}
              className="border border-ink/15 bg-[#fbfaf7] p-5 transition-colors hover:border-ink/40 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                      {ord.orderNumber}
                    </span>
                    <OrderStatusBadge status={ord.status} />
                    <PaymentStatusBadge status={ord.paymentStatus} />
                    <span className="border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[0.6rem] uppercase text-taupe-600">
                      {ord.orderMode === "wholesale" ? "Mayorista B2B" : "Minorista B2C"}
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-2 font-mono text-xs text-taupe-500">
                    <Calendar className="size-3.5" aria-hidden />
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
                  <span className="block font-mono text-[0.62rem] uppercase text-taupe-500">
                    Total del Pedido
                  </span>
                  <span className="font-display text-2xl font-bold tabular-nums text-ink">
                    {formatPEN(ord.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-1 text-taupe-600">
                  <p className="flex items-center gap-1.5">
                    <Truck className="size-3.5 text-ink" aria-hidden />
                    <span>
                      Entrega en: <strong className="text-ink">{ord.shippingDistrict}, {ord.shippingProvince} ({ord.shippingDepartment})</strong>
                    </span>
                  </p>
                  {ord.taxDocument && (
                    <p className="flex items-center gap-1.5">
                      <FileText className="size-3.5 text-ink" aria-hidden />
                      <span>
                        Comprobante:{" "}
                        <strong className="uppercase text-ink">
                          {ord.taxDocument.documentType} ({ord.billingDocType} {ord.billingDocNumber})
                        </strong>
                      </span>
                    </p>
                  )}
                </div>

                <Link
                  href={`/cuenta/pedidos/${ord.id}`}
                  data-testid={`view-order-detail-${ord.orderNumber}`}
                  className="inline-flex h-10 items-center justify-center gap-2 bg-ink px-5 font-mono text-xs font-medium uppercase tracking-wider text-paper transition-colors hover:bg-cochinilla"
                >
                  <span>Ver detalle y comprobante</span>
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
