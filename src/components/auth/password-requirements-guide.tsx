"use client";

import { FaCircleCheck, FaCircleDot, FaCircleXmark } from "react-icons/fa6";

interface PasswordRequirementsGuideProps {
  password: string;
  confirmPassword?: string;
  className?: string;
  showMatchStatus?: boolean;
  variant?: "dark" | "light";
}

export function PasswordRequirementsGuide({
  password = "",
  confirmPassword,
  className = "",
  showMatchStatus = true,
  variant = "dark",
}: PasswordRequirementsGuideProps) {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const score = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber].filter(Boolean).length;

  const isLight = variant === "light";

  const strengthMeta = [
    { label: "Sin clave", color: isLight ? "text-slate-400" : "text-slate-400" },
    { label: "Muy débil", color: "text-red-500" },
    { label: "Débil", color: "text-amber-500" },
    { label: "Buena", color: "text-blue-500" },
    { label: "Segura y lista", color: isLight ? "text-emerald-700 font-bold" : "text-emerald-400 font-bold" },
  ][score] ?? { label: "Segura", color: isLight ? "text-emerald-700 font-bold" : "text-emerald-400 font-bold" };

  const hasConfirm = confirmPassword !== undefined && confirmPassword.length > 0;
  const passwordsMatch = hasConfirm && password.length > 0 && password === confirmPassword;

  const containerStyles = isLight
    ? "rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3"
    : "rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-2.5 backdrop-blur-md";

  const labelColor = isLight ? "text-slate-700 font-bold" : "text-slate-300 font-medium";
  const unfulfilledColor = isLight ? "text-slate-500" : "text-slate-400";
  const unfulfilledIconColor = isLight ? "text-slate-300" : "text-slate-500";
  const fulfilledColor = isLight ? "text-emerald-700 font-bold" : "text-emerald-400 font-bold";
  const fulfilledIconColor = isLight ? "text-emerald-600" : "text-emerald-400";
  const dividerColor = isLight ? "border-slate-200" : "border-white/10";

  return (
    <div
      className={`${containerStyles} ${className}`}
      role="status"
      aria-label="Requisitos de seguridad de la contraseña"
    >
      <div className="flex items-center justify-between text-xs">
        <span className={labelColor}>Requisitos de la contraseña:</span>
        <span className={strengthMeta.color}>{strengthMeta.label}</span>
      </div>

      {/* Barra de progreso de seguridad de 4 niveles */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        <div
          className={`h-full rounded-full transition-colors duration-300 ${
            score >= 1 ? "bg-red-500" : isLight ? "bg-slate-200" : "bg-white/10"
          }`}
        />
        <div
          className={`h-full rounded-full transition-colors duration-300 ${
            score >= 2 ? "bg-amber-500" : isLight ? "bg-slate-200" : "bg-white/10"
          }`}
        />
        <div
          className={`h-full rounded-full transition-colors duration-300 ${
            score >= 3 ? "bg-blue-500" : isLight ? "bg-slate-200" : "bg-white/10"
          }`}
        />
        <div
          className={`h-full rounded-full transition-colors duration-300 ${
            score >= 4 ? "bg-emerald-500" : isLight ? "bg-slate-200" : "bg-white/10"
          }`}
        />
      </div>

      {/* Cuadrícula de 4 Requisitos con Checks Dinámicos */}
      <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 text-xs">
        {/* 1. Longitud */}
        <div
          className={`flex items-center gap-2 transition-colors duration-200 ${
            hasMinLength ? fulfilledColor : unfulfilledColor
          }`}
        >
          {hasMinLength ? (
            <FaCircleCheck className={`size-3.5 shrink-0 ${fulfilledIconColor}`} aria-hidden />
          ) : (
            <FaCircleDot className={`size-3.5 shrink-0 ${unfulfilledIconColor}`} aria-hidden />
          )}
          <span>Mínimo 8 caracteres</span>
        </div>

        {/* 2. Mayúscula */}
        <div
          className={`flex items-center gap-2 transition-colors duration-200 ${
            hasUpperCase ? fulfilledColor : unfulfilledColor
          }`}
        >
          {hasUpperCase ? (
            <FaCircleCheck className={`size-3.5 shrink-0 ${fulfilledIconColor}`} aria-hidden />
          ) : (
            <FaCircleDot className={`size-3.5 shrink-0 ${unfulfilledIconColor}`} aria-hidden />
          )}
          <span>Una letra mayúscula (A-Z)</span>
        </div>

        {/* 3. Minúscula */}
        <div
          className={`flex items-center gap-2 transition-colors duration-200 ${
            hasLowerCase ? fulfilledColor : unfulfilledColor
          }`}
        >
          {hasLowerCase ? (
            <FaCircleCheck className={`size-3.5 shrink-0 ${fulfilledIconColor}`} aria-hidden />
          ) : (
            <FaCircleDot className={`size-3.5 shrink-0 ${unfulfilledIconColor}`} aria-hidden />
          )}
          <span>Una letra minúscula (a-z)</span>
        </div>

        {/* 4. Número */}
        <div
          className={`flex items-center gap-2 transition-colors duration-200 ${
            hasNumber ? fulfilledColor : unfulfilledColor
          }`}
        >
          {hasNumber ? (
            <FaCircleCheck className={`size-3.5 shrink-0 ${fulfilledIconColor}`} aria-hidden />
          ) : (
            <FaCircleDot className={`size-3.5 shrink-0 ${unfulfilledIconColor}`} aria-hidden />
          )}
          <span>Al menos un número (0-9)</span>
        </div>
      </div>

      {/* Verificación de coincidencia de contraseña si existe campo repetir */}
      {showMatchStatus && hasConfirm && (
        <div
          className={`flex items-center gap-2 pt-2 border-t ${dividerColor} text-xs transition-colors duration-200 ${
            passwordsMatch ? fulfilledColor : "text-amber-600 font-medium"
          }`}
        >
          {passwordsMatch ? (
            <>
              <FaCircleCheck className={`size-3.5 shrink-0 ${fulfilledIconColor}`} aria-hidden />
              <span>Las contraseñas coinciden correctamente</span>
            </>
          ) : (
            <>
              <FaCircleXmark className="size-3.5 shrink-0 text-amber-500" aria-hidden />
              <span>Las contraseñas no coinciden todavía</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
