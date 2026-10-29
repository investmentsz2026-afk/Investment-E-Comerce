/**
 * Configuración pública de la marca.
 * Los datos de contacto y redes sociales se definen por variables de entorno públicas (NEXT_PUBLIC_*).
 * Si una variable no está definida, la interfaz omite ese dato: nunca se inventan datos oficiales.
 */

function optional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export interface SocialLink {
  id: "instagram" | "tiktok" | "facebook" | "linkedin";
  label: string;
  href: string | null;
}

export const siteConfig = {
  name: "INVESTMENTS",
  shortName: "Investments",
  tagline: "Viste con intención",
  description:
    "INVESTMENTS es moda premium para el Perú: colecciones atemporales para clientes individuales y soluciones textiles por mayor para negocios, empresas y distribuidores.",
  url: optional(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
  locale: "es_PE",
  language: "es-PE",
  currency: "PEN",
  season: "Temporada 26/27",
  contact: {
    email: optional(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    phone: optional(process.env.NEXT_PUBLIC_CONTACT_PHONE),
    whatsapp: optional(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP),
    businessEmail: optional(process.env.NEXT_PUBLIC_BUSINESS_EMAIL),
    hours: optional(process.env.NEXT_PUBLIC_CONTACT_HOURS),
  },
  social: [
    { id: "instagram", label: "Instagram", href: optional(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM) },
    { id: "tiktok", label: "TikTok", href: optional(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK) },
    { id: "facebook", label: "Facebook", href: optional(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK) },
    { id: "linkedin", label: "LinkedIn", href: optional(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN) },
  ] satisfies SocialLink[],
} as const;

export type SiteConfig = typeof siteConfig;
