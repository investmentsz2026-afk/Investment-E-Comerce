"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { ease } from "@/lib/motion";
import { subscribeNewsletterAction } from "@/server/actions/favorites";

type Status = "idle" | "invalid" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const inputId = useId();
  const messageId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setStatus("invalid");
      return;
    }

    startTransition(async () => {
      const res = await subscribeNewsletterAction({ email: cleanEmail });
      if (res.success) {
        setStatus("success");
        setServerMessage("¡Gracias por suscribirte! Recibirás nuestras novedades y lanzamientos de temporada.");
        setEmail("");
      } else {
        setStatus("error");
        setServerMessage(res.error ?? "No se pudo procesar tu suscripción. Intenta nuevamente.");
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate aria-describedby={messageId}>
      <label htmlFor={inputId} className="eyebrow text-taupe-500">
        Correo electrónico
      </label>
      <div className="group/nl mt-3 flex items-center gap-3 border-b border-ink/25 pb-3 transition-colors focus-within:border-ink">
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          disabled={isPending}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="tu@correo.com"
          aria-invalid={status === "invalid" || status === "error"}
          className="min-w-0 flex-1 bg-transparent py-2 text-lg text-ink outline-none placeholder:text-taupe-300 focus-visible:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="group/send flex h-11 shrink-0 items-center gap-2 bg-ink px-5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors duration-300 hover:bg-cochinilla disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Enviando...
            </>
          ) : status === "success" ? (
            <>
              <Check className="size-3.5" aria-hidden />
              Suscrito
            </>
          ) : (
            <>
              Suscribirme
              <ArrowRight
                className="size-3.5 transition-transform duration-500 ease-luxe group-hover/send:translate-x-1"
                aria-hidden
              />
            </>
          )}
        </button>
      </div>

      <div id={messageId} aria-live="polite" className="mt-3 min-h-10 text-xs leading-relaxed">
        <AnimatePresence mode="wait" initial={false}>
          {status === "invalid" ? (
            <motion.p key="invalid" {...messageMotion} className="text-cochinilla">
              Ingresa un correo electrónico válido.
            </motion.p>
          ) : status === "success" ? (
            <motion.p key="success" {...messageMotion} className="text-emerald-800 font-medium">
              {serverMessage}
            </motion.p>
          ) : status === "error" ? (
            <motion.p key="error" {...messageMotion} className="text-cochinilla">
              {serverMessage}
            </motion.p>
          ) : (
            <motion.p key="idle" {...messageMotion} className="text-taupe-500">
              Novedades, lanzamientos de colección y beneficios exclusivos. Sin spam.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

const messageMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.35, ease: ease.soft },
} as const;
