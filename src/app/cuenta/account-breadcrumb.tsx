"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHouse, FaChevronRight } from "react-icons/fa6";

const PAGE_NAMES: Record<string, string> = {
  "/cuenta": "Mi perfil",
  "/cuenta/favoritos": "Mis favoritos",
  "/cuenta/bolsa": "Mi bolsa actual",
  "/cuenta/direcciones": "Direcciones",
  "/cuenta/seguridad": "Seguridad",
  "/cuenta/pedidos": "Mis pedidos",
  "/cuenta/cotizaciones": "Cotizaciones B2B",
  "/cuenta/mayorista": "Estado Mayorista",
};

export function AccountBreadcrumb() {
  const pathname = usePathname();

  let currentPageName = PAGE_NAMES[pathname];
  if (!currentPageName) {
    if (pathname.startsWith("/cuenta/pedidos/")) {
      currentPageName = "Detalle de pedido";
    } else if (pathname.startsWith("/cuenta/cotizaciones/")) {
      currentPageName = "Detalle de cotización";
    } else {
      currentPageName = "Mi cuenta";
    }
  }

  return (
    <nav aria-label="Ruta de navegación" className="mb-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
      <Link href="/" className="inline-flex items-center gap-1.5 hover:text-[#0055FF] transition-colors">
        <FaHouse className="size-3 text-slate-400" aria-hidden />
        <span>Inicio</span>
      </Link>
      <FaChevronRight className="size-2 text-slate-300" aria-hidden />
      <Link href="/cuenta" className="hover:text-[#0055FF] transition-colors">
        Mi cuenta
      </Link>
      {pathname !== "/cuenta" && (
        <>
          <FaChevronRight className="size-2 text-slate-300" aria-hidden />
          <span className="text-slate-900 font-bold">{currentPageName}</span>
        </>
      )}
    </nav>
  );
}
