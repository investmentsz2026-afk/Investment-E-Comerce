"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Award } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/** Banner institucional de ADN de marca American Colt JEANS™ en Blanco + Azul Eléctrico + Rojo con esquinas redondeadas */
export function Manifesto() {
  return (
    <section aria-labelledby="manifiesto-title" className="bg-paper py-10 lg:py-14">
      <div className="shell">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0055FF] via-[#1D4ED8] to-[#2563EB] p-6 text-paper shadow-2xl sm:p-10 lg:grid-cols-12 lg:gap-10">
          <div className="relative overflow-hidden rounded-2xl border-4 border-paper shadow-xl lg:col-span-5">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/catalogo-colt/02-campana-bolsas.png"
                alt="American Colt JEANS™ — Campaña Oficial"
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between bg-paper px-4 py-2.5 text-[#0055FF]">
              <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-cochinilla">
                CALIDAD DENIM EXPORTACIÓN
              </span>
              <span className="font-mono text-[0.68rem] font-bold text-[#0055FF]">
                100% Confección Peruana
              </span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <Logo size="sm" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3.5 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#0055FF] shadow-md">
                <Award className="size-3.5 text-cochinilla" aria-hidden />
                <span>Marca Oficial Peruana</span>
              </span>
            </div>

            <h2
              id="manifiesto-title"
              className="mt-4 font-sans text-2xl font-black uppercase leading-tight tracking-tight text-paper sm:text-3xl lg:text-4xl"
            >
              AUTÉNTICO DENIM AMERICANO CON EL{" "}
              <span className="inline-block rounded-xl bg-[#EF233C] px-3 py-0.5 text-paper shadow-md">
                MEJOR ALGODÓN PERUANO
              </span>
            </h2>

            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/95 sm:text-sm">
              En <strong>American Colt JEANS™</strong> diseñamos y confeccionamos prendas con telas ring denim de alta resistencia, calce anatómico y acabados de primera. Atendemos tanto a clientes por unidad como a negocios y distribuidores mayoristas.
            </p>

            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {[
                "Telas Denim Ring con elastano de alta recuperación",
                "Costuras reforzadas y avíos metálicos inoxidables",
                "Stock permanente en todas las tallas (28 a 38 / S a XL)",
                "Precios directos de fábrica para compras por mayor B2B",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-bold text-paper">
                  <CheckCircle2 className="size-4 shrink-0 text-amber-300" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-widest text-paper shadow-lg transition-transform hover:scale-105 hover:bg-paper hover:text-cochinilla"
              >
                <span>Comprar por Unidad</span>
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/mayorista"
                className="inline-flex h-11 items-center justify-center rounded-2xl border-2 border-paper bg-white/15 px-6 text-xs font-extrabold uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-[#0055FF]"
              >
                <span>Programa Mayorista B2B</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
