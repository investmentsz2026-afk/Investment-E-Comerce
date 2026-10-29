import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  BadgePercent,
  Headset,
  FileText,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getProducts } from "@/server/queries/products";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = {
  title: "Venta por Mayor y Canal B2B | INVESTMENTS",
  description:
    "Abastece tu boutique, distribuidora o empresa con prendas de alta confección. Escalas de precio por volumen, facturación con RUC y despacho a todo el Perú.",
};

export const instant = false;

const wholesaleBenefits = [
  {
    icon: Boxes,
    title: "Escalas acumulables por modelo",
    description:
      "Combina diferentes tallas y colores de un mismo producto en una sola orden para alcanzar automáticamente las escalas de precio mayorista.",
  },
  {
    icon: BadgePercent,
    title: "Tarifas preferenciales de fábrica",
    description:
      "Márgenes comerciales atractivos para boutiques, distribuidores y tiendas de moda con precios escalonados desde 12 unidades.",
  },
  {
    icon: FileText,
    title: "Facturación electrónica SUNAT",
    description:
      "Emisión formal de Factura electrónica con tu RUC de 11 dígitos, desglose de IGV y crédito fiscal conforme a la normativa tributaria peruana.",
  },
  {
    icon: Truck,
    title: "Despachos seguros a todo el Perú",
    description:
      "Cobertura logística para Lima Metropolitana y envíos consolidados a provincias vía Olva Courier, Shalom o agencias de transporte autorizadas.",
  },
  {
    icon: Headset,
    title: "Asesor comercial asignado",
    description:
      "Acompañamiento directo en la selección de lotes, cotizaciones a medida y reposición periódica para tu inventario.",
  },
  {
    icon: ShieldCheck,
    title: "Control de calidad garantizado",
    description:
      "Prendas confeccionadas con materias primas de calidad superior (algodón pima, lino y sastrería de alta rotación) con estándares uniformes.",
  },
];

const volumeTiers = [
  {
    range: "1 a 11 unidades",
    title: "Compra Minorista",
    discount: "Precio de catálogo",
    description: "Ideal para compras personales, muestras o evaluación inicial de prendas.",
    badge: "B2C",
    highlight: false,
  },
  {
    range: "12 a 49 unidades",
    title: "Escala Mayorista Base",
    discount: "15% a 20% de ahorro",
    description: "Para boutiques, tiendas pequeñas y pedidos iniciales de temporada.",
    badge: "B2B Inicial",
    highlight: false,
  },
  {
    range: "50 a 199 unidades",
    title: "Volumen Comercial",
    discount: "25% a 30% de ahorro",
    description: "Tarifas preferenciales para distribuidores, cadenas y compras por volumen.",
    badge: "B2B Preferencial",
    highlight: true,
  },
  {
    range: "200+ unidades",
    title: "Proyecto Corporativo",
    discount: "Cotización a Medida",
    description: "Desarrollo exclusivo, uniformes empresariales y condiciones de entrega parciales.",
    badge: "A Medida",
    highlight: false,
  },
];

const registrationSteps = [
  {
    number: "01",
    title: "Registra tu empresa con RUC",
    description:
      "Ingresa tu RUC de 11 dígitos, razón social y datos de contacto en nuestro formulario de registro empresarial.",
  },
  {
    number: "02",
    title: "Validación y habilitación comercial",
    description:
      "Nuestro equipo valida tu ficha RUC ante SUNAT en 24 a 48 horas hábiles y activa tu cuenta empresarial B2B.",
  },
  {
    number: "03",
    title: "Cotiza o compra con tarifas B2B",
    description:
      "Accede a los precios mayoristas visibles en el catálogo, arma cotizaciones por lote o compra directamente con Factura.",
  },
  {
    number: "04",
    title: "Despacho y reposición continua",
    description:
      "Recibe tu mercadería embalada y solicita reposiciones rápidas desde tu panel de cuenta mayorista.",
  },
];

export default async function MayoristaPage() {
  const wholesaleCatalog = await getProducts({ mayorista: true });
  const featuredWholesale = wholesaleCatalog.items.slice(0, 4);

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      {/* Hero principal */}
      <section className="shell">
        <div className="border border-ink/15 bg-ink p-8 text-paper sm:p-14 lg:p-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 border border-paper/20 bg-paper/10 px-3.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cochinilla-bright">
              <Sparkles className="size-3.5" aria-hidden />
              Canal Mayorista & Distribución B2B
            </span>
            <h1 className="mt-5 font-display text-display-md text-paper sm:text-display-lg leading-tight">
              Vestimos el crecimiento de tu <em>negocio.</em>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-paper/80 sm:text-base max-w-2xl">
              Abastece tu boutique, tienda o empresa con confección textil peruana de alta calidad. Precios transparentes por escala, combinación multivariante de tallas y colores, facturación con RUC y atención comercial dedicada.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/mayorista/registro"
                className="inline-flex h-12 items-center justify-center gap-2 bg-cochinilla px-8 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla-deep"
              >
                Registrar mi empresa
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/mayorista/cotizaciones"
                className="inline-flex h-12 items-center justify-center gap-2 border border-paper/30 bg-transparent px-8 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:border-paper hover:bg-paper/10"
              >
                Solicitar cotización B2B
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="shell mt-20 lg:mt-32">
        <div>
          <p className="eyebrow text-cochinilla">Propuesta de Valor Comercial</p>
          <h2 className="mt-2 font-display text-display-sm text-ink">
            Ventajas pensadas para <em>negocios textiles.</em>
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-taupe-600">
            Optimizamos cada etapa del abastecimiento mayorista para que obtengas el mejor margen, disponibilidad garantizada y formalidad tributaria sin fricciones.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wholesaleBenefits.map((b) => (
            <div
              key={b.title}
              className="flex flex-col border border-ink/10 bg-[#fbfaf7] p-8 transition-shadow hover:shadow-sm"
            >
              <div className="flex size-12 items-center justify-center border border-ink/15 bg-paper text-cochinilla">
                <b.icon className="size-6" strokeWidth={1.5} aria-hidden />
              </div>
              <h3 className="mt-6 font-display text-xl text-ink">{b.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-taupe-600">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Escalas de volumen */}
      <section id="escalas" className="shell mt-20 lg:mt-32">
        <div className="border border-ink/15 bg-[#fbfaf7] p-8 sm:p-14">
          <div className="max-w-2xl">
            <p className="eyebrow text-cochinilla">Escalas Comerciales</p>
            <h2 className="mt-2 font-display text-display-sm text-ink">
              Precios por volumen con <em>reglas claras.</em>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-taupe-600">
              Nuestras escalas aplican sobre la suma de unidades de un mismo modelo, permitiendo combinar tallas S, M, L y colores diversos sin perder el precio por lote.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {volumeTiers.map((tier) => (
              <div
                key={tier.range}
                className={`flex flex-col border p-6 ${
                  tier.highlight
                    ? "border-cochinilla bg-paper shadow-sm"
                    : "border-ink/10 bg-paper"
                }`}
              >
                <span
                  className={`self-start px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider ${
                    tier.highlight
                      ? "bg-cochinilla text-paper font-semibold"
                      : "bg-taupe-100 text-taupe-700"
                  }`}
                >
                  {tier.badge}
                </span>
                <p className="mt-4 font-mono text-sm font-semibold text-ink">{tier.range}</p>
                <h3 className="mt-1 font-display text-lg text-ink">{tier.title}</h3>
                <p className="mt-3 text-base font-bold text-cochinilla">{tier.discount}</p>
                <p className="mt-2 text-xs leading-relaxed text-taupe-500">{tier.description}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-taupe-500">
            * Los precios exactos y los porcentajes por escala se muestran en la ficha técnica de cada producto y en el configurador de cotizaciones.
          </p>
        </div>
      </section>

      {/* Requisitos y Proceso */}
      <section className="shell mt-20 lg:mt-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Requisitos */}
          <div className="lg:col-span-5">
            <p className="eyebrow text-cochinilla">Requisitos de Acceso</p>
            <h2 className="mt-2 font-display text-display-sm text-ink">
              ¿Qué necesitas para <em>registrarte?</em>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-taupe-600">
              El canal mayorista está orientado a personas jurídicas y naturales con negocio formalmente constituidas en el Perú:
            </p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-700 mt-0.5" />
                <div className="text-xs text-ink leading-relaxed">
                  <strong className="font-semibold">RUC 11 dígitos activo y habido:</strong> RUC 10 con negocio o RUC 20 registrado ante la SUNAT.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-700 mt-0.5" />
                <div className="text-xs text-ink leading-relaxed">
                  <strong className="font-semibold">Razón social o denominación comercial:</strong> Titularidad del negocio o representación comercial acreditable.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-700 mt-0.5" />
                <div className="text-xs text-ink leading-relaxed">
                  <strong className="font-semibold">Datos de entrega y contacto:</strong> Dirección fiscal o de almacén para coordinar la logística de despacho.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-700 mt-0.5" />
                <div className="text-xs text-ink leading-relaxed">
                  <strong className="font-semibold">Sin costo de apertura:</strong> El registro y la evaluación de la cuenta comercial son 100% gratuitos.
                </div>
              </li>
            </ul>

            <div className="mt-8 border-t border-ink/10 pt-6">
              <Link
                href="/mayorista/registro"
                className="inline-flex h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-paper hover:bg-cochinilla transition-colors sm:w-auto"
              >
                Comenzar registro de empresa
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Proceso en pasos */}
          <div className="lg:col-span-7">
            <p className="eyebrow text-taupe-500">Proceso Paso a Paso</p>
            <h2 className="mt-2 font-display text-display-sm text-ink">
              Cómo empezar a <em>comprar por mayor.</em>
            </h2>

            <div className="mt-8 space-y-4">
              {registrationSteps.map((step) => (
                <div
                  key={step.number}
                  className="flex items-start gap-6 border-b border-ink/10 pb-6"
                >
                  <span className="font-mono text-xl font-bold text-cochinilla">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-display text-lg text-ink">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-taupe-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prendas destacadas para venta mayorista */}
      {featuredWholesale.length > 0 && (
        <section className="shell mt-20 lg:mt-32">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-ink/10 pb-5">
            <div>
              <p className="eyebrow text-cochinilla">Modelos Seleccionados</p>
              <h2 className="mt-1 font-display text-display-sm text-ink">
                Prendas con disponibilidad <em>mayorista.</em>
              </h2>
            </div>
            <Link
              href="/catalogo?modalidad=mayorista"
              className="text-xs font-medium text-cochinilla underline-offset-4 hover:underline"
            >
              Ver todo el catálogo mayorista →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
            {featuredWholesale.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="shell mt-20 lg:mt-32">
        <div className="border border-ink/15 bg-[#fbfaf7] p-8 text-center sm:p-14">
          <p className="eyebrow text-cochinilla">Atención Directa</p>
          <h2 className="mt-2 font-display text-display-md text-ink">
            ¿Listo para llevar tu abastecimiento al siguiente <em>nivel?</em>
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-taupe-600">
            Regístrate hoy para acceder a las tarifas comerciales autorizadas o solicita una cotización con las prendas y cantidades exactas que necesita tu negocio.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/mayorista/registro"
              className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-8 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
            >
              Registrar mi empresa
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/mayorista/cotizaciones"
              className="inline-flex h-12 items-center justify-center gap-2 border border-ink/20 bg-paper px-8 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink hover:bg-ink/5"
            >
              Preparar cotización
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

