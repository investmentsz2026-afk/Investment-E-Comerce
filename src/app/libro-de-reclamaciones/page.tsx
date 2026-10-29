"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react";

export default function ComplaintsBookPage() {
  const [submitted, setSubmitted] = useState(false);
  const [claimNumber, setClaimNumber] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) return;
    const generated = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setClaimNumber(generated);
    setSubmitted(true);
  };

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell max-w-3xl space-y-10">
        <header className="border-b border-ink/10 pb-6">
          <div className="flex items-center gap-2 text-cochinilla">
            <BookOpen className="size-5" />
            <span className="eyebrow text-cochinilla">Conforme a la Ley N° 29571 · INDECOPI</span>
          </div>
          <h1 className="mt-2 font-display text-display-md text-ink">
            Libro de <em>Reclamaciones Virtual.</em>
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-taupe-600">
            Razón Social: INVESTMENTS S.A.C. · RUC: 20600000001 · Domicilio Legal: Av. Conquistadores 450, San Isidro, Lima, Perú.
          </p>
        </header>

        {submitted ? (
          <div className="border border-emerald-400 bg-emerald-50/80 p-8 text-emerald-950">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="size-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-emerald-800">
                  Reclamación Registrada Exitosamente
                </p>
                <h2 className="mt-1 font-display text-2xl text-ink">
                  Hoja de Reclamación <span className="font-mono">{claimNumber}</span>
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-emerald-900">
                  Hemos recibido tu registro conforme a las disposiciones del Código de Protección y Defensa del Consumidor. Te hemos enviado una copia a tu correo y nuestro departamento de atención responderá en un plazo máximo de quince (15) días hábiles.
                </p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex h-10 items-center gap-2 bg-ink px-6 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper hover:bg-cochinilla transition-colors"
                  >
                    Volver al inicio
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Datos del consumidor */}
            <div className="border border-ink/10 bg-[#fbfaf7] p-6 space-y-4">
              <h2 className="font-display text-lg text-ink border-b border-ink/10 pb-2">
                1. Identificación del Consumidor Reclamante
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                    Nombres y Apellidos *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    className="mt-1 block w-full border border-ink/20 bg-paper p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                    Tipo y N° Documento *
                  </label>
                  <div className="mt-1 flex gap-2">
                    <select className="border border-ink/20 bg-paper px-2 text-xs text-ink focus:border-ink focus:outline-none">
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                      <option value="RUC">RUC</option>
                    </select>
                    <input
                      required
                      type="text"
                      placeholder="Número"
                      className="block flex-1 border border-ink/20 bg-paper p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                    Correo Electrónico *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="tu@correo.com"
                    className="mt-1 block w-full border border-ink/20 bg-paper p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                    Teléfono / Celular *
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="987 654 321"
                    className="mt-1 block w-full border border-ink/20 bg-paper p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Identificación del bien contratado */}
            <div className="border border-ink/10 bg-[#fbfaf7] p-6 space-y-4">
              <h2 className="font-display text-lg text-ink border-b border-ink/10 pb-2">
                2. Identificación del Bien Contratado
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                    Tipo de Bien *
                  </label>
                  <div className="mt-2 flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5">
                      <input type="radio" name="bien" defaultChecked value="producto" />
                      Producto (Prenda textil)
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="radio" name="bien" value="servicio" />
                      Servicio (Despacho / Atención)
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                    N° de Pedido / Comprobante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. PED-2026-0001 (opcional)"
                    className="mt-1 block w-full border border-ink/20 bg-paper p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Detalle de la reclamación */}
            <div className="border border-ink/10 bg-[#fbfaf7] p-6 space-y-4">
              <h2 className="font-display text-lg text-ink border-b border-ink/10 pb-2">
                3. Detalle de la Reclamación y Pedido del Consumidor
              </h2>
              <div>
                <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                  Tipo *
                </label>
                <div className="mt-2 flex gap-6 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="tipo" defaultChecked value="reclamo" />
                    <strong>Reclamo:</strong> Disconformidad con los productos o servicios.
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="tipo" value="queja" />
                    <strong>Queja:</strong> Malestar respecto a la atención recibida.
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                  Detalle del reclamo o queja *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe detalladamente los hechos ocurridos..."
                  className="mt-1 block w-full border border-ink/20 bg-paper p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink">
                  Pedido concreto del consumidor *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Indica qué solución o acción solicitas (ej. cambio de prenda, devolución de importe)..."
                  className="mt-1 block w-full border border-ink/20 bg-paper p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <p className="text-[0.68rem] text-taupe-500 max-w-md leading-relaxed">
                * Al enviar este formulario declaras la veracidad de los hechos descritos conforme a ley.
              </p>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 bg-ink px-8 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper hover:bg-cochinilla transition-colors"
              >
                Registrar Hoja de Reclamación
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

