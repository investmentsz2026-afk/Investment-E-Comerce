"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  submitWholesaleApplicationAction,
  registerWholesaleCompanyAction,
} from "@/server/actions/wholesale";
import type { ActionResult } from "@/server/actions/auth";
import { Building2, ArrowRight, Loader2, AlertCircle, Lock, UserCheck } from "lucide-react";

interface WholesaleFormProps {
  isAuthenticated?: boolean;
  defaultContactName?: string;
  defaultContactEmail?: string;
  defaultPhone?: string | null;
}

const BUSINESS_TYPES = [
  "Boutique o tienda de moda retail",
  "Distribuidor mayorista textil",
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
  const formHandler = isAuthenticated
    ? submitWholesaleApplicationAction
    : registerWholesaleCompanyAction;

  const [state, formAction, isPending] = useActionState<ActionResult<{ applicationId: number }>, FormData>(
    formHandler,
    { success: false },
  );

  useEffect(() => {
    if (state.success) {
      router.push("/mayorista/solicitud?enviada=1");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-6">
      {!isAuthenticated && (
        <div className="border border-ink/10 bg-bone/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <UserCheck className="size-5 text-taupe-500 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                ¿Ya posees una cuenta de usuario en INVESTMENTS?
              </p>
              <p className="mt-0.5 text-xs text-taupe-600">
                Inicia sesión para autocompletar tus datos y vincular tu empresa a tu cuenta existente.
              </p>
            </div>
          </div>
          <Link
            href="/iniciar-sesion?next=/mayorista/registro"
            className="shrink-0 inline-flex items-center gap-1.5 border border-ink/20 bg-paper px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink hover:text-cochinilla"
          >
            Iniciar sesión
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      )}

      <form action={formAction} className="border border-ink/10 bg-paper p-6 sm:p-10 space-y-8">
      {state.error && (
        <div className="flex items-start gap-2.5 border-l-2 border-cochinilla bg-cochinilla/5 p-4 text-xs text-cochinilla" role="alert">
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      {/* Sección 1: Datos de la Empresa */}
      <div>
        <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
          <Building2 className="size-4 text-taupe-500" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
            1. Información comercial y tributaria
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="legalName" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Razón Social *
            </label>
            <input
              id="legalName"
              name="legalName"
              type="text"
              required
              placeholder="Ej: TEXTILES ANDINOS S.A.C."
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="tradeName" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Nombre Comercial *
            </label>
            <input
              id="tradeName"
              name="tradeName"
              type="text"
              required
              placeholder="Ej: Andinos Moda"
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="taxId" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              RUC (11 dígitos) *
            </label>
            <input
              id="taxId"
              name="taxId"
              type="text"
              required
              maxLength={11}
              placeholder="20123456789"
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm font-mono text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
            <p className="mt-1 text-[0.65rem] text-taupe-500 leading-relaxed">
              Validamos el formato de 11 dígitos (prefijo 20 o 10). La condición de contribuyente activo/habido ante SUNAT será verificada por nuestro equipo comercial durante la evaluación.
            </p>
          </div>

          <div>
            <label htmlFor="businessType" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Tipo de negocio o actividad *
            </label>
            <select
              id="businessType"
              name="businessType"
              required
              disabled={isPending}
              defaultValue=""
              className="mt-2 block w-full border border-ink/20 bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            >
              <option value="" disabled>
                Seleccionar tipo de negocio...
              </option>
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sección 2: Contacto del Representante */}
      <div>
        <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
            2. Representante comercial
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="contactName" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
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
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Correo empresarial *
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              defaultValue={defaultContactEmail}
              placeholder="compras@andinosmoda.pe"
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Teléfono de contacto *
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              required
              defaultValue={defaultPhone ?? ""}
              placeholder="987 654 321"
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mt-6 pt-5 border-t border-ink/10">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="size-4 text-taupe-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                Credenciales de acceso para tu cuenta empresarial
              </h3>
            </div>
            <p className="text-xs text-taupe-600 mb-4">
              Crea una contraseña segura para administrar tu cuenta de empresa y dar seguimiento a tus pedidos mayoristas.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
                  Contraseña de acceso *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  disabled={isPending}
                  placeholder="••••••••"
                  className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
                />
                <p className="mt-1 text-[0.65rem] text-taupe-500">
                  Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
                  Confirmar contraseña *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  disabled={isPending}
                  placeholder="••••••••"
                  className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección 3: Domicilio Comercial */}
      <div>
        <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
            3. Domicilio fiscal o comercial
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="department" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Departamento *
            </label>
            <input
              id="department"
              name="department"
              type="text"
              required
              defaultValue="Lima"
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="province" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Provincia *
            </label>
            <input
              id="province"
              name="province"
              type="text"
              required
              defaultValue="Lima"
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="district" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Distrito *
            </label>
            <input
              id="district"
              name="district"
              type="text"
              required
              placeholder="La Victoria / Gamarra"
              disabled={isPending}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="addressLine" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
            Dirección comercial o tienda *
          </label>
          <input
            id="addressLine"
            name="addressLine"
            type="text"
            required
            placeholder="Jr. Gamarra 1050, Galería Central Tda. 204"
            disabled={isPending}
            className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
          />
        </div>
      </div>

      {/* Sección 4: Estimación Comercial */}
      <div>
        <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
            4. Estimación de compra
          </h2>
        </div>

        <div className="mt-4">
          <label htmlFor="estimatedVolume" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
            Volumen mensual de compra estimado *
          </label>
          <select
            id="estimatedVolume"
            name="estimatedVolume"
            required
            disabled={isPending}
            defaultValue=""
            className="mt-2 block w-full border border-ink/20 bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
          >
            <option value="" disabled>
              Seleccionar rango aproximado...
            </option>
            {ESTIMATED_VOLUMES.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="additionalNotes" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
            Información comercial adicional (Opcional)
          </label>
          <textarea
            id="additionalNotes"
            name="additionalNotes"
            rows={3}
            placeholder="Cuéntanos brevemente sobre tu red de distribución, marcas que comercializas o requerimientos de volumen..."
            disabled={isPending}
            className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50 resize-y"
          />
        </div>
      </div>

      {/* Términos y condiciones */}
      <div className="pt-2 border-t border-ink/10">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="termsAccepted"
            required
            disabled={isPending}
            className="mt-1 size-4 rounded-none border-ink/30 text-ink focus:ring-ink"
          />
          <span className="text-xs leading-relaxed text-taupe-700">
            Declaro que la información proporcionada es fidedigna y representa formalmente a la empresa solicitante. Acepto los{" "}
            <span className="text-ink underline underline-offset-4">Términos Comerciales Mayoristas</span> y la{" "}
            <span className="text-ink underline underline-offset-4">Política de Privacidad</span> de INVESTMENTS.
          </span>
        </label>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="group inline-flex items-center gap-2 bg-ink px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {isAuthenticated ? "Enviando solicitud..." : "Creando cuenta y registrando empresa..."}
            </>
          ) : (
            <>
              {isAuthenticated ? "Enviar solicitud comercial" : "Registrar Empresa y Enviar a Administración"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
    </div>
  );
}
