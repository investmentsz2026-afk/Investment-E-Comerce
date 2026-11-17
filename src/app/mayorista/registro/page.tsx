import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { WholesaleApplicationForm } from "@/components/wholesale/wholesale-application-form";
import {
  FaArrowLeft,
  FaArrowRight,
  FaShieldHalved,
  FaWhatsapp,
  FaBuilding,
  FaGem,
  FaFileInvoice,
  FaTruckFast,
  FaCircleCheck,
} from "react-icons/fa6";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Registro de Empresas y Mayoristas B2B | American Colt JEANS™",
  description: "Solicita tu cuenta comercial para acceder a precios mayoristas, lotes y escalas preferenciales en American Colt JEANS™.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function WholesaleRegisterPage() {
  const { user } = await getCurrentSession();

  if (user?.role === "business_pending") {
    redirect("/mayorista/solicitud");
  }

  return (
    <div className="relative min-h-screen bg-[#070D18] text-white selection:bg-[#EF233C] selection:text-white overflow-hidden flex flex-col justify-between">
      {/* Luces 4D de ambiente y mallas de gradiente reactivas */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[620px] rounded-full bg-[#0055FF]/18 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 size-[560px] rounded-full bg-[#EF233C]/14 blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 size-[600px] rounded-full bg-[#1D4ED8]/16 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Cabecera superior exclusiva sin header genérico */}
      <header className="relative z-30 border-b border-white/10 bg-[#070D18]/85 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/iniciar-sesion"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:text-white"
          >
            <FaArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" aria-hidden />
            <span>Volver al acceso</span>
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
              href="https://wa.me/51926922583?text=Hola%20American%20Colt%20JEANS,%20necesito%20asesoría%20sobre%20registro%20mayorista%20con%20RUC"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
            >
              <FaWhatsapp className="size-3.5 text-emerald-400" aria-hidden />
              <span>WhatsApp Mayorista</span>
            </a>

            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[0.7rem] font-mono uppercase tracking-wider text-blue-300">
              <FaShieldHalved className="size-3 text-blue-400" aria-hidden />
              <span>Conexión SSL Cifrada</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal en Split-Screen Studio */}
      <main className="relative z-20 flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-12 lg:gap-14">
          {/* LADO IZQUIERDO: Información B2B & Showroom */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-600/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#EF233C]">
              <span className="size-2 rounded-full bg-[#EF233C] animate-pulse" />
              Canal Corporativo B2B
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">
                Registro de Empresas y Mayoristas con RUC
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                Únete a la red comercial de American Colt JEANS™ en el Perú. Evaluamos solicitudes de tiendas boutique, distribuidores departamentales, confeccionistas y empresas para autorizar condiciones mayoristas exclusivas de fábrica.
              </p>
            </div>

            {/* Showcase Visual con Badges 3D */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-slate-800/40 to-slate-900/80 p-2 shadow-2xl backdrop-blur-xl">
              <div className="relative h-56 w-full overflow-hidden rounded-xl">
                <Image
                  src="/catalogo-colt/hero-colt-1.png"
                  alt="Lotes Mayoristas American Colt JEANS 2026"
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(min-width: 1024px) 380px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                  <span className="font-bold tracking-wide uppercase text-white">American Colt JEANS™ B2B</span>
                  <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[0.65rem] text-slate-300">
                    LIMA — GAMARRA
                  </span>
                </div>
              </div>

              {/* 4 Beneficios Mayoristas */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-[#EF233C]">
                    <FaGem className="size-3.5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Hasta -50% de Descuento</p>
                    <p className="text-[0.65rem] text-slate-400">Precios por volumen en Denim y Drill.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-[#0055FF]">
                    <FaBuilding className="size-3.5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Curvas de Tallas 28 al 46</p>
                    <p className="text-[0.65rem] text-slate-400">Surtido de cortes Skinny, Slim y Clásico.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <FaFileInvoice className="size-3.5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Factura SUNAT con RUC 20 / 10</p>
                    <p className="text-[0.65rem] text-slate-400">Emisión automática por cada orden.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <FaTruckFast className="size-3.5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Envíos a Todo el Perú</p>
                    <p className="text-[0.65rem] text-slate-400">Shalom, Olva Courier y Agencias.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: Tarjeta 3D con Formulario de Registro Empresarial */}
          <div className="lg:col-span-8">
            <div className="relative w-full rounded-3xl border border-white/20 bg-[#0B1325]/90 p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_-15px_rgba(239,35,60,0.2)] backdrop-blur-2xl">
              {/* Reflejo luminoso en borde */}
              <div className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-40 blur-xs bg-gradient-to-r from-[#EF233C] via-[#0055FF] to-[#D90429]" />

              <div className="relative z-10 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#EF233C]">
                      <FaBuilding className="size-3" aria-hidden />
                      Formulario Oficial de Postulación B2B
                    </span>

                    <Link
                      href="/iniciar-sesion"
                      className="text-xs font-bold text-slate-400 hover:text-white"
                    >
                      ¿Ya tienes cuenta? Iniciar sesión →
                    </Link>
                  </div>

                  <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                    Solicitud de Cuenta Comercial
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-300">
                    Ingresa los datos de tu empresa para que nuestro equipo comercial valide tu RUC y te habilite los precios por mayor.
                  </p>
                </div>

                {user?.role === "business_approved" ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-6 text-center sm:text-left">
                    <div className="flex items-start gap-4">
                      <FaCircleCheck className="size-8 text-emerald-400 shrink-0 mt-1" aria-hidden />
                      <div className="space-y-3">
                        <h3 className="text-lg font-black text-white uppercase">
                          Tu empresa ya cuenta con condición mayorista aprobada
                        </h3>
                        <p className="text-xs leading-relaxed text-emerald-200">
                          Tu cuenta está autorizada para ver tarifas mayoristas con descuento de fábrica y adquirir lotes en todo el catálogo de American Colt JEANS™.
                        </p>
                        <div>
                          <Link
                            href="/catalogo"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-700/30 transition-transform hover:scale-105"
                          >
                            <span>Explorar Catálogo Mayorista</span>
                            <FaArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <WholesaleApplicationForm
                    isAuthenticated={!!user}
                    defaultContactName={user ? `${user.firstName} ${user.lastName}` : ""}
                    defaultContactEmail={user ? user.email : ""}
                    defaultPhone={user?.phone ?? ""}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pie de página moderno */}
      <footer className="relative z-20 border-t border-white/10 bg-[#070D18]/90 py-4 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <p>
            American Colt JEANS™ © 2026 · Moda Textil Peruana · Canal Oficial B2B · RUC Oficial SUNAT
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
