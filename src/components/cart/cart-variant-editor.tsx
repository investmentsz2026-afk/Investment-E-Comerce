"use client";

import { useMemo, useState } from "react";
import { Pencil, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { useCart } from "./cart-provider";
import type { EnrichedCartItem } from "@/server/cart/service";

interface CartVariantEditorProps {
  item: EnrichedCartItem;
  onClose: () => void;
  onSaved?: () => void;
}

export function CartVariantEditor({ item, onClose, onSaved }: CartVariantEditorProps) {
  const { updateVariant } = useCart();
  const variants = useMemo(() => item.availableVariants ?? [], [item.availableVariants]);

  // Extraer colores únicos con su swatch
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; swatch: string }[] = [];
    for (const v of variants) {
      const name = v.colorName ?? "Estándar";
      if (!seen.has(name)) {
        seen.add(name);
        list.push({
          name,
          swatch: v.colorSwatch ?? "#222222",
        });
      }
    }
    return list;
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState<string>(
    item.colorName ?? uniqueColors[0]?.name ?? "Estándar",
  );

  // Tallas disponibles para el color seleccionado
  const sizesForColor = useMemo(() => {
    return variants.filter((v) => (v.colorName ?? "Estándar") === selectedColor);
  }, [variants, selectedColor]);

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const matching = sizesForColor.find((v) => v.size === item.size);
    return matching?.size ?? sizesForColor[0]?.size ?? "Única";
  });

  // Variante objetivo coincidente con color y talla seleccionados
  const targetVariant = useMemo(() => {
    return (
      sizesForColor.find((v) => (v.size ?? "Única") === selectedSize) ??
      sizesForColor[0] ??
      null
    );
  }, [sizesForColor, selectedSize]);

  // Swatch actual para mostrar al lado del dropdown de color
  const activeColorSwatch = useMemo(() => {
    const found = uniqueColors.find((c) => c.name === selectedColor);
    return found?.swatch ?? targetVariant?.colorSwatch ?? item.colorSwatch ?? "#222222";
  }, [uniqueColors, selectedColor, targetVariant, item.colorSwatch]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manejar cambio de color
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    const newSizes = variants.filter((v) => (v.colorName ?? "Estándar") === newColor);
    // Si la talla actual existe en el nuevo color, preservarla; de lo contrario tomar la primera disponible
    const stillValidSize = newSizes.some((v) => (v.size ?? "Única") === selectedSize);
    if (!stillValidSize && newSizes.length > 0) {
      setSelectedSize(newSizes[0].size ?? "Única");
    }
  };

  const isNoChange = targetVariant?.id === item.variantId;
  const isTargetOutOfStock = targetVariant ? targetVariant.stock <= 0 : true;

  const handleSave = async () => {
    if (!targetVariant) return;
    if (isNoChange) {
      onClose();
      return;
    }
    if (isTargetOutOfStock) {
      setErrorMessage("Esta combinación de talla y color está temporalmente agotada.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const res = await updateVariant({
      currentVariantId: item.variantId,
      newVariantId: targetVariant.id,
    });

    setIsSaving(false);

    if (res.success) {
      onSaved?.();
      onClose();
    } else {
      setErrorMessage(res.error ?? "No se pudo actualizar la talla o color.");
    }
  };

  if (variants.length <= 1) {
    return (
      <div className="mt-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 text-xs text-neutral-600">
        <p className="font-medium text-neutral-700">
          Este modelo solo cuenta con una variante disponible actualmente ({item.colorName ?? "Color estándar"} · Talla {item.size ?? "Única"}).
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-xs font-semibold text-[#0055FF] hover:underline"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-neutral-200/90 bg-white p-3.5 sm:p-4 shadow-sm animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
        <Pencil className="size-3 text-[#0055FF]" aria-hidden />
        <span>Editar talla y color</span>
      </div>

      {errorMessage && (
        <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2 text-[0.72rem] text-red-700">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid de Selectores: Color y Talla */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Selector de Color */}
        <div>
          <label
            htmlFor={`edit-color-${item.id}`}
            className="block text-[0.7rem] font-medium text-neutral-600 mb-1"
          >
            Color
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
              <span
                className="size-3 rounded-full border border-black/15 shadow-xs"
                style={{ backgroundColor: activeColorSwatch }}
                aria-hidden
              />
            </div>
            <select
              id={`edit-color-${item.id}`}
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              disabled={isSaving}
              className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2 pl-7 pr-8 text-xs font-semibold text-neutral-800 transition-colors focus:border-neutral-400 focus:outline-none"
            >
              {uniqueColors.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
          </div>
        </div>

        {/* Selector de Talla */}
        <div>
          <label
            htmlFor={`edit-size-${item.id}`}
            className="block text-[0.7rem] font-medium text-neutral-600 mb-1"
          >
            Talla
          </label>
          <div className="relative">
            <select
              id={`edit-size-${item.id}`}
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={isSaving}
              className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2 px-3 pr-8 text-xs font-semibold text-neutral-800 transition-colors focus:border-neutral-400 focus:outline-none"
            >
              {sizesForColor.map((v) => {
                const sLabel = v.size ?? "Única";
                const isAgotado = v.stock <= 0;
                return (
                  <option key={v.id} value={sLabel} disabled={isAgotado}>
                    {sLabel} {isAgotado ? "(Agotado)" : `(${v.stock} uds)`}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="mt-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isTargetOutOfStock}
          className="bg-flow inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] hover:from-[#7F1D1D] hover:via-[#B91C1C] hover:to-[#DC2626] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar cambios</span>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="text-xs font-semibold text-[#0055FF] hover:underline py-1 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
