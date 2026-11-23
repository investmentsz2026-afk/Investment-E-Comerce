"use client";

import { useActionState, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  FaLock,
  FaEnvelope,
  FaUser,
  FaUserPlus,
  FaUserCheck,
  FaBuilding,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaArrowLeft,
  FaShieldHalved,
  FaTruckFast,
  FaGem,
  FaFileInvoice,
  FaTags,
  FaBoxesStacked,
  FaWhatsapp,
  FaCircleCheck,
  FaCircleExclamation,
  FaSpinner,
  FaStar,
} from "react-icons/fa6";
import { Logo } from "@/components/brand/logo";
import { PasswordRequirementsGuide } from "@/components/auth/password-requirements-guide";
import {
  loginAction,
  registerCustomerAction,
  type ActionResult,
} from "@/server/actions/auth";

export type AuthMode = "login" | "register" | "wholesale";

const CELEBRATION_PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const radius = 280 + (i % 5) * 40;
  return {
    targetX: Math.cos(angle) * radius,
    targetY: Math.sin(angle) * radius,
    rotate: i * 45,
    delay: (i % 6) * 0.18,
    isLarge: i % 2 === 0,
    colorClass:
      i % 3 === 0
        ? "text-amber-400"
        : i % 3 === 1
          ? "text-[#0055FF]"
          : "text-[#EF233C]",
  };
});

interface Auth3DExperienceProps {
  initialMode?: AuthMode;
  nextParam?: string;
  verifiedParam?: boolean;
  resetParam?: boolean;
}

export function Auth3DExperience({
  initialMode = "login",
  nextParam = "",
  verifiedParam = false,
  resetParam = false,
}: Auth3DExperienceProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Estados de visibilidad de contraseñas
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Estados preservados de formulario de registro (evita que se borren datos al haber error)
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);

  // Modal de celebración tras crear cuenta
  const [showCelebration, setShowCelebration] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");

  // Física 3D Magnética & Specular Glare
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    isHovering: false,
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Inclinación máxima de 10 grados en 3D
    const rotateY = (x - 0.5) * 16;
    const rotateX = (0.5 - y) * 14;

    setTilt({
      rotateX,
      rotateY,
      glareX: x * 100,
      glareY: y * 100,
      isHovering: true,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      isHovering: false,
    });
  }, []);

  // Cambio de modo con sincronización suave de URL
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      const targetPath =
        newMode === "login"
          ? "/iniciar-sesion"
          : newMode === "register"
            ? "/registro"
            : "/mayorista/registro";
      window.history.replaceState(null, "", targetPath);
    }
  };

  // --- ACCIÓN DE INICIO DE SESIÓN ---
  const [loginState, loginFormAction, isLoginPending] = useActionState<
    ActionResult<{ role: string; redirect: string }>,
    FormData
  >(loginAction, { success: false });

  useEffect(() => {
    if (loginState.success && loginState.data?.redirect) {
      router.push(loginState.data.redirect);
      router.refresh();
    }
  }, [loginState, router]);

  // --- ACCIÓN DE REGISTRO B2C ---
  const [regState, regFormAction, isRegPending] = useActionState<
    ActionResult<{ userId: number }>,
    FormData
  >(
    async (prev, formData) => {
      const res = await registerCustomerAction(prev, formData);
      if (res.success) {
        setShowCelebration(true);
      }
      return res;
    },
    { success: false },
  );

  const handleAcceptCelebration = () => {
    setShowCelebration(false);
    setLoginEmail(regEmail);
    switchMode("login");
  };

  return (
    <div className="relative min-h-screen bg-[#070D18] text-white selection:bg-[#EF233C] selection:text-white overflow-hidden flex flex-col justify-between">
      {/* Luces de ambiente 4D y mallas de gradiente reactivas */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[620px] rounded-full bg-[#0055FF]/18 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 size-[560px] rounded-full bg-[#EF233C]/14 blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 size-[600px] rounded-full bg-[#1D4ED8]/16 blur-[150px]" />
        {/* Patrón sutil de cuadrícula tecnológica */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Barra de cabecera superior */}
      <header className="relative z-30 border-b border-white/10 bg-[#070D18]/85 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:text-white"
          >
            <FaArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" aria-hidden />
            <span>Volver a la tienda</span>
          </Link>

          <Link
            href="/"
            aria-label="American Colt JEANS™ — Portada"
            className="inline-block transition-transform hover:scale-105 active:scale-95"
          >
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/51926922583?text=Hola%20American%20Colt%20JEANS,%20necesito%20ayuda%20con%20mi%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
            >
              <FaWhatsapp className="size-3.5 text-emerald-400" aria-hidden />
              <span>WhatsApp Directo</span>
            </a>

            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[0.7rem] font-mono uppercase tracking-wider text-blue-300">
              <FaShieldHalved className="size-3 text-blue-400" aria-hidden />
              <span>Conexión SSL Cifrada</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor Principal: Split-Screen Studio Showcase + 3D Magnetic Card */}
      <main className="relative z-20 flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* LADO IZQUIERDO (Desktop): Showroom de Marca American Colt JEANS™ */}
          <div className="hidden lg:col-span-5 lg:flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-600/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#EF233C]">
              <span className="size-2 rounded-full bg-[#EF233C] animate-pulse" />
              Catálogo Oficial 2026 · Hombre &amp; Denim
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                La Marca N° 1 de Jeans &amp; Drill en el Perú
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                Mezclilla Ring Spun de 12.5 a 14 oz, 100% algodón peruano de alto gramaje, teñido reactivo anti-decoloración y calce anatómico superior (tallas 28 al 46).
              </p>
            </div>

            {/* Fotografía de estudio con efectos 3D y badges flotantes */}
            <div className="relative mt-2 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-slate-800/40 to-slate-900/80 p-2 shadow-2xl backdrop-blur-xl group">
              <div className="relative h-72 w-full overflow-hidden rounded-xl">
                <Image
                  src="/catalogo-colt/hero-colt-2.png"
                  alt="Colección Oficial American Colt JEANS 2026"
                  fill
                  priority
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 1024px) 480px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-transparent to-transparent opacity-85" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                  <span className="font-bold tracking-wide uppercase text-white">American Colt JEANS™</span>
                  <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[0.65rem] text-slate-300">
                    LIMA — PERÚ
                  </span>
                </div>
              </div>

              {/* 4 Badges Holográficos Flotantes */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm transition-colors hover:border-[#0055FF]/50">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-[#0055FF]">
                    <FaTruckFast className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold text-white">Envíos a Todo el Perú</p>
                    <p className="text-[0.65rem] text-slate-400">Shalom, Olva y Agencias</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm transition-colors hover:border-[#EF233C]/50">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-[#EF233C]">
                    <FaGem className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold text-white">Algodón 100% Peruano</p>
                    <p className="text-[0.65rem] text-slate-400">Garantía de Resistencia</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm transition-colors hover:border-emerald-500/50">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <FaFileInvoice className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold text-white">Boleta y Factura SUNAT</p>
                    <p className="text-[0.65rem] text-slate-400">Emisión Electrónica 100%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm transition-colors hover:border-amber-500/50">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <FaBuilding className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold text-white">+1,500 Clientes B2B</p>
                    <p className="text-[0.65rem] text-slate-400">Precios por Mayor Directo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: Tarjeta 3D Magnética con Giro Tipo Libro y Cambiador de Modo */}
          <div className="lg:col-span-7 flex justify-center [perspective:1400px]">
            <div
              ref={cardRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              style={{
                transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                transformStyle: "preserve-3d",
                transition: tilt.isHovering ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
              className="relative w-full max-w-xl rounded-3xl border border-white/20 bg-[#0B1325]/90 p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_-15px_rgba(0,85,255,0.25)] backdrop-blur-2xl"
            >
              {/* Reflejo / Glare especular magnético dinámico */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
                style={{
                  opacity: tilt.isHovering ? 0.25 : 0,
                  background: `radial-gradient(circle 380px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.4), transparent 70%)`,
                }}
              />

              {/* Borde reactivo luminoso */}
              <div
                className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-50 blur-xs transition-opacity duration-300"
                style={{
                  background: `linear-gradient(${tilt.rotateY * 15 + 135}deg, #0055FF, #EF233C, transparent)`,
                }}
              />

              {/* Cabecera de la Tarjeta 3D: Pestañas Interactivas (Login / Registro / B2B) */}
              <div className="relative z-10 [transform:translateZ(30px)]">
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest text-blue-300">
                    <FaShieldHalved className="size-3 text-blue-400" aria-hidden />
                    Portal Oficial de Acceso Seguro
                  </span>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                    American Colt JEANS™
                  </h2>
                </div>

                {/* Switcher 3D Tipo Pestañas Segmentadas */}
                <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${mode === "login"
                      ? "bg-gradient-to-r from-[#0055FF] to-[#2563EB] text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <FaLock className="size-3" aria-hidden />
                    <span className="hidden sm:inline">Iniciar</span> Sesión
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${mode === "register"
                      ? "bg-gradient-to-r from-[#0055FF] to-[#2563EB] text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <FaUserPlus className="size-3" aria-hidden />
                    <span className="hidden sm:inline">Crear</span> Cuenta
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("wholesale")}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${mode === "wholesale"
                      ? "bg-gradient-to-r from-[#EF233C] to-[#DC2626] text-white shadow-lg shadow-red-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <FaBuilding className="size-3" aria-hidden />
                    Mayorista <span className="hidden sm:inline">B2B</span>
                  </button>
                </div>
              </div>

              {/* CONTENIDO 3D CON EFECTO DE VUELTA DE PÁGINA / LIBRO */}
              <div className="relative mt-6 [transform:translateZ(20px)]">
                <AnimatePresence mode="wait">
                  {/* --- MODO 1: INICIAR SESIÓN --- */}
                  {mode === "login" && (
                    <motion.div
                      key="login"
                      initial={{ rotateY: 75, opacity: 0, scale: 0.96 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      exit={{ rotateY: -75, opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="space-y-5"
                    >
                      {/* Banners informativos de verificación o restablecimiento */}
                      {verifiedParam && (
                        <div
                          className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-200 backdrop-blur-md"
                          role="status"
                        >
                          <FaCircleCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" aria-hidden />
                          <span>Tu correo electrónico ha sido verificado exitosamente. Ya puedes ingresar.</span>
                        </div>
                      )}

                      {resetParam && (
                        <div
                          className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-200 backdrop-blur-md"
                          role="status"
                        >
                          <FaCircleCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" aria-hidden />
                          <span>Tu contraseña ha sido restablecida con éxito. Ingresa con tu nueva clave.</span>
                        </div>
                      )}

                      {loginState.error && (
                        <div
                          className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/70 p-3.5 text-xs text-red-200 backdrop-blur-md"
                          role="alert"
                        >
                          <FaCircleExclamation className="size-4 shrink-0 text-red-400 mt-0.5" aria-hidden />
                          <span>{loginState.error}</span>
                        </div>
                      )}

                      <form action={loginFormAction} className="space-y-4">
                        <input type="hidden" name="next" value={nextParam} />

                        {/* Campo Correo */}
                        <div>
                          <label
                            htmlFor="login-email"
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"
                          >
                            <FaEnvelope className="size-3.5 text-[#0055FF]" aria-hidden />
                            <span>Correo electrónico</span>
                          </label>
                          <div className="relative mt-2">
                            <input
                              id="login-email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="tu-correo@ejemplo.com"
                              disabled={isLoginPending}
                              className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-4 py-3.5 text-sm text-white placeholder-slate-500 transition-all focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* Campo Contraseña */}
                        <div>
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="login-password"
                              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"
                            >
                              <FaLock className="size-3.5 text-[#0055FF]" aria-hidden />
                              <span>Contraseña</span>
                            </label>
                            <Link
                              href="/recuperar-contrasena"
                              className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              ¿Olvidaste tu contraseña?
                            </Link>
                          </div>
                          <div className="relative mt-2">
                            <input
                              id="login-password"
                              name="password"
                              type={showLoginPassword ? "text" : "password"}
                              autoComplete="current-password"
                              required
                              placeholder="••••••••••••"
                              disabled={isLoginPending}
                              className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 pl-4 pr-11 py-3.5 text-sm text-white placeholder-slate-500 transition-all focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              tabIndex={-1}
                              aria-label={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white"
                            >
                              {showLoginPassword ? (
                                <FaEyeSlash className="size-4" aria-hidden />
                              ) : (
                                <FaEye className="size-4" aria-hidden />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Botón de Envío Radiante 3D */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isLoginPending}
                            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#EF233C] px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                          >
                            {isLoginPending ? (
                              <>
                                <FaSpinner className="size-4 animate-spin" aria-hidden />
                                <span>Verificando credenciales...</span>
                              </>
                            ) : (
                              <>
                                <span>Ingresar a mi cuenta</span>
                                <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Pie de enlaces rápidos */}
                      <div className="border-t border-white/10 pt-4 text-center space-y-2">
                        <p className="text-xs text-slate-400">
                          ¿Aún no tienes cuenta personal?{" "}
                          <button
                            type="button"
                            onClick={() => switchMode("register")}
                            className="font-bold text-[#0055FF] hover:underline"
                          >
                            Crear cuenta de cliente gratis
                          </button>
                        </p>
                        <p className="text-xs text-slate-400">
                          ¿Eres comerciante o empresa?{" "}
                          <button
                            type="button"
                            onClick={() => switchMode("wholesale")}
                            className="font-bold text-[#EF233C] hover:underline"
                          >
                            Conocer canal mayorista B2B
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* --- MODO 2: CREAR CUENTA CLIENTE (B2C) --- */}
                  {mode === "register" && (
                    <motion.div
                      key="register"
                      initial={{ rotateY: 75, opacity: 0, scale: 0.96 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      exit={{ rotateY: -75, opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="space-y-4"
                    >
                      {regState.error && (
                        <div
                          className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/70 p-3.5 text-xs text-red-200 backdrop-blur-md"
                          role="alert"
                        >
                          <FaCircleExclamation className="size-4 shrink-0 text-red-400 mt-0.5" aria-hidden />
                          <span>{regState.error}</span>
                        </div>
                      )}

                      <form action={regFormAction} className="space-y-3.5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="reg-first-name"
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
                            >
                              <FaUser className="size-3 text-[#0055FF]" aria-hidden />
                              <span>Nombres</span>
                            </label>
                            <input
                              id="reg-first-name"
                              name="firstName"
                              type="text"
                              autoComplete="given-name"
                              required
                              value={regFirstName}
                              onChange={(e) => setRegFirstName(e.target.value)}
                              placeholder="Carlos"
                              disabled={isRegPending}
                              className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="reg-last-name"
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
                            >
                              <FaUserCheck className="size-3 text-[#0055FF]" aria-hidden />
                              <span>Apellidos</span>
                            </label>
                            <input
                              id="reg-last-name"
                              name="lastName"
                              type="text"
                              autoComplete="family-name"
                              required
                              value={regLastName}
                              onChange={(e) => setRegLastName(e.target.value)}
                              placeholder="Mendoza"
                              disabled={isRegPending}
                              className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="reg-email"
                            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
                          >
                            <FaEnvelope className="size-3 text-[#0055FF]" aria-hidden />
                            <span>Correo electrónico</span>
                          </label>
                          <input
                            id="reg-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="carlos.mendoza@correo.com"
                            disabled={isRegPending}
                            className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="reg-password"
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
                            >
                              <FaLock className="size-3 text-[#0055FF]" aria-hidden />
                              <span>Contraseña</span>
                            </label>
                            <div className="relative mt-1.5">
                              <input
                                id="reg-password"
                                name="password"
                                type={showRegPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isRegPending}
                                className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 pl-3.5 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegPassword(!showRegPassword)}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showRegPassword ? <FaEyeSlash className="size-3.5" /> : <FaEye className="size-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="reg-confirm-password"
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
                            >
                              <FaLock className="size-3 text-[#0055FF]" aria-hidden />
                              <span>Repetir clave</span>
                            </label>
                            <div className="relative mt-1.5">
                              <input
                                id="reg-confirm-password"
                                name="confirmPassword"
                                type={showRegConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isRegPending}
                                className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 pl-3.5 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showRegConfirmPassword ? <FaEyeSlash className="size-3.5" /> : <FaEye className="size-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Guía en vivo e interactiva con checks dinámicos de contraseña */}
                        <PasswordRequirementsGuide
                          password={regPassword}
                          confirmPassword={regConfirmPassword}
                        />

                        {/* Términos y Condiciones */}
                        <div className="pt-1">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              name="termsAccepted"
                              required
                              checked={regTermsAccepted}
                              onChange={(e) => setRegTermsAccepted(e.target.checked)}
                              disabled={isRegPending}
                              className="mt-0.5 size-4 rounded border-slate-700 bg-slate-900 text-[#0055FF] focus:ring-[#0055FF]"
                            />
                            <span className="text-xs leading-relaxed text-slate-300">
                              Acepto los <span className="text-blue-400 underline">Términos del Servicio</span> y la{" "}
                              <span className="text-blue-400 underline">Política de Privacidad</span> de American Colt JEANS™, conforme a la Ley N° 29733.
                            </span>
                          </label>
                        </div>

                        {/* Botón de Registro Radiante */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isRegPending}
                            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#EF233C] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                          >
                            {isRegPending ? (
                              <>
                                <FaSpinner className="size-4 animate-spin" aria-hidden />
                                <span>Creando cuenta personal...</span>
                              </>
                            ) : (
                              <>
                                <span>Crear mi cuenta de cliente</span>
                                <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      <div className="border-t border-white/10 pt-3 text-center">
                        <p className="text-xs text-slate-400">
                          ¿Ya tienes una cuenta registrada?{" "}
                          <button
                            type="button"
                            onClick={() => switchMode("login")}
                            className="font-bold text-[#0055FF] hover:underline"
                          >
                            Iniciar sesión aquí
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* --- MODO 3: EMPRESAS MAYORISTAS B2B --- */}
                  {mode === "wholesale" && (
                    <motion.div
                      key="wholesale"
                      initial={{ rotateY: 75, opacity: 0, scale: 0.96 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      exit={{ rotateY: -75, opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="space-y-5"
                    >
                      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-[#0B1325] to-blue-950/40 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EF233C]">
                          <FaTags className="size-3.5" aria-hidden />
                          <span>Tarifas Especiales por Volumen B2B</span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                          Si tienes tienda física, boutique o distribuyes en provincias, regístrate con tu RUC (10 o 20) para acceder a los precios mayoristas oficiales de fábrica.
                        </p>
                      </div>

                      {/* 4 Beneficios Exclusivos Mayoristas */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <FaBoxesStacked className="size-4 shrink-0 text-[#0055FF] mt-1" aria-hidden />
                          <div>
                            <p className="text-xs font-bold text-white">Descuento hasta -50%</p>
                            <p className="text-[0.68rem] text-slate-400">Tarifas por docena, media y lote completo.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <FaGem className="size-4 shrink-0 text-[#EF233C] mt-1" aria-hidden />
                          <div>
                            <p className="text-xs font-bold text-white">Curvas de Tallas 28-46</p>
                            <p className="text-[0.68rem] text-slate-400">Jeans clásicos, drill premium y bermudas.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <FaFileInvoice className="size-4 shrink-0 text-emerald-400 mt-1" aria-hidden />
                          <div>
                            <p className="text-xs font-bold text-white">Factura SUNAT con RUC</p>
                            <p className="text-[0.68rem] text-slate-400">Comprobantes tributarios al instante.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <FaTruckFast className="size-4 shrink-0 text-blue-400 mt-1" aria-hidden />
                          <div>
                            <p className="text-xs font-bold text-white">Despacho Inmediato</p>
                            <p className="text-[0.68rem] text-slate-400">Envíos directos a agencias en todo el Perú.</p>
                          </div>
                        </div>
                      </div>

                      {/* Botón Principal para el Formulario Completo de Mayorista */}
                      <div className="space-y-2.5 pt-2">
                        <Link
                          href="/mayorista/registro"
                          className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#EF233C] via-[#D90429] to-[#DC2626] px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-600/30 transition-all hover:brightness-110 active:scale-[0.99]"
                        >
                          <span>Solicitar cuenta mayorista con RUC</span>
                          <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                        </Link>

                        <a
                          href="https://wa.me/51926922583?text=Hola%20American%20Colt%20JEANS,%20deseo%20información%20sobre%20compras%20por%20mayor%20para%20mi%20negocio"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          <FaWhatsapp className="size-4 text-emerald-400" aria-hidden />
                          <span>Cotizar lotes por WhatsApp (+51 926 922 583)</span>
                        </a>
                      </div>

                      <div className="border-t border-white/10 pt-3 text-center">
                        <button
                          type="button"
                          onClick={() => switchMode("login")}
                          className="text-xs font-bold text-slate-400 hover:text-white"
                        >
                          ¿Solo compras por menor? Volver a Iniciar Sesión
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal 3D de Celebración: Cuenta Creada Exitosamente */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
          >
            {/* Fondo con estrellas y partículas de celebración reventando */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {CELEBRATION_PARTICLES.map((particle, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: particle.targetX,
                    y: particle.targetY,
                    scale: [0, 1.5, 0.8],
                    opacity: [1, 1, 0],
                    rotate: particle.rotate,
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeOut",
                    delay: particle.delay,
                  }}
                  className={`absolute top-1/2 left-1/2 ${particle.colorClass}`}
                >
                  <FaStar className={particle.isLarge ? "size-6" : "size-4"} />
                </motion.div>
              ))}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-gradient-to-r from-[#0055FF]/25 to-[#EF233C]/25 blur-[120px]" />
            </div>

            {/* Tarjeta 3D de Celebración */}
            <motion.div
              initial={{ scale: 0.8, y: 30, rotateX: 15 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 280 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-white/25 bg-[#0B1325]/95 p-6 sm:p-8 text-center text-white shadow-[0_25px_80px_-10px_rgba(0,85,255,0.4)] backdrop-blur-2xl"
            >
              {/* Icono central de éxito */}
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/20">
                <FaCircleCheck className="size-8" aria-hidden />
              </div>

              <div className="mt-4 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-emerald-400">
                  <FaStar className="size-2.5 text-amber-400" aria-hidden />
                  ¡Registro Exitoso!
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Cuenta Creada Exitosamente
                </h3>
                <p className="text-xs text-slate-300">
                  ¡Bienvenido a <span className="text-[#EF233C] font-bold">American Colt JEANS™</span>, la marca N° 1 del Perú!
                </p>
              </div>

              {/* Caja de confirmación de datos */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-left text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Titular de cuenta:</span>
                  <span className="font-bold text-white uppercase">{regFirstName} {regLastName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Correo registrado:</span>
                  <span className="font-mono text-blue-300">{regEmail}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-300 leading-relaxed">
                Por tu seguridad, ahora inicia sesión con tu correo y contraseña para acceder a tu panel de perfil y pedidos.
              </p>

              {/* Botón Aceptar e Iniciar Sesión */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAcceptCelebration}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#EF233C] px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  <span>Aceptar e Iniciar Sesión</span>
                  <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pie de página moderno */}
      <footer className="relative z-20 border-t border-white/10 bg-[#070D18]/90 py-4 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <p>
            American Colt JEANS™ © 2026 · Moda Textil Peruana · Marca Registrada · Confección 100% Nacional
          </p>
          <div className="flex items-center gap-4 text-[0.7rem] text-slate-500">
            <span>Ley N° 29733 de Datos Personales</span>
            <span>•</span>
            <Link href="/politicas" className="hover:text-slate-300">
              Políticas y Privacidad
            </Link>
            <span>•</span>
            <Link href="/libro-de-reclamaciones" className="hover:text-slate-300">
              Libro de Reclamaciones
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
