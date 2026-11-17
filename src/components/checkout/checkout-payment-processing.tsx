"use client";

import { useEffect, useState } from "react";
import { Lock, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutPaymentProcessingProps {
  isOpen: boolean;
  paymentMethod: "card" | "transfer";
  cardBrand?: string;
  maskedLast4?: string;
  onAnimationComplete?: () => void;
}

export function CheckoutPaymentProcessing({
  isOpen,
  paymentMethod,
  cardBrand = "Visa",
  maskedLast4 = "••••",
  onAnimationComplete,
}: CheckoutPaymentProcessingProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (!isOpen) {
      setPhase(1);
      return;
    }

    // Fase 1: Cifrado SSL 256-Bit (0 a 600ms)
    const t1 = setTimeout(() => {
      setPhase(2);
    }, 600);

    // Fase 2: Red Bancaria / Verificación (600 a 1400ms)
    const t2 = setTimeout(() => {
      setPhase(3);
    }, 1400);

    // Fase 3: Aprobación y éxito (1400 a 2000ms)
    const t3 = setTimeout(() => {
      setPhase(4);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, onAnimationComplete]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#141824] via-[#0F1422] to-[#0A0D16] p-7 text-white text-center shadow-2xl border border-white/10 space-y-6 overflow-hidden">
        {/* Destellos de fondo */}
        <div className="absolute -top-24 -left-24 size-48 rounded-full bg-[#0055FF]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-[#801323]/25 blur-3xl pointer-events-none" />

        {/* Encabezado Seguro */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-300">
          <ShieldCheck className="size-3.5 text-emerald-400 animate-pulse" />
          <span>Pasarela de Pago Segura · SSL 256-Bit</span>
        </div>

        {/* Centro Visual: Animación de Tarjeta / Escaneo */}
        <div className="relative py-3">
          {phase < 4 ? (
            <div className="relative mx-auto size-28 rounded-2xl bg-gradient-to-tr from-[#1E2640] via-[#2D375B] to-[#4A1521] p-3 shadow-xl border border-white/20 flex flex-col justify-between overflow-hidden">
              {/* Línea de escaneo láser */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce" />

              <div className="flex items-center justify-between">
                <div className="size-4 rounded-xs bg-amber-400/90 shadow-xs" />
                <span className="font-sans font-black italic text-xs text-white/90">
                  {cardBrand}
                </span>
              </div>

              <div className="font-mono text-[0.7rem] tracking-wider text-white/80">
                •••• •••• •••• {maskedLast4}
              </div>

              <div className="flex items-center justify-between text-[0.55rem] text-white/60">
                <span>AMERICAN COLT</span>
                <Lock className="size-2.5 text-emerald-400" />
              </div>
            </div>
          ) : (
            /* Fase 4: Éxito con Gran Checkmark y Chispas */
            <div className="relative mx-auto size-28 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.4)] animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="size-16 stroke-[2.2]" />
              <Sparkles className="absolute -top-1 -right-1 size-6 text-amber-300 animate-spin" />
            </div>
          )}
        </div>

        {/* Texto de Progreso */}
        <div className="space-y-1.5 min-h-[58px]">
          {phase === 1 && (
            <>
              <h4 className="text-base font-extrabold tracking-tight text-white">
                Cifrando credenciales...
              </h4>
              <p className="text-xs text-neutral-400">
                Asegurando la transacción con tokenización y cifrado SHA-256.
              </p>
            </>
          )}

          {phase === 2 && (
            <>
              <h4 className="text-base font-extrabold tracking-tight text-cyan-300">
                Conectando con la red bancaria...
              </h4>
              <p className="text-xs text-neutral-400">
                Validando autenticidad con la entidad emisora ({cardBrand} Perú).
              </p>
            </>
          )}

          {phase === 3 && (
            <>
              <h4 className="text-base font-extrabold tracking-tight text-emerald-400">
                Autorización bancaria aprobada
              </h4>
              <p className="text-xs text-neutral-400">
                Confirmando reserva de prendas y emitiendo comprobante fiscal.
              </p>
            </>
          )}

          {phase === 4 && (
            <>
              <h4 className="text-lg font-black tracking-tight text-white">
                ¡Pago confirmado con éxito!
              </h4>
              <p className="text-xs text-emerald-300 font-medium">
                Tu compra ha sido verificada y registrada en el sistema.
              </p>
            </>
          )}
        </div>

        {/* Barra de Progreso */}
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              "h-full bg-gradient-to-r from-[#0055FF] via-emerald-400 to-emerald-500 transition-all duration-500",
              phase === 1 && "w-1/4",
              phase === 2 && "w-2/3",
              phase === 3 && "w-5/6",
              phase === 4 && "w-full",
            )}
          />
        </div>

        <div className="text-[0.68rem] text-neutral-500 font-mono">
          NO CIERRES NI RECARGUES ESTA PESTAÑA
        </div>
      </div>
    </div>
  );
}
