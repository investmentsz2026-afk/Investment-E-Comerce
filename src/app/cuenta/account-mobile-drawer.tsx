"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MoreVertical, X } from "lucide-react";
import {
  FaUser,
  FaHeart,
  FaBagShopping,
  FaLocationDot,
  FaShieldHalved,
  FaBoxArchive,
  FaBuilding,
  FaFileInvoice,
  FaWhatsapp,
  FaChevronRight,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface AccountMobileDrawerProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

interface NavOption {
  href: string;
  label: string;
  badge?: string;
  icon: typeof FaUser;
}

/**
 * Barra compacta con botón de 3 puntos (⋮) para móvil/tablet en /cuenta.
 * Al tocarlo, despliega un panel animado desde la derecha con todas las secciones del perfil
 * y se oculta automáticamente al elegir una opción.
 */
export function AccountMobileDrawer({
  userRole,
  userName,
  userEmail,
}: AccountMobileDrawerProps) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  const items: NavOption[] = [
    { href: "/cuenta", label: "Mi perfil", icon: FaUser },
    { href: "/cuenta/favoritos", label: "Mis favoritos", icon: FaHeart },
    { href: "/cuenta/bolsa", label: "Mi bolsa actual", icon: FaBagShopping },
    { href: "/cuenta/direcciones", label: "Direcciones", icon: FaLocationDot },
    { href: "/cuenta/seguridad", label: "Seguridad", icon: FaShieldHalved },
    { href: "/cuenta/pedidos", label: "Mis pedidos", icon: FaBoxArchive },
  ];

  if (userRole === "business_approved" || userRole === "admin") {
    items.push({
      href: "/cuenta/cotizaciones",
      label: "Cotizaciones B2B",
      icon: FaFileInvoice,
    });
  }

  if (userRole === "customer") {
    items.push({
      href: "/mayorista/registro",
      label: "Cuenta mayorista B2B",
      badge: "Hasta -50%",
      icon: FaBuilding,
    });
  } else {
    items.push({
      href: "/cuenta/mayorista",
      label: "Estado Mayorista",
      icon: FaBuilding,
    });
  }

  const activeItem =
    items.find((it) =>
      it.href === "/cuenta"
        ? pathname === "/cuenta"
        : pathname === it.href || pathname.startsWith(`${it.href}/`),
    ) ?? items[0];

  const ActiveIcon = activeItem.icon;

  // Cerrar con tecla Escape y bloquear scroll cuando está abierto
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* Barra compacta que reemplaza las 8 opciones visibles en pantalla */}
      <button
        type="button"
        onClick={() => setOpenPath(pathname)}
        aria-label="Ver opciones del perfil"
        aria-expanded={open}
        data-testid="account-mobile-options-trigger"
        className="mt-3 flex w-full items-center justify-between gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-left shadow-xs transition-all active:scale-[0.99] hover:border-blue-300"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF]">
            <ActiveIcon className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-tight text-slate-900">
              {activeItem.label}
            </p>
            <p className="truncate text-[0.62rem] font-medium text-slate-500">
              Toca los 3 puntos para ver todas las opciones del perfil
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/90 px-2.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-[#0055FF]">
          <span>Opciones</span>
          <MoreVertical className="size-3.5" aria-hidden />
        </span>
      </button>

      {/* Panel lateral derecho animado con todas las opciones */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[75] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Opciones del perfil"
          >
            {/* Fondo difuminado oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setOpenPath(null)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
              aria-hidden
            />

            {/* Drawer deslizándose desde la derecha */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-10 flex w-[84%] max-w-[330px] flex-col overflow-hidden rounded-l-3xl border-l border-slate-200 bg-white shadow-[-20px_0_50px_-12px_rgba(15,23,42,0.35)]"
            >
              {/* Cabecera del panel */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0055FF] px-4 py-3.5 text-white">
                <div className="min-w-0">
                  <p className="text-[0.58rem] font-bold uppercase tracking-widest text-blue-200">
                    Menú del Perfil
                  </p>
                  <p className="truncate text-xs font-black uppercase text-white">
                    {userName}
                  </p>
                  <p className="truncate font-mono text-[0.6rem] text-blue-100/80">
                    {userEmail}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenPath(null)}
                  aria-label="Cerrar menú del perfil"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white transition-colors hover:bg-white hover:text-slate-900"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              {/* Lista de opciones del perfil */}
              <nav
                aria-label="Opciones de cuenta móvil"
                className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5"
              >
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/cuenta"
                      ? pathname === "/cuenta"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenPath(null)}
                      className={cn(
                        "flex items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs transition-all",
                        isActive
                          ? "border-blue-200 bg-blue-50 font-extrabold text-[#0055FF] shadow-xs"
                          : "border-slate-100 bg-slate-50/50 font-semibold text-slate-700 hover:border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-xl",
                            isActive
                              ? "bg-[#0055FF] text-white"
                              : "bg-white text-slate-500 border border-slate-200/70",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {item.badge && (
                          <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[0.55rem] font-black uppercase text-[#EF233C]">
                            {item.badge}
                          </span>
                        )}
                        <FaChevronRight
                          className={cn(
                            "size-2.5",
                            isActive ? "text-[#0055FF]" : "text-slate-400",
                          )}
                          aria-hidden
                        />
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Soporte rápido en pie del drawer */}
              <div className="border-t border-slate-100 bg-slate-50/80 p-3.5 pb-safe">
                <a
                  href="https://wa.me/51926922583?text=Hola%20American%20Colt%20JEANS,%20necesito%20ayuda%20con%20mi%20cuenta"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenPath(null)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-white px-3 py-2.5 text-xs font-extrabold text-emerald-700 shadow-xs transition-colors hover:bg-emerald-50"
                >
                  <FaWhatsapp className="size-4 text-emerald-500" aria-hidden />
                  <span>Atención WhatsApp ↗</span>
                </a>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
