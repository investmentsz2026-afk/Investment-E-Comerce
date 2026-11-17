import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/server/auth/session";
import { getUserOrdersList } from "@/server/queries/orders";
import { formatPrice } from "@/lib/format";
import { ProductReturnForm } from "@/components/returns/product-return-form";
import {
  FaArrowLeft,
  FaCircleCheck,
  FaRotateLeft,
  FaShieldHalved,
} from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Solicitud de Cambio de Talla o Devolución | American Colt JEANS™",
  description:
    "Gestiona el cambio de talla o modelo de tu prenda de forma rápida y garantizada. Sube fotos de tu compra y coordina por WhatsApp con asesores oficiales de American Colt JEANS™.",
};

export default async function ProductReturnsPage() {
  const { user } = await getCurrentSession();

  let recentOrdersFormatted: {
    orderNumber: string;
    date: string;
    itemsSummary: string;
    totalText: string;
  }[] = [];

  if (user) {
    const userOrders = await getUserOrdersList(user.id);
    recentOrdersFormatted = userOrders.map((ord) => ({
      orderNumber: ord.orderNumber,
      date: new Date(ord.createdAt).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      itemsSummary: `${ord.orderMode === "wholesale" ? "Lote Mayorista" : "Compra Minorista"}`,
      totalText: formatPrice(ord.totalAmount),
    }));
  }

  return (
    <div className="bg-slate-50 pt-[6.5rem] pb-20 lg:pt-[9.75rem]">
      <div className="shell max-w-4xl space-y-8">
        {/* Enlace de regreso y Encabezado Ejecutivo */}
        <div>
          <Link
            href="/atencion-al-cliente"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold uppercase text-[#0055FF] hover:text-[#B91C24]"
          >
            <FaArrowLeft className="size-3" aria-hidden />
            <span>Volver al Centro de Atención al Cliente</span>
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EF233C] px-3 py-0.5 font-mono text-[0.62rem] font-black uppercase tracking-wider text-white shadow-xs">
              <FaRotateLeft className="size-2.5" aria-hidden />
              <span>GESTIÓN DE CAMBIO OFICIAL</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-0.5 font-mono text-[0.62rem] font-extrabold uppercase tracking-wider text-[#0055FF]">
              <FaShieldHalved className="size-2.5" aria-hidden />
              <span>Garantía 7 Días</span>
            </span>
          </div>

          <h1 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Cambio de Talla o Devolución de Prenda
          </h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Si recibiste tu pantalón, jean o camisa y la talla te quedó grande, chica o prefieres otro modelo, llena tus datos para coordinar el cambio de inmediato.
          </p>
        </div>

        {/* 3 Pasos del Proceso */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-mono text-xs font-black text-[#0055FF]">
              01
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-slate-900">Llena tu solicitud</p>
              <p className="text-[0.68rem] text-slate-500">N.° pedido, prenda y fotos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 font-mono text-xs font-black text-[#EF233C]">
              02
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-slate-900">Coordinación WhatsApp</p>
              <p className="text-[0.68rem] text-slate-500">Envío directo de tu ticket</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-mono text-xs font-black text-emerald-700">
              03
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-slate-900">Recojo y Nueva Talla</p>
              <p className="text-[0.68rem] text-slate-500">Lima o agencia de provincia</p>
            </div>
          </div>
        </div>

        {/* Formulario Principal de Cambio */}
        <ProductReturnForm user={user} recentOrders={recentOrdersFormatted} />

        {/* Términos rápidos de la política de cambio */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <h3 className="flex items-center gap-2 font-sans text-xs font-black uppercase tracking-wider text-[#0055FF]">
            <FaShieldHalved className="size-4" aria-hidden />
            <span>Condiciones para hacer válido tu cambio:</span>
          </h3>
          <ul className="mt-2.5 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <FaCircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
              <span>La prenda debe encontrarse sin uso, sin lavar y en perfecto estado.</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
              <span>Conservar las etiquetas originales y el empaque o bolsa oficial.</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
              <span>Plazo máximo de 7 días calendario tras la recepción del producto.</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
              <span>Contar con el número de pedido, boleta de venta o factura electrónica.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
