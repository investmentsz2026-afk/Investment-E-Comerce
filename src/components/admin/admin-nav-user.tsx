"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, User, ShoppingBag, ShieldCheck, LogOut, CheckCircle2 } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";

interface AdminNavUserProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function AdminNavUser({ user }: AdminNavUserProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutAction();
      router.push("/iniciar-sesion");
      router.refresh();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setLoggingOut(false);
    }
  };

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || "AD";

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón trigger con avatar y 3 puntitos (...) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menú de opciones de administrador"
        className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 py-1.5 pl-2 pr-2.5 text-paper transition-all hover:border-white/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cochinilla"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-cochinilla text-[0.65rem] font-bold text-paper">
          {initials}
        </span>
        <div className="hidden text-left md:block">
          <p className="text-[0.72rem] font-medium leading-none text-paper">
            {user.firstName} {user.lastName}
          </p>
          <p className="mt-0.5 font-mono text-[0.62rem] text-paper/60 leading-none">
            Admin
          </p>
        </div>
        {/* 3 Puntitos (...) */}
        <span
          className="flex size-6 items-center justify-center rounded-full text-paper/70 hover:text-paper"
          title="Más opciones"
        >
          <MoreVertical className="size-4" aria-hidden />
        </span>
      </button>

      {/* Menú desplegable flotante */}
      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 origin-top-right border border-ink/15 bg-paper p-1.5 shadow-xl text-ink ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50"
        >
          {/* Cabecera del usuario */}
          <div className="border-b border-ink/10 px-3 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-ink text-[0.7rem] font-bold text-paper">
                {initials}
              </span>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-semibold text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate font-mono text-[0.65rem] text-taupe-500">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-1 text-[0.62rem] font-medium text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3 text-emerald-600" aria-hidden />
              <span>Acceso Administrador Activo</span>
            </div>
          </div>

          {/* Opciones */}
          <div className="py-1">
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <User className="size-3.5 text-taupe-500" aria-hidden />
              <span>Ver mi perfil / cuenta</span>
            </Link>

            <Link
              href="/admin/solicitudes"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <ShieldCheck className="size-3.5 text-taupe-500" aria-hidden />
              <span>Bandeja de solicitudes B2B</span>
            </Link>

            <Link
              href="/catalogo"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <ShoppingBag className="size-3.5 text-taupe-500" aria-hidden />
              <span>Ver catálogo / tienda pública</span>
            </Link>
          </div>

          {/* Separador y Cerrar sesión */}
          <div className="border-t border-ink/10 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-cochinilla transition-colors hover:bg-cochinilla/10 disabled:opacity-50"
            >
              <LogOut className="size-3.5" aria-hidden />
              <span>{loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
