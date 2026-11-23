"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Loader2, Trash2, X, ShieldAlert } from "lucide-react";

export interface DeleteProductTarget {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  variantsCount?: number;
}

interface AdminProductDeleteModalProps {
  product: DeleteProductTarget | null;
  isDeleting: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AdminProductDeleteModal({
  product,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: AdminProductDeleteModalProps) {
  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [product, isDeleting, onCancel]);

  return (
    <AnimatePresence>
      {product && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-modal-title"
        >
          {/* Fondo desenfocado animado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isDeleting) onCancel();
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Tarjeta modal 3D con animación spring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_80px_-15px_rgba(15,23,42,0.45)]"
          >
            {/* Franja superior decorativa rojo fuerte degradado */}
            <div className="bg-flow h-2 w-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]" />

            {/* Botón cerrar esquina */}
            <button
              type="button"
              disabled={isDeleting}
              onClick={onCancel}
              aria-label="Cerrar ventana"
              className="absolute right-4 top-5 flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-2xs transition-all duration-200 hover:scale-110 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40"
            >
              <X className="size-4" aria-hidden />
            </button>

            <div className="p-6 sm:p-7">
              {/* Emblema animado de advertencia */}
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-red-100/90 ring-4 ring-red-500/10 shadow-inner">
                <motion.div
                  animate={{ rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <Trash2 className="size-7 text-[#DC2626]" aria-hidden />
                </motion.div>
              </div>

              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-0.5 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#DC2626] border border-red-200/70">
                  <AlertTriangle className="size-3" aria-hidden />
                  Confirmación requerida
                </span>
                <h3
                  id="delete-product-modal-title"
                  className="mt-2.5 text-xl font-black tracking-tight text-slate-900"
                >
                  ¿Deseas eliminar este producto?
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  Se eliminará del catálogo junto con sus variantes, precios e imágenes configuradas.
                </p>
              </div>

              {/* Vista previa del producto a eliminar */}
              <div className="mt-5 flex items-center gap-3.5 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/50 via-white to-slate-50/60 p-3 shadow-2xs">
                {product.imageUrl ? (
                  <div className="size-13 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-red-100/70 text-[#DC2626]">
                    <Trash2 className="size-5" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-900">
                    {product.name}
                  </p>
                  <p className="truncate font-mono text-[0.68rem] text-slate-500">
                    /{product.slug}
                  </p>
                  {typeof product.variantsCount === "number" && (
                    <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 font-mono text-[0.6rem] font-bold text-slate-600 border border-slate-200/80">
                      {product.variantsCount}{" "}
                      {product.variantsCount === 1 ? "variante SKU" : "variantes SKU"}
                    </span>
                  )}
                </div>
              </div>

              {/* Aviso de seguridad de historial */}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-[0.7rem] text-amber-900">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  Los pedidos y comprobantes históricos de clientes permanecerán intactos en el registro contable.
                </span>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Botones 3D modernos Cancelar / Aceptar */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onCancel}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold uppercase tracking-wider text-slate-700 shadow-[0_3px_0_#E2E8F0] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 hover:shadow-[0_5px_0_#CBD5E1] active:translate-y-0.5 active:shadow-[0_1px_0_#CBD5E1] disabled:opacity-50"
                >
                  <span>Cancelar</span>
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onConfirm}
                  className="bg-flow flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_10px_24px_-6px_rgba(220,38,38,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_6px_0_#7F1D1D,0_14px_28px_-6px_rgba(220,38,38,0.65)] active:translate-y-0.5 active:shadow-[0_1px_0_#7F1D1D] disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" aria-hidden />
                      <span>Sí, eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
