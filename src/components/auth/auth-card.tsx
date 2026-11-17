"use client";

import { type ReactNode, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { FaArrowLeft, FaShieldHalved, FaWhatsapp } from "react-icons/fa6";
import { Logo } from "@/components/brand/logo";

interface AuthCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  backHref = "/",
  backLabel = "Volver a la tienda",
}: AuthCardProps) {
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

    const rotateY = (x - 0.5) * 12;
    const rotateX = (0.5 - y) * 10;

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

  return (
    <div className="relative min-h-screen bg-[#070D18] text-white selection:bg-[#EF233C] selection:text-white overflow-hidden flex flex-col justify-between">
      {/* Luces de ambiente 4D y gradientes reactivos */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 size-[520px] rounded-full bg-[#0055FF]/18 blur-[130px]" />
        <div className="absolute top-1/2 -right-32 size-[480px] rounded-full bg-[#EF233C]/14 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 size-[540px] rounded-full bg-[#1D4ED8]/15 blur-[140px]" />
      </div>

      {/* Cabecera superior */}
      <header className="relative z-30 border-b border-white/10 bg-[#070D18]/85 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:text-white"
          >
            <FaArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" aria-hidden />
            <span>{backLabel}</span>
          </Link>

          <Link href="/" aria-label="American Colt JEANS™ — Portada" className="inline-block transition-transform hover:scale-105">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/51926922583"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
            >
              <FaWhatsapp className="size-3.5" aria-hidden />
              <span>WhatsApp</span>
            </a>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[0.68rem] font-mono uppercase tracking-wider text-blue-300">
              <FaShieldHalved className="size-3 text-blue-400" aria-hidden />
              <span>Conexión cifrada</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor principal con tarjeta 3D magnética */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 [perspective:1400px]">
        <div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transformStyle: "preserve-3d",
            transition: tilt.isHovering ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-[#0B1325]/90 p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,85,255,0.25)] backdrop-blur-2xl"
        >
          {/* Glare especular */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
            style={{
              opacity: tilt.isHovering ? 0.2 : 0,
              background: `radial-gradient(circle 320px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.35), transparent 70%)`,
            }}
          />

          <div className="relative z-10 [transform:translateZ(20px)]">
            <div className="text-center">
              {eyebrow && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-600/15 px-3.5 py-1 text-[0.68rem] font-black uppercase tracking-widest text-[#EF233C]">
                  {eyebrow}
                </span>
              )}
              <h1 className="mt-3 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">{subtitle}</p>}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-6 backdrop-blur-md">
              {children}
            </div>

            {footer && <div className="mt-5 text-center text-xs text-slate-400">{footer}</div>}
          </div>
        </div>
      </div>

      {/* Pie de página */}
      <footer className="relative z-20 border-t border-white/10 bg-[#070D18]/90 py-4 text-center text-xs text-slate-400">
        American Colt JEANS™ © 2026 · Moda Textil Peruana · Plataforma Segura · Ley N° 29733 de Datos Personales
      </footer>
    </div>
  );
}
