import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { WholesaleApplicationForm } from "@/components/wholesale/wholesale-application-form";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Solicitud de Cuenta Mayorista B2B | INVESTMENTS",
  description: "Solicita tu cuenta comercial para acceder a precios mayoristas, lotes y escalas preferenciales.",
};

export const instant = false;

export default async function WholesaleRegisterPage() {
  const { user } = await getCurrentSession();

  if (user?.role === "business_pending") {
    redirect("/mayorista/solicitud");
  }

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell max-w-4xl">
        {/* Cabecera Editorial */}
        <div className="border-b border-ink/10 pb-8 text-center sm:text-left">
          <p className="eyebrow text-cochinilla">Canal Corporativo & Distribución</p>
          <h1 className="mt-2 font-display text-display-lg text-ink">
            Registro de Empresas y Mayoristas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-taupe-600">
            Únete a la red comercial de INVESTMENTS en el Perú. Evaluamos solicitudes de tiendas boutique, distribuidores regionales, confeccionistas y empresas para autorizar condiciones mayoristas exclusivas.
          </p>
        </div>

        {/* Contenido */}
        <div className="mt-10">
          {user?.role === "business_approved" ? (
            <div className="border border-emerald-300 bg-emerald-50/70 p-8 text-center sm:text-left">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="size-8 text-emerald-700 shrink-0" aria-hidden />
                <div>
                  <h2 className="font-display text-xl text-emerald-950">
                    Tu empresa ya cuenta con la condición mayorista aprobada
                  </h2>
                  <p className="mt-2 text-sm text-emerald-900 leading-relaxed">
                    No es necesario enviar una nueva solicitud. Tu cuenta está habilitada para ver tarifas mayoristas y realizar pedidos por lote en todo el catálogo de INVESTMENTS.
                  </p>
                  <div className="mt-5">
                    <Link
                      href="/catalogo"
                      className="inline-flex items-center gap-2 bg-emerald-950 px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-emerald-900"
                    >
                      Explorar catálogo mayorista
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <WholesaleApplicationForm
              isAuthenticated={!!user}
              defaultContactName={user ? `${user.firstName} ${user.lastName}` : ""}
              defaultContactEmail={user ? user.email : ""}
              defaultPhone={user?.phone ?? ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}
