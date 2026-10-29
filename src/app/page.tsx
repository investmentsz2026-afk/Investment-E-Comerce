import { siteConfig } from "@/config/site";
import { Hero } from "@/components/home/hero";
import { BrandMarquee } from "@/components/home/brand-marquee";
import { ModalitySelector } from "@/components/home/modality-selector";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { Manifesto } from "@/components/home/manifesto";
import { FeaturedProducts } from "@/components/home/featured-products";
import { WholesaleSection } from "@/components/home/wholesale-section";
import { getFeaturedProducts } from "@/server/queries/products";

/** Datos dinámicos de Neon: la ruta se renderiza en servidor por petición. */
export const instant = false;

/** Datos estructurados básicos (sin inventar datos de contacto ni identificadores fiscales). */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      areaServed: "PE",
    },
    {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      inLanguage: siteConfig.language,
    },
  ],
};

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(8);

  return (
    <>
      <script
        type="application/ld+json"
        // JSON serializado de un objeto estático controlado; se escapan "<" por seguridad.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <BrandMarquee />
      <ModalitySelector />
      <FeaturedCollections />
      <Manifesto />
      <FeaturedProducts products={featuredProducts} />
      <WholesaleSection />
    </>
  );
}
