import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Moda premium`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f8f6f1",
    theme_color: "#0d0c0b",
    lang: siteConfig.language,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
