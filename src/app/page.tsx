import { siteConfig } from "@/config/site";
import { Hero } from "@/components/home/hero";
import { BrandMarquee } from "@/components/home/brand-marquee";
import { PromoBannersSection } from "@/components/home/promo-banners-section";
import { ModalitySelector } from "@/components/home/modality-selector";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { Manifesto } from "@/components/home/manifesto";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Interactive3DShowcase } from "@/components/home/interactive-3d-showcase";
import { WholesaleSection } from "@/components/home/wholesale-section";
import { getFeaturedProducts } from "@/server/queries/products";
import { getActivePublicPromotions } from "@/server/queries/promotions";
import { getActivePublicShowcaseData } from "@/server/queries/lookbook";

/** Datos dinámicos de Neon: la ruta se renderiza en servidor por petición. */
export const instant = false;

/** Datos estructurados básicos. */
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
  const [featuredProducts, activePromotions, showcaseData] = await Promise.all([
    getFeaturedProducts(10),
    getActivePublicPromotions(),
    getActivePublicShowcaseData(),
  ]);

  const brandSlides = showcaseData.slides.filter((s) => s.slot === "brand");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Hero slides={showcaseData.heroSlides} />
      <BrandMarquee />
      <PromoBannersSection
        promotions={activePromotions}
        lines={showcaseData.homeLines}
      />
      <FeaturedProducts products={featuredProducts} />
      <Interactive3DShowcase />
      <WholesaleSection
        lookbookSlides={showcaseData.slides}
        showcaseConfig={showcaseData.config}
      />
      <ModalitySelector />
      <FeaturedCollections />
      <Manifesto
        brandSlides={brandSlides}
        brandConfig={showcaseData.brandConfig}
      />
    </>
  );
}
