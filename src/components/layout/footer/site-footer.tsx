"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBookOpen,
  FaBuildingColumns,
  FaCcAmex,
  FaCcDinersClub,
  FaCcMastercard,
  FaCcVisa,
  FaCircleCheck,
  FaEnvelope,
  FaFileInvoiceDollar,
  FaLocationDot,
  FaLock,
  FaPhone,
  FaQrcode,
  FaShieldHalved,
  FaTag,
} from "react-icons/fa6";
import {
  SiApplepay,
  SiFacebook,
  SiGooglepay,
  SiInstagram,
  SiMastercard,
  SiMercadopago,
  SiTiktok,
  SiVisa,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import type { NavLink } from "@/types/navigation";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { ActionLink } from "@/components/ui/action-link";
import { PlinAppIcon, YapeAppIcon } from "@/components/ui/framework-icons";
import { NewsletterForm } from "./newsletter-form";

const link = (label: string, href: string): NavLink => ({ label, target: { kind: "href", href } });

const columns: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: "Catálogo Oficial",
    links: [
      link("Catálogo Hombre 2026", "/catalogo?audiencia=hombre"),
      link("Jeans Denim (Relaxed & Comfort)", "/catalogo/denim?audiencia=hombre"),
      link("Pantalones & Bermudas Drill", "/catalogo/pantalones?audiencia=hombre"),
      link("Camisas Zair & Kendall", "/catalogo/camisas?audiencia=hombre"),
      link("Polos Piqué Mark", "/catalogo/polos?audiencia=hombre"),
      link("Ofertas 3x2 / -50%", "/catalogo?novedades=1&oferta=50"),
    ],
  },
  {
    title: "Atención al Cliente",
    links: [
      link("Centro de ayuda", "/atencion-al-cliente"),
      link("Envíos y entregas 24Hrs", "/atencion-al-cliente#envios"),
      link("Cambios y devoluciones", "/politicas#cambios"),
      link("Guía de tallas", "/atencion-al-cliente#tallas"),
      link("Seguimiento de pedido", "/cuenta/pedidos"),
    ],
  },
  {
    title: "Ventas por Mayor B2B",
    links: [
      link("Programa Mayorista", "/mayorista"),
      link("Registro Empresarial RUC", "/mayorista/registro"),
      link("Cotizador por Volumen", "/mayorista/cotizaciones"),
      link("Escalas de Precios", "/mayorista#escalas"),
    ],
  },
  {
    title: "Políticas y Legal",
    links: [
      link("Términos y condiciones", "/politicas#terminos"),
      link("Política de privacidad", "/politicas#privacidad"),
      link("Política de cambios", "/politicas#cambios"),
      link("Libro de Reclamaciones", "/libro-de-reclamaciones"),
    ],
  },
];

export function SiteFooter() {
  const pathname = usePathname();
  const isAuthOrAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/mayorista/registro") ||
    pathname.startsWith("/recuperar-contrasena") ||
    pathname.startsWith("/restablecer-contrasena") ||
    pathname.startsWith("/verificar-correo");

  if (isAuthOrAdmin) {
    return null;
  }

  const { contact } = siteConfig;
  const whatsappClean = (contact.whatsapp ?? "51926922583").replace(/\D/g, "");

  return (
    <footer
      aria-labelledby="footer-title"
      className="overflow-hidden border-t-4 border-[#0055FF] bg-bone pb-24 pt-12 text-ink lg:pb-10 lg:pt-16"
    >
      <h2 id="footer-title" className="sr-only">
        Información de American Colt JEANS™
      </h2>

      <div className="shell space-y-10">
        {/* 1. Banner Compacto de Suscripción VIP (No llena toda la pantalla + Campos de Nombre, Apellido, Celular y Correo) */}
        <div className="mx-auto max-w-5xl rounded-2xl border-2 border-blue-400/30 bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#0F3299] p-4 text-paper shadow-[0_18px_45px_-12px_rgba(0,85,255,0.45)] sm:p-5">
          <div className="grid items-center gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EF233C] px-3 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase tracking-widest text-paper shadow-xs">
                <FaTag className="size-2.5" aria-hidden />
                <span>CLUB VIP AMERICAN COLT JEANS™</span>
              </span>
              <p className="mt-2 font-sans text-base font-black uppercase leading-tight tracking-tight text-paper sm:text-lg">
                ¡Únete al Club VIP y desbloquea Ofertas 3x2, -50% y Tarifas de Fábrica!
              </p>
              <p className="mt-1.5 text-[0.72rem] leading-relaxed text-blue-100">
                Déjanos tu nombre, celular y correo para enviarte cupones exclusivos, alertas de liquidación y el catálogo oficial 2026.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[0.56rem] font-bold text-white">
                  <FaCircleCheck className="size-2.5 text-amber-300" aria-hidden />
                  <span>Cupones 3x2 y -50%</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[0.56rem] font-bold text-white">
                  <SiWhatsapp className="size-2.5 text-[#25D366]" aria-hidden />
                  <span>Catálogo y Lotes B2B</span>
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-white p-3.5 text-ink shadow-lg sm:p-4 lg:col-span-7">
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* 2. Columnas de Navegación y Contacto Directo */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-blue-100 pb-10 md:grid-cols-4 lg:grid-cols-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-4 space-y-4">
            <Logo size="md" className="items-start" />
            <p className="max-w-xs text-xs leading-relaxed text-slate-600 sm:text-sm">
              {siteConfig.description}
            </p>

            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2 text-ink">
                <SiWhatsapp className="size-4 shrink-0 text-[#25D366]" aria-hidden />
                <span className="font-semibold text-slate-600">WhatsApp:</span>
                <a
                  href={`https://wa.me/${whatsappClean}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0055FF] hover:text-cochinilla hover:underline"
                >
                  {contact.phone ?? "+51 926 922 583"}
                </a>
              </li>
              <li className="flex items-center gap-2 text-ink">
                <FaEnvelope className="size-3.5 shrink-0 text-cochinilla" aria-hidden />
                <span className="font-semibold text-slate-600">Ventas:</span>
                <a
                  href={`mailto:${contact.email ?? "ventas@americancolt.pe"}`}
                  className="font-bold text-[#0055FF] hover:text-cochinilla hover:underline"
                >
                  {contact.email ?? "ventas@americancolt.pe"}
                </a>
              </li>
              <li className="flex items-center gap-2 text-ink">
                <FaPhone className="size-3.5 shrink-0 text-[#0055FF]" aria-hidden />
                <span className="font-semibold text-slate-600">Mayoristas B2B:</span>
                <a
                  href={`mailto:${contact.businessEmail ?? "mayoristas@americancolt.pe"}`}
                  className="font-bold text-[#0055FF] hover:text-cochinilla hover:underline"
                >
                  {contact.businessEmail ?? "mayoristas@americancolt.pe"}
                </a>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <FaLocationDot className="size-3.5 shrink-0 text-cochinilla" aria-hidden />
                <span>Lima, Perú · {contact.hours ?? "Lun – Sáb · 9:00 a 20:00 hrs."}</span>
              </li>
            </ul>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
              <p className="font-sans text-xs font-extrabold uppercase tracking-wider text-[#0055FF]">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((item) => (
                  <li key={item.label}>
                    <ActionLink
                      target={item.target}
                      className="inline-flex text-left text-xs font-medium text-slate-600 transition-colors hover:font-bold hover:text-cochinilla sm:text-sm"
                    >
                      {item.label}
                    </ActionLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* 3. Sección de Pagos Seguros (con Iconos Reales de PaymentFont, Simple Icons y Font Awesome) y Redes Sociales */}
        <div className="grid gap-6 rounded-3xl border border-blue-100 bg-paper p-5 shadow-md sm:p-6 lg:grid-cols-12">
          {/* Medios de Pago con Iconos Oficiales de Apps de Pago y Tarjetas */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0055FF] to-[#2563EB] text-paper shadow-sm">
                <FaLock className="size-4" aria-hidden />
              </span>
              <div>
                <h3 className="font-sans text-xs font-black uppercase tracking-wider text-slate-900 sm:text-sm">
                  Pagos 100% Seguros — ¿Con qué puedes pagar?
                </h3>
                <p className="text-[0.7rem] text-slate-500">
                  Transacciones encriptadas SSL · Iconos oficiales de tarjetas, billeteras digitales y banca
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2 xl:grid-cols-3">
              {/* VISA (PaymentFont + Simple Icons + Font Awesome) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-[#1A1F71]/40 hover:bg-white">
                <span className="flex h-8 w-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#1A1F71] px-2 text-white shadow-xs">
                  <i className="pf pf-visa text-base leading-none" aria-hidden="true" />
                  <SiVisa className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="flex items-center gap-1 font-sans text-xs font-black text-slate-900">
                    <span>VISA</span>
                    <FaCcVisa className="size-3.5 text-[#1A1F71]" aria-hidden />
                  </p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">Crédito / Débito</p>
                </div>
              </div>

              {/* MASTERCARD (PaymentFont + Simple Icons + Font Awesome) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-[#EB001B]/40 hover:bg-white">
                <span className="flex h-8 w-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[#EB001B] to-[#F79E1B] px-2 text-white shadow-xs">
                  <i className="pf pf-mastercard-alt text-base leading-none" aria-hidden="true" />
                  <SiMastercard className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="flex items-center gap-1 font-sans text-xs font-black text-slate-900">
                    <span>Mastercard</span>
                    <FaCcMastercard className="size-3.5 text-[#EB001B]" aria-hidden />
                  </p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">Crédito / Débito</p>
                </div>
              </div>

              {/* YAPE (Icono de App Yape + Font Awesome QR) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-[#742284]/40 hover:bg-white">
                <YapeAppIcon className="size-8 shrink-0 shadow-xs" />
                <div className="min-w-0 leading-tight">
                  <p className="flex items-center gap-1 font-sans text-xs font-black text-[#742284]">
                    <span>Yape Oficial</span>
                    <FaQrcode className="size-3 text-[#742284]" aria-hidden />
                  </p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">Pago QR Inmediato</p>
                </div>
              </div>

              {/* PLIN (Icono de App Plin + Font Awesome QR) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-[#00B4CC]/40 hover:bg-white">
                <PlinAppIcon className="size-8 shrink-0 shadow-xs" />
                <div className="min-w-0 leading-tight">
                  <p className="flex items-center gap-1 font-sans text-xs font-black text-[#008DA5]">
                    <span>Plin Oficial</span>
                    <FaQrcode className="size-3 text-[#00B4CC]" aria-hidden />
                  </p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">Pago QR Inmediato</p>
                </div>
              </div>

              {/* MERCADO PAGO (PaymentFont + Simple Icons) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-[#009EE3]/40 hover:bg-white">
                <span className="flex h-8 w-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#009EE3] px-2 text-white shadow-xs">
                  <i className="pf pf-mercado-pago-sign text-base leading-none" aria-hidden="true" />
                  <SiMercadopago className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="font-sans text-xs font-black text-slate-900">Mercado Pago</p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">Pasarela Oficial</p>
                </div>
              </div>

              {/* AMEX & DINERS (PaymentFont + Font Awesome) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-[#0055FF]/40 hover:bg-white">
                <span className="flex h-8 w-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#0055FF] px-1.5 text-white shadow-xs">
                  <FaCcAmex className="size-4" aria-hidden />
                  <FaCcDinersClub className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="flex items-center gap-1 font-sans text-xs font-black text-slate-900">
                    <span>Amex & Diners</span>
                    <i className="pf pf-american-express text-xs text-[#0055FF]" aria-hidden="true" />
                  </p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">Tarjetas</p>
                </div>
              </div>

              {/* BCP / BBVA / INTERBANK (PaymentFont + Font Awesome BuildingColumns) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-[#FF6600]/40 hover:bg-white sm:col-span-2 xl:col-span-2">
                <span className="flex h-8 w-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[#FF6600] to-[#003399] px-2 text-white shadow-xs">
                  <i className="pf pf-bank-transfer text-base leading-none" aria-hidden="true" />
                  <FaBuildingColumns className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="font-sans text-xs font-black text-slate-900">
                    BCP · BBVA · Interbank · Scotiabank
                  </p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">
                    Transferencia Bancaria CCI y Cuentas Corporativas RUC 20
                  </p>
                </div>
              </div>

              {/* APPLE PAY & GOOGLE PAY (Simple Icons + PaymentFont) */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-bone px-3 py-2 shadow-2xs transition-all hover:border-slate-400 hover:bg-white">
                <span className="flex h-8 w-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-slate-900 px-1.5 text-white shadow-xs">
                  <SiApplepay className="size-5" aria-hidden />
                  <SiGooglepay className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="font-sans text-xs font-black text-slate-900">Billeteras NFC</p>
                  <p className="text-[0.65rem] font-semibold text-slate-500">Apple / Google Pay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redes Sociales con Iconos Oficiales Simple Icons & Font Awesome y Sellos Legales */}
          <div className="flex flex-col justify-between gap-4 border-t border-blue-100 pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <h3 className="font-sans text-xs font-black uppercase tracking-wider text-slate-900 sm:text-sm">
                Síguenos en Nuestras Redes Sociales
              </h3>
              <p className="mt-0.5 text-[0.7rem] text-slate-500">
                Conéctate con American Colt JEANS™ en nuestras cuentas oficiales
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <a
                  href={siteConfig.social.find((s) => s.id === "instagram")?.href ?? "https://instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-transform hover:scale-105"
                >
                  <SiInstagram className="size-4 shrink-0" aria-hidden />
                  <span>Instagram</span>
                </a>
                <a
                  href={siteConfig.social.find((s) => s.id === "facebook")?.href ?? "https://facebook.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1877F2] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-transform hover:scale-105"
                >
                  <SiFacebook className="size-4 shrink-0" aria-hidden />
                  <span>Facebook</span>
                </a>
                <a
                  href={siteConfig.social.find((s) => s.id === "tiktok")?.href ?? "https://tiktok.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-transform hover:scale-105"
                >
                  <SiTiktok className="size-4 shrink-0 text-[#00F2FE]" aria-hidden />
                  <span>TikTok</span>
                </a>
                <a
                  href={`https://wa.me/${whatsappClean}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-transform hover:scale-105"
                >
                  <SiWhatsapp className="size-4 shrink-0" aria-hidden />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#FF0000] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-transform hover:scale-105"
                >
                  <SiYoutube className="size-4 shrink-0" aria-hidden />
                  <span>YouTube</span>
                </a>
              </div>
            </div>

            {/* Sellos de Confianza y Libro de Reclamaciones con Iconos Font Awesome */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href="/libro-de-reclamaciones"
                className="inline-flex items-center gap-1.5 rounded-xl border border-cochinilla/30 bg-cochinilla/5 px-3 py-1.5 text-xs font-extrabold text-cochinilla transition-colors hover:bg-cochinilla hover:text-paper"
              >
                <FaBookOpen className="size-3.5" aria-hidden />
                <span>Libro de Reclamaciones</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-bone px-2.5 py-1.5 text-[0.68rem] font-bold text-[#0055FF]">
                <FaFileInvoiceDollar className="size-3.5 text-emerald-600" aria-hidden />
                <span>Boleta y Factura SUNAT</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-bone px-2.5 py-1.5 text-[0.68rem] font-bold text-[#0055FF]">
                <FaShieldHalved className="size-3.5 text-[#0055FF]" aria-hidden />
                <span>Compra Protegida</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4. Línea Inferior de Derechos Reservados */}
        <div className="flex flex-col items-center justify-between gap-2 pt-2 text-center text-xs text-slate-500 md:flex-row">
          <p className="font-semibold text-[#0055FF]">
            © 2026 American Colt JEANS™. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1.5">
            <FaCircleCheck className="size-3.5 text-emerald-600" aria-hidden />
            <span>Precios en soles (PEN) · Ventas por Unidad (B2C) y por Mayor (B2B) en todo el Perú</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
