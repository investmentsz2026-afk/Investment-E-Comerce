"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  submitWholesaleApplicationAction,
  registerWholesaleCompanyAction,
} from "@/server/actions/wholesale";
import type { ActionResult } from "@/server/actions/auth";
import { PasswordRequirementsGuide } from "@/components/auth/password-requirements-guide";
import {
  FaBuilding,
  FaFileInvoice,
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaLocationDot,
  FaBoxesStacked,
  FaArrowRight,
  FaCircleExclamation,
  FaSpinner,
  FaUserCheck,
} from "react-icons/fa6";

interface WholesaleFormProps {
  isAuthenticated?: boolean;
  defaultContactName?: string;
  defaultContactEmail?: string;
  defaultPhone?: string | null;
}

const BUSINESS_TYPES = [
  "Boutique o tienda de moda retail",
  "Distribuidor mayorista textil regional",
  "Cadena de tiendas comerciales",
  "Confeccionista o taller de confección",
  "Corporativo / Dotación y uniformes",
  "Comercio electrónico multimarca",
  "Otro rubro afín",
] as const;

const ESTIMATED_VOLUMES = [
  "S/ 3,000 a S/ 10,000 mensuales (pequeño volumen)",
  "S/ 10,000 a S/ 30,000 mensuales (mediano volumen)",
  "S/ 30,000 a S/ 80,000 mensuales (distribuidor regional)",
  "Más de S/ 80,000 mensuales (gran volumen nacional)",
] as const;

export function WholesaleApplicationForm({
  isAuthenticated = false,
  defaultContactName = "",
  defaultContactEmail = "",
  defaultPhone = "",
}: WholesaleFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de contraseña para validación interactiva en vivo
  const [wholesalePassword, setWholesalePassword] = useState("");
  const [wholesaleConfirmPassword, setWholesaleConfirmPassword] = useState("");

  const formHandler = isAuthenticated
    ? submitWholesaleApplicationAction
    : registerWholesaleCompanyAction;

  const [state, formAction, isPending] = useActionState<
    ActionResult<{ applicationId: number }>,
    FormData
  >(formHandler, { success: false });

  useEffect(() => {
    if (state.success) {
      router.push("/mayorista/solicitud?enviada=1");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-6 text-white">
      {/* Aviso si ya posee cuenta de usuario */}
      {!isAuthenticated && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-[#0055FF] mt-0.5">
              <FaUserCheck className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                ¿Ya tienes cuenta de cliente en American Colt JEANS™?
              </p>
              <p className="mt-0.5 text-xs text-slate-300">
                Inicia sesión para autocompletar tus datos y asociar tu empresa a tu cuenta actual.
              </p>
            </div>
          </div>
          <Link
            href="/iniciar-sesion?next=/mayorista/registro"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-400/40 bg-blue-600/20 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-blue-300 transition-colors hover:bg-blue-600/30 hover:text-white"
          >
            <span>Iniciar sesión</span>
            <FaArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {state.error && (
          <div
            className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/70 p-4 text-xs text-red-200 backdrop-blur-md"
            role="alert"
          >
            <FaCircleExclamation className="size-4 shrink-0 text-red-400 mt-0.5" aria-hidden />
            <span>{state.error}</span>
          </div>
        )}

        {/* SECCIÓN 1: DATOS DE LA EMPRESA Y RUC */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <FaBuilding className="size-4 text-[#EF233C]" aria-hidden />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              1. Información comercial y tributaria (SUNAT)
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="legalName"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Razón Social *
              </label>
              <input
                id="legalName"
                name="legalName"
                type="text"
                required
                placeholder="Ej: TEXTILES ANDINOS S.A.C."
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="tradeName"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Nombre Comercial *
              </label>
              <input
                id="tradeName"
                name="tradeName"
                type="text"
                required
                placeholder="Ej: Andinos Moda Jeans"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="taxId"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                <FaFileInvoice className="size-3 text-[#0055FF]" aria-hidden />
                <span>RUC (11 dígitos) *</span>
              </label>
              <input
                id="taxId"
                name="taxId"
                type="text"
                required
                maxLength={11}
                placeholder="20123456789"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
              <p className="mt-1 text-[0.68rem] text-slate-400">
                Formato de 11 dígitos (RUC 20 o 10 con negocio activo).
              </p>
            </div>

            <div>
              <label
                htmlFor="businessType"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Tipo de negocio o actividad *
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                disabled={isPending}
                defaultValue=""
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3.5 py-3 text-sm text-white focus:border-[#0055FF] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Seleccionar tipo de actividad...
                </option>
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt} className="bg-slate-900 text-white">
                    {bt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: REPRESENTANTE COMERCIAL Y CREDENCIALES */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <FaUserTie className="size-4 text-[#0055FF]" aria-hidden />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              2. Representante comercial &amp; Acceso
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="contactName"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Nombre y Apellidos *
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                required
                defaultValue={defaultContactName}
                placeholder="Carlos Mendoza"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="contactEmail"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                <FaEnvelope className="size-3 text-[#0055FF]" aria-hidden />
                <span>Correo empresarial *</span>
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                required
                defaultValue={defaultContactEmail}
                placeholder="ventas@empresa.com"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="contactPhone"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                <FaPhone className="size-3 text-emerald-400" aria-hidden />
                <span>Celular WhatsApp *</span>
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                required
                defaultValue={defaultPhone ?? ""}
                placeholder="987 654 321"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>
          </div>

          {!isAuthenticated && (
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <FaLock className="size-3.5 text-[#EF233C]" aria-hidden />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Contraseña de acceso para el portal mayorista
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Crear Contraseña *
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      disabled={isPending}
                      value={wholesalePassword}
                      onChange={(e) => setWholesalePassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 pl-3.5 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <FaEyeSlash className="size-3.5" /> : <FaEye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Confirmar Contraseña *
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      disabled={isPending}
                      value={wholesaleConfirmPassword}
                      onChange={(e) => setWholesaleConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 pl-3.5 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="size-3.5" /> : <FaEye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Guía en vivo e interactiva con checks dinámicos de contraseña */}
                <div className="sm:col-span-2 pt-1">
                  <PasswordRequirementsGuide
                    password={wholesalePassword}
                    confirmPassword={wholesaleConfirmPassword}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN 3: DOMICILIO FISCAL / COMERCIAL */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <FaLocationDot className="size-4 text-emerald-400" aria-hidden />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              3. Domicilio fiscal o tienda física
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="department"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Departamento *
              </label>
              <input
                id="department"
                name="department"
                type="text"
                required
                defaultValue="Lima"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="province"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Provincia *
              </label>
              <input
                id="province"
                name="province"
                type="text"
                required
                defaultValue="Lima"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="district"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Distrito *
              </label>
              <input
                id="district"
                name="district"
                type="text"
                required
                placeholder="La Victoria / Gamarra"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="addressLine"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              Dirección exacta de tienda o almacén *
            </label>
            <input
              id="addressLine"
              name="addressLine"
              type="text"
              required
              placeholder="Jr. Gamarra 1050, Galería Central Tienda 204"
              disabled={isPending}
              className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
            />
          </div>
        </div>

        {/* SECCIÓN 4: ESTIMACIÓN DE COMPRA */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <FaBoxesStacked className="size-4 text-amber-400" aria-hidden />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              4. Proyección de volumen y notas
            </h3>
          </div>

          <div>
            <label
              htmlFor="estimatedVolume"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              Volumen mensual de compra estimado *
            </label>
            <select
              id="estimatedVolume"
              name="estimatedVolume"
              required
              disabled={isPending}
              defaultValue=""
              className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3.5 py-3 text-sm text-white focus:border-[#0055FF] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                Seleccionar rango aproximado...
              </option>
              {ESTIMATED_VOLUMES.map((ev) => (
                <option key={ev} value={ev} className="bg-slate-900 text-white">
                  {ev}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="additionalNotes"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              Notas adicionales sobre tu negocio o marcas (Opcional)
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={2}
              placeholder="Detalla si requieres despacho urgente a provincia (Olva / Shalom), líneas prioritarias de Jeans o Drill..."
              disabled={isPending}
              className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50 resize-y"
            />
          </div>
        </div>

        {/* Declaración y Términos */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="termsAccepted"
              required
              disabled={isPending}
              className="mt-0.5 size-4 rounded border-slate-700 bg-slate-900 text-[#EF233C] focus:ring-[#EF233C]"
            />
            <span className="text-xs leading-relaxed text-slate-300">
              Declaro que los datos ingresados representan legítimamente a la empresa postulante. Acepto los{" "}
              <span className="text-blue-400 underline">Términos Comerciales Mayoristas</span> y la{" "}
              <span className="text-blue-400 underline">Política de Privacidad</span> de American Colt JEANS™, conforme a la Ley N° 29733.
            </span>
          </label>
        </div>

        {/* Botón de Envío Radiante */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#EF233C] via-[#D90429] to-[#DC2626] px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-600/30 transition-all duration-300 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {isPending ? (
              <>
                <FaSpinner className="size-4 animate-spin" aria-hidden />
                <span>
                  {isAuthenticated
                    ? "Enviando solicitud comercial..."
                    : "Creando cuenta y registrando empresa..."}
                </span>
              </>
            ) : (
              <>
                <span>
                  {isAuthenticated
                    ? "Enviar Solicitud Comercial B2B"
                    : "Registrar Empresa y Solicitar Aprobación RUC"}
                </span>
                <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
