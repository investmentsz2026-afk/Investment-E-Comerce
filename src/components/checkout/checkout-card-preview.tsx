"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Wifi, ShieldCheck, Lock } from "lucide-react";

export type CardBrand = "visa" | "mastercard" | "amex" | "generic";

export function detectCardBrand(number: string): CardBrand {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  return "generic";
}

export function formatCardNumberInput(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(" ");
}

export function formatExpInput(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  }
  return clean;
}

interface CheckoutCardPreviewProps {
  cardNumber: string;
  cardHolder: string;
  cardExp: string;
  cardCvv: string;
  isFlipped: boolean;
  className?: string;
}

export function CheckoutCardPreview({
  cardNumber,
  cardHolder,
  cardExp,
  cardCvv,
  isFlipped,
  className,
}: CheckoutCardPreviewProps) {
  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);

  const displayCardNumber = useMemo(() => {
    const formatted = formatCardNumberInput(cardNumber);
    if (!formatted) return "•••• •••• •••• ••••";
    const parts = formatted.split(" ");
    while (parts.length < 4) {
      parts.push("••••");
    }
    return parts.join(" ");
  }, [cardNumber]);

  const displayHolder = (cardHolder.trim() || "NOMBRE DEL TITULAR").toUpperCase();
  const displayExp = cardExp.trim() || "MM/AA";
  const displayCvv = cardCvv.trim() || "•••";

  return (
    <div className={cn("perspective-1000 w-full max-w-sm mx-auto", className)}>
      <div
        className={cn(
          "relative h-52 w-full rounded-2xl transition-transform duration-500 shadow-2xl",
          "transform-style-3d",
          isFlipped ? "rotate-y-180" : "",
        )}
      >
        {/* ─── ANVERSO (FRENTE) ─── */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl p-5 flex flex-col justify-between text-white overflow-hidden",
            "backface-hidden border border-white/20",
            "bg-gradient-to-tr from-[#0F1424] via-[#1B243B] to-[#581520]",
          )}
        >
          {/* Textura sutil y reflejo de luz */}
          <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-[#DC2626]/20 blur-xl pointer-events-none" />

          {/* Fila superior: Chip + Contactless + Marca */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Chip Dorado EMV */}
              <div className="size-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-1 shadow-inner border border-amber-300/40 relative overflow-hidden">
                <div className="w-full h-full border border-amber-800/20 rounded-[2px] grid grid-cols-2 gap-0.5">
                  <div className="border-r border-b border-amber-700/30" />
                  <div className="border-b border-amber-700/30" />
                  <div className="border-r border-amber-700/30" />
                  <div />
                </div>
              </div>
              <Wifi className="size-4 text-white/70 rotate-90" />
            </div>

            {/* Logo de la Franquicia Bancaria */}
            <div className="text-right">
              {brand === "visa" && (
                <span className="font-sans font-black italic tracking-wider text-xl text-white drop-shadow-md">
                  VISA
                </span>
              )}
              {brand === "mastercard" && (
                <div className="flex items-center -space-x-2">
                  <div className="size-6 rounded-full bg-[#EB001B]" />
                  <div className="size-6 rounded-full bg-[#F79E1B]/90" />
                </div>
              )}
              {brand === "amex" && (
                <span className="rounded bg-[#006FCF] px-2 py-0.5 font-black text-xs tracking-tight text-white shadow-xs">
                  AMEX
                </span>
              )}
              {brand === "generic" && (
                <span className="font-mono text-[0.68rem] font-bold tracking-widest text-white/80 uppercase">
                  AMERICAN COLT
                </span>
              )}
            </div>
          </div>

          {/* Centro: Número de tarjeta */}
          <div className="relative z-10 py-1">
            <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white drop-shadow-sm select-none">
              {displayCardNumber}
            </div>
          </div>

          {/* Fila inferior: Titular + Vencimiento */}
          <div className="relative z-10 flex items-end justify-between text-xs">
            <div className="max-w-[70%]">
              <span className="text-[0.58rem] uppercase font-bold tracking-wider text-white/50 block">
                Titular de la tarjeta
              </span>
              <span className="font-mono font-bold tracking-wide text-white truncate block uppercase text-[0.78rem]">
                {displayHolder}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[0.58rem] uppercase font-bold tracking-wider text-white/50 block">
                Vence
              </span>
              <span className="font-mono font-bold tracking-wider text-white text-[0.78rem]">
                {displayExp}
              </span>
            </div>
          </div>
        </div>

        {/* ─── REVERSO (DORSO) ─── */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl py-4 flex flex-col justify-between text-white overflow-hidden",
            "backface-hidden rotate-y-180 border border-white/20",
            "bg-gradient-to-bl from-[#0F1424] via-[#1B243B] to-[#581520]",
          )}
        >
          {/* Banda magnética superior */}
          <div className="w-full h-10 bg-neutral-900 shadow-inner" />

          {/* Panel de firma y CVV */}
          <div className="px-5 space-y-1.5">
            <div className="flex items-center justify-between text-[0.58rem] text-white/60 font-mono uppercase">
              <span>Firma autorizada</span>
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <Lock className="size-2.5" />
                Código CVV / CVC
              </span>
            </div>

            <div className="h-8 rounded bg-neutral-100 flex items-center justify-end px-3">
              <span className="font-mono font-extrabold text-neutral-900 tracking-widest text-sm">
                {displayCvv}
              </span>
            </div>
          </div>

          {/* Disclaimer de Seguridad Bancaria */}
          <div className="px-5 text-[0.6rem] text-white/50 flex items-center justify-between border-t border-white/10 pt-2">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="size-3" />
              Cifrado SSL 256-Bit
            </span>
            <span className="font-mono">BANCO EMISOR PERÚ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
