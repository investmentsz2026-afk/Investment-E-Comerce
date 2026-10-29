import type { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  Truck,
  Ruler,
  Mail,
  Phone,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Atención al Cliente | INVESTMENTS",
  description:
    "Centro de ayuda, información de envíos y entregas a nivel nacional, guía de tallas y canales oficiales de soporte en INVESTMENTS.",
};

const faqs = [
  {
    q: "¿Cuáles son los métodos de pago aceptados?",
    a: "Aceptamos pagos mediante tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias bancarias a nuestras cuentas BCP/BBVA/Interbank, Yape y Plin. Para empresas mayoristas aprobadas, ofrecemos transferencias interbancarias y créditos comerciales sujetos a evaluación.",
  },
  {
    q: "¿Cómo se calculan los precios mayoristas?",
    a: "En INVESTMENTS las escalas mayoristas se aplican automáticamente por modelo a partir de 12 unidades. Puedes combinar diferentes tallas y colores de un mismo producto en tu bolsa o cotización B2B.",
  },
  {
    q: "¿Emiten Factura electrónica con RUC?",
    a: "Sí. Durante el checkout o al aprobar tu cotización corporativa puedes elegir entre Boleta de Venta electrónica o Factura electrónica indicando tu RUC de 11 dígitos, razón social y domicilio fiscal.",
  },
  {
    q: "¿Cuánto demora en llegar mi pedido?",
    a: "Para Lima Metropolitana y Callao, el plazo regular de entrega es de 24 a 48 horas hábiles. Para provincias a nivel nacional, el despacho se consolida vía agencias autorizadas (Olva Courier, Shalom) con un tiempo estimado de 48 a 72 horas hábiles.",
  },
  {
    q: "¿Cómo realizo el seguimiento de mi compra?",
    a: "Al despacharse tu pedido recibirás un correo de confirmación con el código de seguimiento de la agencia. También puedes consultar el estado en tiempo real ingresando a la sección 'Mis Pedidos' en tu cuenta de cliente.",
  },
];

const sizeTableWomen = [
  { size: "XS", bust: "82 - 86 cm", waist: "62 - 66 cm", hip: "88 - 92 cm" },
  { size: "S", bust: "86 - 90 cm", waist: "66 - 70 cm", hip: "92 - 96 cm" },
  { size: "M", bust: "90 - 96 cm", waist: "70 - 76 cm", hip: "96 - 102 cm" },
  { size: "L", bust: "96 - 102 cm", waist: "76 - 82 cm", hip: "102 - 108 cm" },
  { size: "XL", bust: "102 - 108 cm", waist: "82 - 88 cm", hip: "108 - 114 cm" },
];

const sizeTableMen = [
  { size: "S", chest: "90 - 95 cm", waist: "76 - 81 cm", collar: "37 - 38 cm" },
  { size: "M", chest: "96 - 101 cm", waist: "82 - 87 cm", collar: "39 - 40 cm" },
  { size: "L", chest: "102 - 107 cm", waist: "88 - 93 cm", collar: "41 - 42 cm" },
  { size: "XL", chest: "108 - 113 cm", waist: "94 - 99 cm", collar: "43 - 44 cm" },
  { size: "XXL", chest: "114 - 119 cm", waist: "100 - 105 cm", collar: "45 - 46 cm" },
];

export default function CustomerCarePage() {
  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell max-w-5xl space-y-16">
        {/* Cabecera */}
        <header className="border-b border-ink/10 pb-8">
          <p className="eyebrow text-cochinilla">Soporte y Asistencia</p>
          <h1 className="mt-2 font-display text-display-md text-ink">
            Centro de <em>Atención al Cliente.</em>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-taupe-600 max-w-2xl">
            Encuentra información detallada sobre envíos, plazos de entrega en todo el Perú, guía de tallas anatómicas y respuestas a las consultas más frecuentes de nuestros clientes.
          </p>
        </header>

        {/* Acceso rápido a secciones */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="#preguntas"
            className="flex items-center justify-between border border-ink/10 bg-[#fbfaf7] p-5 hover:border-ink transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="size-5 text-cochinilla" />
              <span className="font-medium text-sm text-ink">Preguntas Frecuentes</span>
            </div>
            <ChevronRight className="size-4 text-taupe-400" />
          </a>
          <a
            href="#envios"
            className="flex items-center justify-between border border-ink/10 bg-[#fbfaf7] p-5 hover:border-ink transition-colors"
          >
            <div className="flex items-center gap-3">
              <Truck className="size-5 text-cochinilla" />
              <span className="font-medium text-sm text-ink">Envíos y Entregas</span>
            </div>
            <ChevronRight className="size-4 text-taupe-400" />
          </a>
          <a
            href="#tallas"
            className="flex items-center justify-between border border-ink/10 bg-[#fbfaf7] p-5 hover:border-ink transition-colors"
          >
            <div className="flex items-center gap-3">
              <Ruler className="size-5 text-cochinilla" />
              <span className="font-medium text-sm text-ink">Guía de Tallas</span>
            </div>
            <ChevronRight className="size-4 text-taupe-400" />
          </a>
        </div>

        {/* Preguntas frecuentes */}
        <section id="preguntas" className="space-y-6">
          <div className="border-b border-ink/10 pb-4">
            <h2 className="font-display text-2xl text-ink">Preguntas Frecuentes (FAQ)</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-ink/10 bg-[#fbfaf7] p-6">
                <h3 className="font-medium text-sm text-ink">{faq.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-taupe-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Envíos y entregas */}
        <section id="envios" className="space-y-6">
          <div className="border-b border-ink/10 pb-4">
            <h2 className="font-display text-2xl text-ink">Envíos y Cobertura Nacional</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="border border-ink/10 bg-paper p-6 space-y-3">
              <div className="flex items-center gap-2 text-cochinilla">
                <Truck className="size-5" />
                <h3 className="font-display text-lg text-ink">Lima Metropolitana y Callao</h3>
              </div>
              <p className="text-xs text-taupe-600 leading-relaxed">
                Despacho en 24 a 48 horas hábiles mediante servicio motorizado express y transportistas propios. Envío gratuito en compras superiores a S/ 250.
              </p>
              <ul className="text-xs text-taupe-500 space-y-1 pt-2 border-t border-ink/5">
                <li>• Tarifa estándar: S/ 12.00</li>
                <li>• Notificación de salida por correo y SMS</li>
                <li>• Entrega en horario de 9:00 a 18:00 hrs.</li>
              </ul>
            </div>

            <div className="border border-ink/10 bg-paper p-6 space-y-3">
              <div className="flex items-center gap-2 text-cochinilla">
                <Truck className="size-5" />
                <h3 className="font-display text-lg text-ink">Provincias (Todo el Perú)</h3>
              </div>
              <p className="text-xs text-taupe-600 leading-relaxed">
                Envíos consolidados a todas las regiones del país a través de Olva Courier, Shalom Empresarial y agencias de transporte con guía de remisión.
              </p>
              <ul className="text-xs text-taupe-500 space-y-1 pt-2 border-t border-ink/5">
                <li>• Tarifa calculada según departamento de destino</li>
                <li>• Tiempo estimado: 48 a 72 horas hábiles</li>
                <li>• Embalaje de seguridad con precinto sellado</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Guía de tallas */}
        <section id="tallas" className="space-y-6">
          <div className="border-b border-ink/10 pb-4">
            <h2 className="font-display text-2xl text-ink">Guía de Tallas</h2>
            <p className="mt-1 text-xs text-taupe-500">
              Medidas corporales de referencia en centímetros para asegurar el calce ideal de cada prenda.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Mujer */}
            <div className="border border-ink/10 bg-[#fbfaf7] p-6">
              <h3 className="font-display text-lg text-ink mb-4">Colección Mujer</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-ink/10 font-mono text-[0.65rem] uppercase text-taupe-600">
                    <tr>
                      <th className="py-2">Talla</th>
                      <th className="py-2">Busto</th>
                      <th className="py-2">Cintura</th>
                      <th className="py-2">Cadera</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {sizeTableWomen.map((row) => (
                      <tr key={row.size}>
                        <td className="py-2.5 font-bold font-mono text-ink">{row.size}</td>
                        <td className="py-2.5 text-taupe-600">{row.bust}</td>
                        <td className="py-2.5 text-taupe-600">{row.waist}</td>
                        <td className="py-2.5 text-taupe-600">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hombre */}
            <div className="border border-ink/10 bg-[#fbfaf7] p-6">
              <h3 className="font-display text-lg text-ink mb-4">Colección Hombre</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-ink/10 font-mono text-[0.65rem] uppercase text-taupe-600">
                    <tr>
                      <th className="py-2">Talla</th>
                      <th className="py-2">Pecho</th>
                      <th className="py-2">Cintura</th>
                      <th className="py-2">Cuello</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {sizeTableMen.map((row) => (
                      <tr key={row.size}>
                        <td className="py-2.5 font-bold font-mono text-ink">{row.size}</td>
                        <td className="py-2.5 text-taupe-600">{row.chest}</td>
                        <td className="py-2.5 text-taupe-600">{row.waist}</td>
                        <td className="py-2.5 text-taupe-600">{row.collar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Canales de contacto */}
        <section className="border border-ink/15 bg-ink p-8 text-paper sm:p-12">
          <div className="max-w-2xl">
            <p className="eyebrow text-cochinilla-bright">Canales Oficiales</p>
            <h2 className="mt-2 font-display text-2xl text-paper">
              ¿Tienes una consulta específica sobre tu pedido?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-paper/70">
              Nuestro equipo comercial y de atención al cliente está a tu disposición de lunes a sábado de 9:00 a 19:00 hrs.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-mono">
              <span className="flex items-center gap-2 border border-paper/20 px-3.5 py-2">
                <Mail className="size-4 text-cochinilla-bright" />
                contacto@investments.pe
              </span>
              <span className="flex items-center gap-2 border border-paper/20 px-3.5 py-2">
                <Phone className="size-4 text-cochinilla-bright" />
                +51 987 654 321
              </span>
              <Link
                href="/libro-de-reclamaciones"
                className="flex items-center gap-2 bg-paper text-ink px-4 py-2 uppercase tracking-wider font-sans font-semibold hover:bg-cochinilla hover:text-paper transition-colors"
              >
                Libro de Reclamaciones →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

