import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
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
  return (
    <div className="min-h-screen flex flex-col justify-between bg-paper text-ink selection:bg-cochinilla selection:text-paper">
      {/* Top minimal header */}
      <header className="border-b border-ink/10 px-6 py-4 flex items-center justify-between">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-taupe-600 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          <span>{backLabel}</span>
        </Link>

        <Link href="/" aria-label="INVESTMENTS — Portada" className="inline-block transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <div className="hidden sm:flex items-center gap-1.5 text-[0.68rem] font-mono uppercase tracking-wider text-taupe-500">
          <Shield className="size-3.5 text-emerald-700" aria-hidden />
          <span>Conexión cifrada</span>
        </div>
      </header>

      {/* Main card container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center">
            {eyebrow && <p className="eyebrow text-cochinilla">{eyebrow}</p>}
            <h1 className="mt-2 font-display text-display-md text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-taupe-600 leading-relaxed">{subtitle}</p>}
          </div>

          <div className="mt-8 border border-ink/15 bg-paper p-8 shadow-sm sm:p-10">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-xs text-taupe-500">{footer}</div>}
        </div>
      </div>

      {/* Minimal luxury footer */}
      <footer className="border-t border-ink/10 py-5 text-center text-[0.68rem] text-taupe-500 font-mono">
        INVESTMENTS © 2026 · Moda Textil Peruana · Plataforma Segura · Ley N° 29733 de Datos Personales
      </footer>
    </div>
  );
}
