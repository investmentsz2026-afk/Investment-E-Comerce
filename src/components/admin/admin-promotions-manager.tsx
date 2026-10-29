"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminSavePromotionAction,
  adminTogglePromotionStatusAction,
} from "@/server/actions/admin-commerce";
import {
  Percent,
  Plus,
  Edit3,
  Power,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
} from "lucide-react";

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
  const [description, setDescription] = useState("");
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
    setDescription("");
    setDiscountPercent("15");
    setCategoryId("");
    setProductId("");
    setChannelTarget("retail");
    setStartsAt(toInputDateTimeLocal(new Date()));
    setEndsAt(toInputDateTimeLocal(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
    setIsActive(true);
  };

  const handleSelectEdit = (promo: PromotionItem) => {
    setEditingId(promo.id);
    setCode(promo.code);
    setName(promo.name);
    setDescription(promo.description ?? "");
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

    startTransition(async () => {
      const res = await adminSavePromotionAction({
        id: editingId,
        code,
        name,
        description: description.trim() || null,
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
        text: res.message ?? "Promoción comercial guardada.",
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
      {/* Nota Arquitectónica de Reglas de Precios B2C / B2B */}
      <div className="border border-ink/15 bg-sand-50/70 p-5 text-xs text-ink space-y-2">
        <div className="flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-widest text-cochinilla">
          <ShieldCheck className="size-4" aria-hidden />
          <span>Reglas de Resolución de Precios en el Servidor (B2C vs. B2B)</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-taupe-800">
          <li>
            <strong>Autoridad única en servidor:</strong> Ningún descuento ni precio se calcula ni se acepta desde el navegador.
          </li>
          <li>
            <strong>Clientes Minoristas (B2C):</strong> Reciben automáticamente la promoción activa vigente de mayor beneficio que aplique al producto o categoría.
          </li>
          <li>
            <strong>Empresas Mayoristas Aprobadas (B2B):</strong> Acceden a las escalas mayoristas por volumen configuradas en cada prenda (ver{" "}
            <Link href="/admin/productos" className="font-semibold text-cochinilla underline">
              Gestión de Productos
            </Link>
            ). Las promociones B2C no se acumulan indebidamente sobre los tramos B2B, otorgando siempre la tarifa autorizada más favorable.
          </li>
          <li>
            <strong>Inmutabilidad de Pedidos Históricos:</strong> Crear o modificar una promoción jamás altera los importes de órdenes o comprobantes emitidos en el pasado.
          </li>
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario de Promoción */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-5 space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                {editingId ? `EDITANDO PROMOCIÓN #${editingId}` : "NUEVA CAMPAÑA PROMOCIONAL"}
              </p>
              <h2 className="font-display text-xl text-ink">
                {editingId ? "Modificar Promoción" : "Crear Promoción por Fechas"}
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
                  placeholder="EJ: INVIERNO2026"
                  className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs font-bold text-ink"
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
                  className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs font-bold text-cochinilla"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="promo-name"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Nombre Comercial de la Promoción *
              </label>
              <input
                id="promo-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Campaña Sastrería Peruana -15%"
                className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
              />
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
                  className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
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
                  className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
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
                className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
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
                  className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs text-ink"
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
                  className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs text-ink"
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
                <span>Promoción Activa</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden />
              <span>
                {isPending
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar Promoción"
                    : "Registrar Promoción"}
              </span>
            </button>
          </form>
        </div>

        {/* Listado de Promociones */}
        <div className="border border-ink/10 bg-paper p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
                CAMPAÑAS REGISTRADAS
              </p>
              <h2 className="font-display text-xl text-ink">
                Promociones y Vigencias ({promotions.length})
              </h2>
            </div>
          </div>

          {promotions.length === 0 ? (
            <div className="border border-dashed border-ink/20 bg-sand-50/40 p-8 text-center">
              <p className="text-sm text-taupe-700">
                Aún no hay campañas promocionales configuradas. Puedes crear una indicando porcentaje y rango de fechas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 font-mono text-[0.65rem] uppercase tracking-wider text-taupe-500">
                    <th className="py-2.5 pr-3">Código / Campaña</th>
                    <th className="py-2.5 pr-3">Descuento / Alcance</th>
                    <th className="py-2.5 pr-3">Vigencia</th>
                    <th className="py-2.5 pr-3">Estado</th>
                    <th className="py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {promotions.map((pr) => (
                    <tr key={pr.id} className="hover:bg-sand-50/50">
                      <td className="py-3 pr-3">
                        <span className="font-mono font-bold text-ink">{pr.code}</span>
                        <span className="block text-taupe-700">{pr.name}</span>
                      </td>

                      <td className="py-3 pr-3 font-mono">
                        <span className="font-bold text-cochinilla">
                          -{pr.discountPercent}% OFF
                        </span>
                        <span className="block text-[0.65rem] text-taupe-600">
                          {pr.productName
                            ? `Producto: ${pr.productName}`
                            : pr.categoryName
                              ? `Categoría: ${pr.categoryName}`
                              : "Catálogo general"}
                        </span>
                      </td>

                      <td className="py-3 pr-3 font-mono text-[0.65rem] text-taupe-700">
                        <div>
                          Inicio: {new Date(pr.startsAt).toLocaleDateString("es-PE")}
                        </div>
                        <div>Fin: {new Date(pr.endsAt).toLocaleDateString("es-PE")}</div>
                      </td>

                      <td className="py-3 pr-3 font-mono text-[0.64rem]">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

