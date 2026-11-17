export type PromoPlacement =
  | "top_bar"
  | "popup"
  | "home_banner"
  | "all"
  | "catalog_only";

export interface ParsedPromoMeta {
  placement: PromoPlacement;
  cleanDescription: string;
  ctaHref: string;
  showInTopBar: boolean;
  showInPopup: boolean;
  showInHomeBanner: boolean;
}

const PLACEMENT_REGEX = /^\[UBICACION:(TOP_BAR|POPUP|HOME_BANNER|ALL|CATALOG_ONLY)\](?:\[LINK:([^\]]+)\])?\s*/i;

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
): string {
  const tag = `[UBICACION:${placement.toUpperCase()}]`;
  const linkTag = ctaHref && ctaHref.trim() ? `[LINK:${ctaHref.trim()}]` : "";
  return `${tag}${linkTag} ${cleanDescription.trim()}`.trim();
}

export function parsePromoDescription(
  rawDescription: string | null | undefined,
  code?: string,
): ParsedPromoMeta {
  const raw = (rawDescription ?? "").trim();
  const match = raw.match(PLACEMENT_REGEX);

  let placement: PromoPlacement = "all";
  let ctaHref = "/catalogo";
  let cleanDescription = raw;

  if (match) {
    const rawType = match[1].toLowerCase() as PromoPlacement;
    if (
      rawType === "top_bar" ||
      rawType === "popup" ||
      rawType === "home_banner" ||
      rawType === "all" ||
      rawType === "catalog_only"
    ) {
      placement = rawType;
    }
    if (match[2]) {
      ctaHref = match[2].trim();
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
      // Por defecto, las promociones activas se muestran en todas las ubicaciones promocionales
      placement = "all";
    }
  }

  return {
    placement,
    cleanDescription: stripEmojis(cleanDescription),
    ctaHref,
    showInTopBar: placement === "top_bar" || placement === "all",
    showInPopup: placement === "popup" || placement === "all",
    showInHomeBanner: placement === "home_banner" || placement === "all",
  };
}

export interface PublicPromotionItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  cleanDescription: string;
  discountPercent: number;
  channelTarget: "retail" | "wholesale";
  placement: PromoPlacement;
  ctaHref: string;
  showInTopBar: boolean;
  showInPopup: boolean;
  showInHomeBanner: boolean;
  endsAtIso: string;
}
