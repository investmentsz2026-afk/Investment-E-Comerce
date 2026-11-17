"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminSavePromotionAction,
  adminTogglePromotionStatusAction,
} from "@/server/actions/admin-commerce";
import {
  encodePromoDescription,
  parsePromoDescription,
  type PromoPlacement,
} from "@/lib/promo-display";
import {
  Percent,
  Plus,
  Edit3,
  Power,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
  Megaphone,
  LayoutTemplate,
} from "lucide-react";
import { FaEye } from "react-icons/fa6";

interface PromotionItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountPercent: number;
  categoryId: number | null;
  categoryName: string | null;
  productId: number | null;
  productName: string | null;
  channelTarget: "retail" | "wholesale";
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  liveStatus: "active_now" | "scheduled" | "expired" | "paused";
}

interface AdminPromotionsManagerProps {
  promotions: PromotionItem[];
  categories: Array<{ id: number; name: string }>;
  products: Array<{ id: number; name: string; slug: string; isWholesale: boolean }>;
}

const PLACEMENT_OPTIONS: Array<{
  id: PromoPlacement;
  title: string;
  subtitle: string;
  badge: string;
}> = [
  {
    id: "all",
    title: "Todas las ubicaciones (Cintillo Arriba + Popup al Cargar + Banner Home)",
    subtitle: "Aparece encima de toda la página, en ventana emergente al entrar y en banners de inicio.",
    badge: "Cintillo + Popup + Banner",
  },
  {
    id: "top_bar",
    title: "Cintillo Superior (Barra encima de toda la página)",
    subtitle: "El mensaje que escribas saldrá fijo arriba de la barra roja de navegación en toda la tienda.",
    badge: "Cintillo Arriba",
  },
  {
    id: "popup",
    title: "Ventana Emergente al Cargar la Página (Popup de Inicio)",
    subtitle: "Aparece automáticamente en pantalla apenas el cliente entra a la tienda.",
    badge: "Popup al Cargar",
  },
  {
    id: "home_banner",
    title: "Banner Promocional en Página de Inicio + Catálogo",
    subtitle: "Destaca la campaña en la sección de promociones de la portada.",
    badge: "Banner Home",
  },
  {
    id: "catalog_only",
    title: "Solo Descuento Automático en Catálogo",
    subtitle: "Aplica el descuento en los productos sin mostrar cintillo ni popup.",
    badge: "Solo Catálogo",
  },
];

function toInputDateTimeLocal(dateVal: Date | string): string {
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AdminPromotionsManager({
  promotions,
  categories,
  products,
}: AdminPromotionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<PromoPlacement>("all");
  const [messageText, setMessageText] = useState(
    "¡Delivery gratis a Lima Metropolitana por compras mayores a S/ 199.00! Aprovecha descuentos exclusivos en Jeans American Colt.",
  );
  const [ctaHref, setCtaHref] = useState("/catalogo");
  const [discountPercent, setDiscountPercent] = useState("15");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [channelTarget, setChannelTarget] = useState<"retail" | "wholesale">("retail");
  const [startsAt, setStartsAt] = useState(toInputDateTimeLocal(defaultStart));
  const [endsAt, setEndsAt] = useState(toInputDateTimeLocal(defaultEnd));
  const [isActive, setIsActive] = useState(true);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setName("");
    setPlacement("all");
    setMessageText(
      "¡Delivery gratis a Lima Metropolitana por compras mayores a S/ 199.00! Aprovecha descuentos exclusivos en Jeans American Colt.",
    );
    setCtaHref("/catalogo");
    setDiscountPercent("15");
    setCategoryId("");
    setProductId("");
    setChannelTarget("retail");
    setStartsAt(toInputDateTimeLocal(new Date()));
    setEndsAt(toInputDateTimeLocal(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
    setIsActive(true);
  };

  const handleSelectEdit = (promo: PromotionItem) => {
    const parsed = parsePromoDescription(promo.description, promo.code);
    setEditingId(promo.id);
    setCode(promo.code);
    setName(promo.name);
    setPlacement(parsed.placement);
    setMessageText(parsed.cleanDescription || promo.name);
    setCtaHref(parsed.ctaHref || "/catalogo");
    setDiscountPercent(String(promo.discountPercent));
    setCategoryId(promo.categoryId ? String(promo.categoryId) : "");
    setProductId(promo.productId ? String(promo.productId) : "");
    setChannelTarget(promo.channelTarget);
    setStartsAt(toInputDateTimeLocal(promo.startsAt));
    setEndsAt(toInputDateTimeLocal(promo.endsAt));
    setIsActive(promo.isActive);
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const encodedDescription = encodePromoDescription(
      placement,
      messageText.trim() || name.trim(),
      ctaHref,
    );

    startTransition(async () => {
      const res = await adminSavePromotionAction({
        id: editingId,
        code,
        name,
        description: encodedDescription,
        discountPercent: Number(discountPercent),
        categoryId: categoryId ? Number(categoryId) : null,
        productId: productId ? Number(productId) : null,
        channelTarget,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive,
      });

      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "No se pudo guardar la promoción." });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Promoción comercial guardada y publicada en la tienda.",
      });
      resetForm();
      router.refresh();
    });
  };

  const handleToggleActive = (promo: PromotionItem) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await adminTogglePromotionStatusAction({
        promotionId: promo.id,
        isActive: !promo.isActive,
      });
      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "Error al cambiar estado." });
        return;
      }
      setFeedback({ type: "success", text: res.message ?? "Estado actualizado." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Nota Arquitectónica de Reglas de Precios B2C / B2B + Banners & Popup */}
      <div className="border border-ink/15 bg-bone p-5 text-xs text-ink space-y-2">
        <div className="flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-widest text-cochinilla">
          <ShieldCheck className="size-4" aria-hidden />
          <span>Control de Cintillo Superior, Popup de Bienvenida al Cargar y Descuentos B2C / B2B</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-taupe-700">
          <li>
            <strong>Cintillo Superior (Arriba de la página):</strong> El mensaje configurado aparece automáticamente encima del encabezado rojo de <strong>American Colt JEANS™</strong>.
          </li>
          <li>
            <strong>Popup Emergente al Cargar la Página:</strong> Cuando el visitante abre la tienda, aparece una ventana promocional interactiva con el título, mensaje, porcentaje de descuento y botón de acción que definas aquí.
          </li>
          <li>
            <strong>Descuentos B2C y Mayoristas B2B:</strong> Los descuentos se aplican con autoridad única en servidor; las cuentas mayoristas reciben siempre su mejor tarifa escalonada en{" "}
            <Link href="/admin/productos" className="font-semibold text-cochinilla underline">
              Gestión de Productos
            </Link>
            .
          </li>
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario de Promoción */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-5 space-y-5 h-fit shadow-xs">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                {editingId ? `EDITANDO PROMOCIÓN #${editingId}` : "NUEVA CAMPAÑA / BANNER / POPUP"}
              </p>
              <h2 className="font-display text-xl text-ink">
                {editingId ? "Modificar Promoción" : "Crear Promoción y Anuncio"}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 border border-ink/20 px-2.5 py-1 font-mono text-[0.68rem] text-taupe-700 hover:border-ink"
              >
                <X className="size-3" aria-hidden />
                <span>Cancelar</span>
              </button>
            ) : (
              <Percent className="size-5 text-cochinilla" aria-hidden />
            )}
          </div>

          {feedback && (
            <div
              role="status"
              className={`flex items-start gap-2 border p-3.5 text-xs ${
                feedback.type === "success"
                  ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-950"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-950"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-700" aria-hidden />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de ubicación visual (Cintillo arriba / Popup al cargar / Banner) */}
            <div className="space-y-2 rounded-sm border border-cochinilla/25 bg-cochinilla/[0.03] p-3.5">
              <label
                htmlFor="promo-placement"
                className="flex items-center gap-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-widest text-cochinilla"
              >
                <Megaphone className="size-3.5" aria-hidden />
                <span>¿Dónde mostrar esta promoción en la tienda? *</span>
              </label>
              <select
                id="promo-placement"
                value={placement}
                onChange={(e) => setPlacement(e.target.value as PromoPlacement)}
                className="w-full border border-ink/20 bg-paper px-3 py-2 text-xs font-semibold text-ink"
              >
                {PLACEMENT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <p className="text-[0.7rem] leading-relaxed text-taupe-600">
                {PLACEMENT_OPTIONS.find((o) => o.id === placement)?.subtitle}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="promo-code"
                  className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
                >
                  Código de Campaña *
                </label>
                <input
                  id="promo-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EJ: COLT2026"
                  className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 font-mono text-xs font-bold text-ink"
                />
              </div>

              <div>
                <label
                  htmlFor="promo-pct"
                  className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
                >
                  Descuento (%) *
                </label>
                <input
                  id="promo-pct"
                  type="number"
                  min="1"
                  max="90"
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 font-mono text-xs font-bold text-cochinilla"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="promo-name"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Título Principal de la Promoción *
              </label>
              <input
                id="promo-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: ¡Gran Liquidación Jeans American Colt -20%!"
                className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 text-xs text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="promo-message"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Texto que dirá en el Cintillo Arriba y en el Popup al Cargar *
              </label>
              <textarea
                id="promo-message"
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe aquí exactamente lo que quieres que diga arriba de la página o cuando cargue la pantalla..."
                className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 text-xs text-ink leading-relaxed"
              />
            </div>

            <div>
              <label
                htmlFor="promo-link"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Enlace al hacer clic en la promoción
              </label>
              <select
                id="promo-link"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 text-xs text-ink"
              >
                <option value="/catalogo">Catálogo Completo (/catalogo)</option>
                <option value="/catalogo/denim">Colección Jeans &amp; Denim (/catalogo/denim)</option>
                <option value="/catalogo?audiencia=hombre">Sección Hombre (/catalogo?audiencia=hombre)</option>
                <option value="/catalogo?audiencia=mujer">Sección Mujer (/catalogo?audiencia=mujer)</option>
                <option value="/catalogo?novedades=1">Nuevos Ingresos (/catalogo?novedades=1)</option>
                <option value="/mayorista">Venta por Mayor B2B (/mayorista)</option>
                <option value="/mayorista/cotizaciones">Cotizador Mayorista (/mayorista/cotizaciones)</option>
              </select>
            </div>

            {/* Vista Previa en Vivo */}
            <div className="space-y-2 border border-ink/15 bg-bone/70 p-3">
              <p className="flex items-center gap-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-taupe-600">
                <FaEye className="size-3 text-cochinilla" aria-hidden />
                <span>Vista previa en tiempo real</span>
              </p>
              {(placement === "top_bar" || placement === "all") && (
                <div className="overflow-hidden rounded-xs border border-ink/10">
                  <div className="bg-ink px-2.5 py-1.5 text-center text-[0.68rem] font-bold text-paper">
                    {messageText.trim() || name.trim() || "¡Escribe el mensaje para el cintillo superior!"}
                    {discountPercent ? ` · (${discountPercent}% DSCTO — CÓDIGO: ${code || "PROMO"})` : ""}
                  </div>
                </div>
              )}
              {(placement === "popup" || placement === "all") && (
                <div className="rounded-xs border border-cochinilla/30 bg-paper p-2.5 text-center shadow-xs">
                  <span className="inline-block rounded-full bg-cochinilla px-2 py-0.5 font-mono text-[0.58rem] font-bold uppercase text-paper">
                    Popup al cargar · -{discountPercent || "15"}% OFF
                  </span>
                  <p className="mt-1 text-xs font-bold uppercase text-ink">
                    {name.trim() || "Título del Popup de Bienvenida"}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-taupe-600 line-clamp-2">
                    {messageText.trim() || "Descripción de la promoción al abrir la página"}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="promo-cat"
                  className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
                >
                  Filtrar por Categoría
                </label>
                <select
                  id="promo-cat"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 text-xs text-ink"
                >
                  <option value="">Todo el catálogo</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="promo-prod"
                  className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
                >
                  O Producto Específico
                </label>
                <select
                  id="promo-prod"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 text-xs text-ink"
                >
                  <option value="">Cualquier producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="promo-channel"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Canal Comercial Objetivo
              </label>
              <select
                id="promo-channel"
                value={channelTarget}
                onChange={(e) =>
                  setChannelTarget(e.target.value as "retail" | "wholesale")
                }
                className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 text-xs text-ink"
              >
                <option value="retail">Minorista B2C (Estándar)</option>
                <option value="wholesale">Exclusiva Empresas Mayoristas B2B</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="promo-start"
                  className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
                >
                  Fecha y Hora de Inicio *
                </label>
                <input
                  id="promo-start"
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 font-mono text-xs text-ink"
                />
              </div>

              <div>
                <label
                  htmlFor="promo-end"
                  className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
                >
                  Fecha y Hora de Fin *
                </label>
                <input
                  id="promo-end"
                  type="datetime-local"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="mt-1 w-full border border-ink/20 bg-bone px-3 py-2 font-mono text-xs text-ink"
                />
              </div>
            </div>

            <div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 accent-cochinilla"
                />
                <span>Promoción Activa (Visible inmediatamente en la tienda)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 bg-cochinilla px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla-deep disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden />
              <span>
                {isPending
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar Promoción y Anuncio"
                    : "Publicar Promoción en la Tienda"}
              </span>
            </button>
          </form>
        </div>

        {/* Listado de Promociones */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-7 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                CAMPAÑAS REGISTRADAS
              </p>
              <h2 className="font-display text-xl text-ink">
                Promociones, Cintillos y Popups ({promotions.length})
              </h2>
            </div>
          </div>

          {promotions.length === 0 ? (
            <div className="border border-dashed border-ink/20 bg-bone/50 p-8 text-center">
              <p className="text-sm text-taupe-700">
                Aún no hay campañas promocionales configuradas. Crea una en el formulario de la izquierda para mostrarla en el cintillo superior o en el popup de bienvenida.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 font-mono text-[0.65rem] uppercase tracking-wider text-taupe-500">
                    <th className="py-2.5 pr-3">Código / Mensaje</th>
                    <th className="py-2.5 pr-3">Ubicación Visual</th>
                    <th className="py-2.5 pr-3">Descuento</th>
                    <th className="py-2.5 pr-3">Vigencia / Estado</th>
                    <th className="py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {promotions.map((pr) => {
                    const parsed = parsePromoDescription(pr.description, pr.code);
                    const placementLabel =
                      PLACEMENT_OPTIONS.find((o) => o.id === parsed.placement)?.badge ??
                      "Cintillo + Popup";

                    return (
                      <tr key={pr.id} className="hover:bg-bone/50">
                        <td className="py-3 pr-3 max-w-[230px]">
                          <span className="font-mono font-bold text-ink">{pr.code}</span>
                          <span className="block font-semibold text-ink">{pr.name}</span>
                          {parsed.cleanDescription ? (
                            <span className="mt-0.5 block line-clamp-2 text-[0.68rem] text-taupe-600">
                              “{parsed.cleanDescription}”
                            </span>
                          ) : null}
                        </td>

                        <td className="py-3 pr-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-cochinilla/10 px-2.5 py-1 font-mono text-[0.62rem] font-bold uppercase text-cochinilla">
                            <LayoutTemplate className="size-3" aria-hidden />
                            {placementLabel}
                          </span>
                        </td>

                        <td className="py-3 pr-3 font-mono">
                          <span className="font-bold text-cochinilla">
                            -{pr.discountPercent}% OFF
                          </span>
                          <span className="block text-[0.65rem] text-taupe-600">
                            {pr.productName
                              ? `Prod: ${pr.productName}`
                              : pr.categoryName
                                ? `Cat: ${pr.categoryName}`
                                : "Todo el catálogo"}
                          </span>
                        </td>

                        <td className="py-3 pr-3 font-mono text-[0.64rem]">
                          <div className="mb-1">
                            {pr.liveStatus === "active_now" ? (
                              <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold uppercase text-emerald-800">
                                Vigente
                              </span>
                            ) : pr.liveStatus === "scheduled" ? (
                              <span className="rounded bg-indigo-500/15 px-2 py-0.5 font-bold uppercase text-indigo-800">
                                Programada
                              </span>
                            ) : pr.liveStatus === "expired" ? (
                              <span className="rounded bg-rose-500/15 px-2 py-0.5 font-bold uppercase text-rose-800">
                                Vencida
                              </span>
                            ) : (
                              <span className="rounded bg-taupe-200 px-2 py-0.5 font-bold uppercase text-taupe-700">
                                Pausada
                              </span>
                            )}
                          </div>
                          <div className="text-taupe-500">
                            Hasta: {new Date(pr.endsAt).toLocaleDateString("es-PE")}
                          </div>
                        </td>

                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectEdit(pr)}
                              className="inline-flex items-center gap-1 border border-ink/20 px-2 py-1 font-mono text-[0.65rem] uppercase text-ink hover:border-ink"
                            >
                              <Edit3 className="size-3" aria-hidden />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleToggleActive(pr)}
                              title={pr.isActive ? "Pausar promoción" : "Activar promoción"}
                              className="border border-ink/20 p-1 text-taupe-700 hover:border-ink hover:text-ink"
                            >
                              <Power className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
