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
  name: "American Colt",
  shortName: "American Colt",
  tagline: "Jeans & Moda Peruana — Venta por Menor y Mayor",
  description:
    "American Colt JEANS™ es moda denim y casual para el Perú: colecciones de temporada para clientes individuales (B2C) y lotes mayoristas con precios escalonados para tiendas, boutiques y distribuidores (B2B).",
  url: optional(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
  locale: "es_PE",
  language: "es-PE",
  currency: "PEN",
  season: "Colección 2026",
  contact: {
    email: optional(process.env.NEXT_PUBLIC_CONTACT_EMAIL) ?? "ventas@americancolt.pe",
    phone: optional(process.env.NEXT_PUBLIC_CONTACT_PHONE) ?? "+51 926 922 583",
    whatsapp: optional(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP) ?? "51926922583",
    businessEmail: optional(process.env.NEXT_PUBLIC_BUSINESS_EMAIL) ?? "mayoristas@americancolt.pe",
    hours: optional(process.env.NEXT_PUBLIC_CONTACT_HOURS) ?? "Lun – Sáb · 9:00 a 20:00 hrs.",
  },
  social: [
    { id: "instagram", label: "Instagram", href: optional(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM) },
    { id: "tiktok", label: "TikTok", href: optional(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK) },
    { id: "facebook", label: "Facebook", href: optional(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK) },
    { id: "linkedin", label: "LinkedIn", href: optional(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN) },
  ] satisfies SocialLink[],
} as const;

export type SiteConfig = typeof siteConfig;
