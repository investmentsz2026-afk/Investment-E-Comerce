"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Database,
  ChevronDown,
  User,
  ShoppingBag,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Lock,
  Home,
} from "lucide-react";
import { logoutAction } from "@/server/actions/auth";

interface AdminTopbarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function AdminTopbar({ user }: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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

  const initials =
    `${user.firstName?.charAt(0) || "A"}${user.lastName?.charAt(0) || "P"}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between">
      {/* ─── Lado izquierdo: Status de Seguridad y Base de Datos ─── */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-[0.68rem] text-emerald-800 font-medium">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <Database className="size-3 text-emerald-600" />
          <span className="font-mono">Neon PostgreSQL Activo</span>
        </div>

        <span className="hidden md:inline-flex items-center gap-1 text-[0.68rem] text-neutral-400 font-mono">
          <Lock className="size-3 text-neutral-400" />
          TLS 1.3
        </span>
      </div>

      {/* ─── Lado derecho: Enlace a Tienda Pública y Menú de Usuario ─── */}
      <div className="flex items-center gap-4">
        {/* Enlace a Tienda pública */}
        <Link
          href="/catalogo"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#801323] transition-colors"
          title="Ver tienda en una pestaña nueva"
        >
          <span>Tienda pública</span>
          <ExternalLink className="size-3.5 text-neutral-400 hover:text-[#801323]" />
        </Link>

        <div className="h-4 w-px bg-neutral-200" aria-hidden />

        {/* Perfil del Administrador */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-neutral-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#801323]/20"
          >
            {/* Círculo carmesí con iniciales AP */}
            <span className="flex size-8 items-center justify-center rounded-full bg-[#801323] text-xs font-extrabold text-white shadow-xs">
              {initials}
            </span>

            {/* Nombre y chevron */}
            <div className="hidden sm:flex items-center gap-1.5 text-left">
              <span className="text-xs font-bold text-neutral-800">
                {user.firstName} {user.lastName}
              </span>
              <ChevronDown
                className={`size-3.5 text-neutral-400 transition-transform duration-200 ${
                  menuOpen ? "rotate-180 text-neutral-700" : ""
                }`}
              />
            </div>
          </button>

          {/* Menú Desplegable */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50">
              {/* Info de cuenta */}
              <div className="border-b border-neutral-100 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#801323] text-xs font-bold text-white shrink-0">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate font-mono text-[0.65rem] text-neutral-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[0.65rem] font-bold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                  <span>Rol: Administrador Principal</span>
                </div>
              </div>

              {/* Opciones */}
              <div className="py-1">
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  <Home className="size-4 text-neutral-400" />
                  <span>Inicio del panel</span>
                </Link>

                <Link
                  href="/cuenta"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  <User className="size-4 text-neutral-400" />
                  <span>Mi perfil de usuario</span>
                </Link>

                <Link
                  href="/admin/solicitudes"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  <ShieldCheck className="size-4 text-neutral-400" />
                  <span>Solicitudes de empresas B2B</span>
                </Link>

                <Link
                  href="/catalogo"
                  target="_blank"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  <ShoppingBag className="size-4 text-neutral-400" />
                  <span>Ver catálogo en vivo</span>
                </Link>
              </div>

              {/* Botón de Cerrar Sesión */}
              <div className="border-t border-neutral-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <LogOut className="size-4 text-rose-600" />
                  <span>{loggingOut ? "Cerrando sesión..." : "Cerrar sesión segura"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
