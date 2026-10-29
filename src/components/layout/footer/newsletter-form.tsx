"use client";

import { useId, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ease } from "@/lib/motion";

type Status = "idle" | "invalid" | "pending";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Formulario visual de newsletter.
 * Valida el correo en el cliente, pero NO lo envía ni lo almacena:
 * la suscripción real se implementará en una fase futura y así se comunica.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const inputId = useId();
  const messageId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setStatus(EMAIL_PATTERN.test(email.trim()) ? "pending" : "invalid");
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
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="tu@correo.com"
          aria-invalid={status === "invalid"}
          className="min-w-0 flex-1 bg-transparent py-2 text-lg text-ink outline-none placeholder:text-taupe-300 focus-visible:outline-none"
        />
        <button
          type="submit"
          className="group/send flex h-11 shrink-0 items-center gap-2 bg-ink px-5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors duration-300 hover:bg-cochinilla"
        >
          Suscribirme
          <ArrowRight className="size-3.5 transition-transform duration-500 ease-luxe group-hover/send:translate-x-1" aria-hidden />
        </button>
      </div>

      <div id={messageId} aria-live="polite" className="mt-3 min-h-10 text-xs leading-relaxed">
        <AnimatePresence mode="wait" initial={false}>
          {status === "invalid" ? (
            <motion.p key="invalid" {...messageMotion} className="text-cochinilla">
              Ingresa un correo electrónico válido.
            </motion.p>
          ) : status === "pending" ? (
            <motion.p key="pending" {...messageMotion} className="text-taupe-600">
              Gracias por tu interés. La suscripción al newsletter se habilitará próximamente; por ahora no hemos
              registrado tu correo.
            </motion.p>
          ) : (
            <motion.p key="idle" {...messageMotion} className="text-taupe-500">
              Novedades, lanzamientos y beneficios exclusivos. Sin spam.
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
