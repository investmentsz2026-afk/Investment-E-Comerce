import type { ImageAsset } from "./catalog";
import type { FeatureKey } from "@/config/roadmap";

/**
 * Un destino de navegación puede ser:
 * - "href": una ruta interna real (enlace funcional).
 * - "anchor": una sección existente en la página actual (funcional).
 * - "pending": una funcionalidad de una fase futura (muestra aviso "Próximamente").
 */
export type NavTarget =
  | { kind: "href"; href: string }
  | { kind: "anchor"; href: `#${string}` }
  | { kind: "pending"; feature: FeatureKey };

export interface NavLink {
  label: string;
  target: NavTarget;
}

export interface MegaMenuColumn {
  title: string;
  links: readonly NavLink[];
}

export interface MegaMenu {
  columns: readonly MegaMenuColumn[];
  feature: {
    eyebrow: string;
    title: string;
    image: ImageAsset;
    target: NavTarget;
  };
}

export interface MainNavItem {
  id: string;
  label: string;
  target: NavTarget;
  megaMenu?: MegaMenu;
}
