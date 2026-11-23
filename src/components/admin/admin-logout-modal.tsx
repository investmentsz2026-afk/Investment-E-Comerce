"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Lock, LogOut, ShieldCheck, Sparkles, X } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";

interface AdminLogoutModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
}

export function AdminLogoutModal({
  open,
  onClose,
  userName,
  userEmail,
}: AdminLogoutModalProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"confirm" | "closing" | "done">("confirm");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleConfirmLogout = async () => {
    setErrorMsg(null);
    setPhase("closing");
    try {
      await Promise.all([
        logoutAction(),
        new Promise((resolve) => setTimeout(resolve, 1050)),
      ]);
      setPhase("done");
      setTimeout(() => {
        router.push("/iniciar-sesion");
        router.refresh();
      }, 450);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setPhase("confirm");
      setErrorMsg("No pudimos cerrar la sesión en este momento. Inténtalo nuevamente.");
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md font-sans"
        onClick={() => {
          if (phase === "confirm") onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/25 bg-white shadow-[0_32px_80px_-14px_rgba(15,23,42,0.65)]"
        >
          <AnimatePresence mode="wait">
            {phase === "confirm" ? (
              <motion.div
                key="confirm-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                {/* Cabecera 3D Carmesí */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white">
                  <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/15 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-10 left-8 size-28 rounded-full bg-black/15 blur-2xl" />

                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-2xl bg-white/15 p-2 text-white backdrop-blur-md transition hover:bg-white/25"
                    aria-label="Cerrar ventana"
                  >
                    <X className="size-4" />
                  </button>

                  <div className="relative flex items-center gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/35 bg-white/20 shadow-lg backdrop-blur-md">
                      <LogOut className="size-7 text-white" />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[0.64rem] font-extrabold uppercase tracking-[0.16em]">
                        <Lock className="size-3" />
                        Seguridad de Sesión
                      </span>
                      <h3 className="mt-1.5 text-xl font-black tracking-tight">
                        ¿Estás seguro de cerrar sesión?
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="space-y-4 p-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-semibold leading-relaxed text-slate-700">
                      Se cerrará de forma segura la sesión de{" "}
                      <strong className="font-black text-slate-950">{userName}</strong>{" "}
                      ({userEmail}). Tendrás que volver a autenticarte para
                      ingresar al panel administrativo.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleConfirmLogout}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_6px_0_rgba(127,29,29,0.32),0_12px_24px_-6px_rgba(220,38,38,0.45)] transition hover:brightness-110"
                    >
                      <LogOut className="size-4" />
                      <span>Sí, cerrar sesión</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* FASE ANIMADA: CERRANDO SESIÓN */
              <motion.div
                key="closing-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#1E293B] to-[#0F172A] px-6 py-10 text-center text-white"
              >
                <div className="pointer-events-none absolute -left-10 -top-10 size-44 rounded-full bg-[#DC2626]/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 size-44 rounded-full bg-blue-600/25 blur-3xl" />

                <div className="relative flex flex-col items-center space-y-5">
                  {/* Anillos orbitales 3D giratorios */}
                  <div className="relative flex size-24 items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#EF233C] border-r-[#DC2626]"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.1,
                        ease: "linear",
                      }}
                      className="absolute inset-2 rounded-full border-4 border-dashed border-transparent border-b-blue-400 border-l-sky-300"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        ease: "easeInOut",
                      }}
                      className={`flex size-14 items-center justify-center rounded-full shadow-lg ${
                        phase === "done"
                          ? "bg-emerald-500 text-white"
                          : "bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white"
                      }`}
                    >
                      {phase === "done" ? (
                        <CheckCircle2 className="size-7" />
                      ) : (
                        <ShieldCheck className="size-7" />
                      )}
                    </motion.div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-red-300">
                      <Sparkles className="size-3" />
                      <span>Protocolo Seguro TLS 1.3</span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight">
                      {phase === "done"
                        ? "¡Sesión cerrada con éxito!"
                        : "Cerrando sesión administrativa..."}
                    </h3>
                    <p className="text-xs font-semibold text-slate-300">
                      {phase === "done"
                        ? "Redirigiendo al acceso principal..."
                        : "Revocando tokens activos y protegiendo tu cuenta"}
                    </p>
                  </div>

                  {/* Barra de progreso animada */}
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: "8%" }}
                      animate={{ width: phase === "done" ? "100%" : "86%" }}
                      transition={{ duration: 0.95, ease: "easeInOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#DC2626] via-[#EF233C] to-blue-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
