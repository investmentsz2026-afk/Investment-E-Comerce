"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { FaShieldHalved } from "react-icons/fa6";

export function AdminPortalButton() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [stepText, setStepText] = useState(
    "Verificando credenciales de administrador...",
  );

  useEffect(() => {
    router.prefetch("/admin");
  }, [router]);

  const handleEnterAdmin = () => {
    if (entering) return;
    setEntering(true);
    setStepText("Verificando credenciales de administrador...");

    const t1 = setTimeout(() => {
      setStepText("Cargando módulos comerciales 3D y base de datos...");
    }, 450);

    const t2 = setTimeout(() => {
      router.push("/admin");
    }, 950);

    // Limpieza defensiva si el componente desmonta antes
    void t1;
    void t2;
  };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleEnterAdmin}
        disabled={entering}
        className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-2xl border border-[#991B1B]/30 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_5px_0_rgba(127,29,29,0.32),0_12px_24px_-8px_rgba(220,38,38,0.5)] transition-all hover:brightness-110 disabled:opacity-80"
      >
        {/* Brillo animado diagonal */}
        <span className="pointer-events-none absolute -left-full top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-all duration-700 group-hover:left-[140%]" />
        <FaShieldHalved className="relative size-3.5 text-white" aria-hidden />
        <span className="relative">Panel Admin</span>
        <Sparkles className="relative size-3.5 text-amber-200" aria-hidden />
      </motion.button>

      {entering &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-lg font-sans"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-950 via-[#1E293B] to-[#0F172A] px-7 py-10 text-center text-white shadow-[0_32px_90px_-14px_rgba(220,38,38,0.55)]"
              >
                {/* Luces 3D de fondo */}
                <div className="pointer-events-none absolute -left-12 -top-12 size-48 rounded-full bg-[#DC2626]/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-14 -right-12 size-52 rounded-full bg-blue-600/30 blur-3xl" />

                <div className="relative flex flex-col items-center space-y-6">
                  {/* Anillos orbitales 3D giratorios */}
                  <div className="relative flex size-28 items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#EF233C] border-r-[#DC2626] shadow-[0_0_24px_rgba(220,38,38,0.45)]"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.3,
                        ease: "linear",
                      }}
                      className="absolute inset-2.5 rounded-full border-4 border-dashed border-transparent border-b-blue-400 border-l-sky-300"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.09, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.3,
                        ease: "easeInOut",
                      }}
                      className="flex size-16 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#1E3A8A] shadow-[0_0_28px_rgba(220,38,38,0.6)]"
                    >
                      <ShieldCheck className="size-8 text-white" />
                    </motion.div>
                  </div>

                  {/* Textos principales */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.18em] text-red-200 backdrop-blur-md">
                      <Lock className="size-3 text-emerald-300" />
                      <span>American Colt® · Acceso Autorizado</span>
                    </div>

                    <h2 className="text-2xl font-black tracking-tight text-white">
                      Entrando al Panel Administrativo...
                    </h2>

                    <motion.p
                      key={stepText}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-bold text-slate-300"
                    >
                      {stepText}
                    </motion.p>
                  </div>

                  {/* Barra de carga animada */}
                  <div className="w-full max-w-xs space-y-2">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
                      <motion.div
                        initial={{ width: "8%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.95, ease: "easeInOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[#991B1B] via-[#EF233C] to-blue-400 shadow-[0_0_12px_rgba(239,35,60,0.8)]"
                      />
                    </div>
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-emerald-400">
                      Cifrado TLS 1.3 · Neon PostgreSQL
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
