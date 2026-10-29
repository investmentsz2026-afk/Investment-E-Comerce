"use client";

import { useState } from "react";
import { formatPEN } from "@/lib/format";

interface PriceRangeFormProps {
  /** Límites del catálogo en céntimos de PEN. */
  minBound: number;
  maxBound: number;
  /** Valores actuales (en soles, tal como viajan por la URL). */
  initialMin: string;
  initialMax: string;
  onApply: (min: string, max: string) => void;
}

/** Filtro de precio mínimo/máximo en soles. Se aplica al pulsar el botón o Enter. */
export function PriceRangeForm({ minBound, maxBound, initialMin, initialMax, onApply }: PriceRangeFormProps) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  const lowSoles = Math.floor(minBound / 100);
  const highSoles = Math.ceil(maxBound / 100);

  const sanitize = (v: string) => v.replace(/[^\d.,]/g, "").slice(0, 8);
  const inputClass =
    "h-10 w-full border border-ink/15 bg-transparent px-3 text-sm tabular-nums text-ink outline-none transition-colors placeholder:text-taupe-300 focus:border-ink";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(min.replace(",", "."), max.replace(",", "."));
      }}
      className="space-y-3"
      aria-label="Filtrar por precio"
    >
      <p className="text-xs text-taupe-500">
        Entre {formatPEN(minBound)} y {formatPEN(maxBound)}
      </p>
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Precio mínimo en soles</span>
          <input
            type="text"
            inputMode="decimal"
            name="precio_min"
            value={min}
            onChange={(e) => setMin(sanitize(e.target.value))}
            placeholder={`Mín. ${lowSoles}`}
            className={inputClass}
          />
        </label>
        <span className="text-taupe-400" aria-hidden>
          –
        </span>
        <label className="flex-1">
          <span className="sr-only">Precio máximo en soles</span>
          <input
            type="text"
            inputMode="decimal"
            name="precio_max"
            value={max}
            onChange={(e) => setMax(sanitize(e.target.value))}
            placeholder={`Máx. ${highSoles}`}
            className={inputClass}
          />
        </label>
      </div>
      <button
        type="submit"
        className="flex h-10 w-full items-center justify-center border border-ink text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:bg-ink hover:text-paper"
      >
        Aplicar precio
      </button>
    </form>
  );
}
