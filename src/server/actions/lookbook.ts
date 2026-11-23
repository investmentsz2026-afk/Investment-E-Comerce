"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  auditLogs,
  ecommerceShowcaseConfig,
  heroSlides,
  homeLineSlides,
  lookbookSlides,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import {
  BRAND_CONFIG_KEY,
  SHOWCASE_CONFIG_KEY,
  type LookbookSlot,
} from "@/server/queries/lookbook";
import type { AdminActionResult } from "./admin-commerce";

export async function saveLookbookSlideAction(input: {
  id?: number | null;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  priceTag?: string | null;
  imageUrl: string;
  linkHref?: string | null;
  slot?: LookbookSlot;
  sortOrder?: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const title = (input.title ?? "").trim();
  const imageUrl = (input.imageUrl ?? "").trim();
  if (title.length < 2) {
    return {
      success: false,
      error: "Ingresa un título para el modelo o look (mínimo 2 caracteres).",
    };
  }
  if (!imageUrl || (!imageUrl.startsWith("/") && !imageUrl.startsWith("http"))) {
    return {
      success: false,
      error: "Sube o selecciona una imagen válida para el Lookbook.",
    };
  }

  const subtitle = input.subtitle?.trim() || null;
  const badge = (input.badge?.trim() || "TOP LOOK").slice(0, 60);
  const priceTag = input.priceTag?.trim() || null;
  const rawHref = input.linkHref?.trim() || "/catalogo";
  const linkHref = rawHref.startsWith("/") ? rawHref : "/catalogo";
  const slot: LookbookSlot =
    input.slot === "left"
      ? "left"
      : input.slot === "brand"
        ? "brand"
        : "right";
  const sortOrder = Number.isFinite(Number(input.sortOrder))
    ? Math.max(0, Math.min(999, Math.round(Number(input.sortOrder))))
    : 0;
  const isActive = Boolean(input.isActive);

  const slideId = input.id ? Number(input.id) : null;
  let savedId: number;

  if (!slideId) {
    const [inserted] = await db
      .insert(lookbookSlides)
      .values({
        title: title.slice(0, 140),
        subtitle: subtitle ? subtitle.slice(0, 160) : null,
        badge,
        priceTag: priceTag ? priceTag.slice(0, 50) : null,
        imageUrl,
        linkHref: linkHref.slice(0, 240),
        slot,
        sortOrder,
        isActive,
      })
      .returning({ id: lookbookSlides.id });
    savedId = inserted.id;
  } else {
    const existing = await db
      .select({ id: lookbookSlides.id })
      .from(lookbookSlides)
      .where(eq(lookbookSlides.id, slideId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "El look seleccionado ya no existe." };
    }

    await db
      .update(lookbookSlides)
      .set({
        title: title.slice(0, 140),
        subtitle: subtitle ? subtitle.slice(0, 160) : null,
        badge,
        priceTag: priceTag ? priceTag.slice(0, 50) : null,
        imageUrl,
        linkHref: linkHref.slice(0, 240),
        slot,
        sortOrder,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(lookbookSlides.id, slideId));
    savedId = slideId;
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "lookbook_slide",
    targetId: savedId,
    details: `${slideId ? "Actualización" : "Creación"} de imagen Lookbook E-Commerce #${savedId} ("${title}", lado: ${slot}, link: ${linkHref}).`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  const slotLabel =
    slot === "left"
      ? "Lado Izquierdo"
      : slot === "brand"
        ? "Sección Marca"
        : "Lado Derecho";

  return {
    success: true,
    message: slideId
      ? `Look "${title}" actualizado y enlazado a su producto en portada.`
      : `Nuevo look "${title}" agregado (${slotLabel}).`,
  };
}

export async function saveShowcaseConfigAction(input: {
  configKey?: string;
  centerBadge: string;
  centerTitle: string;
  centerHighlight: string;
  centerSubtitle: string;
  leftLabel: string;
  rightLabel: string;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const targetKey =
    input.configKey === BRAND_CONFIG_KEY
      ? BRAND_CONFIG_KEY
      : SHOWCASE_CONFIG_KEY;

  const centerTitle = (input.centerTitle ?? "").trim();
  if (centerTitle.length < 2) {
    return {
      success: false,
      error: "El título central debe tener al menos 2 caracteres.",
    };
  }

  const payload = {
    centerBadge: (input.centerBadge?.trim() || "AMERICAN COLT JEANS™").slice(0, 120),
    centerTitle: centerTitle.slice(0, 120),
    centerHighlight: (input.centerHighlight?.trim() || "CRECEN.").slice(0, 80),
    centerSubtitle: (input.centerSubtitle?.trim() || "").slice(0, 220),
    leftLabel: (input.leftLabel?.trim() || "CAMISAS & POLOS").slice(0, 80),
    rightLabel: (input.rightLabel?.trim() || "JEANS & DRILL").slice(0, 80),
    updatedAt: new Date(),
  };

  const existing = await db
    .select({ id: ecommerceShowcaseConfig.id })
    .from(ecommerceShowcaseConfig)
    .where(eq(ecommerceShowcaseConfig.key, targetKey))
    .limit(1);

  let recordId: number;
  if (existing.length === 0) {
    const [inserted] = await db
      .insert(ecommerceShowcaseConfig)
      .values({
        key: targetKey,
        ...payload,
      })
      .returning({ id: ecommerceShowcaseConfig.id });
    recordId = inserted.id;
  } else {
    recordId = existing[0].id;
    await db
      .update(ecommerceShowcaseConfig)
      .set(payload)
      .where(eq(ecommerceShowcaseConfig.id, recordId));
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "ecommerce_showcase_config",
    targetId: recordId,
    details: `Actualización de textos de portada (${targetKey}).`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: "Textos centrales y títulos de secciones actualizados en la portada.",
  };
}

export async function toggleLookbookSlideStatusAction(input: {
  id: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const slideId = Number(input.id);
  const found = await db
    .select({ id: lookbookSlides.id, title: lookbookSlides.title })
    .from(lookbookSlides)
    .where(eq(lookbookSlides.id, slideId))
    .limit(1);

  if (found.length === 0) {
    return { success: false, error: "Imagen del lookbook no encontrada." };
  }

  const nextActive = Boolean(input.isActive);
  await db
    .update(lookbookSlides)
    .set({ isActive: nextActive, updatedAt: new Date() })
    .where(eq(lookbookSlides.id, slideId));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "lookbook_slide",
    targetId: slideId,
    details: `Look "${found[0].title}" ${nextActive ? "activado" : "pausado"} en la portada.`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: nextActive
      ? `"${found[0].title}" ahora está visible en la portada.`
      : `"${found[0].title}" pausado de la portada.`,
  };
}

export async function deleteLookbookSlideAction(input: {
  id: number;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const slideId = Number(input.id);
  const found = await db
    .select({ id: lookbookSlides.id, title: lookbookSlides.title })
    .from(lookbookSlides)
    .where(eq(lookbookSlides.id, slideId))
    .limit(1);

  if (found.length === 0) {
    return { success: false, error: "Imagen del lookbook no encontrada." };
  }

  await db.delete(lookbookSlides).where(eq(lookbookSlides.id, slideId));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "lookbook_slide",
    targetId: slideId,
    details: `Eliminación permanente del look "${found[0].title}" (#${slideId}).`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: `Look "${found[0].title}" eliminado correctamente.`,
  };
}

// ────────────────────────────────────────────────────────────────
// CRUD PORTADA PRINCIPAL (HERO BANNERS + PRODUCTO ENLAZADO)
// ────────────────────────────────────────────────────────────────

export async function saveHeroSlideAction(input: {
  id?: number | null;
  badge: string;
  promoPill: string;
  eyebrow: string;
  titleLine1: string;
  titleHighlight: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  bgImageUrl: string;
  productId?: number | null;
  cardTag: string;
  cardTitle: string;
  cardSubtitle: string;
  cardPriceText: string;
  cardHref: string;
  cardImageUrl: string;
  cardHoverImageUrl?: string | null;
  sortOrder?: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const titleLine1 = (input.titleLine1 ?? "").trim();
  const titleHighlight = (input.titleHighlight ?? "").trim();
  const bgImageUrl = (input.bgImageUrl ?? "").trim();
  const cardTitle = (input.cardTitle ?? "").trim();
  const cardImageUrl = (input.cardImageUrl ?? "").trim();

  if (titleLine1.length < 2 && titleHighlight.length < 2) {
    return {
      success: false,
      error: "Ingresa el título principal del banner de portada.",
    };
  }
  if (!bgImageUrl || (!bgImageUrl.startsWith("/") && !bgImageUrl.startsWith("http"))) {
    return {
      success: false,
      error: "Sube o selecciona una imagen de fondo válida para la portada.",
    };
  }
  if (cardTitle.length < 2 || !cardImageUrl) {
    return {
      success: false,
      error: "Selecciona el producto destacado que aparecerá en el cuadrito derecho.",
    };
  }

  const sanitizeHref = (raw: string | undefined, fallback: string) => {
    const t = (raw ?? "").trim();
    return t.startsWith("/") ? t.slice(0, 240) : fallback;
  };

  const payload = {
    badge: (input.badge?.trim() || "CATÁLOGO OFICIAL").slice(0, 80),
    promoPill: (input.promoPill?.trim() || "NUEVA COLECCIÓN").slice(0, 80),
    eyebrow: (input.eyebrow?.trim() || "AMERICAN COLT JEANS™").slice(0, 120),
    titleLine1: (titleLine1 || "ESTILO OFICIAL").slice(0, 120),
    titleHighlight: (titleHighlight || "2026").slice(0, 120),
    description: (input.description?.trim() || "").slice(0, 280),
    primaryCtaLabel: (input.primaryCtaLabel?.trim() || "Ver más aquí >>").slice(0, 60),
    primaryCtaHref: sanitizeHref(input.primaryCtaHref, "/catalogo"),
    secondaryCtaLabel: (input.secondaryCtaLabel?.trim() || "Ver Oferta").slice(0, 60),
    secondaryCtaHref: sanitizeHref(input.secondaryCtaHref, "/catalogo?oferta=1"),
    bgImageUrl,
    productId: input.productId && Number.isFinite(Number(input.productId)) ? Number(input.productId) : null,
    cardTag: (input.cardTag?.trim() || "Catálogo 2026").slice(0, 60),
    cardTitle: cardTitle.slice(0, 140),
    cardSubtitle: (input.cardSubtitle?.trim() || "Toca la flecha para ver prenda").slice(0, 160),
    cardPriceText: (input.cardPriceText?.trim() || "Ver Precio").slice(0, 60),
    cardHref: sanitizeHref(input.cardHref, "/catalogo"),
    cardImageUrl,
    cardHoverImageUrl: input.cardHoverImageUrl?.trim() || null,
    sortOrder: Number.isFinite(Number(input.sortOrder))
      ? Math.max(0, Math.min(999, Math.round(Number(input.sortOrder))))
      : 1,
    isActive: Boolean(input.isActive),
    updatedAt: new Date(),
  };

  const heroId = input.id ? Number(input.id) : null;
  let savedId: number;

  if (!heroId) {
    const [inserted] = await db
      .insert(heroSlides)
      .values(payload)
      .returning({ id: heroSlides.id });
    savedId = inserted.id;
  } else {
    const existing = await db
      .select({ id: heroSlides.id })
      .from(heroSlides)
      .where(eq(heroSlides.id, heroId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "La portada seleccionada ya no existe." };
    }

    await db.update(heroSlides).set(payload).where(eq(heroSlides.id, heroId));
    savedId = heroId;
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "hero_slide",
    targetId: savedId,
    details: `${heroId ? "Actualización" : "Creación"} de portada Hero #${savedId} ("${payload.titleLine1} ${payload.titleHighlight}", producto: ${payload.cardTitle}).`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: heroId
      ? `Portada "${payload.titleHighlight}" actualizada con su imagen de fondo y producto enlazado.`
      : `Nueva portada "${payload.titleHighlight}" agregada al carrusel principal.`,
  };
}

export async function toggleHeroSlideStatusAction(input: {
  id: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const heroId = Number(input.id);
  const found = await db
    .select({ id: heroSlides.id, titleHighlight: heroSlides.titleHighlight })
    .from(heroSlides)
    .where(eq(heroSlides.id, heroId))
    .limit(1);

  if (found.length === 0) {
    return { success: false, error: "Banner de portada no encontrado." };
  }

  const nextActive = Boolean(input.isActive);
  await db
    .update(heroSlides)
    .set({ isActive: nextActive, updatedAt: new Date() })
    .where(eq(heroSlides.id, heroId));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "hero_slide",
    targetId: heroId,
    details: `Banner Hero "${found[0].titleHighlight}" ${nextActive ? "activado" : "pausado"}.`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: nextActive
      ? `Banner "${found[0].titleHighlight}" visible en portada principal.`
      : `Banner "${found[0].titleHighlight}" pausado de la portada principal.`,
  };
}

export async function deleteHeroSlideAction(input: {
  id: number;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const heroId = Number(input.id);
  const found = await db
    .select({ id: heroSlides.id, titleHighlight: heroSlides.titleHighlight })
    .from(heroSlides)
    .where(eq(heroSlides.id, heroId))
    .limit(1);

  if (found.length === 0) {
    return { success: false, error: "Banner de portada no encontrado." };
  }

  await db.delete(heroSlides).where(eq(heroSlides.id, heroId));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "hero_slide",
    targetId: heroId,
    details: `Eliminación de portada Hero "${found[0].titleHighlight}" (#${heroId}).`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: `Portada "${found[0].titleHighlight}" eliminada.`,
  };
}

// ────────────────────────────────────────────────────────────────
// CRUD "¡EXPLORA NUESTRAS LÍNEAS!" (CATEGORÍAS / LÍNEAS EN PORTADA)
// ────────────────────────────────────────────────────────────────

export async function saveHomeLineAction(input: {
  id?: number | null;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  hoverImageUrl?: string | null;
  linkHref: string;
  accent: "blue" | "red";
  sortOrder?: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const title = (input.title ?? "").trim();
  const imageUrl = (input.imageUrl ?? "").trim();
  if (title.length < 2) {
    return {
      success: false,
      error: "Ingresa un nombre válido para la línea o categoría.",
    };
  }
  if (!imageUrl || (!imageUrl.startsWith("/") && !imageUrl.startsWith("http"))) {
    return {
      success: false,
      error: "Sube o selecciona una imagen principal para la línea.",
    };
  }

  const rawHref = (input.linkHref ?? "").trim() || "/catalogo";
  const linkHref = rawHref.startsWith("/") ? rawHref.slice(0, 240) : "/catalogo";
  const payload = {
    title: title.slice(0, 120),
    subtitle: (input.subtitle?.trim() || "Ver colección disponible").slice(0, 160),
    badge: (input.badge?.trim() || "Colección 2026").slice(0, 60),
    imageUrl,
    hoverImageUrl: input.hoverImageUrl?.trim() || null,
    linkHref,
    accent: input.accent === "red" ? "red" : "blue",
    sortOrder: Number.isFinite(Number(input.sortOrder))
      ? Math.max(0, Math.min(999, Math.round(Number(input.sortOrder))))
      : 1,
    isActive: Boolean(input.isActive),
    updatedAt: new Date(),
  };

  const lineId = input.id ? Number(input.id) : null;
  let savedId: number;

  if (!lineId) {
    const [inserted] = await db
      .insert(homeLineSlides)
      .values(payload)
      .returning({ id: homeLineSlides.id });
    savedId = inserted.id;
  } else {
    const existing = await db
      .select({ id: homeLineSlides.id })
      .from(homeLineSlides)
      .where(eq(homeLineSlides.id, lineId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "La línea seleccionada ya no existe." };
    }

    await db
      .update(homeLineSlides)
      .set(payload)
      .where(eq(homeLineSlides.id, lineId));
    savedId = lineId;
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "home_line_slide",
    targetId: savedId,
    details: `${lineId ? "Actualización" : "Creación"} de línea en portada "${payload.title}" -> ${payload.linkHref}.`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: lineId
      ? `Línea "${payload.title}" actualizada y conectada con ${payload.linkHref}.`
      : `Nueva línea "${payload.title}" agregada a ¡Explora Nuestras Líneas!.`,
  };
}

export async function toggleHomeLineStatusAction(input: {
  id: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const lineId = Number(input.id);
  const found = await db
    .select({ id: homeLineSlides.id, title: homeLineSlides.title })
    .from(homeLineSlides)
    .where(eq(homeLineSlides.id, lineId))
    .limit(1);

  if (found.length === 0) {
    return { success: false, error: "Línea no encontrada." };
  }

  const nextActive = Boolean(input.isActive);
  await db
    .update(homeLineSlides)
    .set({ isActive: nextActive, updatedAt: new Date() })
    .where(eq(homeLineSlides.id, lineId));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "home_line_slide",
    targetId: lineId,
    details: `Línea "${found[0].title}" ${nextActive ? "activada" : "pausada"} en portada.`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: nextActive
      ? `Línea "${found[0].title}" visible en portada.`
      : `Línea "${found[0].title}" pausada de portada.`,
  };
}

export async function deleteHomeLineAction(input: {
  id: number;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const lineId = Number(input.id);
  const found = await db
    .select({ id: homeLineSlides.id, title: homeLineSlides.title })
    .from(homeLineSlides)
    .where(eq(homeLineSlides.id, lineId))
    .limit(1);

  if (found.length === 0) {
    return { success: false, error: "Línea no encontrada." };
  }

  await db.delete(homeLineSlides).where(eq(homeLineSlides.id, lineId));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "home_line_slide",
    targetId: lineId,
    details: `Eliminación permanente de línea "${found[0].title}" (#${lineId}).`,
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    success: true,
    message: `Línea "${found[0].title}" eliminada.`,
  };
}
