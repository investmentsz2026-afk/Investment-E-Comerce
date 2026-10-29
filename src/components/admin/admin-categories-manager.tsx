"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminSaveCategoryAction,
  adminDeleteOrArchiveCategoryAction,
} from "@/server/actions/admin-commerce";
import { normalizeCommercialSlug } from "@/server/pricing/admin-validators";
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
} from "lucide-react";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  parentName: string | null;
  audience: "mujer" | "hombre" | "unisex" | null;
  sortOrder: number;
  isActive: boolean;
  totalProductsCount: number;
  activeProductsCount: number;
  subcategoriesCount: number;
}

interface AdminCategoriesManagerProps {
  categories: CategoryItem[];
}

export function AdminCategoriesManager({
  categories,
}: AdminCategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [audience, setAudience] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [isActive, setIsActive] = useState<boolean>(true);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setParentId("");
    setAudience("");
    setSortOrder("0");
    setIsActive(true);
  };

  const handleSelectEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setImageUrl(cat.imageUrl ?? "");
    setParentId(cat.parentId ? String(cat.parentId) : "");
    setAudience(cat.audience ?? "");
    setSortOrder(String(cat.sortOrder));
    setIsActive(cat.isActive);
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await adminSaveCategoryAction({
        id: editingId,
        name,
        slug,
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        parentId: parentId ? Number(parentId) : null,
        audience:
          audience === "mujer" || audience === "hombre" || audience === "unisex"
            ? audience
            : null,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });

      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "No se pudo guardar." });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Categoría guardada correctamente.",
      });
      resetForm();
      router.refresh();
    });
  };

  const handleDeleteOrArchive = (cat: CategoryItem) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await adminDeleteOrArchiveCategoryAction(cat.id);
      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "No se pudo procesar." });
        return;
      }
      setFeedback({ type: "success", text: res.message ?? "Operación completada." });
      if (editingId === cat.id) resetForm();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Formulario de Creación / Edición */}
      <div className="border border-ink/10 bg-paper p-6 lg:col-span-5 space-y-5 h-fit">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
              {editingId ? `EDITANDO CATEGORÍA #${editingId}` : "NUEVA CATEGORÍA / SUBCATEGORÍA"}
            </p>
            <h2 className="font-display text-xl text-ink">
              {editingId ? "Modificar Categoría" : "Registrar Categoría"}
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
            <FolderTree className="size-5 text-cochinilla" aria-hidden />
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
          <div>
            <label
              htmlFor="cat-name"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Nombre de la Categoría *
            </label>
            <input
              id="cat-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingId) {
                  setSlug(normalizeCommercialSlug(e.target.value));
                }
              }}
              placeholder="Ej: Sastrería Contemporánea"
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="cat-slug"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Slug URL (Único) *
            </label>
            <input
              id="cat-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(normalizeCommercialSlug(e.target.value))}
              placeholder="sastreria-contemporanea"
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="cat-parent"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Categoría Padre (Subcategoría)
              </label>
              <select
                id="cat-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
              >
                <option value="">Categoría Principal (Raíz)</option>
                {categories
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="cat-audience"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Audiencia Principal
              </label>
              <select
                id="cat-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
              >
                <option value="">Transversal (Todas)</option>
                <option value="mujer">Mujer</option>
                <option value="hombre">Hombre</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="cat-sort"
                className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
              >
                Orden de Visualización
              </label>
              <input
                id="cat-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs text-ink"
              />
            </div>

            <div className="flex items-end pb-1.5">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 accent-cochinilla"
                />
                <span>Visible en Tienda Pública</span>
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="cat-desc"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Descripción Editorial
            </label>
            <textarea
              id="cat-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve para encabezados de colección..."
              className="mt-1 w-full border border-ink/20 bg-sand-50 p-2.5 text-xs text-ink"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla disabled:opacity-50"
          >
            {editingId ? <Save className="size-3.5" /> : <Plus className="size-3.5" />}
            <span>
              {isPending
                ? "Procesando..."
                : editingId
                  ? "Guardar Cambios de Categoría"
                  : "Crear Categoría"}
            </span>
          </button>
        </form>
      </div>

      {/* Tabla de Categorías y Subcategorías */}
      <div className="border border-ink/10 bg-paper p-6 lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
              ESTRUCTURA DEL CATÁLOGO
            </p>
            <h2 className="font-display text-xl text-ink">
              Categorías Configuradas ({categories.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ink/10 font-mono text-[0.65rem] uppercase tracking-wider text-taupe-500">
                <th className="py-2.5 pr-3">Categoría / Slug</th>
                <th className="py-2.5 pr-3">Jerarquía</th>
                <th className="py-2.5 pr-3">Productos</th>
                <th className="py-2.5 pr-3">Estado</th>
                <th className="py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-sand-50/50">
                  <td className="py-3 pr-3">
                    <span className="font-semibold text-ink">{cat.name}</span>
                    <span className="block font-mono text-[0.65rem] text-taupe-500">
                      /{cat.slug} · Orden #{cat.sortOrder}
                    </span>
                  </td>

                  <td className="py-3 pr-3 font-mono text-[0.68rem]">
                    {cat.parentName ? (
                      <span className="text-taupe-700">
                        Subcategoría de <strong>{cat.parentName}</strong>
                      </span>
                    ) : (
                      <span className="text-ink">Categoría Principal</span>
                    )}
                    {cat.audience && (
                      <span className="block text-[0.62rem] uppercase text-cochinilla">
                        Audiencia: {cat.audience}
                      </span>
                    )}
                  </td>

                  <td className="py-3 pr-3 font-mono text-[0.68rem]">
                    <span className="font-bold text-ink">{cat.totalProductsCount}</span> total (
                    {cat.activeProductsCount} activos)
                  </td>

                  <td className="py-3 pr-3 font-mono text-[0.65rem]">
                    {cat.isActive ? (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold uppercase text-emerald-800">
                        Activa
                      </span>
                    ) : (
                      <span className="rounded bg-taupe-200 px-2 py-0.5 font-bold uppercase text-taupe-700">
                        Oculta
                      </span>
                    )}
                  </td>

                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectEdit(cat)}
                        className="inline-flex items-center gap-1 border border-ink/20 px-2.5 py-1 font-mono text-[0.65rem] uppercase text-ink hover:border-ink"
                      >
                        <Edit3 className="size-3" aria-hidden />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteOrArchive(cat)}
                        title={
                          cat.totalProductsCount > 0
                            ? "Desactivar categoría (posee productos vinculados)"
                            : "Eliminar categoría vacía"
                        }
                        className="border border-rose-500/30 p-1 text-rose-700 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

