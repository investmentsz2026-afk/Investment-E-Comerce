"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Database,
  ExternalLink,
  Home,
  Lock,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { AdminLogoutModal } from "./admin-logout-modal";

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
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const initials =
    `${user.firstName?.charAt(0) || "A"}${user.lastName?.charAt(0) || "P"}`.toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl shadow-[0_8px_28px_-16px_rgba(15,23,42,0.14)] sm:px-6 lg:px-8 font-sans antialiased">
        {/* ─── IZQUIERDA: BADGES 3D DE INFRAESTRUCTURA Y SEGURIDAD ─── */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/70 px-3.5 py-1.5 text-xs font-extrabold text-emerald-900 shadow-[0_4px_12px_-6px_rgba(16,185,129,0.35)]">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <Database className="size-3.5 text-emerald-600" />
            <span>Neon PostgreSQL Activo</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-[0.72rem] font-extrabold text-slate-600">
            <Lock className="size-3.5 text-blue-600" />
            <span>TLS 1.3</span>
          </div>
        </div>

        {/* ─── DERECHA: BOTÓN TIENDA PÚBLICA 3D + PERFIL CIRCULAR MODERNO ─── */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/catalogo"
            target="_blank"
            className="group hidden sm:inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 shadow-[0_4px_0_rgba(203,213,225,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#DC2626] hover:bg-red-50/40 hover:text-[#DC2626] hover:shadow-[0_6px_0_rgba(220,38,38,0.22)] active:translate-y-0"
            title="Abrir tienda pública en pestaña nueva"
          >
            <ShoppingBag className="size-3.5 text-[#DC2626] transition-transform group-hover:scale-110" />
            <span>Tienda pública</span>
            <ExternalLink className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#DC2626]" />
          </Link>

          <div className="hidden sm:block h-6 w-px bg-slate-200" aria-hidden />

          {/* PERFIL DE ADMIN CIRCULAR 3D + MENÚ DESPLEGABLE */}
          <div className="relative" ref={menuRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              className={`group flex items-center gap-3 rounded-full border-2 p-1 pr-3 transition-all duration-200 focus:outline-none ${
                menuOpen
                  ? "border-[#DC2626] bg-red-50/70 shadow-[0_10px_24px_-8px_rgba(220,38,38,0.35)]"
                  : "border-slate-200/90 bg-white shadow-[0_6px_16px_-8px_rgba(15,23,42,0.18)] hover:border-red-300 hover:shadow-[0_10px_22px_-8px_rgba(220,38,38,0.28)]"
              }`}
            >
              {/* Círculo 3D con aro degradado e indicador en línea */}
              <div className="relative">
                <span className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] text-xs font-black text-white shadow-[0_6px_14px_-4px_rgba(220,38,38,0.65)] transition-transform duration-200 group-hover:scale-105">
                  {initials}
                </span>
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
              </div>

              <div className="hidden md:block text-left leading-tight">
                <span className="block text-xs font-black text-slate-950">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-[0.65rem] font-extrabold text-[#DC2626]">
                  Administrador
                </span>
              </div>

              <span
                className={`flex size-6 items-center justify-center rounded-full transition-colors ${
                  menuOpen
                    ? "bg-[#DC2626] text-white"
                    : "bg-slate-100 text-slate-600 group-hover:bg-red-100 group-hover:text-[#DC2626]"
                }`}
              >
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </motion.button>

            {/* MENÚ DESPLEGABLE MODERNO 3D */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -8 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="absolute right-0 mt-3 w-72 origin-top-right overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_60px_-14px_rgba(15,23,42,0.3)] ring-1 ring-black/5 z-50"
                >
                  {/* Cabecera gradiente 3D del perfil */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#1E3A8A] p-4 text-white">
                    <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/15 blur-xl" />

                    <div className="relative flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-sm font-black text-white shadow-md backdrop-blur-md">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-[0.7rem] font-semibold text-white/85">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[0.65rem] font-extrabold text-emerald-100 backdrop-blur-md">
                      <CheckCircle2 className="size-3.5 text-emerald-300" />
                      <span>Sesión Administrador Verificada</span>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="p-2 space-y-1">
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-slate-800 transition hover:bg-red-50/70 hover:text-[#991B1B]"
                    >
                      <span className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-[#DC2626] transition group-hover:bg-[#DC2626] group-hover:text-white">
                        <Home className="size-4" />
                      </span>
                      <span>Inicio del Panel</span>
                    </Link>

                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-slate-800 transition hover:bg-blue-50/70 hover:text-blue-800"
                    >
                      <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        <BarChart3 className="size-4" />
                      </span>
                      <span>Dashboard Analítico</span>
                    </Link>

                    <Link
                      href="/cuenta"
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-slate-800 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      <span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                        <User className="size-4" />
                      </span>
                      <span>Mi Perfil de Usuario</span>
                    </Link>

                    <Link
                      href="/admin/solicitudes"
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-slate-800 transition hover:bg-emerald-50/70 hover:text-emerald-900"
                    >
                      <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                        <ShieldCheck className="size-4" />
                      </span>
                      <span>Solicitudes Empresas B2B</span>
                    </Link>

                    <Link
                      href="/catalogo"
                      target="_blank"
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-slate-800 transition hover:bg-indigo-50/70 hover:text-indigo-900"
                    >
                      <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                        <Sparkles className="size-4" />
                      </span>
                      <span>Ver Tienda en Vivo</span>
                    </Link>
                  </div>

                  {/* Cerrar Sesión con Confirmación Modal */}
                  <div className="border-t border-slate-100 p-2 bg-slate-50/70">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setLogoutModalOpen(true);
                      }}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-red-50/80 px-3 py-2.5 text-xs font-black text-[#991B1B] transition hover:bg-gradient-to-r hover:from-[#991B1B] hover:to-[#DC2626] hover:text-white hover:shadow-md"
                    >
                      <span className="flex size-8 items-center justify-center rounded-xl bg-white text-[#DC2626] shadow-xs transition group-hover:bg-white/20 group-hover:text-white">
                        <LogOut className="size-4" />
                      </span>
                      <span>Cerrar Sesión Segura</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <AdminLogoutModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        userName={`${user.firstName} ${user.lastName}`}
        userEmail={user.email}
      />
    </>
  );
}
