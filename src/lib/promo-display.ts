export type PromoPlacement =
  | "top_bar"
  | "popup"
  | "home_banner"
  | "catalog_banner"
  | "all"
  | "catalog_only";

export interface ParsedPromoMeta {
  placement: PromoPlacement;
  cleanDescription: string;
  ctaHref: string;
  applyToCart: boolean;
  imageUrl: string | null;
  showInTopBar: boolean;
  showInPopup: boolean;
  showInHomeBanner: boolean;
  showInCatalogBanner: boolean;
}

const PLACEMENT_REGEX =
  /^\[UBICACION:(TOP_BAR|POPUP|HOME_BANNER|CATALOG_BANNER|ALL|CATALOG_ONLY)\](?:\[LINK:([^\]]+)\])?(?:\[CARRITO:(SI|NO)\])?(?:\[IMG:([^\]]+)\])?\s*/i;

export function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function encodePromoDescription(
  placement: PromoPlacement,
  cleanDescription: string,
  ctaHref?: string,
  applyToCart = true,
  imageUrl?: string | null,
): string {
  const tag = `[UBICACION:${placement.toUpperCase()}]`;
  const linkTag = ctaHref && ctaHref.trim() ? `[LINK:${ctaHref.trim()}]` : "";
  const cartTag = applyToCart ? "" : "[CARRITO:NO]";
  const cleanImg =
    imageUrl && imageUrl.trim() && !imageUrl.includes("]")
      ? `[IMG:${imageUrl.trim()}]`
      : "";
  return `${tag}${linkTag}${cartTag}${cleanImg} ${cleanDescription.trim()}`.trim();
}

export function parsePromoDescription(
  rawDescription: string | null | undefined,
  code?: string,
): ParsedPromoMeta {
  const raw = (rawDescription ?? "").trim();
  const match = raw.match(PLACEMENT_REGEX);

  let placement: PromoPlacement = "all";
  let ctaHref = "/catalogo";
  let applyToCart = true;
  let imageUrl: string | null = null;
  let cleanDescription = raw;

  if (match) {
    const rawType = match[1].toLowerCase() as PromoPlacement;
    if (
      rawType === "top_bar" ||
      rawType === "popup" ||
      rawType === "home_banner" ||
      rawType === "catalog_banner" ||
      rawType === "all" ||
      rawType === "catalog_only"
    ) {
      placement = rawType;
    }
    if (match[2]) {
      ctaHref = match[2].trim();
    }
    if (match[3] && match[3].toUpperCase() === "NO") {
      applyToCart = false;
    }
    if (match[4]) {
      imageUrl = match[4].trim() || null;
    }
    cleanDescription = raw.slice(match[0].length).trim();
  } else if (code) {
    const upperCode = code.toUpperCase();
    if (upperCode.includes("BARRA") || upperCode.includes("TOP") || upperCode.includes("CINTILLO")) {
      placement = "top_bar";
    } else if (upperCode.includes("POPUP") || upperCode.includes("BIENVENIDA") || upperCode.includes("MODAL")) {
      placement = "popup";
    } else if (upperCode.includes("BANNER")) {
      placement = "home_banner";
    } else {
      placement = "all";
    }
  }

  return {
    placement,
    cleanDescription: stripEmojis(cleanDescription),
    ctaHref,
    applyToCart,
    imageUrl,
    showInTopBar: placement === "top_bar" || placement === "all",
    showInPopup: placement === "popup" || placement === "all",
    showInHomeBanner: placement === "home_banner" || placement === "all",
    showInCatalogBanner: placement === "catalog_banner" || placement === "all",
  };
}

export interface PublicPromotionItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  cleanDescription: string;
  discountPercent: number;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  channelTarget: "retail" | "wholesale";
  placement: PromoPlacement;
  ctaHref: string;
  applyToCart: boolean;
  imageUrl: string | null;
  showInTopBar: boolean;
  showInPopup: boolean;
  showInHomeBanner: boolean;
  showInCatalogBanner: boolean;
  endsAtIso: string;
}
