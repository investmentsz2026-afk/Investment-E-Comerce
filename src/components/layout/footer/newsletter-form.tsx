"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  FaArrowRight,
  FaCircleCheck,
  FaCircleExclamation,
  FaEnvelope,
  FaMobileScreenButton,
  FaPaperPlane,
  FaSpinner,
  FaUser,
} from "react-icons/fa6";
import { ease } from "@/lib/motion";
import { subscribeNewsletterAction } from "@/server/actions/favorites";

type Status = "idle" | "invalid" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

export function NewsletterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [serverMessage, setServerMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const firstNameId = useId();
  const lastNameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const messageId = useId();

  const resetFeedback = () => {
    if (status !== "idle") {
      setStatus("idle");
      setValidationMessage("");
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (cleanFirst.length < 2) {
      setStatus("invalid");
      setValidationMessage("Por favor ingresa tu nombre.");
      return;
    }
    if (cleanLast.length < 2) {
      setStatus("invalid");
      setValidationMessage("Por favor ingresa tu apellido.");
      return;
    }
    if (!PHONE_PATTERN.test(cleanPhone)) {
      setStatus("invalid");
      setValidationMessage("Ingresa un número de celular válido (ej: 987 654 321).");
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setStatus("invalid");
      setValidationMessage("Ingresa un correo electrónico válido (ej: nombre@correo.com).");
      return;
    }

    startTransition(async () => {
      const res = await subscribeNewsletterAction({
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
        email: cleanEmail,
      });
      if (res.success) {
        setStatus("success");
        setServerMessage(
          "¡Suscripción registrada con éxito! Tus datos ya están en nuestro Club VIP para enviarte ofertas y catálogos.",
        );
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
      } else {
        setStatus("error");
        setServerMessage(res.error ?? "No se pudo procesar tu suscripción. Intenta nuevamente.");
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate aria-describedby={messageId} className="space-y-2.5">
      {/* Fila 1: Nombre, Apellido y Celular */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <label
            htmlFor={firstNameId}
            className="mb-1 block font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-slate-700"
          >
            Nombre *
          </label>
          <div className="relative flex items-center">
            <FaUser
              className="pointer-events-none absolute left-3 size-3 text-[#0055FF]"
              aria-hidden
            />
            <input
              id={firstNameId}
              type="text"
              autoComplete="given-name"
              value={firstName}
              disabled={isPending}
              onChange={(e) => {
                setFirstName(e.target.value);
                resetFeedback();
              }}
              placeholder="Ej: Carlos"
              className="h-9 w-full rounded-xl border-2 border-blue-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-900 shadow-2xs outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/20 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={lastNameId}
            className="mb-1 block font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-slate-700"
          >
            Apellido *
          </label>
          <div className="relative flex items-center">
            <FaUser
              className="pointer-events-none absolute left-3 size-3 text-[#0055FF]"
              aria-hidden
            />
            <input
              id={lastNameId}
              type="text"
              autoComplete="family-name"
              value={lastName}
              disabled={isPending}
              onChange={(e) => {
                setLastName(e.target.value);
                resetFeedback();
              }}
              placeholder="Ej: Mendoza"
              className="h-9 w-full rounded-xl border-2 border-blue-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-900 shadow-2xs outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/20 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={phoneId}
            className="mb-1 block font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-slate-700"
          >
            Celular / WhatsApp *
          </label>
          <div className="relative flex items-center">
            <FaMobileScreenButton
              className="pointer-events-none absolute left-3 size-3 text-[#EF233C]"
              aria-hidden
            />
            <input
              id={phoneId}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              disabled={isPending}
              onChange={(e) => {
                setPhone(e.target.value);
                resetFeedback();
              }}
              placeholder="Ej: 987 654 321"
              className="h-9 w-full rounded-xl border-2 border-blue-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-900 shadow-2xs outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/20 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Fila 2: Correo Electrónico bien visible + Botón de Suscripción Reluciente */}
      <div>
        <label
          htmlFor={emailId}
          className="mb-1 block font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-slate-700"
        >
          Correo Electrónico *
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex flex-1 items-center">
            <FaEnvelope
              className="pointer-events-none absolute left-3.5 size-3.5 text-[#0055FF]"
              aria-hidden
            />
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              disabled={isPending}
              onChange={(e) => {
                setEmail(e.target.value);
                resetFeedback();
              }}
              placeholder="Ingresa tu correo aquí (ej: cliente@empresa.com)"
              aria-invalid={status === "invalid" || status === "error"}
              className="h-10 w-full rounded-xl border-2 border-blue-300 bg-slate-50 pl-9 pr-3.5 text-xs font-semibold text-slate-900 shadow-inner outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/20 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="group/send inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EF233C] via-[#D90429] to-[#B91C24] px-5 font-sans text-xs font-black uppercase tracking-wider text-white shadow-md shadow-red-500/25 transition-all duration-300 hover:scale-[1.02] hover:from-[#0055FF] hover:via-[#1D4ED8] hover:to-[#1E40AF] hover:shadow-blue-500/30 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <FaSpinner className="size-3.5 animate-spin" aria-hidden />
                <span>Enviando...</span>
              </>
            ) : status === "success" ? (
              <>
                <FaCircleCheck className="size-3.5" aria-hidden />
                <span>¡Suscrito!</span>
              </>
            ) : (
              <>
                <FaPaperPlane className="size-3 transition-transform group-hover/send:-translate-y-0.5" aria-hidden />
                <span>Suscribirme Ahora</span>
                <FaArrowRight
                  className="size-3 transition-transform duration-300 group-hover/send:translate-x-1"
                  aria-hidden
                />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensaje de estado compacto */}
      <div id={messageId} aria-live="polite" className="min-h-5 text-[0.7rem] leading-snug">
        <AnimatePresence mode="wait" initial={false}>
          {status === "invalid" ? (
            <motion.p
              key="invalid"
              {...messageMotion}
              className="flex items-center gap-1.5 font-bold text-[#EF233C]"
            >
              <FaCircleExclamation className="size-3 shrink-0" aria-hidden />
              <span>{validationMessage || "Completa todos los campos correctamente."}</span>
            </motion.p>
          ) : status === "success" ? (
            <motion.p
              key="success"
              {...messageMotion}
              className="flex items-center gap-1.5 font-bold text-emerald-700"
            >
              <FaCircleCheck className="size-3 shrink-0" aria-hidden />
              <span>{serverMessage}</span>
            </motion.p>
          ) : status === "error" ? (
            <motion.p
              key="error"
              {...messageMotion}
              className="flex items-center gap-1.5 font-bold text-[#EF233C]"
            >
              <FaCircleExclamation className="size-3 shrink-0" aria-hidden />
              <span>{serverMessage}</span>
            </motion.p>
          ) : (
            <motion.p key="idle" {...messageMotion} className="text-slate-500">
              Recibe cupones VIP, alertas 3x2 y catálogo mayorista directo en tu correo y WhatsApp. Cero spam.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

const messageMotion = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25, ease: ease.soft },
} as const;
