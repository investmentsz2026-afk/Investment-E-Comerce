import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/header/site-header";
import { SiteFooter } from "@/components/layout/footer/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Moda premium por menor y por mayor en Perú`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "moda Perú",
    "ropa premium",
    "tienda de ropa online",
    "venta de ropa por mayor",
    "ropa al por mayor Lima",
    "prendas de vestir",
    "uniformes corporativos",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "INVESTMENTS — Colección 26/27" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0d0c0b",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.language}
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="fixed left-4 top-4 z-[100] -translate-y-24 bg-ink px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-paper transition-transform focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        <AppProviders>
          <SiteHeader />
          <main id="contenido">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
