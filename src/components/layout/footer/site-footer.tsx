"use client";

import { usePathname } from "next/navigation";
import type { NavLink } from "@/types/navigation";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { ActionLink } from "@/components/ui/action-link";
import { Reveal } from "@/components/motion/reveal";
import { NewsletterForm } from "./newsletter-form";

const pending = (label: string, feature: Extract<NavLink["target"], { kind: "pending" }>["feature"]): NavLink => ({
  label,
  target: { kind: "pending", feature },
});
const anchor = (label: string, href: `#${string}`): NavLink => ({ label, target: { kind: "anchor", href } });
const link = (label: string, href: string): NavLink => ({ label, target: { kind: "href", href } });

const columns: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: "Comprar",
    links: [
      link("Mujer", "/catalogo?audiencia=mujer"),
      link("Hombre", "/catalogo?audiencia=hombre"),
      link("Novedades", "/catalogo?novedades=1"),
      link("Catálogo completo", "/catalogo"),
    ],
  },
  {
    title: "Atención al cliente",
    links: [
      pending("Centro de ayuda", "customer-care"),
      pending("Envíos y entregas", "customer-care"),
      pending("Cambios y devoluciones", "policies"),
      pending("Guía de tallas", "customer-care"),
      pending("Seguimiento de pedido", "orders"),
    ],
  },
  {
    title: "Empresas",
    links: [
      anchor("Venta por mayor", "#mayorista"),
      pending("Registro empresarial", "business-signup"),
      pending("Cotizaciones", "quotes"),
      anchor("Precios por volumen", "#mayorista"),
    ],
  },
  {
    title: "Políticas",
    links: [
      pending("Términos y condiciones", "policies"),
      pending("Política de privacidad", "policies"),
      pending("Política de cambios", "policies"),
      pending("Libro de Reclamaciones", "complaints-book"),
    ],
  },
];

const linkClass =
  "group/fl relative inline-flex text-left text-sm text-ink/70 transition-colors duration-300 hover:text-ink";

export function SiteFooter() {
  const pathname = usePathname();
  const isAuthOrAdmin =
    pathname.startsWith("/admin") ||
    pathname === "/iniciar-sesion" ||
    pathname === "/registro" ||
    pathname === "/recuperar-contrasena" ||
    pathname === "/restablecer-contrasena" ||
    pathname === "/verificar-correo";

  if (isAuthOrAdmin) {
    return null;
  }

  const { contact, social } = siteConfig;
  const contactItems = [
    contact.email ? { label: "Correo", value: contact.email, href: `mailto:${contact.email}` } : null,
    contact.phone ? { label: "Teléfono", value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, "")}` } : null,
    contact.whatsapp
      ? { label: "WhatsApp", value: contact.whatsapp, href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` }
      : null,
    contact.businessEmail
      ? { label: "Empresas", value: contact.businessEmail, href: `mailto:${contact.businessEmail}` }
      : null,
  ].filter((item): item is { label: string; value: string; href: string } => item !== null);

  return (
    <footer aria-labelledby="footer-title" className="overflow-hidden bg-bone pb-28 pt-20 text-ink lg:pb-10 lg:pt-28">
      <h2 id="footer-title" className="sr-only">
        Información de INVESTMENTS
      </h2>

      <div className="shell">
        {/* Newsletter */}
        <div className="grid gap-10 border-b border-ink/10 pb-16 lg:grid-cols-12 lg:gap-6 lg:pb-24">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow text-taupe-500">Newsletter</p>
            <p className="mt-5 max-w-xl font-display text-display-md">
              Sé el primero en conocer <em>cada colección.</em>
            </p>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8 lg:self-end" delay={0.1}>
            <NewsletterForm />
          </Reveal>
        </div>

        {/* Navegación */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:grid-cols-4 lg:grid-cols-12 lg:py-20">
          <div className="col-span-2 md:col-span-4 lg:col-span-4">
            <Logo withDescriptor className="items-start" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-taupe-600">{siteConfig.description}</p>

            <div className="mt-8">
              <p className="eyebrow text-taupe-500">Contacto</p>
              {contactItems.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {contactItems.map((item) => (
                    <li key={item.label} className="text-sm">
                      <span className="text-taupe-500">{item.label}: </span>
                      <a href={item.href} className="text-ink underline-offset-4 hover:underline">
                        {item.value}
                      </a>
                    </li>
                  ))}
                  {contact.hours ? <li className="text-sm text-taupe-500">{contact.hours}</li> : null}
                </ul>
              ) : (
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-taupe-500">
                  Nuestros canales oficiales de atención se publicarán muy pronto.
                </p>
              )}
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
              <p className="eyebrow text-taupe-500">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <ActionLink target={link.target} className={linkClass}>
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-500 ease-luxe group-hover/fl:scale-x-100" />
                      </span>
                    </ActionLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Redes sociales */}
        <div className="flex flex-col gap-4 border-t border-ink/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="eyebrow text-taupe-500">Síguenos</p>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {social.map((network) => (
              <li key={network.id}>
                {network.href ? (
                  <a
                    href={network.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {network.label}
                  </a>
                ) : (
                  <span className="text-sm text-taupe-400" title="Perfil oficial próximamente">
                    {network.label} <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em]">· pronto</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Firma tipográfica */}
      <Reveal y={60} amount={0.4}>
        <p
          aria-hidden
          className="select-none whitespace-nowrap text-center font-sans text-[12.4vw] font-semibold leading-[0.8] tracking-[-0.03em] text-ink"
        >
          INVESTMENTS<span className="text-cochinilla">.</span>
        </p>
      </Reveal>

      <div className="shell mt-10 flex flex-col gap-3 border-t border-ink/10 pt-6 text-xs text-taupe-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 INVESTMENTS. Todos los derechos reservados.</p>
        <p>Precios en soles (PEN) · Pagos en línea disponibles próximamente</p>
      </div>
    </footer>
  );
}
